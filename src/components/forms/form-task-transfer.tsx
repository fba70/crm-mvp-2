"use client"

import { useForm } from "react-hook-form"
import { useTransition, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { NotificationType, type Task } from "@/types/entities"
import axiosApi from "@/lib/axios"
import { toast } from "sonner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

type TaskEditFormFields = {
  transferToId: string
  transferToReason: string
  transferStatus: "UNDEFINED" | "ACCEPTED" | "REJECTED"
}

type User = {
  id: string
  name: string
  image: string | null
}

export default function FormTaskTransferDialog({
  taskId,
  userId,
  onSuccess,
  triggerLabel = "Task Transfer",
}: {
  taskId: string
  userId: string
  onSuccess: (t: Task) => void
  triggerLabel?: string
}) {
  const form = useForm<TaskEditFormFields>({
    defaultValues: {
      transferToId: undefined,
      transferToReason: "",
      transferStatus: "UNDEFINED",
    },
  })

  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

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

  const onSubmit = (data: TaskEditFormFields) => {
    setError(null)
    startTransition(async () => {
      const payload = {
        ...data,
        transferStatus: "UNDEFINED",
      }

      const notificationPayload = {
        senderId: userId,
        recipientId: data.transferToId,
        message: data.transferToReason,
        type: NotificationType.TRANSFER,
        read: false,
      }

      try {
        const res = await axiosApi.patch(`/api/task/${taskId}`, payload)
        onSuccess(res.data)
        toast.success("Task transfer initiated successfully")

        try {
          await axiosApi.post("/api/notification", notificationPayload)
          toast.success("Notification sent successfully")
        } catch (notificationError) {
          console.error("Failed to send notification:", notificationError)
          toast.error(
            "Task transfer succeeded, but sending notification failed",
          )
        }

        setOpen(false)
      } catch (err) {
        console.log("Task transfer initiation error", err)
        setError("Failed to initiate task transfer ")
        toast.error("Failed to initiate task transfer")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="transferToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">
                    Tranfer to the User
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingUsers ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transferToReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">
                    Transfer Reason
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
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
                onClick={() => setOpen(false)}
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
