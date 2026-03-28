import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Snippet Bubble Manager backend is alive"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, model = "gemini-2.5-flash" } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt
    });

    return res.json({
      text: response.text
    });
  } catch (error) {
    console.error("Gemini generate error:", error);
    return res.status(500).json({
      error: "Failed to generate content."
    });
  }
});

app.post("/api/gemini/complete", async (req, res) => {
  try {
    const { context, language = "javascript", model = "gemini-2.5-flash" } = req.body;

    if (!context || typeof context !== "string") {
      return res.status(400).json({ error: "Context is required." });
    }

    const prompt = `You are a code completion assistant. Given the following code context, suggest the next few lines or a completion for the current line.

Context:
\`\`\`${language}
${context}
\`\`\`

Return ONLY the suggested code completion as plain text. Do not include markdown fences or explanations.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt
    });

    return res.json({
      text: response.text
    });
  } catch (error) {
    console.error("Gemini completion error:", error);
    return res.status(500).json({
      error: "Failed to generate completion."
    });
  }
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
