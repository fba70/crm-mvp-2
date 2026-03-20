"use client"

import dynamic from "next/dynamic"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import axiosApi from "@/lib/axios"
import { cn } from "@/lib/utils"
import {
  CheckIcon,
  ChevronDownIcon,
  Eye,
  FileTextIcon,
  PlayIcon,
  Share2Icon,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { toast } from "sonner"
import "@uiw/react-md-editor/markdown-editor.css"

const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((m) => m.default.Markdown),
  { ssr: false },
)

// ─── Local types ─────────────────────────────────────────────────────────────

interface SourceRecord {
  id: string
  source: string
  channelId: string
  fetchedAt: string
  messages: {
    authorName?: string
    ts?: string
    text?: string
    role?: string
    content?: string
  }[]
  processed: boolean
}

interface RuleRecord {
  id: string
  title: string
  category: string
  content: string
}

interface Client {
  id: string
  name: string
}

// Shape returned by /api/analyze (LLM output, not yet persisted)
interface AnalysisResult {
  status: "open"
  priority: "high" | "normal"
  category:
    | "RECOMMENDATION"
    | "CLIENT_ACTIVITY"
    | "INDUSTRY_INFO"
    | "COLLEAGUES_UPDATE"
  message: {
    analysis: string
    recommendation: string
  }
  client: string | null
}

// Shape returned by /api/truffle-card (persisted DB record)
interface TruffleCardRecord {
  id: string
  status: string
  priority: "HIGH" | "NORMAL"
  category:
    | "RECOMMENDATION"
    | "CLIENT_ACTIVITY"
    | "INDUSTRY_INFO"
    | "COLLEAGUES_UPDATE"
  message: {
    analysis: string
    recommendation: string
  }
  accepted: boolean
  rejectionReason: string | null
  clients: { id: string; name: string }[]
  sources: {
    id: string
    source: string
    channelId: string
    fetchedAt: string
    messages: {
      authorName?: string
      ts?: string
      text?: string
      role?: string
      content?: string
    }[]
  }[]
  rule: { id: string; title: string; category: string; content: string } | null
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_CATEGORIES = [
  "Media",
  "Healthcare",
  "Automotive",
  "Banking",
  "Insurance",
  "IT",
  "Sport",
]

const models = [
  { chef: "OpenAI", chefSlug: "openai", id: "gpt-4o", name: "GPT-4o" },
  {
    chef: "Google",
    chefSlug: "google",
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
  },
]

const CATEGORY_STYLES: Record<string, string> = {
  RECOMMENDATION:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  CLIENT_ACTIVITY:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  INDUSTRY_INFO:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  COLLEAGUES_UPDATE:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

const buildSystemPrompt = (rule: RuleRecord, clients: Client[]): string => {
  const clientNames = clients.map((c) => c.name).join(", ") || "none"
  const categories = BUSINESS_CATEGORIES.join(", ")

  return `You are a CRM analyst. Analyze the provided messages and identify actionable insights.

Analysis Rule:
${rule.content}

Available Clients in CRM:
${clientNames}

Business Domains:
${categories}

Return ONLY a valid JSON array with no additional text. Each element must follow this exact structure:
[
  {
    "status": "open",
    "priority": "high" or "normal",
    "category": "RECOMMENDATION" or "CLIENT_ACTIVITY" or "INDUSTRY_INFO" or "COLLEAGUES_UPDATE",
    "message": {
      "analysis": "concise analysis summary",
      "recommendation": "actionable recommendation"
    },
    "client": "client name from the provided list, or null if not identified"
  }
]`
}

const buildUserContent = (sources: SourceRecord[]): string =>
  sources
    .map((s) => {
      const msgs = Array.isArray(s.messages) ? s.messages : []
      const lines = msgs
        .map((m) => {
          const author = m.authorName ?? m.role ?? "unknown"
          const body = m.text ?? m.content ?? ""
          return `[${author}]: ${body}`
        })
        .join("\n")
      const date = new Date(s.fetchedAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      return `Source: ${s.source} / ${s.channelId} (fetched ${date})\n${lines}`
    })
    .join("\n\n---\n\n")

// ─── Sub-components ───────────────────────────────────────────────────────────

const SourceSelector = ({
  sources,
  selected,
  onToggle,
  loading,
  onOpen,
  includeProcessed,
  onIncludeProcessedChange,
}: {
  sources: SourceRecord[]
  selected: string[]
  onToggle: (id: string) => void
  loading: boolean
  onOpen?: () => void
  includeProcessed: boolean
  onIncludeProcessedChange: (v: boolean) => void
}) => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (next) onOpen?.()
    setOpen(next)
  }
  const count = selected.length
  const label =
    count === 0 ? "Select sources" : `${count} source${count !== 1 ? "s" : ""}`

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={count > 0 ? "secondary" : "outline"}
          size="sm"
          className="h-7 gap-1.5 text-xs"
        >
          {label}
          <ChevronDownIcon className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search sources…" />
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <Checkbox
              id="include-processed"
              checked={includeProcessed}
              onCheckedChange={(v) => onIncludeProcessedChange(v === true)}
            />
            <label
              htmlFor="include-processed"
              className="text-muted-foreground cursor-pointer text-xs"
            >
              Include processed
            </label>
          </div>
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading…" : "No sources found."}
            </CommandEmpty>
            <CommandGroup>
              {sources.map((s) => {
                const isSelected = selected.includes(s.id)
                const msgCount = Array.isArray(s.messages)
                  ? s.messages.length
                  : 0
                const date = new Date(s.fetchedAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                return (
                  <CommandItem
                    key={s.id}
                    value={`${s.source} ${s.channelId}`}
                    onSelect={() => onToggle(s.id)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-3.5 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">
                        {s.source} / {s.channelId}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {date} · {msgCount} msg{msgCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const RuleSelector = ({
  rules,
  selectedId,
  onSelect,
  loading,
}: {
  rules: RuleRecord[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
}) => {
  const [open, setOpen] = useState(false)
  const selected = rules.find((r) => r.id === selectedId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedId ? "secondary" : "outline"}
          size="sm"
          className="h-7 gap-1.5 text-xs"
        >
          {selected ? selected.title : "Select rule"}
          <ChevronDownIcon className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search rules…" />
          <CommandList>
            <CommandEmpty>{loading ? "Loading…" : "No rules."}</CommandEmpty>
            <CommandGroup>
              {rules.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.title}
                  onSelect={() => {
                    onSelect(r.id)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-3.5 shrink-0",
                      r.id === selectedId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{r.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {r.category}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const ModelDropdown = ({
  model,
  onSelect,
}: {
  model: string
  onSelect: (id: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const selected = models.find((m) => m.id === model)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
          {selected?.name ?? "Select model"}
          <ChevronDownIcon className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {models.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.id}
                  onSelect={() => {
                    onSelect(m.id)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-3.5",
                      model === m.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {m.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const REJECTION_REASONS = [
  "not relevant",
  "not important",
  "too late to act upon",
  "other",
] as const

type RejectionReason = (typeof REJECTION_REASONS)[number]

const RejectDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (reason: RejectionReason) => void
}) => {
  const [selected, setSelected] = useState<RejectionReason>(
    REJECTION_REASONS[0],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reject card</DialogTitle>
        </DialogHeader>
        <RadioGroup
          value={selected}
          onValueChange={(v) => setSelected(v as RejectionReason)}
          className="flex flex-col gap-3 py-2"
        >
          {REJECTION_REASONS.map((reason) => (
            <div key={reason} className="flex items-center gap-2">
              <RadioGroupItem value={reason} id={reason} />
              <Label htmlFor={reason} className="cursor-pointer capitalize">
                {reason}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={() => onConfirm(selected)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Source messages preview modal ────────────────────────────────────────────

type CardSourceRecord = TruffleCardRecord["sources"][number]

const SourceMessagesModal = ({
  open,
  onOpenChange,
  source,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  source: CardSourceRecord | null
}) => {
  if (!source) return null
  const messages = Array.isArray(source.messages) ? source.messages : []
  const date = new Date(source.fetchedAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Messages — {source.source} / {source.channelId}
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-xs">
          {date} · {messages.length} message
          {messages.length !== 1 ? "s" : ""}
        </p>
        <div className="mt-2 flex flex-col gap-3">
          {messages.length === 0 ? (
            <span className="text-muted-foreground text-sm">No messages.</span>
          ) : (
            messages.map((msg, i) => {
              const role = msg.authorName ?? msg.role ?? `#${i + 1}`
              const text = msg.text ?? msg.content ?? ""
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

// ─── Rule preview modal ──────────────────────────────────────────────────────

const RulePreviewModal = ({
  open,
  onOpenChange,
  rule,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rule: TruffleCardRecord["rule"]
}) => {
  if (!rule) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] w-[90vw] max-w-5xl overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{rule.title}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-xs">
          Category: <span className="font-medium">{rule.category}</span>
        </p>
        <div className="mt-2" data-color-mode="light">
          <MDPreview source={rule.content} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Analysis result card ────────────────────────────────────────────────────

const AnalysisResultCard = ({
  card,
  onAccept,
  onReject,
  onShare,
}: {
  card: TruffleCardRecord
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onShare: (card: TruffleCardRecord) => void
}) => {
  const isHigh = card.priority === "HIGH"
  const clientName = card.clients[0]?.name ?? null

  const [sourceModalOpen, setSourceModalOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<CardSourceRecord | null>(
    null,
  )
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  // style={{ height: "480px" }}
  return (
    <Card
      className={cn(
        "flex h-[500px] w-[340px] shrink-0 flex-col overflow-hidden border",
        isHigh
          ? "bg-gradient-to-br from-yellow-50 to-pink-100 dark:from-yellow-700 dark:to-slate-900"
          : "bg-gradient-to-br from-slate-100 to-pink-100 dark:from-slate-500 dark:to-slate-900",
      )}
    >
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="flex flex-row items-center gap-3 text-lg font-semibold">
          <Image
            src="/T_logo_2.jpg"
            alt="Truffle"
            width={36}
            height={36}
            className="rounded-full"
          />
          {isHigh ? "Golden Truffle Found" : "Silver Truffle Found"}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isHigh ? "destructive" : "secondary"}
            className="text-xs capitalize"
          >
            {card.priority.toLowerCase()}
          </Badge>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              CATEGORY_STYLES[card.category] ??
                "bg-muted text-muted-foreground",
            )}
          >
            {card.category}
          </span>
          {clientName && (
            <span className="text-muted-foreground text-xs">
              · {clientName}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pb-2">
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="text-muted-foreground mb-1 shrink-0 text-xs font-medium uppercase">
            Analysis
          </p>
          <p className="overflow-y-auto text-sm">{card.message.analysis}</p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <p className="text-muted-foreground mb-1 shrink-0 text-xs font-medium uppercase">
            Recommendation
          </p>
          <p className="overflow-y-auto text-sm">
            {card.message.recommendation}
          </p>
        </div>

        {/* Sources & rule references */}
        <div className="flex shrink-0 flex-col gap-1 border-t pt-2">
          {card.sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-muted-foreground text-xs font-medium">
                Sources:
              </span>
              {card.sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs hover:underline"
                  onClick={() => {
                    setSelectedSource(s)
                    setSourceModalOpen(true)
                  }}
                >
                  <Eye className="size-3" />
                  {s.source}/{s.channelId}
                </button>
              ))}
            </div>
          )}
          {card.rule && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs font-medium">
                Rule:
              </span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-xs hover:underline"
                onClick={() => setRuleModalOpen(true)}
              >
                <FileTextIcon className="size-3" />
                {card.rule.title}
              </button>
            </div>
          )}
        </div>
      </CardContent>

      <SourceMessagesModal
        open={sourceModalOpen}
        onOpenChange={setSourceModalOpen}
        source={selectedSource}
      />
      <RulePreviewModal
        open={ruleModalOpen}
        onOpenChange={setRuleModalOpen}
        rule={card.rule}
      />

      <CardFooter className="shrink-0 gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => onReject(card.id)}
        >
          REJECT
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onAccept(card.id)}
        >
          ACCEPT
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 shrink-0 p-0"
          onClick={() => onShare(card)}
          title="Share to Slack"
        >
          <Share2Icon className="size-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const CardsPopUp = () => {
  const [sources, setSources] = useState<SourceRecord[]>([])
  const [rules, setRules] = useState<RuleRecord[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [rulesLoading, setRulesLoading] = useState(true)

  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState(models[0].id)
  const [includeProcessed, setIncludeProcessed] = useState(false)

  const [cards, setCards] = useState<TruffleCardRecord[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = useCallback(() => {
    setSourcesLoading(true)
    const params = includeProcessed ? "" : "?processed=false"
    axiosApi
      .get<SourceRecord[]>(`/api/source${params}`)
      .then((res) => setSources(res.data))
      .finally(() => setSourcesLoading(false))
  }, [includeProcessed])

  useEffect(() => {
    fetchSources()

    axiosApi
      .get<RuleRecord[]>("/api/rule")
      .then((res) => setRules(res.data))
      .finally(() => setRulesLoading(false))

    axiosApi.get<Client[]>("/api/client").then((res) => setClients(res.data))

    axiosApi
      .get<TruffleCardRecord[]>("/api/truffle-card")
      .then((res) => setCards(res.data))
      .finally(() => setCardsLoading(false))
  }, [fetchSources])

  const toggleSource = useCallback((id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const selectedModelData = useMemo(
    () => models.find((m) => m.id === selectedModel),
    [selectedModel],
  )

  const canRun =
    selectedSourceIds.length > 0 && selectedRuleId !== null && !analyzing

  const handleRun = useCallback(async () => {
    if (!canRun) return
    const rule = rules.find((r) => r.id === selectedRuleId)
    if (!rule) return

    const selectedSources = sources.filter((s) =>
      selectedSourceIds.includes(s.id),
    )

    setAnalyzing(true)
    setError(null)

    try {
      const res = await axiosApi.post<{
        success: boolean
        results?: AnalysisResult[]
        error?: string
      }>("/api/analyze", {
        systemPrompt: buildSystemPrompt(rule, clients),
        userContent: buildUserContent(selectedSources),
        model: selectedModelData?.chefSlug ?? "openai",
      })

      if (!res.data.success || !res.data.results) {
        throw new Error(res.data.error || "Analysis failed")
      }

      if (res.data.results.length === 0) {
        // LLM found nothing relevant — mark sources processed and notify
        await axiosApi.patch("/api/source", {
          sourceIds: selectedSourceIds,
          processed: true,
        })
        setSources((prev) =>
          prev.filter((s) => !selectedSourceIds.includes(s.id)),
        )
        setSelectedSourceIds([])
        toast.info("No valuable insights found", {
          description:
            "The analysis did not identify actionable information. Sources marked as processed.",
        })
        return
      }

      // Persist each result as a TruffleCard and prepend to the list
      const created = await Promise.all(
        res.data.results.map((result) =>
          axiosApi
            .post<TruffleCardRecord>("/api/truffle-card", {
              priority: result.priority.toUpperCase(),
              category: result.category,
              message: result.message,
              clientName: result.client,
              sourceIds: selectedSourceIds,
              ruleId: selectedRuleId,
            })
            .then((r) => r.data),
        ),
      )

      setCards((prev) => [...created, ...prev])
      // Remove processed sources from the selector
      setSources((prev) =>
        prev.filter((s) => !selectedSourceIds.includes(s.id)),
      )
      setSelectedSourceIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setAnalyzing(false)
    }
  }, [
    canRun,
    rules,
    selectedRuleId,
    sources,
    selectedSourceIds,
    clients,
    selectedModelData,
  ])

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)

  const handleAccept = useCallback(async (id: string) => {
    try {
      await axiosApi.patch(`/api/truffle-card/${id}`, { accepted: true })
      setCards((prev) => prev.filter((c) => c.id !== id))
      toast.success("Card accepted", {
        description: "A feed record has been created.",
      })
    } catch {
      toast.error("Failed to accept card")
    }
  }, [])

  const handleReject = useCallback((id: string) => {
    setRejectTargetId(id)
    setRejectDialogOpen(true)
  }, [])

  const handleShare = useCallback(async (card: TruffleCardRecord) => {
    try {
      await axiosApi.post("/api/slack/notify", card)
      toast.success("Shared to Slack")
    } catch {
      toast.error("Failed to share to Slack")
    }
  }, [])

  const handleRejectConfirm = useCallback(
    async (reason: RejectionReason) => {
      if (!rejectTargetId) return
      setRejectDialogOpen(false)
      try {
        await axiosApi.patch(`/api/truffle-card/${rejectTargetId}`, {
          rejectionReason: reason,
        })
        setCards((prev) => prev.filter((c) => c.id !== rejectTargetId))
        toast.success("Card rejected", {
          description: `Reason: ${reason}`,
        })
      } catch {
        toast.error("Failed to reject card")
      } finally {
        setRejectTargetId(null)
      }
    },
    [rejectTargetId],
  )

  return (
    <div className="relative mt-4 flex size-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SourceSelector
          sources={sources}
          selected={selectedSourceIds}
          onToggle={toggleSource}
          loading={sourcesLoading}
          onOpen={fetchSources}
          includeProcessed={includeProcessed}
          onIncludeProcessedChange={setIncludeProcessed}
        />
        <RuleSelector
          rules={rules}
          selectedId={selectedRuleId}
          onSelect={setSelectedRuleId}
          loading={rulesLoading}
        />
        <ModelDropdown model={selectedModel} onSelect={setSelectedModel} />
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={!canRun}
          onClick={handleRun}
        >
          <PlayIcon className="size-3" />
          {analyzing ? "Analyzing…" : "Run Analysis"}
        </Button>
      </div>

      {error && <div className="text-destructive text-xs">{error}</div>}

      {analyzing && (
        <div className="text-muted-foreground text-sm">Analyzing…</div>
      )}

      {!analyzing && !cardsLoading && cards.length === 0 && !error && (
        <div className="text-muted-foreground text-sm">
          Select sources and a rule, then run the analysis.
        </div>
      )}

      {cardsLoading && (
        <div className="text-muted-foreground text-sm">Loading…</div>
      )}

      {cards.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {cards.map((card) => (
            <AnalysisResultCard
              key={card.id}
              card={card}
              onAccept={handleAccept}
              onReject={handleReject}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
      />
    </div>
  )
}

export default CardsPopUp
