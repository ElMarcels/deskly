import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface FlashcardGen {
  front: string;
  back: string;
}

interface GeminiResponse {
  flashcards: FlashcardGen[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta la API key de Gemini en las variables de entorno (GEMINI_API_KEY)" },
      { status: 500 }
    );
  }

  let textToUse = "";

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const manual = (form.get("text") as string) || "";

      if (file && file.name.toLowerCase().endsWith(".pdf")) {
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text: string }>;
          const data = await pdfParse(buffer);
          textToUse = (data.text || "").replace(/\s+/g, " ").trim().slice(0, 20000);
        } catch {
          return NextResponse.json(
            { error: "No se pudo leer el PDF. Asegúrate de que sea un PDF con texto seleccionable o pega el texto manualmente." },
            { status: 400 }
          );
        }
      } else if (manual.trim()) {
        textToUse = manual.trim().slice(0, 20000);
      } else {
        return NextResponse.json(
          { error: "Sube un PDF o pega texto para generar las tarjetas" },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      textToUse = (body?.text || "").trim().slice(0, 20000);
      if (!textToUse) {
        return NextResponse.json(
          { error: "No se recibió texto para generar las tarjetas" },
          { status: 400 }
        );
      }
    }
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la solicitud" }, { status: 400 });
  }

  if (!textToUse || textToUse.length < 20) {
    return NextResponse.json(
      { error: "No se pudo extraer texto del documento. Sube un PDF con texto seleccionable o pega el texto manualmente." },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    const prompt = `Eres un asistente experto en crear tarjetas de estudio (flashcards). 
A partir del siguiente texto de apuntes, genera entre 8 y 15 tarjetas de estudio de alta calidad con conceptos, definiciones, fórmulas y preguntas clave.

Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura exacta (sin markdown, sin texto extra):
{"flashcards":[{"front":"pregunta o concepto","back":"respuesta o definición"}]}

Texto:
---
${textToUse}
---`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return NextResponse.json(
        { error: "La IA no devolvió un formato válido. Inténtalo de nuevo." },
        { status: 500 }
      );
    }

    const parsed: GeminiResponse = JSON.parse(cleaned.slice(start, end + 1));
    const flashcards = (parsed.flashcards || []).slice(0, 30);

    if (flashcards.length === 0) {
      return NextResponse.json(
        { error: "No se generaron tarjetas. Inténtalo con un texto más completo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ flashcards });
  } catch (e) {
    return NextResponse.json(
      { error: "Error de la IA: " + (e instanceof Error ? e.message : "error desconocido") },
      { status: 500 }
    );
  }
}
