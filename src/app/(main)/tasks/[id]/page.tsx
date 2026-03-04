"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RouteButton from "@/components/business/route-button"
import { Badge } from "@/components/ui/badge"
import { ChevronsRight, ExternalLink, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import FormTaskEditDialog from "@/components/forms/form-task-edit"
import FormNewTaskDialog from "@/components/forms/form-new-task"
import FormTaskTransferDialog from "@/components/forms/form-task-transfer"
import type { Task, Client, Contact } from "@/types/entities"
import { unauthorized, notFound } from "next/navigation"
import TaskLoading from "./loading"
import axiosApi from "@/lib/axios"
import { Button } from "@/components/ui/button"

type User = {
  id: string
  name: string
  image: string | null
}

export default function TaskPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params as { id: string }

  const { data: user, isPending } = useSession()

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  useEffect(() => {
    if (!id) return

    // Reset states to show loading indicator and prevent stale data
    setTask(null)
    setClients([])
    setContacts([])
    setUsers([])
    setLoading(true)
    setClientsLoading(true)
    setLoadingContacts(true)
    setLoadingUsers(true)

    const fetchAllData = async () => {
      try {
        const [taskRes, clientsRes, contactsRes, usersRes] = await Promise.all([
          axiosApi.get(`/api/task/${id}`),
          axiosApi.get("/api/client"),
          axiosApi.get("/api/contact"),
          axiosApi.get("/api/user"),
        ])
        setTask(taskRes.data)
        setClients(clientsRes.data)
        setContacts(contactsRes.data)
        setUsers(usersRes.data)
      } catch (error) {
        console.error("Failed to fetch task page data:", error)
        // Optionally set an error state here
      } finally {
        setLoading(false)
        setClientsLoading(false)
        setLoadingContacts(false)
        setLoadingUsers(false)
      }
    }

    fetchAllData()
  }, [id])

  if (loading || clientsLoading || loadingUsers || loadingContacts)
    return <TaskLoading />
  if (!user && !isPending) {
    unauthorized()
  }
  if (!task) {
    notFound()
  }

  const handleSuccess = () => {
    setLoading(true)
    axiosApi
      .get(`/api/task/${id}`)
      .then((res) => setTask(res.data))
      .catch((err) => console.error("Failed to refetch task", err))
      .finally(() => setLoading(false))
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-0 pt-5">
      <div className="flex justify-between">
        <div className="flex w-[95%] flex-row items-center justify-between gap-2">
          <h1 className="ml-6 text-2xl font-semibold">Task</h1>
          <div className="flex flex-row gap-2">
            <RouteButton pathParam="/tasks" nameParam="Go to all tasks" />

            {task.parentTaskId && (
              <Button
                variant="default"
                onClick={() => {
                  if (task.parentTaskId) {
                    router.push(`/tasks/${task.parentTaskId}`)
                  }
                }}
              >
                Go to parent task
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <Card className="mx-auto mt-6 flex w-[90%] max-w-xl flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <div className="flex flex-row items-center justify-start gap-1">
                {task.type}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    task.status === "OPEN"
                      ? "border-green-600 text-green-600"
                      : "border-gray-300 text-gray-500"
                  }
                >
                  {task.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    task.priority === "HIGH"
                      ? "border-red-600 text-red-600"
                      : task.priority === "MEDIUM"
                        ? "border-yellow-600 text-yellow-600"
                        : "border-gray-300 text-blue-500"
                  }
                >
                  {task.priority}
                </Badge>
                {task.transferToId && (
                  <Badge
                    variant="outline"
                    className={
                      task.transferStatus === "REJECTED"
                        ? "border-red-600 text-red-600"
                        : task.transferStatus === "ACCEPTED"
                          ? "border-green-600 text-green-600"
                          : "border-gray-300 text-gray-500"
                    }
                  >
                    {task.transferStatus}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-4 grid max-h-120 grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 overflow-y-auto">
              <div className="pr-2 text-sm text-gray-500">Task Name:</div>
              <div className="text-lg">{task.theme || "—"}</div>

              <div className="pr-2 text-sm text-gray-500">Due Date:</div>
              <div className="text-lg">
                {task.date ? format(new Date(task.date), "dd.MM.yyyy") : "—"}
              </div>

              {task.client && (
                <>
                  <div className="pr-2 text-sm text-gray-500">Client name:</div>
                  <div className="text-lg">{task.client?.name || "—"}</div>

                  <div className="pr-2 text-sm text-gray-500">
                    Client Phone:
                  </div>
                  <div className="flex items-center gap-3 text-lg">
                    <span className="w-[180px] overflow-hidden">
                      {task.client?.phone || "—"}
                    </span>
                    <a
                      href={`tel:${task.client?.phone ?? ""}`}
                      onClick={(e) => {
                        if (!task.client?.phone) e.preventDefault()
                      }}
                    >
                      <Phone className="h-5 w-5 text-blue-500" />
                    </a>
                  </div>

                  <div className="pr-2 text-sm text-gray-500">
                    Client Email:
                  </div>
                  <div className="flex items-center gap-3 text-lg">
                    <span className="w-[180px] overflow-hidden">
                      {task.client?.email || "—"}
                    </span>
                    <a
                      href={`mailto:${task.client?.email ?? ""}`}
                      onClick={(e) => {
                        if (!task.client?.email) e.preventDefault()
                      }}
                    >
                      <Mail className="h-5 w-5 text-blue-500" />
                    </a>
                  </div>
                </>
              )}

              {task.contact && (
                <>
                  <div className="pr-2 text-sm text-gray-500">
                    Contact name:
                  </div>
                  <div className="text-lg">{task.contact?.name || "—"}</div>

                  <div className="pr-2 text-sm text-gray-500">
                    Contact Phone:
                  </div>
                  <div className="flex items-center gap-3 text-lg">
                    <span className="w-[180px] overflow-hidden">
                      {task.contact?.phone || "—"}
                    </span>
                    <a
                      href={`tel:${task.contact?.phone ?? ""}`}
                      onClick={(e) => {
                        if (!task.contact?.phone) e.preventDefault()
                      }}
                    >
                      <Phone className="h-5 w-5 text-blue-500" />
                    </a>
                  </div>

                  <div className="pr-2 text-sm text-gray-500">
                    Contact Email:
                  </div>
                  <div className="flex items-center gap-3 text-lg">
                    <span className="w-[180px] overflow-hidden">
                      {task.contact?.email || "—"}
                    </span>
                    <a
                      href={`mailto:${task.contact?.email ?? ""}`}
                      onClick={(e) => {
                        if (!task.contact?.email) e.preventDefault()
                      }}
                    >
                      <Mail className="h-5 w-5 text-blue-500" />
                    </a>
                  </div>
                </>
              )}

              <div className="pr-2 text-sm text-gray-500">Meeting URL:</div>
              <div className="text-base">
                {task.urlLink ? (
                  <a
                    href={task.urlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-500"
                  >
                    <span className="w-[180px] overflow-hidden">
                      Conference link
                    </span>
                    <ExternalLink className="h-5 w-5 text-blue-500" />
                  </a>
                ) : (
                  "—"
                )}
              </div>

              {task.type === "MEET" && (
                <>
                  <div className="pr-2 text-sm text-gray-500">Address:</div>
                  <div className="text-lg">{task.address || "—"}</div>
                </>
              )}

              {task.parentTaskId && (
                <>
                  <div className="pr-2 text-sm text-gray-500">Parent task:</div>
                  <div className="flex items-center justify-start gap-2 text-lg">
                    {task.parentTask?.theme}{" "}
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (task.parentTaskId) {
                          router.push(`/tasks/${task.parentTaskId}`)
                        }
                      }}
                    >
                      <ChevronsRight />
                    </Button>
                  </div>
                </>
              )}

              {task.linkedTasks && task.linkedTasks.length > 0 && (
                <>
                  <div className="pr-2 text-sm text-gray-500">
                    Linked Task(s):
                  </div>
                  <div className="flex flex-col gap-2">
                    {task.linkedTasks.map((linkedTask) => (
                      <div
                        key={linkedTask.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="text-lg">{linkedTask.theme || "—"}</div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            router.push(`/tasks/${linkedTask.id}`)
                          }}
                        >
                          <ChevronsRight />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {task.collaborators && task.collaborators.length > 0 && (
                <>
                  <div className="pr-2 text-sm text-gray-500">
                    Collaborators:
                  </div>
                  <div className="flex flex-col gap-2">
                    {task.collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="text-lg">
                        {collaborator.name || "—"}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {task.transferToId && (
                <>
                  <div className="pr-2 text-sm text-gray-500">
                    Transfered to:
                  </div>
                  <div className="text-lg">
                    {users.find((u) => u.id === task.transferToId)?.name ||
                      "Unknown"}
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <div className="mx-auto flex w-[80%] flex-row items-center justify-center gap-2">
            <FormTaskEditDialog
              task={task}
              clients={clients}
              contacts={contacts}
              onSuccess={handleSuccess}
            />

            {user?.user.id && (
              <FormNewTaskDialog
                clients={clients}
                contacts={contacts}
                userId={user?.user.id}
                onSuccess={handleSuccess}
                triggerLabel="Add Linked Task"
                parentTaskId={task.id}
              />
            )}

            <FormTaskTransferDialog
              taskId={task.id}
              userId={user?.user.id || ""}
              onSuccess={handleSuccess}
              triggerLabel="Transfer Task"
            />
          </div>
        </Card>
      </div>
    </main>
  )
}
