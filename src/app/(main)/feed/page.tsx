"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { unauthorized } from "next/navigation"
import { FeedStatus, type Feed, Client, Contact } from "@/types/entities"
import axiosApi from "@/lib/axios"
import FeedLoading from "./loading"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AtSign,
  Phone,
  ChevronsUp,
  ChevronsDown,
  Check,
  Brain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LikeButton } from "@/components/business/like-button"
import FormNewTaskIconDialog from "@/components/forms/form-new-task-icon"
import FormNewFeedDialog from "@/components/forms/form-new-feed"
import BookingRequestDialog from "@/components/forms/form-booking-request"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function FeedPage() {
  const { data: user, isPending } = useSession()

  if (!user && !isPending) {
    unauthorized()
  }

  const [feed, setFeed] = useState<Feed[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [includeClosed, setIncludeClosed] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)

  const fetchFeed = () => {
    setFeedLoading(true)
    axiosApi
      .get("/api/feed")
      .then((res) => setFeed(res.data))
      .finally(() => setFeedLoading(false))
  }

  const fetchContacts = () => {
    setContactsLoading(true)
    axiosApi
      .get("/api/contact")
      .then((res) => setContacts(res.data))
      .finally(() => setContactsLoading(false))
  }

  useEffect(() => {
    fetchFeed()
    fetchContacts()
  }, [])

  const filteredFeed = feed.filter((item) => {
    const matchesType = typeFilter ? item.type === typeFilter : true
    const matchesStatus = statusFilter ? item.status === statusFilter : true
    const includeClosedFilter = includeClosed || item.status !== "CLOSED"
    return matchesType && matchesStatus && includeClosedFilter
  })

  const sortedFilteredFeed = [...filteredFeed].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA
  })

  // console.log("Feed:", feed)

  if (feedLoading || contactsLoading) return <FeedLoading />

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-0 pt-5">
      <div className="space-y-4">
        <div className="flex flex-row justify-between px-4">
          <h1 className="pl-2 text-2xl font-semibold">Feed</h1>

          <div className="flex items-center">
            <Checkbox
              id="includeClosed"
              checked={includeClosed}
              onCheckedChange={(checked) => setIncludeClosed(!!checked)}
            />
            <label
              htmlFor="includeClosed"
              className="ml-2 text-sm text-gray-600"
            >
              Include closed
            </label>
          </div>
          {user && <FormNewFeedDialog onSuccess={() => fetchFeed()} />}
        </div>

        <div className="mb-3 flex flex-row items-center justify-between gap-3 px-4">
          <Select
            onValueChange={(value) =>
              setTypeFilter(value === "ALL" ? null : value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="RECOMMENDATION">Recommendation</SelectItem>
              <SelectItem value="CLIENT_ACTIVITY">Client Activity</SelectItem>
              <SelectItem value="INDUSTRY_INFO">Industry Info</SelectItem>
              <SelectItem value="COLLEAGUES_UPDATE">
                Colleagues Update
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) =>
              setStatusFilter(value === "ALL" ? null : value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ACTION_COMPLETED">Action Completed</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            {sortOrder === "asc" ? (
              <ChevronsUp size={16} />
            ) : (
              <ChevronsDown size={16} />
            )}
          </Button>
        </div>

        {sortedFilteredFeed.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No feed found.
          </p>
        ) : (
          <FeedCards
            feed={sortedFilteredFeed}
            setFeed={setFeed}
            contacts={contacts}
          />
        )}
      </div>
    </main>
  )
}

function FeedCards({
  feed,
  contacts,
  setFeed,
}: {
  feed: Feed[]
  contacts: Contact[]
  setFeed: React.Dispatch<React.SetStateAction<Feed[]>>
}) {
  const router = useRouter()
  const { data: user } = useSession()

  const [clients, setClients] = useState<Client[]>([])

  const fetchClients = () => {
    axiosApi.get("/api/client").then((res) => setClients(res.data))
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const updateFeedItem = (id: string, updatedFields: Partial<Feed>) => {
    setFeed((prevFeed) =>
      prevFeed.map((item) =>
        item.id === id ? { ...item, ...updatedFields } : item,
      ),
    )
  }

  // console.log("FEED TO RENDER", feed)

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid h-[680px] w-[95%] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {feed.map((feedItem) => (
          <Card key={feedItem.id} className="py-3">
            <CardContent className="flex flex-col gap-1 px-4 py-0">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-row items-center justify-center gap-2">
                  <div
                    className={cn(
                      "rounded-xl border-1 border-gray-300 px-2 py-1 text-sm dark:border-gray-700",
                      feedItem.type === "RECOMMENDATION" &&
                        "bg-gradient-to-t from-blue-100 to-transparent dark:from-blue-200 dark:to-white dark:text-black",
                      feedItem.type === "CLIENT_ACTIVITY" &&
                        "bg-gradient-to-t from-cyan-100 to-transparent dark:from-cyan-200 dark:to-white dark:text-black",
                      feedItem.type === "INDUSTRY_INFO" &&
                        "bg-gradient-to-t from-pink-100 to-transparent dark:from-pink-200 dark:to-white dark:text-black",
                      feedItem.type === "COLLEAGUES_UPDATE" &&
                        "bg-gradient-to-t from-green-100 to-transparent dark:from-green-200 dark:to-white dark:text-black",
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
                      feedItem.status === "ACTION_COMPLETED" &&
                        "text-green-400",
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

                <Button
                  variant="default"
                  onClick={async () => {
                    try {
                      await axiosApi.patch(`/api/feed/${feedItem.id}`, {
                        status: FeedStatus.CLOSED,
                      })
                      // feedItem.status = FeedStatus.CLOSED
                      updateFeedItem(feedItem.id, {
                        status: FeedStatus.CLOSED,
                      })
                      toast.success("Feed item closed successfully.")
                    } catch (error) {
                      console.error("Failed to close the feed item:", error)
                      toast.error("Failed to close the feed item.")
                    }
                  }}
                >
                  <Check />
                </Button>
              </div>

              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center justify-start gap-3 py-2">
                  <span className="text-sm text-gray-400">Client:</span>
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

              <div className="pb-2">
                <span className="pr-2 text-sm text-gray-400">Theme:</span>
                <span className="max-w-[200px] overflow-hidden text-sm">
                  {feedItem.metadata}
                </span>
              </div>

              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-row items-center justify-start gap-2">
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
                      onSuccess={() => {}}
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
                          updateFeedItem(feedItem.id, { taskId: newTask.id })
                        }}
                      />
                    )}

                  {feedItem.type === "COLLEAGUES_UPDATE" && (
                    <LikeButton feedId={feedItem.id} />
                  )}

                  {(feedItem.feedback || feedItem.feedbackBooking) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push(`/feed/${feedItem.id}`)
                      }}
                    >
                      <Brain size={24} className="text-blue-500" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-row items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push(`/feed/${feedItem.id}`)
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/*
function FeedCards({
  feed,
  setFeed,
}: {
  feed: Feed[]
  setFeed: React.Dispatch<React.SetStateAction<Feed[]>>
}) {
  const router = useRouter()
  const { data: user } = useSession()

  const [clients, setClients] = useState<Client[]>([])

  const fetchClients = () => {
    axiosApi.get("/api/client").then((res) => setClients(res.data))
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const updateFeedItem = (id: string, updatedFields: Partial<Feed>) => {
    setFeed((prevFeed) =>
      prevFeed.map((item) =>
        item.id === id ? { ...item, ...updatedFields } : item,
      ),
    )
  }

  const CARDS_PER_PAGE = 3
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(feed.length / CARDS_PER_PAGE)
  const startIdx = (page - 1) * CARDS_PER_PAGE
  const endIdx = startIdx + CARDS_PER_PAGE
  const pageFeed = feed.slice(startIdx, endIdx)

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid w-[95%] grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {pageFeed.map((feedItem) => (
          <Card key={feedItem.id} className="py-4">
            <CardContent className="flex flex-col gap-2 px-4 py-0">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-row items-center justify-center gap-2">
                  <div className="rounded-xl border-1 border-gray-300 px-2 py-1 text-sm">
                    {feedItem.type.replace(/_/g, " ")}
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border-1 border-gray-300 px-2 py-1 text-sm",
                      feedItem.status === "CANCELLED" && "text-gray-500",
                      feedItem.status === "IN_PROGRESS" && "text-blue-500",
                      feedItem.status === "ACTION_COMPLETED" &&
                        "text-green-400",
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
                <div className="flex flex-row items-center justify-start gap-3 py-2">
                  <span className="text-sm text-gray-400">Client:</span>
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

              <div className="pb-2">{feedItem.metadata}</div>

              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-row items-center justify-start gap-2">
                  <span className="text-sm text-gray-400">Actions:</span>
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
                      onSuccess={() => {}}
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
                        userId={user?.user.id}
                        onSuccess={(newTask) => {
                          updateFeedItem(feedItem.id, { taskId: newTask.id })
                        }}
                      />
                    )}

                  {feedItem.type === "COLLEAGUES_UPDATE" && (
                    <LikeButton feedId={feedItem.id} />
                  )}
                </div>

                <div className="flex flex-row items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push(`/feed/${feedItem.id}`)
                    }}
                  >
                    Details
                  </Button>

                  <Button
                    variant="default"
                    onClick={async () => {
                      try {
                        await axiosApi.patch(`/api/feed/${feedItem.id}`, {
                          status: FeedStatus.CLOSED,
                        })
                        // feedItem.status = FeedStatus.CLOSED
                        updateFeedItem(feedItem.id, {
                          status: FeedStatus.CLOSED,
                        })
                      } catch (error) {
                        console.error("Failed to close the feed item:", error)
                      }
                    }}
                  >
                    <Check />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            className="bg-muted text-foreground rounded px-3 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            className="bg-muted text-foreground rounded px-3 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
*/
