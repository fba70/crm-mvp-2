"use client"
import { useForm } from "react-hook-form"
import { useTransition, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Task } from "@/types/entities"
import axiosApi from "@/lib/axios"
import { toast } from "sonner"

type TaskStatusUpdateFields = {
  status: "OPEN" | "CLOSED" | "DELETED"
  statusChangeReason?: string
}

export default function FormTaskStatusChangeDialog({
  task,
  status,
  onSuccess,
  open,
  onOpenChange,
}: {
  task: Task
  status: "OPEN" | "CLOSED" | "DELETED"
  onSuccess: (t: Task) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<TaskStatusUpdateFields>({
    defaultValues: {
      status: status,
      statusChangeReason: task.statusChangeReason || "",
    },
  })

  useEffect(() => {
    form.reset({
      status: status,
      statusChangeReason: task.statusChangeReason || "",
    })
  }, [status, task, form])

  // console.log("TASK data", task)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (data: TaskStatusUpdateFields) => {
    setError(null)
    startTransition(async () => {
      const payload = { ...data }

      try {
        const res = await axiosApi.patch(`/api/task/${task.id}`, payload)
        onSuccess(res.data)
        toast.success("Task updated successfully")
        onOpenChange(false)
      } catch (err) {
        console.log("Task update error", err)
        setError("Failed to update task")
        toast.error("Failed to update task")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Status Update</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Status</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Task status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">OPEN</SelectItem>
                        <SelectItem value="CLOSED">CLOSED</SelectItem>
                        <SelectItem value="DELETED">DELETED</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="statusChangeReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">
                    Status Change Reason
                  </FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <div className="text-sm text-red-500">{error}</div>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
