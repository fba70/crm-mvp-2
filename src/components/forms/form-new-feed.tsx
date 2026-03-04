"use client"

import { useForm } from "react-hook-form"
import { useTransition, useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { Client, Feed } from "@/types/entities"
import { FeedType, FeedStatus, NotificationType } from "@/types/entities"
import axiosApi from "@/lib/axios"
import { toast } from "sonner"

export default function FormNewFeedDialog({
  onSuccess,
  triggerLabel = "Add Feed Item (admin)",
}: {
  onSuccess: (t: Feed) => void
  triggerLabel?: string
}) {
  const form = useForm<Feed>({
    defaultValues: {
      type: FeedType.RECOMMENDATION,
      status: FeedStatus.NEW,
      actionCall: false,
      actionEmail: false,
      actionBooking: false,
      actionTask: false,
      metadata: "",
      clientId: undefined,
      taskId: undefined,
    },
  })

  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axiosApi.get("/api/client")
        setClients(response.data)
      } catch (err) {
        console.error("Failed to fetch clients:", err)
      }
    }

    fetchClients()
  }, [])

  const onSubmit = (data: Feed) => {
    setError(null)
    startTransition(async () => {
      const payload = {
        ...data,
        taskId: undefined,
      }

      const notificationPayload = {
        senderId: null,
        recipientId: null,
        message: data.metadata,
        type: NotificationType.FEED,
        read: false,
      }

      try {
        const res = await axiosApi.post(`/api/feed/`, payload)
        onSuccess(res.data)
        toast.success("Feed created successfully")

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
        console.log("Feed create error", err)
        setError("Failed to create feed")
        toast.error("Failed to create feed")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="">
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(FeedType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ")}{" "}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(FeedStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ")}{" "}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row gap-12">
              <div className="flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="actionCall"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-gray-500">
                        Action Call
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="actionEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-gray-500">
                        Action Email
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="actionBooking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-gray-500">
                        Action Booking
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="actionTask"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-gray-500">
                        Action Task
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Client</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Feed Info</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter feed info here..."
                      rows={4}
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
