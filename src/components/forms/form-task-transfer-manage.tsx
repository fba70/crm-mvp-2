"use client"

import { useForm } from "react-hook-form"
import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { NotificationType, type Task } from "@/types/entities"
import axiosApi from "@/lib/axios"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useNotificationContext } from "@/context/notification-context"

type TaskStatusUpdateFields = {
  transferStatus?: "UNDEFINED" | "ACCEPTED" | "REJECTED"
  rejectionReason?: string
}

export default function FormTaskTransferManageDialog({
  task,
  recipientId,
  senderId,
  onSuccess,
}: {
  task: Task
  recipientId: string
  senderId: string
  onSuccess: (t: Task) => void
}) {
  const form = useForm<TaskStatusUpdateFields>({
    defaultValues: {
      transferStatus: "ACCEPTED",
    },
  })

  const { triggerNotificationUpdate } = useNotificationContext()

  const [isOpen, setIsOpen] = useState(false) // State to control dialog visibility

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (data: TaskStatusUpdateFields) => {
    setError(null)
    startTransition(async () => {
      const payload = { ...data }

      let notificationPayload: {
        senderId: string
        recipientId: string
        message: string
        type: NotificationType
        read: boolean
      } = {
        senderId: senderId,
        recipientId: recipientId,
        message: "Default notification message",
        type: NotificationType.GENERAL, // Use a default type
        read: false,
      }

      if (data.transferStatus === "ACCEPTED") {
        notificationPayload = {
          senderId: senderId,
          recipientId: recipientId,
          message: data.rejectionReason || "Task transfer accepted",
          type: NotificationType.ACCEPTED,
          read: false,
        }
      } else if (data.transferStatus === "REJECTED") {
        notificationPayload = {
          senderId: senderId,
          recipientId: recipientId,
          message: data.rejectionReason || "Task transfer rejected",
          type: NotificationType.REJECTED,
          read: false,
        }
      }

      try {
        const res = await axiosApi.patch(`/api/task/${task.id}`, payload)
        onSuccess(res.data)

        // Add notification record
        try {
          await axiosApi.post("/api/notification", notificationPayload)
          toast.success("Task transfer status updated, and notification sent")
          triggerNotificationUpdate()
        } catch (notificationError) {
          console.error("Failed to create notification:", notificationError)
          toast.error("Task transfer status updated, but notification failed")
        }

        toast.success("Task transfer status updated successfully")
        setIsOpen(false) // Close the dialog on success
      } catch (err) {
        console.log("Task transfer status update error", err)
        setError("Failed to update task transfer status")
        toast.error("Failed to update task transfer status")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" onClick={() => setIsOpen(true)}>
          Task Transfer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Task Transfer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="transferStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">
                    Accept or reject the Task:
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-row items-center justify-start gap-4 py-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ACCEPTED" id="accept" />
                        <Label htmlFor="accept">Accept</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="REJECTED" id="reject" />
                        <Label htmlFor="reject">Reject</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rejectionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">
                    If you reject the Task, please provide the reason:
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                onClick={() => setIsOpen(false)} // Close the dialog on cancel
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
