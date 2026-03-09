"use client"

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import type { ToolUIPart, UIMessage } from "ai"
import { DefaultChatTransport } from "ai"
import { useChat } from "@ai-sdk/react"
import { Paperclip } from "lucide-react"

import {
  Attachment,
  type AttachmentData,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector"
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import axiosApi from "@/lib/axios"
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDownIcon, GlobeIcon, XIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
// import { Badge } from "@/components/ui/badge"

interface MessageType {
  key: string
  from: "user" | "assistant"
  sources?: { href: string; title: string }[]
  versions: {
    id: string
    content: string
  }[]
  reasoning?: {
    content: string
    duration: number
  }
  tools?: {
    name: string
    description: string
    status: ToolUIPart["state"]
    parameters: Record<string, unknown>
    result: string | undefined
    error: string | undefined
  }[]
}

const uiMessageToMessageType = (msg: UIMessage): MessageType => {
  let textContent = ""
  let reasoning: MessageType["reasoning"]
  const sources: { href: string; title: string }[] = []

  for (const part of msg.parts) {
    if (part.type === "text") {
      textContent += part.text
    } else if (part.type === "reasoning") {
      reasoning = { content: part.text, duration: 0 }
    } else if (part.type === "source-url") {
      sources.push({ href: part.url, title: part.title ?? part.url })
    }
  }

  return {
    key: msg.id,
    from: msg.role === "user" ? "user" : "assistant",
    versions: [{ id: msg.id, content: textContent }],
    ...(reasoning && { reasoning }),
    ...(sources.length > 0 && { sources }),
  }
}

const models = [
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "gpt-4o",
    name: "GPT-4o",
    providers: ["openai", "azure"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    providers: ["google"],
  },
]

const suggestions = [
  "Find latest trends in the business domain",
  "Find latest news about the client(s)",
  "Find most important events in DACH region in 2026",
  "Find biggest deals in business domain in DACH region in 2026",
]

const chefs = ["OpenAI", "Google"]

const BUSINESS_CATEGORIES = [
  "Media",
  "Healthcare",
  "Automotive",
  "Banking",
  "Insurance",
  "IT",
  "Sport",
]

interface Client {
  id: string
  name: string
}

const FilterSelector = ({
  label,
  items,
  selected,
  onToggle,
  loading = false,
}: {
  label: string
  items: { id: string; name: string }[]
  selected: string[]
  onToggle: (id: string) => void
  loading?: boolean
}) => {
  const [open, setOpen] = useState(false)

  const selectedCount = selected.length
  const triggerLabel =
    selectedCount === 0
      ? label
      : selectedCount === items.length
        ? `${label}: All`
        : `${label}: ${selectedCount}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedCount > 0 ? "secondary" : "outline"}
          size="sm"
          className="h-7 gap-1.5 text-xs"
        >
          {triggerLabel}
          <ChevronDownIcon className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>{loading ? "Loading…" : "No results."}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const isSelected = selected.includes(item.id)
                return (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => onToggle(item.id)}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-3.5",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {item.name}
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

const AttachmentItem = ({
  attachment,
  onRemove,
}: {
  attachment: AttachmentData
  onRemove: (id: string) => void
}) => {
  const handleRemove = useCallback(() => {
    onRemove(attachment.id)
  }, [onRemove, attachment.id])

  return (
    <Attachment data={attachment} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  )
}

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments()

  const handleRemove = useCallback(
    (id: string) => {
      attachments.remove(id)
    },
    [attachments],
  )

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <AttachmentItem
          attachment={attachment}
          key={attachment.id}
          onRemove={handleRemove}
        />
      ))}
    </Attachments>
  )
}

const SuggestionItem = ({
  suggestion,
  onClick,
}: {
  suggestion: string
  onClick: (suggestion: string) => void
}) => {
  const handleClick = useCallback(() => {
    onClick(suggestion)
  }, [onClick, suggestion])

  return <Suggestion onClick={handleClick} suggestion={suggestion} />
}

const ModelItem = ({
  m,
  isSelected,
  onSelect,
}: {
  m: (typeof models)[0]
  isSelected: boolean
  onSelect: (id: string) => void
}) => {
  const handleSelect = useCallback(() => {
    onSelect(m.id)
  }, [onSelect, m.id])

  return (
    <ModelSelectorItem onSelect={handleSelect} value={m.id}>
      <ModelSelectorLogo provider={m.chefSlug} />
      <ModelSelectorName>{m.name}</ModelSelectorName>
      <ModelSelectorLogoGroup>
        {m.providers.map((provider) => (
          <ModelSelectorLogo key={provider} provider={provider} />
        ))}
      </ModelSelectorLogoGroup>
      {isSelected ? (
        <CheckIcon className="ml-auto size-4" />
      ) : (
        <div className="ml-auto size-4" />
      )}
    </ModelSelectorItem>
  )
}

const ElementsChat = () => {
  const [model, setModel] = useState<string>(models[0].id)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [text, setText] = useState<string>("")
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    setClientsLoading(true)
    axiosApi
      .get("/api/client")
      .then((res) => setClients(res.data))
      .finally(() => setClientsLoading(false))
  }, [])

  const {
    messages: rawMessages,
    sendMessage,
    status,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const messages = useMemo(
    () => rawMessages.map(uiMessageToMessageType),
    [rawMessages],
  )

  const selectedModelData = useMemo(
    () => models.find((m) => m.id === model),
    [model],
  )

  const categoryItems = useMemo(
    () => BUSINESS_CATEGORIES.map((c) => ({ id: c, name: c })),
    [],
  )

  const buildContextSuffix = useCallback(() => {
    if (selectedClients.length === 0 && selectedCategories.length === 0)
      return ""
    const parts: string[] = []
    if (selectedClients.length > 0) {
      const names = clients
        .filter((c) => selectedClients.includes(c.id))
        .map((c) => c.name)
        .join(", ")
      parts.push(`clients: ${names}`)
    }
    if (selectedCategories.length > 0) {
      parts.push(`categories: ${selectedCategories.join(", ")}`)
    }
    return ` Please search for the information only relevant to the ${parts.join(" and ")}.`
  }, [selectedClients, selectedCategories, clients])

  const toggleClient = useCallback((id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const hasText = Boolean(message.text)
      const hasAttachments = Boolean(message.files?.length)

      if (!(hasText || hasAttachments)) return

      if (message.files?.length) {
        toast.success("Files attached", {
          description: `${message.files.length} file(s) attached to message`,
        })
      }

      const suffix = buildContextSuffix()
      const baseText = message.text || "Sent with attachments"
      await sendMessage(
        { text: baseText + suffix },
        {
          body: {
            model: selectedModelData?.chefSlug ?? "openai",
            webSearch: useWebSearch,
          },
        },
      )
      setText("")
    },
    [sendMessage, selectedModelData, useWebSearch, buildContextSuffix],
  )

  const handleSuggestionClick = useCallback(
    async (suggestion: string) => {
      const suffix = buildContextSuffix()
      await sendMessage(
        { text: suggestion + suffix },
        {
          body: {
            model: selectedModelData?.chefSlug ?? "openai",
            webSearch: useWebSearch,
          },
        },
      )
    },
    [sendMessage, selectedModelData, useWebSearch, buildContextSuffix],
  )

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
  }, [])

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value)
    },
    [],
  )

  const toggleWebSearch = useCallback(() => {
    setUseWebSearch((prev) => !prev)
  }, [])

  const handleModelSelect = useCallback((modelId: string) => {
    setModel(modelId)
    setModelSelectorOpen(false)
  }, [])

  const isSubmitDisabled = useMemo(
    () => !text.trim() || status === "streaming" || status === "submitted",
    [text, status],
  )

  return (
    <div className="relative mt-4 flex size-full flex-col divide-y overflow-hidden">
      <div className="max-h-[400px] min-h-0 flex-1 overflow-y-auto rounded-md border border-dashed p-4 shadow-sm">
        <Conversation>
          <ConversationContent>
            {messages.map(({ versions, ...message }) => (
              <MessageBranch defaultBranch={0} key={message.key}>
                <MessageBranchContent>
                  {versions.map((version) => (
                    <Message
                      from={message.from}
                      key={`${message.key}-${version.id}`}
                    >
                      <div>
                        {message.sources?.length && (
                          <Sources>
                            <SourcesTrigger count={message.sources.length} />
                            <SourcesContent>
                              {message.sources.map((source) => (
                                <Source
                                  href={source.href}
                                  key={source.href}
                                  title={source.title}
                                />
                              ))}
                            </SourcesContent>
                          </Sources>
                        )}
                        {message.reasoning && (
                          <Reasoning duration={message.reasoning.duration}>
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {message.reasoning.content}
                            </ReasoningContent>
                          </Reasoning>
                        )}
                        <MessageContent>
                          <MessageResponse>{version.content}</MessageResponse>
                        </MessageContent>
                      </div>
                    </Message>
                  ))}
                </MessageBranchContent>
                {versions.length > 1 && (
                  <MessageBranchSelector>
                    <MessageBranchPrevious />
                    <MessageBranchPage />
                    <MessageBranchNext />
                  </MessageBranchSelector>
                )}
              </MessageBranch>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="grid shrink-0 gap-4 pt-4">
        <Suggestions className="px-4">
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion}
              onClick={handleSuggestionClick}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>

        <div className="flex flex-wrap items-center gap-2 px-4">
          <span className="text-muted-foreground text-xs">
            Filter search by categories:
          </span>
          <FilterSelector
            label="Clients"
            items={clients}
            selected={selectedClients}
            onToggle={toggleClient}
            loading={clientsLoading}
          />
          <FilterSelector
            label="Categories"
            items={categoryItems}
            selected={selectedCategories}
            onToggle={toggleCategory}
          />
          {(selectedClients.length > 0 || selectedCategories.length > 0) && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
              onClick={() => {
                setSelectedClients([])
                setSelectedCategories([])
              }}
            >
              <XIcon className="size-3" />
              Clear
            </button>
          )}
        </div>

        <div className="w-full px-4 pb-4">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea onChange={handleTextChange} value={text} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <Paperclip size={16} />
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>

                <PromptInputButton
                  onClick={toggleWebSearch}
                  variant={useWebSearch ? "default" : "ghost"}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>

                <ModelSelector
                  onOpenChange={setModelSelectorOpen}
                  open={modelSelectorOpen}
                >
                  <ModelSelectorTrigger asChild>
                    <PromptInputButton>
                      {selectedModelData?.chefSlug && (
                        <ModelSelectorLogo
                          provider={selectedModelData.chefSlug}
                        />
                      )}
                      {selectedModelData?.name && (
                        <ModelSelectorName>
                          {selectedModelData.name}
                        </ModelSelectorName>
                      )}
                    </PromptInputButton>
                  </ModelSelectorTrigger>
                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />
                    <ModelSelectorList>
                      <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                      {chefs.map((chef) => (
                        <ModelSelectorGroup heading={chef} key={chef}>
                          {models
                            .filter((m) => m.chef === chef)
                            .map((m) => (
                              <ModelItem
                                isSelected={model === m.id}
                                key={m.id}
                                m={m}
                                onSelect={handleModelSelect}
                              />
                            ))}
                        </ModelSelectorGroup>
                      ))}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>

                <SpeechInput
                  className="shrink-0"
                  onTranscriptionChange={handleTranscriptionChange}
                  size="icon-sm"
                  variant="ghost"
                />
              </PromptInputTools>
              <PromptInputSubmit disabled={isSubmitDisabled} status={status} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}

export default ElementsChat
