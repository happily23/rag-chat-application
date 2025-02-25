import axios from "axios";
import * as cheerio from "cheerio";
import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import { pipeline } from "@xenova/transformers";

config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const indexName = "rag-chat-index";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end(); // ✅ No explicit return
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  try {
    const { url } = req.body;
    console.log(`🔍 Scraping content from: ${url}`);

    const response = await axios.get(url);
    if (!response.data) {
      res.status(400).json({ message: "Failed to fetch the page." });
      return;
    }

    const $ = cheerio.load(response.data);
    const extractedText = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .join(" ");

    if (!extractedText.trim()) {
      res.status(400).json({ message: "No readable text found." });
      return;
    }

    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    const embeddingResponse = await extractor(extractedText, {
      pooling: "mean",
      normalize: true,
    });

    // Get the raw embeddings. The output might be in a property or directly returned.
    let textEmbedding = embeddingResponse?.data ?? embeddingResponse;

    // If it's not a plain array (e.g. it’s a typed array), convert it.
    if (textEmbedding && !Array.isArray(textEmbedding)) {
      textEmbedding = Array.from(textEmbedding);
    }

    if (!Array.isArray(textEmbedding) || textEmbedding.length === 0) {
      throw new Error("Embedding generation failed.");
    }

    const index = pinecone.Index(indexName);
    await index.upsert([
      { id: url, values: textEmbedding, metadata: { text: extractedText } },
    ]);

    console.log("✅ Stored in Pinecone:", url);

    res.status(200).json({ message: "Success" });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ message: "Error", error: error.message });
  }
}
