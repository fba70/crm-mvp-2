"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function RouteButton({
  pathParam,
  nameParam,
}: {
  pathParam: string
  nameParam: string
}) {
  const router = useRouter()
  return (
    <Button variant="default" onClick={() => router.push(pathParam)}>
      {nameParam}
    </Button>
  )
}
