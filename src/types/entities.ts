import { User } from "@/generated/prisma/wasm"

export type Task = {
  id: string
  type: "CALL" | "MEET" | "EMAIL" | "OFFER" | "PRESENTATION"
  priority: "LOW" | "MEDIUM" | "HIGH"
  status: "OPEN" | "CLOSED" | "DELETED"
  theme?: string | null
  date?: string | Date | null
  contactPhone?: string | null
  contactEmail?: string | null
  contactPerson?: string | null
  address?: string | null
  urlLink?: string | null
  statusChangeReason?: string | null
  clientId?: string | null
  client?: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
    createdAt: string | Date
    updatedAt: string | Date
  } | null
  parentTaskId?: string | null
  parentTask?: Task | null
  linkedTasks?: Task[]
  transferToId: string | null
  transferTo?: User | null
  transferToReason?: string | null
  transferStatus?: "UNDEFINED" | "ACCEPTED" | "REJECTED"
  rejectionReason?: string | null
  createdById: string
  assignedToId?: string | null
  collaborators?: User[] | null
  createdAt: string | Date
  updatedAt: string | Date
  contactId?: string | null
  contact?: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
    position?: string | null
    createdAt: Date
    updatedAt: Date
    clientId?: string | null
    client?: Client | null
    createdById: string | null
    createdBy: User | null
  } | null
}

export type Client = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  webUrl?: string | null
  createdAt: string | Date
  updatedAt: string | Date
  createdById?: string | null
  createdBy?: User | null
  tasks?: Task[]
  feeds?: Feed[]
  contacts?: Contact[]
}

export enum FeedType {
  RECOMMENDATION = "RECOMMENDATION",
  CLIENT_ACTIVITY = "CLIENT_ACTIVITY",
  INDUSTRY_INFO = "INDUSTRY_INFO",
  COLLEAGUES_UPDATE = "COLLEAGUES_UPDATE",
}

export enum FeedStatus {
  NEW = "NEW",
  CANCELLED = "CANCELLED",
  IN_PROGRESS = "IN_PROGRESS",
  ACTION_COMPLETED = "ACTION_COMPLETED",
  CLOSED = "CLOSED",
}

export interface Feed {
  id: string
  type: FeedType
  status: FeedStatus
  actionCall?: boolean
  actionEmail?: boolean
  actionBooking?: boolean
  actionTask?: boolean
  metadata?: string
  feedback?: string
  feedbackBooking?: string
  clientId?: string
  client?: Client
  taskId?: string
  task?: Task
  createdAt: Date
  updatedAt: Date
}

export interface Like {
  id: string
  userId: string
  feedId: string
  createdAt: Date
}

export type Contact = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  position?: string | null
  createdAt: Date
  updatedAt: Date
  clientId?: string | null
  client?: Client | null
  createdById: string | null
  createdBy: User | null
}

export enum NotificationType {
  GENERAL = "GENERAL",
  FEED = "FEED",
  TRANSFER = "TRANSFER",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export type Notification = {
  id: string
  recipientId?: string | null
  senderId?: string | null
  sender?: User | null
  message?: string | null
  type: NotificationType
  read: boolean
  createdAt: Date
  updatedAt: Date
}
