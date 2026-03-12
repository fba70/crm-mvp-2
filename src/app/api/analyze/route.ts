import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createVertex } from "@ai-sdk/google-vertex"

export const maxDuration = 60

type ModelProvider = "openai" | "google"

export async function POST(req: NextRequest) {
  try {
    const {
      systemPrompt,
      userContent,
      model = "openai",
    }: {
      systemPrompt: string
      userContent: string
      model?: ModelProvider
    } = await req.json()

    if (!systemPrompt || !userContent) {
      return NextResponse.json(
        { success: false, error: "systemPrompt and userContent are required" },
        { status: 400 },
      )
    }

    let text: string

    if (model === "google") {
      const encodedJson = process.env.GCP_SERVICE_ACCOUNT_JSON_BASE64
      if (!encodedJson)
        throw new Error("GCP_SERVICE_ACCOUNT_JSON_BASE64 is not set")
      const credentials = JSON.parse(
        Buffer.from(encodedJson, "base64").toString(),
      )
      const vertex = createVertex({
        project: credentials.project_id,
        location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
        googleAuthOptions: {
          credentials,
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        },
      })
      const result = await generateText({
        model: vertex("gemini-2.5-flash"),
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      })
      text = result.text
    } else {
      const result = await generateText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      })
      text = result.text
    }

    // Strip markdown code fences if the model wraps its output
    const jsonStr = text
      .trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")

    const parsed = JSON.parse(jsonStr)
    const results = Array.isArray(parsed) ? parsed : [parsed]

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
