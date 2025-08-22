import dotenv from "dotenv";
dotenv.config();
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

const myPdf = "./Attention.pdf";
const loader = new PDFLoader(myPdf);
const docs = await loader.load();

const recursiveSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 250,
  chunkOverlap: 25,
});

const recursiveChunks = await recursiveSplitter.splitDocuments(docs);
// console.log(JSON.stringify(recursiveChunks, null, 2));

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  batchSize: 512,
  model: "text-embedding-3-large",
});

console.log("process.env.QDRANT_URL", process.env.QDRANT_URL);

async function saveToQdrant() {
  const vectorStore = await QdrantVectorStore.fromDocuments(
    recursiveChunks,
    embeddings,
    {
      url: process.env.QDRANT_URL,
      collectionName: "docs",
    }
  );

  console.log("vectorStore 🤣🤣", vectorStore);
}

saveToQdrant();
