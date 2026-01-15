import { ObjectId } from "mongodb";

export type DriveItem = {
  id: string | null | undefined;
  name: string | null | undefined;
  mimeType: string | null | undefined;
  content: string | null | undefined;
};

export type ChatMessage = {
  _id?: ObjectId;
  role: "user" | "bot";
  user_id: string | null;
  user_name: string | null;
  display_name: string | null;
  message_content: string;
  created_at: Date;
};

export type VectorEntry = {
  _id?: ObjectId;
  content: string;
  source_name: string;
  source_id: string;
  chunk_index: number | null;
  mimeType:
    | "application/vnd.google-apps.document"
    | "application/vnd.google-apps.spreadsheet"
    | "application/vnd.google-apps.presentation"
    | "others";
  embedding: number[];
  created_at: Date;
};

export type UserIntent = "get_information" | "conversation" | "web_search";
