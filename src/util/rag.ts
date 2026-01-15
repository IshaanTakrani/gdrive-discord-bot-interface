import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getEmbeddingCollection } from "../services/db_services";
import * as dotenv from "dotenv";
dotenv.config();

export async function fetchRAGContent(prompt: string): Promise<string> {
  const collection = await getEmbeddingCollection();

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection as any,
    indexName: process.env.MONGODB_EMBEDDING_INDEX!,
    textKey: "content",
    embeddingKey: "embedding",
  });

  const results = await vectorStore.similaritySearch(prompt, 7);

  if (results.length === 0) {
    return "no_results";
  }

  const content = results
    .map(
      (doc, i) =>
        `[Source ${i + 1}: ${doc.metadata?.source_name ?? "Unknown"}]\n${
          doc.pageContent
        }`
    )
    .join("\n\n---\n\n");

  return content;
}
