"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { DragOverEvent } from "@dnd-kit/core"
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/kibo-ui/kanban"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import axiosApi from "@/lib/axios"
import { toast } from "sonner"
import { format } from "date-fns"
import type { Task, Funnel } from "@/types/entities"

const FUNNEL_COLUMNS: { id: Funnel; name: string; color: string }[] = [
  { id: "Awareness", name: "Awareness", color: "#6B7280" },
  { id: "Interest", name: "Interest", color: "#3B82F6" },
  { id: "Decision", name: "Decision", color: "#F59E0B" },
  { id: "Action", name: "Action", color: "#10B981" },
  { id: "Retention", name: "Retention", color: "#8B5CF6" },
]

type KanbanItem = {
  id: string
  name: string
  column: string
  taskType: Task["type"]
  priority: Task["priority"]
  clientName: string | null
  date: string | Date | null | undefined
}

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  HIGH: "border-red-500 text-red-600",
  MEDIUM: "border-yellow-500 text-yellow-600",
  LOW: "border-gray-300 text-gray-500",
}

function taskToItem(task: Task): KanbanItem {
  return {
    id: task.id,
    name: task.theme || task.type,
    column: task.funnel ?? "Awareness",
    taskType: task.type,
    priority: task.priority,
    clientName: task.client?.name ?? null,
    date: task.date,
  }
}

export const Kanban = ({
  tasks,
  onTaskUpdated,
}: {
  tasks: Task[]
  onTaskUpdated: () => void
}) => {
  const router = useRouter()
  const [items, setItems] = useState<KanbanItem[]>(() => tasks.map(taskToItem))

  // Keep items in sync when tasks change (e.g. filter applied)
  useEffect(() => {
    setItems(tasks.map(taskToItem))
  }, [tasks])

  // Track which column a card is being dragged into, so we can call the API on drop
  const pendingMoveRef = useRef<{ taskId: string; funnel: Funnel } | null>(null)

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const overItem = items.find((i) => i.id === over.id)
    const overColumn =
      overItem?.column ?? FUNNEL_COLUMNS.find((c) => c.id === over.id)?.id

    if (overColumn) {
      pendingMoveRef.current = {
        taskId: active.id as string,
        funnel: overColumn as Funnel,
      }
    }
  }

  const handleDragEnd = async () => {
    const pending = pendingMoveRef.current
    pendingMoveRef.current = null

    if (!pending) return

    const originalTask = tasks.find((t) => t.id === pending.taskId)
    if (!originalTask) return

    const originalFunnel: Funnel = originalTask.funnel ?? "Awareness"
    if (originalFunnel === pending.funnel) return

    // Optimistic update already applied via onDataChange — now persist
    try {
      await axiosApi.patch(`/api/task/${pending.taskId}`, {
        funnel: pending.funnel,
      })
      toast.success(`Moved to ${pending.funnel}`)
      onTaskUpdated()
    } catch {
      toast.error("Failed to move task")
      // Revert optimistic update
      setItems(tasks.map(taskToItem))
    }
  }

  return (
    <KanbanProvider
      columns={FUNNEL_COLUMNS}
      data={items}
      onDataChange={setItems}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {(column) => (
        <KanbanBoard id={column.id} key={column.id}>
          <KanbanHeader>
            <div className="flex items-center gap-2 px-1 py-0.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <span>{column.name}</span>
              <span className="text-muted-foreground ml-auto text-xs font-normal">
                {items.filter((i) => i.column === column.id).length}
              </span>
            </div>
          </KanbanHeader>
          <KanbanCards<KanbanItem>
            id={column.id}
            scrollAreaClassName="max-h-[620px]"
          >
            {(item) => (
              <KanbanCard
                key={item.id}
                id={item.id}
                name={item.name}
                column={item.column}
                taskType={item.taskType}
                priority={item.priority}
                clientName={item.clientName}
                date={item.date}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm leading-snug font-medium">
                      {item.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 shrink-0 p-0"
                      onClick={() => router.push(`/tasks/${item.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[10px] text-gray-500"
                    >
                      {item.taskType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`h-4 px-1 text-[10px] ${PRIORITY_COLORS[item.priority]}`}
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  {item.clientName && (
                    <p className="text-muted-foreground truncate text-xs">
                      {item.clientName}
                    </p>
                  )}
                  {item.date && (
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(item.date), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  )
}
