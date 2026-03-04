"use client"

import { useEffect, useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Task, Client, Contact } from "@/types/entities"
import { User } from "@/generated/prisma/wasm"
import axiosApi from "@/lib/axios"
import { toast } from "sonner"
import { DialogDescription } from "@radix-ui/react-dialog"
import { Checkbox } from "@/components/ui/checkbox"

type TaskEditFormFields = {
  theme?: string
  type: "CALL" | "MEET" | "EMAIL" | "OFFER" | "PRESENTATION"
  priority: "LOW" | "MEDIUM" | "HIGH"
  status: "OPEN" | "CLOSED"
  date: string
  contactPhone?: string
  contactEmail?: string
  contactPerson?: string
  address?: string
  urlLink?: string
  clientId?: string
  contactId?: string
  parentTaskId?: string
  collaborators?: string[]
}

export default function FormNewTaskDialog({
  clients,
  contacts,
  userId,
  onSuccess,
  triggerLabel,
  parentTaskId,
}: {
  clients: Client[]
  contacts: Contact[]
  userId: string
  onSuccess: (t: Task) => void
  triggerLabel?: string
  parentTaskId?: string
}) {
  const form = useForm<TaskEditFormFields>({
    defaultValues: {
      status: "OPEN",
      type: "CALL",
      priority: "HIGH",
      theme: "",
      date: new Date().toISOString().slice(0, 10),
      contactPhone: "",
      contactEmail: "",
      contactPerson: "",
      address: "",
      urlLink: "",
      clientId: "",
      contactId: "",
      parentTaskId: parentTaskId || undefined,
      collaborators: [],
    },
  })

  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      try {
        const res = await axiosApi.get("/api/user")
        setUsers(res.data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const { control, setValue } = form

  // Watch for changes to the contactId field
  const selectedContactId = useWatch({
    control,
    name: "contactId",
  })

  // Watch for changes to the clientId field
  const selectedClientId = useWatch({
    control,
    name: "clientId",
  })

  useEffect(() => {
    const selectedContact = contacts.find(
      (contact) => contact.id === selectedContactId,
    )

    // If contact has a clientId and it's different from current, autofill it
    if (
      selectedContact?.clientId &&
      form.getValues("clientId") !== selectedContact.clientId
    ) {
      setValue("clientId", selectedContact.clientId)
    }
    // If no contact selected, do nothing (leave clientId as is)
  }, [selectedContactId, contacts, setValue])

  useEffect(() => {
    const associatedContacts = contacts.filter(
      (contact) => contact.clientId === selectedClientId,
    )

    // If client has contacts and it's different from current, autofill the first one
    if (
      associatedContacts.length > 0 &&
      form.getValues("contactId") !== associatedContacts[0].id
    ) {
      setValue("contactId", associatedContacts[0].id)
    } else if (associatedContacts.length === 0 && form.getValues("contactId")) {
      // If no contacts, clear contactId
      setValue("contactId", "")
    }
    // If no client selected, do nothing (leave contactId as is)
  }, [selectedClientId, contacts, setValue])

  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeMeeting = form.watch("type")

  const onSubmit = (data: TaskEditFormFields) => {
    setError(null)
    startTransition(async () => {
      const payload = {
        ...data,
        createdById: userId,
        assignedToId: userId,
        parentTaskId: parentTaskId || undefined,
        clientId:
          data.clientId === "No client" || data.clientId === ""
            ? null
            : data.clientId, // Convert "No client" or empty string to null
        contactId:
          data.contactId === "No contact" || data.contactId === ""
            ? null
            : data.contactId, // Convert "No contact" or empty string to null
        collaborators: {
          connect: data.collaborators?.map((id) => ({ id })) || [], // Connect collaborators by ID
        },
      }

      if (payload.date) {
        payload.date = new Date(payload.date).toISOString()
      }

      try {
        const res = await axiosApi.post(`/api/task/`, payload)
        onSuccess(res.data)
        toast.success("Task created successfully!")
        setOpen(false)
      } catch (err) {
        console.log("Task create error", err)
        setError("Failed to create task")
        toast.error("Failed to create task")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="">
          {triggerLabel ?? "Add New Task"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          {parentTaskId && (
            <DialogDescription className="mt-1 text-xs text-gray-500">
              Parent task ID: {parentTaskId}
            </DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <div className="flex flex-row items-center justify-between">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Task status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">OPEN</SelectItem>
                          <SelectItem value="CLOSED">CLOSED</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Task type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CALL">CALL</SelectItem>
                          <SelectItem value="MEET">MEET</SelectItem>
                          <SelectItem value="EMAIL">EMAIL</SelectItem>
                          <SelectItem value="OFFER">OFFER</SelectItem>
                          <SelectItem value="PRESENTATION">
                            PRESENTATION
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">Priority</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Task priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">LOW</SelectItem>
                          <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                          <SelectItem value="HIGH">HIGH</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Theme</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">Client</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No client">No client</SelectItem>
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
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">Contact</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No contact">No contact</SelectItem>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="collaborators"
              render={() => (
                <FormItem>
                  <FormLabel className="text-gray-500">
                    Collaborators (Optional)
                  </FormLabel>
                  <div className="max-h-16 space-y-2 overflow-y-auto">
                    {usersLoading ? (
                      <p className="text-sm text-gray-500">Loading users...</p>
                    ) : (
                      users.map((user) => (
                        <FormField
                          key={user.id}
                          control={form.control}
                          name="collaborators"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, user.id])
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== user.id),
                                      )
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {user.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urlLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">T-con URL</FormLabel>
                  <FormControl>
                    <Input type="url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {typeMeeting === "MEET" && (
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

/*
<FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">
                    Contact Person
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row gap-8">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">
                      Contact Email
                    </FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">
                      Contact Phone
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
*/
