import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatRequest } from "@/types/ai";
import { getToolDefinitions } from "@/lib/tool-executor";

const openai = new OpenAI({
  baseURL: process.env.API_BASE_URL || "http://localhost:1234/v1",
  apiKey: process.env.AI_API_KEY || "localhost",
});

const AI_MODEL = process.env.AI_MODEL || "qwen3-vl-4b-thinking";

const SYSTEM_PROMPT = `You are a helpful healthcare assistant for a FHIR HL7 compliant clinic management system.
You can help with:
- Understanding patient records and medical data
- Explaining FHIR resources and healthcare terminology
- Answering questions about appointments, encounters, and medical records
- Creating and managing patient records
- Creating and managing practitioner records
- Scheduling and updating appointments
- Recording clinical encounters
- Recording vital signs and lab observations
- Documenting conditions and diagnoses
- Creating medication prescriptions
- Providing general healthcare information

Always be professional, accurate, and helpful. If you're unsure about something medical, recommend consulting with a healthcare professional.

${getToolDefinitions()}`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return Response.json(
        { error: "Invalid request: messages array required" },
        { status: 400 }
      );
    }

    const messagesWithSystem = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...body.messages,
    ];

    const stream = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: messagesWithSystem,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (_error) {
          controller.error(_error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (_error) {
    console.error("Chat API Error:", _error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}