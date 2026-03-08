import { streamText, UIMessage, convertToModelMessages } from "ai"
import { openai } from "@ai-sdk/openai"
import { createVertex } from "@ai-sdk/google-vertex"
import serviceAccount from "@/secret/videoparser-470412-9f69b1624ccc.json"

export const maxDuration = 30

type ModelProvider = "openai" | "google"

export async function POST(req: Request) {
  const {
    messages,
    model = "openai",
    webSearch = false,
  }: {
    messages: UIMessage[]
    model?: ModelProvider
    webSearch?: boolean
  } = await req.json()

  const useGoogle = webSearch || model === "google"

  let result
  if (useGoogle) {
    const vertex = createVertex({
      googleAuthOptions: {
        credentials: serviceAccount,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      },
    })
    result = streamText({
      model: vertex("gemini-2.5-flash"),
      ...(webSearch && {
        tools: { google_search: vertex.tools.googleSearch({}) },
      }),
      messages: await convertToModelMessages(messages),
      system: "You are a helpful assistant that can answer questions and help with tasks",
    })
  } else {
    result = streamText({
      model: openai("gpt-4o"),
      messages: await convertToModelMessages(messages),
      system: "You are a helpful assistant that can answer questions and help with tasks",
    })
  }

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  })
}
