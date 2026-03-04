import { useState, useEffect } from "react"
import axiosApi from "@/lib/axios"
import { ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function LikeButton({ feedId }: { feedId: string }) {
  const [likeCount, setLikeCount] = useState<number | null>(null)
  const [isLiking, setIsLiking] = useState(false)

  // Fetch the initial like count when the component mounts
  useEffect(() => {
    const fetchLikeCount = async () => {
      try {
        const response = await axiosApi.get(`/api/feed/${feedId}/like`)
        setLikeCount(response.data.likeCount)
      } catch (error) {
        console.error("Error fetching like count:", error)
      }
    }

    fetchLikeCount()
  }, [feedId])

  const handleLike = async () => {
    setIsLiking(true)
    try {
      await axiosApi.post(`/api/feed/${feedId}/like`)
      const response = await axiosApi.get(`/api/feed/${feedId}/like`)
      setLikeCount(response.data.likeCount)
      toast.success("Thanks for you like!")
    } catch (error) {
      console.error("Error liking the feed item:", error)
      toast.error("Failed to like the feed item ...")
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={handleLike}
        disabled={isLiking}
        variant="outline" // Use the appropriate variant for an outlined button
        className="flex items-center gap-1"
      >
        <ThumbsUp className="text-green-500" />
        {isLiking ? (
          <span className="text-sm"> ...</span>
        ) : (
          <span className="text-sm text-green-600">Like</span>
        )}
        {likeCount !== null && (
          <span className="text-sm text-green-600">( {likeCount} )</span>
        )}
      </Button>
    </div>
  )
}
