"use client"

import { useParams } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import RouteButton from "@/components/business/route-button"
import { Card, CardContent } from "@/components/ui/card"
import axios from "axios"
import { useEffect, useState } from "react"
import ContactLoading from "./loading"
import unauthorized from "@/app/unauthorized"
import type { Contact, Client } from "@/types/entities"
import FormContactEditDialog from "@/components/forms/form-contact-edit"

export default function ContactItemPage() {
  const params = useParams()
  const { id } = params as { id: string }
  const { data: user, isPending } = useSession()
  const [contact, setContact] = useState<Contact | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[] | null>(null)
  const [clientLoading, setClientLoading] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(false)

  const fetchContact = async () => {
    try {
      setContactLoading(true)
      const response = await axios.get(`/api/contact/${id}`)
      setContact(response.data)
    } catch (error) {
      console.error("Failed to fetch contact data:", error)
    } finally {
      setContactLoading(false)
    }
  }

  const fetchClient = async () => {
    try {
      setClientLoading(true)
      const response = await axios.get(`/api/client/${contact?.clientId}`)
      setClient(response.data)
    } catch (error) {
      console.error("Failed to fetch client data:", error)
    } finally {
      setClientLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      setClientsLoading(true)
      const response = await axios.get(`/api/client/`)
      setClients(response.data)
    } catch (error) {
      console.error("Failed to fetch clients data:", error)
    } finally {
      setClientsLoading(false)
    }
  }

  useEffect(() => {
    fetchContact()
    fetchClients()
  }, [id])

  useEffect(() => {
    if (contact?.clientId) {
      fetchClient()
    }
  }, [contact?.clientId])

  if (!user && !isPending) {
    unauthorized()
  }

  //console.log("Contact:", contact)
  // console.log("Client:", client)

  if (contactLoading || clientLoading || clientsLoading)
    return <ContactLoading />

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-0 pt-5">
      <div className="flex justify-between">
        <div className="flex w-[95%] flex-row items-center justify-between gap-2">
          <h1 className="ml-6 text-2xl font-semibold">Contact Details:</h1>
          <RouteButton
            pathParam="/clients"
            nameParam="Go back to contacts list"
          />
        </div>
      </div>

      <div className="max-h-190 overflow-y-auto">
        <Card className="mx-auto mt-6 flex w-[95%] flex-col py-4">
          <CardContent className="flex flex-col gap-2 px-5 py-0">
            <div className="mb-6 grid grid-cols-[120px_auto] gap-4">
              <div className="text-gray-400">Name:</div>
              <div className="text-xl text-black">{contact?.name}</div>

              <div className="text-gray-400">Email:</div>
              <div className="text-xl text-black">
                {contact?.email || "N/A"}
              </div>

              <div className="text-gray-400">Phone:</div>
              <div className="text-xl text-black">
                {contact?.phone || "N/A"}
              </div>

              <div className="text-gray-400">Position:</div>
              <div className="text-xl text-black">
                {contact?.position || "N/A"}
              </div>

              <div className="text-gray-400">Creation Date:</div>
              <div className="text-xl text-black">
                {contact?.createdAt
                  ? new Date(contact.createdAt).toLocaleDateString()
                  : "N/A"}
              </div>

              <div className="text-gray-400">Client name:</div>
              <div className="text-xl text-black">{client?.name || "N/A"}</div>
            </div>

            {contact && (
              <FormContactEditDialog
                contact={contact}
                clients={clients || []}
                onSuccess={fetchContact}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
