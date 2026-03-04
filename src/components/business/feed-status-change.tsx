"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import axios from "axios"
import { FeedStatus } from "@/types/entities"
import { toast } from "sonner"

export function StatusChangeDialog({
  feedId,
  currentStatus,
  onStatusChange,
}: {
  feedId: string
  currentStatus: string
  onStatusChange: (newStatus: FeedStatus) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<FeedStatus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStatusChange = async () => {
    if (!newStatus) return

    setIsSubmitting(true)
    try {
      await axios.patch(`/api/feed/${feedId}`, { status: newStatus })
      onStatusChange(newStatus)
      setIsOpen(false)
      toast.success("Status updated successfully!")
    } catch (error) {
      console.error("Failed to update status:", error)
      toast.error("Failed to update status. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="default" onClick={() => setIsOpen(true)}>
        Status
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Feed Item Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              onValueChange={(value) => setNewStatus(value as FeedStatus)}
              defaultValue={currentStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ACTION_COMPLETED">
                  Action Completed
                </SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleStatusChange}
              disabled={!newStatus || isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
