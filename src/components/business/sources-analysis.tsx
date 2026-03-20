"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import axiosApi from "@/lib/axios"
import { useEffect, useState, useCallback } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 5

interface SourceRecord {
  id: string
  source: string
  channelId: string
  fetchedAt: string
  messages: unknown
  processed: boolean
  createdAt: string
}

type MessageEntry = Record<string, string>

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const summarizeMessages = (messages: unknown): string => {
  if (!Array.isArray(messages) || messages.length === 0) return "—"
  const count = messages.length
  const first = messages[0]
  const preview =
    typeof first === "object" && first !== null
      ? ((first as MessageEntry).text ?? (first as MessageEntry).content ?? "")
      : String(first)
  const truncated = preview.length > 60 ? `${preview.slice(0, 60)}…` : preview
  return `${count} msg${count !== 1 ? "s" : ""}${truncated ? ` · ${truncated}` : ""}`
}

const MessagesModal = ({
  open,
  onOpenChange,
  record,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  record: SourceRecord | null
}) => {
  if (!record) return null

  const messages = Array.isArray(record.messages) ? record.messages : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Messages — {record.source} / {record.channelId}
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-xs">
          {formatDate(record.fetchedAt)} · {messages.length} message
          {messages.length !== 1 ? "s" : ""}
        </p>
        <div className="mt-2 flex flex-col gap-3">
          {messages.length === 0 ? (
            <span className="text-muted-foreground text-sm">No messages.</span>
          ) : (
            messages.map((msg, i) => {
              const entry =
                typeof msg === "object" && msg !== null
                  ? (msg as MessageEntry)
                  : null
              const role = entry?.role ?? entry?.authorName ?? `#${i + 1}`
              const text = entry?.text ?? entry?.content ?? JSON.stringify(msg)
              return (
                <div key={i} className="rounded-md border p-3 text-sm">
                  <span className="text-muted-foreground mb-1 block text-xs font-medium uppercase">
                    {role}
                  </span>
                  <p className="break-words whitespace-pre-wrap">{text}</p>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const SourcesAnalysis = () => {
  const [sources, setSources] = useState<SourceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<SourceRecord | null>(
    null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [includeProcessed, setIncludeProcessed] = useState(false)

  const fetchSources = useCallback(() => {
    setLoading(true)
    const params = includeProcessed ? "" : "?processed=false"
    axiosApi
      .get<SourceRecord[]>(`/api/source${params}`)
      .then((res) => {
        setSources(res.data)
        setError(null)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load sources"),
      )
      .finally(() => setLoading(false))
  }, [includeProcessed])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const openModal = useCallback((record: SourceRecord) => {
    setSelectedRecord(record)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      await axiosApi.delete("/api/source", { data: { id } })
      setSources((prev) => prev.filter((s) => s.id !== id))
      toast.success("Source deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }, [])

  const totalPages = Math.max(1, Math.ceil(sources.length / PAGE_SIZE))
  const paginated = sources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="relative mt-4 flex size-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm font-medium">
            {includeProcessed ? "All" : "Unprocessed"} sources
            {!loading && (
              <span className="text-muted-foreground px-1 text-xs">
                ({sources.length} record{sources.length !== 1 ? "s" : ""})
              </span>
            )}
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={includeProcessed}
              onCheckedChange={(v) => setIncludeProcessed(v === true)}
            />
            <span className="text-muted-foreground text-xs">Include processed</span>
          </label>
        </div>

        <Button
          variant="ghost"
          size="xs"
          className="h-7 text-xs text-gray-500"
          onClick={fetchSources}
          disabled={loading}
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />{" "}
          Refresh
        </Button>
      </div>

      {error && <div className="text-destructive text-xs">{error}</div>}

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : sources.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          No unprocessed sources.
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Channel / Model</TableHead>
                <TableHead>Fetched at</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.source}</TableCell>
                  <TableCell>{row.channelId}</TableCell>
                  <TableCell>{formatDate(row.fetchedAt)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate text-xs">
                    {summarizeMessages(row.messages)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openModal(row)}
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-7 text-xs"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page === 1}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-muted-foreground px-3 text-sm">
                    {page} / {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={page === totalPages}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <MessagesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        record={selectedRecord}
      />
    </div>
  )
}

export default SourcesAnalysis
