"use client"

import { JSX, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import RouteButton from "@/components/business/route-button"
import FeedItemLoading from "./loading"
import { unauthorized, notFound } from "next/navigation"
import type { Feed, Client, Contact } from "@/types/entities"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { LikeButton } from "@/components/business/like-button"
import { StatusChangeDialog } from "@/components/business/feed-status-change"
import { AtSign, Phone, Eye } from "lucide-react"
import FormNewTaskIconDialog from "@/components/forms/form-new-task-icon"
import BookingRequestDialog from "@/components/forms/form-booking-request"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import axios from "axios"
import axiosApi from "@/lib/axios"

export default function FeedItemPage() {
  const params = useParams()
  const { id } = params as { id: string }
  const { data: user, isPending } = useSession()
  const router = useRouter()

  const [feedItem, setFeed] = useState<Feed | null>(null)
  const [loading, setLoading] = useState(true)

  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)

  const [userPrompt, setUserPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [feedItemRefresh, setFeedItemRefresh] = useState(false)

  const fetchClients = () => {
    setClientsLoading(true)
    axiosApi
      .get("/api/client")
      .then((res) => setClients(res.data))
      .finally(() => setClientsLoading(false))
  }

  const fetchContacts = () => {
    setContactsLoading(true)
    axiosApi
      .get("/api/contact")
      .then((res) => setContacts(res.data))
      .finally(() => setContactsLoading(false))
  }

  useEffect(() => {
    fetchClients()
    fetchContacts()
  }, [])

  console.log("Contacts:", contacts)

  useEffect(() => {
    const fetchFeedItem = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/feed/${id}`)
        setFeed(response.data)
      } catch (error) {
        console.error("Failed to fetch feed item", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedItem()
  }, [id, feedItemRefresh])

  const handleOpenAICall = async () => {
    setIsLoading(true)
    setResponse("")

    try {
      const systemPromptClientActivity =
        "You are a helpful assistant providing insights for sales team members based on input from client activity feed." +
        "Client is:" +
        (feedItem?.client?.name ?? "No client provided.") +
        ".Client activity message is: " +
        (feedItem?.metadata ?? "No message provided.") +
        ". Provide concise and relevant suggestions or actions that a sales team member could take based on this activity. Structure is into 3 recommended activity bullets like Action_1_:, Action_2_: and Action_3_: . Keep the response under 150 words."

      const systemPromptIndustryInfo =
        "You are a helpful assistant providing insights for sales team members based on input from industry information feed." +
        "Industry information message is: " +
        (feedItem?.metadata ?? "No message provided.") +
        ". Provide concise and relevant suggestions or actions that a sales team member could take based on this activity. Structure is into 3 recommended activity bullets like Action_1_:, Action_2_: and Action_3_: . Keep the response under 150 words."

      const systemPromptRecommendations =
        "You are a helpful assistant providing insights for sales team members based on input about client plans and recommendations." +
        "Client is:" +
        (feedItem?.client?.name ?? "No client provided.") +
        ".Client plans and recommendations message is: " +
        (feedItem?.metadata ?? "No message provided.") +
        ". Provide concise and relevant suggestions or actions that a sales team member could take based on this activity. Structure is into 3 recommended activity bullets like Action_1_:, Action_2_: and Action_3_: . Keep the response under 150 words."

      let systemPrompt = ""

      if (feedItem?.type === "CLIENT_ACTIVITY") {
        systemPrompt = systemPromptClientActivity
      } else if (feedItem?.type === "INDUSTRY_INFO") {
        systemPrompt = systemPromptIndustryInfo
      } else if (feedItem?.type === "RECOMMENDATION") {
        systemPrompt = systemPromptRecommendations
      }

      const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}`

      const res = await fetch("/api/openai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch LLM response")
      }

      const data = await res.json()
      // console.log("AI response:", data.result)
      setResponse(data.result.output_text)
    } catch (error) {
      console.error("Error calling LLM API:", error)
      setResponse("An error occurred while processing your request.")
    } finally {
      setIsLoading(false)
    }
  }

  function parseFeedback(feedback: string): JSX.Element {
    // Match each action block using regex
    const actions =
      feedback.match(/Action_\d+_:\s*([\s\S]*?)(?=Action_\d+_:|$)/g) || []

    if (actions.length === 0) {
      return <p>No structured actions found in the feedback.</p>
    }

    return (
      <div className="space-y-4">
        {actions.map((action, index) => {
          // Extract the title and text using regex
          const titleMatch = action.match(/Action_\d+/)
          const textMatch = action.match(/_:\s*([\s\S]*)/)

          const title = titleMatch
            ? titleMatch[0].replace("_", " ") + ":"
            : "Action:"
          const text = textMatch ? textMatch[1].trim() : "No details provided."

          return (
            <div key={index}>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                {title}
              </p>
              <p className="text-gray-700 dark:text-gray-300">{text}</p>
            </div>
          )
        })}
      </div>
    )
  }

  function parseFeedbackBooking(feedback: string): JSX.Element {
    // Match each action block using regex
    const actions =
      feedback.match(/Option_\d+_:\s*([\s\S]*?)(?=Option_\d+_:|$)/g) || []

    if (actions.length === 0) {
      return <p>No structured actions found in the feedback.</p>
    }

    return (
      <div className="space-y-4">
        {actions.map((action, index) => {
          // Extract the title and text using regex
          const titleMatch = action.match(/Option_\d+/)
          const textMatch = action.match(/_:\s*([\s\S]*)/)

          const title = titleMatch
            ? titleMatch[0].replace("_", " ") + ":"
            : "Option:"
          const text = textMatch ? textMatch[1].trim() : "No details provided."

          return (
            <div key={index}>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                {title}
              </p>
              <p className="text-gray-700 dark:text-gray-300">{text}</p>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading || clientsLoading || contactsLoading) return <FeedItemLoading />
  if (!feedItem) {
    notFound()
  }
  if (!user && !isPending) {
    unauthorized()
  }

  // console.log("AI response text:", response)
  // console.log("Feed Item:", feedItem)
  // key={feedItem.id}

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-0 pt-5">
      <div className="flex justify-between">
        <div className="flex w-[95%] flex-row items-center justify-between gap-2">
          <h1 className="ml-6 text-2xl font-semibold">Feed Item</h1>
          <RouteButton pathParam="/feed" nameParam="Go back to feed list" />
        </div>
      </div>

      <div className="max-h-190 overflow-y-auto">
        <Card className="mx-auto mt-6 flex w-[95%] flex-col py-4">
          <CardContent className="flex flex-col gap-2 px-5 py-0">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-row items-center justify-center gap-2">
                <div
                  className={cn(
                    "rounded-xl border-1 border-gray-300 px-2 py-1 text-sm",
                    feedItem.type === "RECOMMENDATION" &&
                      "bg-gradient-to-t from-blue-100 to-transparent",
                    feedItem.type === "CLIENT_ACTIVITY" &&
                      "bg-gradient-to-t from-cyan-100 to-transparent",
                    feedItem.type === "INDUSTRY_INFO" &&
                      "bg-gradient-to-t from-pink-100 to-transparent",
                    feedItem.type === "COLLEAGUES_UPDATE" &&
                      "bg-gradient-to-t from-green-100 to-transparent",
                  )}
                >
                  {feedItem.type
                    .replace("COLLEAGUES_UPDATE", "COLLEAGUES")
                    .replace(/_/g, " ")}
                </div>

                <div
                  className={cn(
                    "rounded-xl border-1 border-gray-300 px-2 py-1 text-sm",
                    feedItem.status === "CANCELLED" && "text-gray-500",
                    feedItem.status === "IN_PROGRESS" && "text-blue-500",
                    feedItem.status === "ACTION_COMPLETED" && "text-green-400",
                    feedItem.status === "CLOSED" && "text-green-700",
                    feedItem.status === "NEW" && "text-orange-500",
                  )}
                >
                  {feedItem.status
                    .replace(/_/g, " ")
                    .replace("ACTION COMPLETED", "ACTION OK")}
                </div>
              </div>

              <div className="flex flex-row items-center justify-start gap-3 text-xs text-gray-500">
                {format(new Date(feedItem.createdAt), "yyyy-MM-dd")}
              </div>
            </div>

            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center justify-start gap-3">
                <span className="w-[60px] text-sm text-gray-400">Client:</span>
                {feedItem.client ? (
                  <span>{feedItem.client.name || "—"}</span>
                ) : (
                  <span>No client</span>
                )}
              </div>

              {feedItem.taskId && (
                <Button
                  variant="link"
                  onClick={() => {
                    if (feedItem.taskId) {
                      router.push(`/tasks/${feedItem.taskId}`)
                    }
                  }}
                >
                  TASK
                </Button>
              )}
            </div>

            <div className="mb-1 flex flex-row items-center justify-start gap-3">
              <span className="w-[60px] text-sm text-gray-400">Message:</span>
              <span className="block max-h-30 w-[290px] overflow-y-auto text-sm">
                {feedItem.metadata || "No message"}
              </span>
            </div>

            {feedItem.feedback && (
              <div className="flex flex-row items-center justify-start gap-4">
                <span className="w-[60px] text-sm text-gray-400">
                  Assistant:
                </span>
                <div className="relative">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="absolute right-2 bottom-1 rounded-full bg-blue-500 p-1">
                        <Eye size={16} className="text-white" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assistant Details</DialogTitle>
                      </DialogHeader>
                      <div className="mt-2 max-h-180 overflow-y-auto text-sm text-gray-700">
                        {parseFeedback(
                          feedItem.feedback || "No feedback available",
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <span className="block max-h-30 w-[290px] overflow-y-auto text-sm">
                    {parseFeedback(
                      feedItem.feedback || "No feedback available",
                    )}
                  </span>
                </div>
              </div>
            )}

            {feedItem.feedbackBooking && (
              <div className="flex flex-row items-center justify-start gap-4">
                <span className="w-[60px] text-sm text-gray-400">Booking:</span>
                <div className="relative">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="absolute right-2 bottom-1 rounded-full bg-blue-500 p-1">
                        <Eye size={16} className="text-white" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Booking Assistant Details</DialogTitle>
                      </DialogHeader>
                      <div className="mt-2 max-h-180 overflow-y-auto text-sm text-gray-700">
                        {parseFeedbackBooking(
                          feedItem.feedbackBooking || "No feedback available",
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <span className="block max-h-30 w-[290px] overflow-y-auto text-sm">
                    {parseFeedbackBooking(
                      feedItem.feedbackBooking || "No feedback available",
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-2 flex flex-row items-center justify-between gap-2">
              <div className="flex flex-row items-center justify-start gap-3">
                <span className="w-[60px] text-sm text-gray-400">Actions:</span>
                {feedItem.actionCall && (
                  <a
                    href={`tel:${feedItem?.client?.phone ?? ""}`}
                    onClick={(e) => {
                      if (!feedItem?.client?.phone) e.preventDefault()
                    }}
                  >
                    <Button variant="outline">
                      <Phone size={24} />
                    </Button>
                  </a>
                )}

                {feedItem.actionEmail && (
                  <a
                    href={`mailto:${feedItem?.client?.email ?? ""}`}
                    onClick={(e) => {
                      if (!feedItem?.client?.email) e.preventDefault()
                    }}
                  >
                    <Button variant="outline">
                      <AtSign size={24} />
                    </Button>
                  </a>
                )}

                {feedItem.actionBooking && (
                  <BookingRequestDialog
                    feedId={feedItem.id}
                    onSuccess={() => setFeedItemRefresh((prev) => !prev)}
                  />
                )}

                {user &&
                  !feedItem.taskId &&
                  feedItem.actionTask &&
                  feedItem.type !== "COLLEAGUES_UPDATE" && (
                    <FormNewTaskIconDialog
                      clients={
                        feedItem.clientId
                          ? clients.filter(
                              (client) => client.id === feedItem.clientId,
                            )
                          : clients
                      }
                      contacts={contacts}
                      userId={user?.user.id}
                      onSuccess={(newTask) => {
                        setFeed((prevFeedItem) => {
                          if (!prevFeedItem) return null
                          return { ...prevFeedItem, taskId: newTask.id }
                        })
                      }}
                    />
                  )}

                {feedItem.type === "COLLEAGUES_UPDATE" && (
                  <LikeButton feedId={feedItem.id} />
                )}
              </div>

              <StatusChangeDialog
                feedId={feedItem.id}
                currentStatus={feedItem.status}
                onStatusChange={(newStatus) => {
                  setFeed((prevFeedItem) => {
                    if (!prevFeedItem) {
                      console.error(
                        "Previous feed item is null or undefined...",
                      )
                      return null
                    }
                    return { ...prevFeedItem, status: newStatus }
                  })
                }}
              />
            </div>
          </CardContent>
        </Card>

        {(feedItem.type === "RECOMMENDATION" ||
          feedItem.type === "CLIENT_ACTIVITY" ||
          feedItem.type === "INDUSTRY_INFO") && (
          <Card className="mx-auto mt-4 flex w-[95%] flex-col py-4">
            <CardContent className="flex flex-col gap-2 px-5 py-0">
              <p className="text-sm text-gray-500 dark:text-gray-300">
                You can ask AI-assistant to provide inputs and recommendations
                within the context of the client activity event. Please specify
                your request to AI-assistant here:
              </p>

              <Textarea
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                placeholder="Enter your request details here..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
              />

              <Button
                variant="default"
                className="mt-2"
                onClick={handleOpenAICall}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Submit Request"}
              </Button>

              {response && (
                <div className="mt-3 rounded-md border border-gray-300 p-3">
                  <div className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                    AI-assistant response:
                  </div>
                  <div className="text-sm text-gray-900">
                    {parseFeedback(response)}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await axios.patch(`/api/feed/${feedItem.id}`, {
                            feedback: response,
                          })
                          toast.success(
                            "Recommendation saved successfully to the feed item!",
                          )
                          setFeed((prevFeedItem) => {
                            if (!prevFeedItem) return null
                            return { ...prevFeedItem, feedback: response }
                          })
                        } catch (error) {
                          console.error("Failed to save recommendation", error)
                          toast.error(
                            "Failed to save recommendation. Please try again.",
                          )
                        }
                      }}
                    >
                      Save Recommendation
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setResponse("")}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
