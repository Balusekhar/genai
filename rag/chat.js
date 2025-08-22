import dotenv from "dotenv";
dotenv.config({
  path: "../.env",
});
import { OpenAIEmbeddings } from "@langchain/openai";
import OpenAI from "openai";
import { QdrantVectorStore } from "@langchain/qdrant";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // apiKey: process.env.GEMINI_API_KEY,
  // baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const USER_QUERY = "What is the summary of this document?";

async function main() {
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    batchSize: 512,
    model: "text-embedding-3-large",
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "docs",
    }
  );

  const retriever = vectorStore.asRetriever({
    k: 2,
  });

  const relevantChunks = await retriever.invoke(USER_QUERY);
  console.log("relevantChunks 🤣🤣", JSON.stringify(relevantChunks, null, 2));

  const messages = [
    {
      role: "system",
      content: `You are a helpful assistant that can answer questions about the document. You are given a document and a question. You need to answer the question based on the document. When you are referring the document to answer the user question, you also need to include the page number of the document in your response.
      Available context: ${JSON.stringify(relevantChunks)}
      `,
    },
    {
      role: "user",
      content: USER_QUERY,
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
  });

  console.log("response 🤣🤣", response.choices[0].message.content);
}

main();
