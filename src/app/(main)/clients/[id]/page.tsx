"use client"

import { useParams } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import RouteButton from "@/components/business/route-button"
import { Card, CardContent } from "@/components/ui/card"
import axios from "axios"
import { useEffect, useState } from "react"
import ClientsLoading from "../loading"
import unauthorized from "@/app/unauthorized"
import FormClientEditDialog from "@/components/forms/form-client-edit"
import FormNewContactDialog from "@/components/forms/form-new-contact"
import type { Client } from "@/types/entities"
import { Button } from "@/components/ui/button"

export default function ClientItemPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params as { id: string }
  const { data: user, isPending } = useSession()
  const [client, setClient] = useState<Client | null>(null)
  const [clientLoading, setClientLoading] = useState(true)

  const fetchClient = async () => {
    try {
      const response = await axios.get(`/api/client/${id}`)
      setClient(response.data)
    } catch (error) {
      console.error("Failed to fetch client data:", error)
    } finally {
      setClientLoading(false)
    }
  }

  useEffect(() => {
    fetchClient()
  }, [id])

  if (!user && !isPending) {
    unauthorized()
  }

  // console.log("CLIENT", client)

  if (clientLoading) return <ClientsLoading />

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-0 pt-5">
      <div className="flex justify-between">
        <div className="flex w-[95%] flex-row items-center justify-between gap-2">
          <h1 className="ml-6 text-2xl font-semibold">Client Details:</h1>
          <RouteButton
            pathParam="/clients"
            nameParam="Go back to clients list"
          />
        </div>
      </div>

      <div className="max-h-190 overflow-y-auto">
        <Card className="mx-auto mt-6 flex w-[95%] flex-col py-4">
          <CardContent className="flex flex-col gap-4 px-5 py-0">
            <div className="mb-2 grid grid-cols-[120px_auto] gap-4">
              <div className="text-gray-400">Name:</div>
              <div className="text-xl text-black dark:text-gray-300">
                {client?.name}
              </div>

              <div className="text-gray-400">Email:</div>
              <div className="text-xl text-black dark:text-gray-300">
                {client?.email || "N/A"}
              </div>

              <div className="text-gray-400">Phone:</div>
              <div className="text-xl text-black dark:text-gray-300">
                {client?.phone || "N/A"}
              </div>

              <div className="text-gray-400">Address:</div>
              <div className="text-xl text-black dark:text-gray-300">
                {client?.address || "N/A"}
              </div>

              <div className="text-gray-400">Website URL:</div>
              <div className="text-xl text-black dark:text-gray-300">
                {client?.webUrl || "N/A"}
              </div>

              <div className="text-gray-400">Creation Date:</div>
              <div className="text-xl text-black dark:text-gray-300">
                {client?.createdAt
                  ? new Date(client.createdAt).toLocaleDateString()
                  : "N/A"}
              </div>

              <div className="text-gray-400">Contacts:</div>
              <div className="text-xl text-black dark:text-gray-300">
                {client?.contacts && client?.contacts?.length > 0
                  ? client.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex flex-row justify-between text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-gray-500 dark:text-gray-300">
                            {contact.position || "No position"}
                          </span>
                          <span className="text-gray-500 dark:text-gray-300">
                            {contact.email || "No email"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))
                  : "No contacts available"}
              </div>
            </div>

            <FormNewContactDialog
              userId={user?.user.id || ""}
              clients={client ? [client] : []}
              onSuccess={fetchClient}
            />

            {client && (
              <FormClientEditDialog client={client} onSuccess={fetchClient} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
