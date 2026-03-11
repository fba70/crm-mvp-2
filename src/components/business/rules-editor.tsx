"use client"

import dynamic from "next/dynamic"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axiosApi from "@/lib/axios"
import { useEffect, useState, useCallback } from "react"
import { Eye, Plus } from "lucide-react"
import "@uiw/react-md-editor/markdown-editor.css"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })
const MDPreview = dynamic(
  () => import("@uiw/react-md-editor").then((m) => m.default.Markdown),
  { ssr: false },
)

interface Rule {
  id: string
  title: string
  category: string
  content: string
  createdAt: string
  updatedAt: string
}

type FormState = { title: string; category: string; content: string }

const emptyForm: FormState = { title: "", category: "", content: "" }

// ─── Rule Modal ──────────────────────────────────────────────────────────────

const RuleModal = ({
  open,
  onOpenChange,
  rule,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rule: Rule | null // null = new rule
  onSaved: (updated: Rule) => void
}) => {
  const isNew = rule === null
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(
        rule
          ? {
              title: rule.title,
              category: rule.category,
              content: rule.content,
            }
          : emptyForm,
      )
      setError(null)
    }
  }, [open, rule])

  const handleSave = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.content.trim()) {
      setError("All fields are required")
      return
    }
    setSaving(true)
    setError(null)
    try {
      let saved: Rule
      if (isNew) {
        const res = await axiosApi.post<Rule>("/api/rule", form)
        saved = res.data
      } else {
        const res = await axiosApi.patch<Rule>(`/api/rule/${rule.id}`, form)
        saved = res.data
      }
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] w-[90vw] max-w-5xl flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "New rule" : "Edit rule"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rule-title">Title</Label>
              <Input
                id="rule-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Sales tone guidelines"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rule-category">Category</Label>
              <Input
                id="rule-category"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="e.g. agent_behavior"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Content (Markdown)</Label>
            <div data-color-mode="light">
              <MDEditor
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v ?? "" }))}
                height={340}
                preview="live"
              />
            </div>
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewModal = ({
  open,
  onOpenChange,
  rule,
  onEdit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  rule: Rule | null
  onEdit: () => void
}) => {
  if (!rule) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule.title}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-xs">
          Category: <span className="font-medium">{rule.category}</span>
        </p>
        <div className="mt-2" data-color-mode="light">
          <MDPreview source={rule.content} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const RulesEditor = () => {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  const fetchRules = useCallback(() => {
    setLoading(true)
    axiosApi
      .get<Rule[]>("/api/rule")
      .then((res) => {
        setRules(res.data)
        setError(null)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load rules"),
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleSaved = useCallback((saved: Rule) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
  }, [])

  const openView = useCallback((rule: Rule) => {
    setSelectedRule(rule)
    setViewOpen(true)
  }, [])

  const openEditFromView = useCallback(() => {
    setViewOpen(false)
    setEditOpen(true)
  }, [])

  return (
    <div className="relative mt-4 flex size-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">
          Available rules:
        </span>
        <Button
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setNewOpen(true)}
        >
          <Plus className="size-3" />
          New rule
        </Button>
      </div>

      {error && <div className="text-destructive text-xs">{error}</div>}

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : rules.length === 0 ? (
        <div className="text-muted-foreground text-sm">No rules yet.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Content preview</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.title}</TableCell>
                <TableCell>
                  <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                    {rule.category}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate text-xs">
                  {rule.content.length > 80
                    ? `${rule.content.slice(0, 80)}…`
                    : rule.content}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => openView(rule)}
                  >
                    <Eye />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* View modal */}
      <ViewModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        rule={selectedRule}
        onEdit={openEditFromView}
      />

      {/* Edit modal */}
      <RuleModal
        open={editOpen}
        onOpenChange={setEditOpen}
        rule={selectedRule}
        onSaved={handleSaved}
      />

      {/* New rule modal */}
      <RuleModal
        open={newOpen}
        onOpenChange={setNewOpen}
        rule={null}
        onSaved={handleSaved}
      />
    </div>
  )
}

export default RulesEditor
