"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Check,
  X,
  Eye,
  SquareArrowOutUpRight,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task } from "@/types/entities"
import { format } from "date-fns"
import FormTaskStatusChangeDialog from "@/components/forms/form-task-status-change"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

export function TasksCarousel({
  tasks,
  onTaskStatusUpdated,
}: {
  tasks: Task[]
  onTaskStatusUpdated: () => void // Callback to notify parent of task status update
}) {
  const router = useRouter()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [statusDialogOpen1, setStatusDialogOpen1] = useState(false)
  const [statusDialogOpen2, setStatusDialogOpen2] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // console.log("Tasks in carousel:", tasks)

  useEffect(() => {
    setCurrentIndex(0)
  }, [tasks])

  const handleScroll = (direction: "up" | "down") => {
    if (isScrolling) return

    setIsScrolling(true)

    if (direction === "down" && currentIndex < tasks.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (direction === "up" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }

    setTimeout(() => setIsScrolling(false), 600)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") handleScroll("down")
      if (e.key === "ArrowUp") handleScroll("up")
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, isScrolling])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY > 0) {
        handleScroll("down")
      } else {
        handleScroll("up")
      }
    }

    const container = document.getElementById("carousel-scroll-container")
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel)
      }
    }
  }, [isScrolling, currentIndex])

  const getCardPosition = (index: number) => {
    const diff = index - currentIndex
    const baseY = diff * 120
    const curve = Math.abs(diff) * 30
    const scale = diff === 0 ? 1 : Math.max(0.7, 1 - Math.abs(diff) * 0.15)
    const opacity = Math.max(0.3, 1 - Math.abs(diff) * 0.3)
    const blur = Math.abs(diff) * 2

    return {
      transform: `translateY(${baseY}px) translateX(${curve}px) scale(${scale})`,
      opacity,
      filter: `blur(${blur}px)`,
      zIndex: 10 - Math.abs(diff),
    }
  }

  const renderStars = (priority: string) => {
    const count =
      priority === "HIGH"
        ? 3
        : priority === "MEDIUM"
          ? 2
          : priority === "LOW"
            ? 1
            : 0

    return Array.from({ length: 3 }, (_, i) => (
      <span
        key={i}
        className={`text-3xl ${i < count ? "text-red-500" : "text-gray-300"}`}
      >
        ★
      </span>
    ))
  }

  const getTaskBgColor = (date?: string | Date | null) => {
    if (!date) return "bg-gray-200"
    const now = new Date()
    const taskDate = new Date(date)
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(now.getDate() + 3)

    if (now >= taskDate) {
      return "bg-red-300"
    } else if (taskDate <= threeDaysFromNow) {
      return "bg-yellow-300"
    } else {
      return "bg-green-300"
    }
  }

  // Gradient: bg-gradient-to-t from-white to-gray-200

  // If tasks list is empty, show the message
  if (tasks.length === 0) {
    return (
      <div className="flex h-[67vh] w-full items-center justify-center">
        <p className="text-lg text-gray-500">
          The filtered list of tasks is empty
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-[67vh] w-full overflow-hidden">
      {/* Carousel Container */}
      <div className="relative flex h-full w-full items-center justify-center">
        {currentIndex >= 0 && currentIndex < tasks.length && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="relative h-80 w-80 rounded-full border-4 border-gray-300">
              <div
                className="absolute inset-0 rounded-full border-5 border-blue-400"
                style={{
                  clipPath: "polygon(0 0, 25% 0, 25% 100%, 0 100%)",
                  transform: "rotate(-90deg)",
                }}
              />
            </div>
          </div>
        )}

        {tasks.map((card, index) => (
          <div
            key={card.id}
            className="absolute flex h-64 w-64 cursor-pointer flex-col items-center justify-center rounded-full text-center transition-all duration-500 ease-out"
            style={getCardPosition(index)}
            onClick={() => !isScrolling && setCurrentIndex(index)}
          >
            <div
              className={`flex h-full w-full flex-col items-center justify-center rounded-full p-6 shadow-lg ${getTaskBgColor(card.date)} border-4 ${
                card.transferToId
                  ? card.transferStatus === "ACCEPTED"
                    ? "border-green-600"
                    : card.transferStatus === "REJECTED"
                      ? "border-red-600"
                      : "border-dashed border-blue-500"
                  : "border-white"
              }`}
            >
              <div className="mb-4">{renderStars(card.priority)}</div>
              <h3 className="mb-1 text-2xl font-bold text-gray-700">
                {card.type}
              </h3>
              {card.client?.name && (
                <h4 className="mb-2 max-w-[180px] truncate text-2xl text-gray-600">
                  {card.client.name}
                </h4>
              )}
              {card.date && (
                <p className="text-lg font-medium text-gray-500">
                  {format(new Date(card.date), "dd.MM.yyyy")}
                </p>
              )}
              {card.collaborators && card.collaborators.length > 0 && (
                <Users className="mt-1 h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>
        ))}

        {tasks[currentIndex] && (
          <Button
            variant="default"
            className="fixed top-80 right-38 z-30 rounded-lg"
            onClick={() => {
              router.push(`/tasks/${tasks[currentIndex].id}`)
            }}
          >
            <Eye />
            TASK DETAILS
          </Button>
        )}

        {/* Action Buttons for Center Card */}
        {currentIndex >= 0 && currentIndex < tasks.length && (
          <>
            <button
              className="absolute top-3/4 left-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-lime-600 text-xl text-white shadow-lg"
              onClick={() => {
                setIsDialogOpen(true)
                console.log("Linked tasks button clicked")
              }}
            >
              {tasks[currentIndex].linkedTasks?.length || 0}
            </button>

            <div className="absolute top-1/10 right-4 z-15 flex flex-col items-center justify-center gap-2">
              <a
                href={`mailto:${tasks[currentIndex]?.client?.email ?? ""}`}
                onClick={(e) => {
                  if (!tasks[currentIndex]?.client?.email) e.preventDefault()
                }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 w-16 rounded-full border-2 bg-white/90 backdrop-blur-sm transition-transform hover:scale-110 dark:border-gray-500"
                >
                  <Mail className="h-8 w-8" />
                </Button>
              </a>

              <a
                href={`tel:${tasks[currentIndex]?.client?.phone ?? ""}`}
                onClick={(e) => {
                  if (!tasks[currentIndex]?.client?.phone) e.preventDefault()
                }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 w-16 rounded-full border-2 bg-white/90 backdrop-blur-sm transition-transform hover:scale-110 dark:border-gray-500"
                >
                  <Phone className="h-8 w-8" />
                </Button>
              </a>
            </div>

            <div className="absolute top-1/10 left-4 z-15 flex flex-col items-center justify-center gap-2">
              <Button
                size="lg"
                variant="outline"
                className="h-16 w-16 rounded-full border-2 bg-white/90 backdrop-blur-sm transition-transform hover:scale-110 dark:border-gray-500"
                onClick={() => setStatusDialogOpen1(true)}
              >
                <Check className="h-8 w-8 font-bold text-green-600" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-16 w-16 rounded-full border-2 bg-white/90 backdrop-blur-sm transition-transform hover:scale-110 dark:border-gray-500"
                onClick={() => setStatusDialogOpen2(true)}
              >
                <X className="h-8 w-8 text-red-600" />
              </Button>
            </div>

            {statusDialogOpen1 && (
              <div className="z-200">
                <FormTaskStatusChangeDialog
                  open={statusDialogOpen1}
                  onOpenChange={setStatusDialogOpen1}
                  task={tasks[currentIndex]}
                  status="CLOSED"
                  onSuccess={() => {
                    setStatusDialogOpen1(false)
                    onTaskStatusUpdated() // Notify parent of successful status update
                  }}
                />
              </div>
            )}

            {statusDialogOpen2 && (
              <FormTaskStatusChangeDialog
                open={statusDialogOpen2}
                onOpenChange={setStatusDialogOpen2}
                task={tasks[currentIndex]}
                status="DELETED"
                onSuccess={() => {
                  setStatusDialogOpen2(false)
                  onTaskStatusUpdated() // Notify parent of successful status update
                }}
              />
            )}
          </>
        )}

        {/* Linked Tasks Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Linked Tasks:</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {Array.isArray(tasks[currentIndex]?.linkedTasks) ? (
                tasks[currentIndex].linkedTasks.map((linkedTask) => (
                  <div
                    key={linkedTask.id}
                    className="flex flex-col gap-2 border-b pb-1"
                  >
                    <p className="text-sm font-medium">
                      Name: {linkedTask.theme}
                    </p>
                    <div className="flex flex-row items-center justify-between gap-4">
                      <p className="text-sm">Type: {linkedTask.type}</p>
                      <p className="text-sm">Priority: {linkedTask.priority}</p>
                      <p className="text-sm">Status: {linkedTask.status}</p>
                      <Link
                        href={`/tasks/${linkedTask.id}`}
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                      >
                        <SquareArrowOutUpRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No linked tasks available.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Scroll Indicator */}
        <Button
          variant="ghost"
          size="lg"
          className="absolute bottom-4 left-1/3 z-20 h-12 w-12 -translate-x-1/2 animate-bounce rounded-full border-1 border-gray-300 bg-white/80 backdrop-blur-sm dark:bg-gray-500"
          onClick={() => handleScroll("down")}
          disabled={currentIndex >= tasks.length - 1}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="absolute bottom-4 left-2/3 z-20 h-12 w-12 -translate-x-1/2 animate-bounce rounded-full border-1 border-gray-300 bg-white/80 backdrop-blur-sm dark:bg-gray-500"
          onClick={() => handleScroll("up")}
          disabled={currentIndex >= 0 && currentIndex <= 0}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      </div>

      {/* Touch/Scroll Controls */}
      <div
        id="carousel-scroll-container"
        className="absolute inset-0 z-10"
        onTouchStart={(e) => {
          const touch = e.touches[0]
          const startY = touch.clientY

          const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].clientY
            const diff = startY - currentY

            if (Math.abs(diff) > 50) {
              if (diff > 0) {
                handleScroll("down")
              } else {
                handleScroll("up")
              }
              document.removeEventListener("touchmove", handleTouchMove)
            }
          }

          document.addEventListener("touchmove", handleTouchMove)
          document.addEventListener(
            "touchend",
            () => {
              document.removeEventListener("touchmove", handleTouchMove)
            },
            { once: true },
          )
        }}
      />
    </div>
  )
}
