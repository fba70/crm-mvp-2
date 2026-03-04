"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Check, Mails } from "lucide-react"
import type { Notification } from "@/types/entities"
import { toast } from "sonner"
import { useNotificationContext } from "@/context/notification-context"

export default function NewsDrawer({ userId }: { userId: string }) {
  const { notificationsUpdated } = useNotificationContext()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`/api/notification`, {
        params: { userId },
      })
      setNotifications(response.data)
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [notificationsUpdated])

  const handleStatusChange = async (id: string) => {
    try {
      await axios.patch(`/api/notification/${id}`, {
        read: true,
      })
      toast.success("Notification marked as read")
      // Refetch the notifications list
      await fetchNotifications()
    } catch (err) {
      toast.error("Failed to mark notification as read")
      console.error("Failed to mark notification as read:", err)
    }
  }
  // console.log("NOTIFICATIONS", notifications)

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Mails size={16} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
              {notifications.length}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>News and Announcements</DrawerTitle>
        </DrawerHeader>
        <div className="flex max-h-300 flex-col items-center justify-center gap-3 overflow-y-auto px-6">
          {loading && <p>Loading notifications...</p>}
          {error && (
            <p className="text-red-500">Error loading notifications...</p>
          )}
          <ul>
            {notifications.map((notification) => (
              <li key={notification.id}>
                <div className="mb-3 flex w-[380px] flex-col gap-1 rounded-md border p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p>{notification.message}</p>
                    <Button
                      variant="default"
                      onClick={() => handleStatusChange(notification.id)}
                    >
                      <Check />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p>
                      <span className="text-sm text-gray-500">Type:</span>{" "}
                      <span
                        className={
                          notification.type === "ACCEPTED"
                            ? "text-green-500"
                            : notification.type === "REJECTED"
                              ? "text-red-500"
                              : notification.type === "TRANSFER"
                                ? "text-blue-500"
                                : notification.type === "FEED"
                                  ? "text-pink-500"
                                  : "text-black"
                        }
                      >
                        {notification.type}
                      </span>
                    </p>{" "}
                    <p>
                      <span className="text-sm text-gray-500">Sender:</span>{" "}
                      {notification.sender?.name}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
