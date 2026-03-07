"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { unauthorized } from "next/navigation"
import { TasksCarousel } from "@/components/business/carousel"
import type { Task, Client, Contact } from "@/types/entities"
import FormNewTaskDialog from "@/components/forms/form-new-task"
import axiosApi from "@/lib/axios"
import TasksLoading from "./loading"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import TaskTransitions from "./transitions"

export default function TasksPage() {
  const { data: user, isPending } = useSession()

  if (!user && !isPending) {
    unauthorized()
  }

  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("typeFilter") || "ALL"
      : "ALL",
  )
  const [clientNameFilter, setClientNameFilter] = useState<string>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("clientNameFilter") || ""
      : "",
  )
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() =>
    typeof window !== "undefined"
      ? (sessionStorage.getItem("sortOrder") as "asc" | "desc") || "desc"
      : "desc",
  )
  const [priorityFilter, setPriorityFilter] = useState<string>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("priorityFilter") || "ALL"
      : "ALL",
  )
  const [showClosed, setShowClosed] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("showClosed") === "true"
      : false,
  )

  const fetchTasks = () => {
    setLoading(true)
    axiosApi
      .get(`/api/task?userId=${user?.user.id}`)
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false))
  }

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
    if (user && !isPending) {
      fetchTasks()
    }
  }, [user, isPending])

  useEffect(() => {
    fetchClients()
    fetchContacts()
  }, [])

  // console.log("TASKS data", tasks)

  // Save filters to sessionStorage whenever they change
  useEffect(() => {
    const currentTypeFilter = sessionStorage.getItem("typeFilter")
    const currentClientNameFilter = sessionStorage.getItem("clientNameFilter")
    const currentSortOrder = sessionStorage.getItem("sortOrder")
    const currentPriorityFilter = sessionStorage.getItem("priorityFilter")
    const currentShowClosed = sessionStorage.getItem("showClosed")

    if (currentTypeFilter !== typeFilter) {
      sessionStorage.setItem("typeFilter", typeFilter)
    }
    if (currentClientNameFilter !== clientNameFilter) {
      sessionStorage.setItem("clientNameFilter", clientNameFilter)
    }
    if (currentSortOrder !== sortOrder) {
      sessionStorage.setItem("sortOrder", sortOrder)
    }
    if (currentPriorityFilter !== priorityFilter) {
      sessionStorage.setItem("priorityFilter", priorityFilter)
    }
    if (currentShowClosed !== showClosed.toString()) {
      sessionStorage.setItem("showClosed", showClosed.toString())
    }
  }, [typeFilter, clientNameFilter, sortOrder, priorityFilter, showClosed])

  // Reset filters to default values
  const resetFilters = () => {
    setTypeFilter("ALL")
    setClientNameFilter("")
    setSortOrder("desc")
    setPriorityFilter("ALL")
    setShowClosed(false)
    sessionStorage.clear() // Clear all saved filters
  }

  const filteredTasks = tasks
    ?.filter(
      (task) =>
        task.status !== "DELETED" && // Exclude deleted tasks
        (showClosed || task.status !== "CLOSED") && // Only include CLOSED if checked
        (typeFilter === "ALL" || task.type === typeFilter) &&
        (priorityFilter === "ALL" || task.priority === priorityFilter) &&
        (clientNameFilter === "" ||
          (task.client?.name ?? "")
            .toLowerCase()
            .includes(clientNameFilter.toLowerCase())),
    )
    ?.sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  if (loading || clientsLoading || contactsLoading) return <TasksLoading />

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-0 pt-5">
      <div className="space-y-6">
        <div className="flex flex-row justify-between px-4">
          <h1 className="pl-2 text-2xl font-semibold">Tasks</h1>
          <div className="flex flex-row gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            {user && (
              <FormNewTaskDialog
                clients={clients}
                contacts={contacts}
                userId={user?.user.id}
                onSuccess={() => fetchTasks()}
                triggerLabel="Add New Task"
              />
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-row items-center justify-between gap-4 px-6">
          <Input
            type="text"
            placeholder="Filter by client name..."
            value={clientNameFilter}
            onChange={(e) => setClientNameFilter(e.target.value)}
            className="w-[360px]"
          />

          <Select
            value={sortOrder}
            onValueChange={(v) => setSortOrder(v as "asc" | "desc")}
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Sort by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">New first</SelectItem>
              <SelectItem value="asc">Old first</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="CALL">Call</SelectItem>
              <SelectItem value="MEET">Meet</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="OFFER">Offer</SelectItem>
              <SelectItem value="PRESENTATION">Presentation</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              id="show-closed"
              checked={showClosed}
              onCheckedChange={(v) => setShowClosed(Boolean(v))}
            />
            <label htmlFor="show-closed" className="text-sm">
              include closed
            </label>
          </div>
        </div>

        <section className="mt-4 flex flex-1 flex-col rounded-lg border-1 border-dashed border-gray-300 p-2 shadow-lg">
          {tasks && (
            <TasksCarousel
              tasks={filteredTasks ?? []}
              onTaskStatusUpdated={fetchTasks}
            />
          )}
        </section>

        <section>
          <TaskTransitions />
        </section>
      </div>
    </main>
  )
}
