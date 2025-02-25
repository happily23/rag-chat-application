import axios from "axios";
import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";
import { pipeline } from "@xenova/transformers";
import { GoogleGenerativeAI } from "@google/generative-ai";

config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const indexName = "rag-chat-index";

// Load embedding model once (optimization)
let extractor;
async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

// Function to convert text into an embedding vector
async function encodeText(text) {
  try {
    const model = await getExtractor();
    const output = await model(text, { pooling: "mean", normalize: true });

    if (!output || !output.data) {
      throw new Error("Failed to generate embeddings");
    }

    return Array.isArray(output.data)
      ? output.data.flat()
      : Object.values(output.data).flat();
  } catch (error) {
    console.error("🚨 Embedding Error:", error.message);
    return [];
  }
}

// API Route Handler
export default async function handler(req, res) {
  // ✅ Handle CORS Preflight Request
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // ✅ Allow CORS for All Requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Query cannot be empty" });
    }

    console.log("📥 Received query:", query);

    // Preprocess the query (clean unwanted characters)
    const sanitizedQuery = query.replace(/[^a-zA-Z0-9 ?]/g, "").trim();

    // Convert query into embedding vector
    const queryEmbedding = await encodeText(sanitizedQuery);
    if (!queryEmbedding.length) {
      return res.status(500).json({ message: "Embedding generation failed" });
    }

    console.log("🔍 Searching Pinecone for relevant documents...");
    const index = pinecone.index(indexName);
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    // Extract and combine retrieved text
    const retrievedText =
      searchResults.matches
        ?.map((match) => match.metadata?.text || "")
        .join(" ") || "";

    if (!retrievedText.trim()) {
      return res
        .status(200)
        .json({ query, response: "No relevant information found." });
    }

    console.log("📤 Sending request to Gemini...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Structured prompt for better AI responses
    const prompt = `
    You are an intelligent assistant. Answer the user's question based on retrieved knowledge.

    **User Query:** ${sanitizedQuery}
    **Relevant Information:** ${retrievedText}

    Provide a clear and concise response.
    `;

    const result = await model.generateContent(prompt);

    console.log("✅ Gemini API response received.");
    console.log(
      "📥 Full Gemini API Response:",
      JSON.stringify(result, null, 2)
    );

    const aiResponse =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Error: No response generated.";

    return res.status(200).json({ query, response: aiResponse });
  } catch (error) {
    console.error("❌ Error:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}
