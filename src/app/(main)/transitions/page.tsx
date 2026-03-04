"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { unauthorized } from "next/navigation"
import type { Task } from "@/types/entities"
import axiosApi from "@/lib/axios"
import TransitionsLoading from "./loading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import FormTaskTransferManageDialog from "@/components/forms/form-task-transfer-manage"
import { Checkbox } from "@/components/ui/checkbox"

type User = {
  id: string
  name: string
  image: string | null
}

export default function TaskTransitionsPage() {
  const { data: user, isPending } = useSession()
  const router = useRouter()

  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [loading, setLoading] = useState(true)

  const [tasksToMePage, setTasksToMePage] = useState(1)
  const [tasksFromMePage, setTasksFromMePage] = useState(1)

  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [showClosedTasks, setShowClosedTasks] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosApi.get("/api/user")
        setUsers(response.data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    if (user && !isPending) {
      setLoading(true)
      axiosApi
        .get(`/api/task?userId=${user?.user.id}`)
        .then((res) => {
          const sortedTasks = (res.data as Task[]).sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          setTasks(sortedTasks)
        })
        .finally(() => setLoading(false))
    }
  }, [user, isPending])

  if (!user && !isPending) {
    unauthorized()
  }

  const tasksToMe =
    tasks?.filter(
      (task) =>
        task.transferToId === user?.user.id &&
        (showClosedTasks || task.status !== "CLOSED"), // Filter out closed tasks if checkbox is unchecked
    ) || []
  const tasksFromMe =
    tasks?.filter(
      (task) =>
        task.assignedToId === user?.user.id &&
        task.transferToId &&
        (showClosedTasks || task.status !== "CLOSED"), // Filter out closed tasks if checkbox is unchecked
    ) || []

  const ITEMS_PER_PAGE = 3
  const totalPages1 = Math.ceil(tasksToMe.length / ITEMS_PER_PAGE)
  const totalPages2 = Math.ceil(tasksFromMe.length / ITEMS_PER_PAGE)

  const paginatedTasksToMe = tasksToMe.slice(
    (tasksToMePage - 1) * ITEMS_PER_PAGE,
    tasksToMePage * ITEMS_PER_PAGE,
  )

  const paginatedTasksFromMe = tasksFromMe.slice(
    (tasksFromMePage - 1) * ITEMS_PER_PAGE,
    tasksFromMePage * ITEMS_PER_PAGE,
  )

  // console.log("Tasks:", tasks)

  if (loading || loadingUsers) return <TransitionsLoading />

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-0 pt-5">
      <div className="space-y-6">
        <div className="flex flex-row justify-between px-4">
          <h1 className="pl-2 text-2xl font-semibold">Tasks Transitions</h1>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-closed-tasks"
              checked={showClosedTasks}
              onCheckedChange={(checked) => setShowClosedTasks(!!checked)}
            />
            <label
              htmlFor="show-closed-tasks"
              className="text-sm text-gray-600 dark:text-gray-300"
            >
              Show Closed Tasks
            </label>
          </div>
        </div>

        <Tabs
          defaultValue="toMe"
          className="w-full items-center justify-center"
        >
          <TabsList>
            <TabsTrigger value="toMe">Tasks transferred to me:</TabsTrigger>
            <TabsTrigger value="fromMe">Tasks transferred by me:</TabsTrigger>
          </TabsList>
          <TabsContent value="toMe">
            {tasksToMe.length > 0 && (
              <>
                <div className="mt-2 flex w-[400px] flex-col items-center justify-center gap-2">
                  {paginatedTasksToMe.map((task) => (
                    <div
                      key={task.id}
                      className="w-[95%] rounded-lg border border-gray-300 px-4 py-2 shadow-sm"
                    >
                      <h3 className="mb-2 text-base font-semibold">
                        {task.theme}
                      </h3>
                      <div className="flex flex-row items-center justify-between gap-3">
                        <p className="w-[140px] truncate">
                          {task.client?.name}
                        </p>
                        <div className="flex flex-row items-center justify-start gap-3">
                          <Badge
                            variant="outline"
                            className="border-gray-300 text-gray-500"
                          >
                            {task.type}
                          </Badge>
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
                        </div>
                      </div>
                      <div className="mt-2 flex flex-row items-center justify-between gap-3">
                        <div className="flex flex-row items-center justify-center gap-2">
                          <span className="text-sm text-gray-400">From:</span>
                          <span className="w-[130px] truncate">
                            {users.find((u) => u.id === task.createdById)
                              ?.name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex flex-row items-center justify-center gap-2">
                          <span className="text-sm text-gray-400">To:</span>
                          <span className="w-[130px] truncate">
                            {users.find((u) => u.id === task.transferToId)
                              ?.name || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-row items-center justify-between gap-3">
                        <Badge
                          variant="outline"
                          className={
                            task.transferStatus === "ACCEPTED"
                              ? "border-green-600 text-green-600"
                              : task.transferStatus === "REJECTED"
                                ? "text--300 border-red-600 text-red-600"
                                : "border-gray-300 text-gray-500"
                          }
                        >
                          {task.transferStatus}
                        </Badge>
                        <div className="flex flex-row items-center justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/tasks/${task.id}`)}
                          >
                            Task Details
                          </Button>
                          <FormTaskTransferManageDialog
                            task={task}
                            recipientId={task.transferToId || ""}
                            senderId={task.createdById}
                            onSuccess={(updatedTask) => {
                              setTasks(
                                (prevTasks) =>
                                  prevTasks?.map((t) =>
                                    t.id === updatedTask.id ? updatedTask : t,
                                  ) || [],
                              )
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages1 > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-4">
                    <button
                      onClick={() =>
                        setTasksToMePage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={tasksToMePage === 1}
                      className="bg-muted text-foreground rounded px-3 py-1 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm">Page {tasksToMePage}</span>
                    <button
                      onClick={() =>
                        setTasksToMePage((prev) =>
                          prev < Math.ceil(tasksToMe.length / ITEMS_PER_PAGE)
                            ? prev + 1
                            : prev,
                        )
                      }
                      disabled={
                        tasksToMePage ===
                        Math.ceil(tasksToMe.length / ITEMS_PER_PAGE)
                      }
                      className="bg-muted text-foreground rounded px-3 py-1 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="fromMe">
            {tasksFromMe.length > 0 && (
              <>
                <div className="mt-2 flex w-[400px] flex-col items-center justify-center gap-2">
                  {paginatedTasksFromMe.map((task) => (
                    <div
                      key={task.id}
                      className="w-[95%] rounded-lg border border-gray-300 px-4 py-2 shadow-sm"
                    >
                      <h3 className="mb-2 text-base font-semibold">
                        {task.theme}
                      </h3>
                      <div className="flex flex-row items-center justify-between gap-3">
                        <p className="w-[140px] truncate">
                          {task.client?.name}
                        </p>
                        <div className="flex flex-row items-center justify-start gap-3">
                          <Badge
                            variant="outline"
                            className="border-gray-300 text-gray-500"
                          >
                            {task.type}
                          </Badge>
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
                        </div>
                      </div>
                      <div className="mt-2 flex flex-row items-center justify-between gap-3">
                        <div className="flex flex-row items-center justify-center gap-2">
                          <span className="text-sm text-gray-400">From:</span>
                          <span className="w-[130px] truncate">
                            {users.find((u) => u.id === task.createdById)
                              ?.name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex flex-row items-center justify-center gap-2">
                          <span className="text-sm text-gray-400">To:</span>
                          <span className="w-[130px] truncate">
                            {users.find((u) => u.id === task.transferToId)
                              ?.name || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-row items-center justify-between gap-3">
                        <Badge
                          variant="outline"
                          className={
                            task.transferStatus === "ACCEPTED"
                              ? "border-green-600 text-green-600"
                              : task.transferStatus === "REJECTED"
                                ? "text--300 border-red-600 text-red-600"
                                : "border-gray-300 text-gray-500"
                          }
                        >
                          {task.transferStatus}
                        </Badge>
                        <div className="flex flex-row items-center justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/tasks/${task.id}`)}
                          >
                            Task Details
                          </Button>
                          <FormTaskTransferManageDialog
                            task={task}
                            recipientId={task.transferToId || ""}
                            senderId={task.createdById}
                            onSuccess={(updatedTask) => {
                              setTasks(
                                (prevTasks) =>
                                  prevTasks?.map((t) =>
                                    t.id === updatedTask.id ? updatedTask : t,
                                  ) || [],
                              )
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages2 > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-4">
                    <button
                      onClick={() =>
                        setTasksFromMePage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={tasksFromMePage === 1}
                      className="bg-muted text-foreground rounded px-3 py-1 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm">Page {tasksFromMePage}</span>
                    <button
                      onClick={() =>
                        setTasksFromMePage((prev) =>
                          prev < Math.ceil(tasksFromMe.length / ITEMS_PER_PAGE)
                            ? prev + 1
                            : prev,
                        )
                      }
                      disabled={
                        tasksFromMePage ===
                        Math.ceil(tasksFromMe.length / ITEMS_PER_PAGE)
                      }
                      className="bg-muted text-foreground rounded px-3 py-1 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
