"use client"
import { useForm } from "react-hook-form"
import { useTransition, useState } from "react"
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
import type { Client } from "@/types/entities"
import axiosApi from "@/lib/axios"
import { toast } from "sonner"

type ClientEditFormFields = {
  name: string
  email?: string
  phone?: string
  address?: string
  webUrl?: string
}

export default function FormNewClientDialog({
  userId,
  onSuccess,
}: {
  userId: string
  onSuccess: (t: Client) => void
}) {
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userPrompt, setUserPrompt] = useState("")
  const [aiDialogOpen, setAIDialogOpen] = useState(false)

  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ClientEditFormFields>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      webUrl: "",
    },
  })

  const { setValue } = form

  const handleOpenAICall = async () => {
    setIsLoading(true)
    setResponse("")

    try {
      const systemPrompt =
        "You are a helpful assistant providing search of the publicly available data in internet based on client name or website URL." +
        "Structure the result into a JSON object with the following fields: name, email, phone, address, webUrl." +
        "Here name is the company official name, email is the general contact email address, phone is the general contact phone number, address is the full physical address, webUrl is the official website URL." +
        "If any of the fields are not found, return them as empty strings." +
        "Respond only with the JSON object and nothing else. Do not include any explanations or comments."

      const fullPrompt = `${systemPrompt}\n\nClient name or website URL to search for the data: ${userPrompt}`

      const res = await fetch("/api/openai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch LLM response")
      }

      const data = await res.json()
      const parsedData = JSON.parse(data.result.output_text) // Parse the JSON response

      console.log("AI parsed response:", parsedData)

      // Pre-fill the form fields with the AI response
      setValue("name", parsedData.name || "")
      setValue("email", parsedData.email || "")
      setValue("phone", parsedData.phone || "")
      setValue("address", parsedData.address || "")
      setValue("webUrl", parsedData.webUrl || "")

      setResponse("Client data pre-filled successfully!")
    } catch (error) {
      console.error("Error calling LLM API:", error)
      setResponse("An error occurred while processing your request.")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = (data: ClientEditFormFields) => {
    setError(null)
    startTransition(async () => {
      const payload = {
        ...data,
        createdById: userId,
      }

      try {
        const res = await axiosApi.post(`/api/client/`, payload)
        onSuccess(res.data)
        toast.success("Client created successfully")
        setOpen(false)
      } catch (err) {
        console.log("Client create error", err)
        setError("Failed to create client")
        toast.error("Failed to create client")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="">
          Add New Client (admin)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Client Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="webUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">Website URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="default"
              className="my-2 w-full"
              onClick={() => setAIDialogOpen(true)}
            >
              Search client with AI-assistant
            </Button>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <div className="mt-4 flex justify-end gap-2">
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

      {/* AI Search Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search Client Data with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter client name or website URL"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
            <Button
              onClick={handleOpenAICall}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
            {response && <p className="text-sm text-gray-500">{response}</p>}
          </div>
          {!isLoading && (
            <Button variant="outline" onClick={() => setAIDialogOpen(false)}>
              Close
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
