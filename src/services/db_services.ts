import { MongoClient, Db } from "mongodb";
import { Collection } from "mongodb";
import { ChatMessage, VectorEntry } from "../types";
import * as dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

if (!dbName) {
  throw new Error(
    "Please define the MONGODB_DB environment variable inside .env"
  );
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri);

  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getChatCollection(): Promise<Collection<ChatMessage>> {
  const { db } = await connectDB();
  return db.collection<ChatMessage>(
    process.env.MONGODB_CHAT_HISTORY_COLLECTION!
  );
}

export async function getEmbeddingCollection(): Promise<
  Collection<VectorEntry>
> {
  const { db } = await connectDB();
  return db.collection<VectorEntry>("drive-embeddings");
}

// Get chat history sorted by created_at descending

export async function getChatHistory() {
  const col = await getChatCollection();

  const docs = await col.find({}).sort({ created_at: -1 }).limit(100).toArray();

  return docs.reverse();
}

// Create a new chat message

export async function createMessage(message: ChatMessage) {
  const col = await getChatCollection();
  return col.insertOne({
    ...message,
    created_at: new Date(),
  });
}

export async function createEmbedding(entry: VectorEntry) {
  const col = await getEmbeddingCollection();
  return col.insertOne({
    ...entry,
    created_at: new Date(),
  });
}

// getChatHistory().then((res) => {
//   console.log(res);
// });
