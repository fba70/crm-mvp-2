"use client"

import React, { createContext, useState, useContext, ReactNode } from "react"

type NotificationContextType = {
  notificationsUpdated: boolean
  triggerNotificationUpdate: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notificationsUpdated, setNotificationsUpdated] = useState(false)

  const triggerNotificationUpdate = () => {
    setNotificationsUpdated((prev) => !prev) // Toggle state to notify listeners
  }

  return (
    <NotificationContext.Provider
      value={{ notificationsUpdated, triggerNotificationUpdate }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider",
    )
  }
  return context
}
