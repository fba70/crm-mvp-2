"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { unauthorized } from "next/navigation"
import type { Client, Contact } from "@/types/entities"
import axiosApi from "@/lib/axios"
import ClientsLoading from "./loading"
import FormNewClientDialog from "@/components/forms/form-new-client"
import FormNewContactDialog from "@/components/forms/form-new-contact"
import FormClientEditDialog from "@/components/forms/form-client-edit"
import FormContactEditDialog from "@/components/forms/form-contact-edit"
import { Card, CardContent } from "@/components/ui/card"
import { MapPinHouse, AtSign, Phone, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ClientsPage() {
  const { data: user, isPending } = useSession()

  if (!user && !isPending) {
    unauthorized()
  }

  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [searchClients, setSearchClients] = useState("")

  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [searchContacts, setSearchContacts] = useState("")

  const fetchClients = () => {
    setClientsLoading(true)
    axiosApi
      .get("/api/client")
      .then((res) => setClients(res.data))
      .finally(() => setClientsLoading(false))
  }

  const fetchContacts = () => {
    setContactsLoading(true)
    axiosApi
      .get("/api/contact")
      .then((res) => setContacts(res.data))
      .finally(() => setContactsLoading(false))
  }

  useEffect(() => {
    fetchClients()
    fetchContacts()
  }, [])

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchClients.toLowerCase()),
  )

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchContacts.toLowerCase()),
  )

  // console.log("Clients:", clients)
  // console.log("Contacts:", contacts)

  if (clientsLoading || contactsLoading) return <ClientsLoading />

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col px-0 pt-5">
      <div className="space-y-4">
        <div className="flex flex-row px-4">
          <h1 className="pl-2 text-2xl font-semibold">Clients & Contacts</h1>
        </div>

        <div className="flex flex-row justify-between px-4">
          {user && (
            <FormNewClientDialog
              userId={user?.user.id}
              onSuccess={() => fetchClients()}
            />
          )}
          {user && (
            <FormNewContactDialog
              userId={user?.user.id}
              clients={clients}
              onSuccess={() => fetchContacts()}
            />
          )}
        </div>

        <Tabs
          defaultValue="clients"
          className="w-full items-center justify-center"
        >
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            {/* Clients Section */}
            <div className="mb-4 flex flex-row items-center justify-between gap-3 px-4">
              <div className="ml-2 w-full">
                <input
                  type="text"
                  placeholder="Search clients by name..."
                  value={searchClients}
                  onChange={(e) => setSearchClients(e.target.value)}
                  className="w-[380px] rounded border px-4 py-2 text-sm"
                />
              </div>
            </div>

            {clients.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No clients found.
              </p>
            ) : (
              <ClientCards
                clients={filteredClients}
                onClientUpdated={fetchClients}
              />
            )}
          </TabsContent>

          <TabsContent value="contacts">
            {/* Contacts Section */}
            <div className="mb-4 flex flex-row items-center justify-between gap-3 px-4">
              <div className="ml-2 w-full">
                <input
                  type="text"
                  placeholder="Search contacts by name..."
                  value={searchContacts}
                  onChange={(e) => setSearchContacts(e.target.value)}
                  className="w-[380px] rounded border px-4 py-2 text-sm"
                />
              </div>
            </div>

            {contacts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No contacts found.
              </p>
            ) : (
              <ContactCards
                contacts={filteredContacts}
                clients={clients}
                onContactUpdated={fetchContacts}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function ClientCards({
  clients,
  onClientUpdated,
}: {
  clients: Client[]
  onClientUpdated: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid h-[580px] w-[95%] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {clients.map((client) => (
          <Card key={client.id} className="w-[95%] pt-4 pb-6">
            <CardContent className="flex flex-col gap-3 px-6 py-0">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="text-lg font-semibold">{client.name}</div>
                <div className="flex gap-2">
                  <Link href={`/clients/${client.id}`}>
                    <Button className="default">View</Button>
                  </Link>
                  <FormClientEditDialog
                    client={client}
                    onSuccess={onClientUpdated}
                  />
                </div>
              </div>

              {client.webUrl && (
                <Link
                  href={client.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  <div className="flex flex-row items-center gap-3 text-sm">
                    <Globe size={18} />
                    {client.webUrl}
                  </div>
                </Link>
              )}
              {client.address && (
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${client.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  <div className="flex flex-row items-center gap-3 text-sm">
                    <MapPinHouse size={18} />
                    {client.address}
                  </div>
                </Link>
              )}
              <div className="flex flex-row gap-6">
                {client.email && (
                  <div className="flex flex-row items-center gap-3 text-sm">
                    <AtSign size={18} /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex flex-row items-center gap-3 text-sm">
                    <Phone size={18} /> {client.phone}
                  </div>
                )}
              </div>
              {client.contacts && (
                <div className="flex flex-col gap-2">
                  {client.contacts?.length > 0 ? (
                    client.contacts?.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex flex-row justify-between text-sm"
                      >
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-gray-500 dark:text-gray-300">
                          {contact.position || "No position"}
                        </span>
                        <span className="text-gray-500 dark:text-gray-300">
                          {contact.email || "No email"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No contacts available
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ContactCards({
  contacts,
  clients,
  onContactUpdated,
}: {
  contacts: Contact[]
  clients: Client[]
  onContactUpdated: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid h-[580px] w-[95%] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className="h-auto pt-4 pb-4">
            <CardContent className="flex flex-col gap-3 px-6 py-0">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="text-lg font-semibold">{contact.name}</div>
                <div className="flex gap-2">
                  <Link href={`/contacts/${contact.id}`}>
                    <Button className="default">View</Button>
                  </Link>
                  <FormContactEditDialog
                    contact={contact}
                    clients={clients}
                    onSuccess={onContactUpdated}
                  />
                </div>
              </div>

              <div className="flex flex-row gap-6">
                {contact.email && (
                  <div className="flex flex-row items-center gap-3 text-sm">
                    <AtSign size={18} /> {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div className="flex flex-row items-center gap-3 text-sm">
                    <Phone size={18} /> {contact.phone}
                  </div>
                )}
              </div>

              <div className="flex flex-row">
                {contact.clientId && (
                  <div className="flex flex-row items-center gap-3 text-sm">
                    <span className="text-gray-500">Client:</span>
                    <span>
                      {clients.find((client) => client.id === contact.clientId)
                        ?.name || "Unknown"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
