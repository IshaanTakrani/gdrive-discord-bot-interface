import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { VectorEntry, DriveItem } from "../types";
import { createEmbedding } from "./db_services";
import * as dotenv from "dotenv";
dotenv.config();

export async function embedDriveItem(document: DriveItem) {
  const doc = new Document({
    pageContent: document.content ?? "",
    metadata: {
      source_name: document.name,
      source_id: document.id,
      mimeType: document.mimeType,
    },
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const chunks = await splitter.splitDocuments([doc]);

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  const vectors = await embeddings.embedDocuments(
    chunks.map((chunk) => chunk.pageContent),
  );

  console.log(vectors);

  const entries: VectorEntry[] = chunks.map((chunk, i) => ({
    content: chunk.pageContent,
    source_name: chunk.metadata.source_name,
    source_id: chunk.metadata.source_id,
    chunk_index: i,
    mimeType: chunk.metadata.mimeType,
    embedding: vectors[i],
    created_at: new Date(),
  }));

  entries.forEach((element) => {
    createEmbedding(element);
  });

  return entries;
}

// embedDriveItem(googleDocExample).then((data) => {
//   console.log(data);
// });
