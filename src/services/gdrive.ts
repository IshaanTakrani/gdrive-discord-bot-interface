import { google } from "googleapis";
import * as dotenv from "dotenv";
import { DriveItem } from "../types";
import { embedDriveItem } from "./embed";
dotenv.config();

const drive_folder_id: string | undefined = process.env.DRIVE_FOLDER_ID;
console.log(drive_folder_id);

const auth = new google.auth.GoogleAuth({
  keyFile: "./service-account.json",
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

const docs = google.docs({
  version: "v1",
  auth,
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

export async function listFolder(
  folderID: string | null | undefined = drive_folder_id
): Promise<DriveItem[]> {
  const result: DriveItem[] = [];

  try {
    const res = await drive.files.list({
      q: `'${folderID}' in parents and trashed = false`,
      fields: "files(id, name, mimeType)",
    });

    const files = res.data.files ?? [];

    for (const file of files) {
      const driveItem: DriveItem = {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        content: "",
      };
      driveItem.content = await getFileContent(driveItem);

      if (driveItem.mimeType === "application/vnd.google-apps.folder") {
        const nestedFiles = await listFolder(driveItem.id);
        result.push(...nestedFiles);
      } else if (
        driveItem.mimeType === "application/vnd.google-apps.spreadsheet" ||
        driveItem.mimeType === "application/vnd.google-apps.document"
      ) {
        result.push(driveItem);
      }
    }
  } catch (e) {
    console.error("Error while listing drive folders: ", e);
  }

  return result;
}

export async function getFileContent(
  item: DriveItem
): Promise<string | undefined> {
  if (item.mimeType === "application/vnd.google-apps.document" && item.id) {
    return parseDoc(item.id);
  }

  if (item.mimeType === "application/vnd.google-apps.spreadsheet" && item.id) {
    return parseSheet(item.id);
  }
  return undefined;
}
export async function parseSheet(sheetID: string): Promise<string> {
  try {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: sheetID,
    });

    const sheetsList = meta.data.sheets || [];
    if (sheetsList.length === 0) return "";

    // Fetch all sheets in parallel
    const sheetPromises = sheetsList.map(async (sheet) => {
      const title = sheet.properties?.title;
      if (!title) return null;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetID,
        range: title,
      });

      const rows = res.data.values || [];
      if (rows.length === 0) return null;

      // Convert to CSV
      const csvString = rows
        .map((row) => row.map((cell: any) => escapeCsvCell(cell)).join(","))
        .join("\n");

      return `--- Sheet: ${title} ---\n${csvString}`;
    });

    const results = await Promise.all(sheetPromises);

    // Filter out nulls and join
    return results
      .filter((content): content is string => content !== null)
      .join("\n\n")
      .trim();
  } catch (e) {
    console.error(`Error parsing sheet ${sheetID}: `, e);
    return "";
  }
}

// Optimized CSV escaping
function escapeCsvCell(cell: any): string {
  if (cell == null) return "";

  const cellText = String(cell);

  // Check if escaping is needed
  if (
    cellText.includes('"') ||
    cellText.includes(",") ||
    cellText.includes("\n")
  ) {
    return `"${cellText.replace(/"/g, '""')}"`;
  }

  return cellText;
}

export async function parseDoc(docID: string): Promise<string | undefined> {
  try {
    const res = await docs.documents.get({
      documentId: docID,
    });

    const doc = res.data;
    if (!doc.body?.content) {
      return "";
    }

    const chunks: string[] = [];

    for (const element of doc.body.content) {
      if (element.paragraph) {
        const runs = element.paragraph.elements || [];
        for (const run of runs) {
          if (run.textRun?.content) {
            chunks.push(run.textRun.content);
          }
        }
      } else if (element.table) {
        for (const tableRow of element.table.tableRows || []) {
          for (const tableCell of tableRow.tableCells || []) {
            for (const cellContent of tableCell.content || []) {
              if (cellContent.paragraph) {
                const runs = cellContent.paragraph.elements || [];
                for (const run of runs) {
                  if (run.textRun?.content) {
                    chunks.push(run.textRun.content);
                  }
                }
              }
            }
          }
        }
      }
    }

    return chunks.join("").replace(/\n/g, " ").trim();
  } catch (e) {
    return "";
  }
}

export async function indexDrive() {
  const items = await listFolder();
  items.forEach((item) => {
    embedDriveItem(item);
  });
}

indexDrive();
