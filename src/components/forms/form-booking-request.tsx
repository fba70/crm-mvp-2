"use client"
import { useForm } from "react-hook-form"
import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { TicketsPlane } from "lucide-react"
import type { Feed } from "@/types/entities"
import axios from "axios"
import { toast } from "sonner"

type BookingRequestFormFields = {
  travellersNumber: number
  datesFrom: string
  datesTo: string
  country: string
  city: string
  departureCountry: string
  departureCity: string
  travelOption: string
  isHotelRequired: boolean
  otherPreferences: string
}

export default function BookingRequestDialog({
  feedId,
  onSuccess,
}: {
  feedId: string
  onSuccess: (t: Feed) => void
}) {
  const form = useForm<BookingRequestFormFields>({
    defaultValues: {
      travellersNumber: 1,
      datesFrom: "",
      datesTo: "",
      country: "Austria",
      city: "",
      departureCountry: "Austria",
      departureCity: "",
      travelOption: "Plane",
      isHotelRequired: false,
      otherPreferences: "",
    },
  })

  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackBooking, setFeedbackBooking] = useState<string | null>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const transformBookingData = (data: BookingRequestFormFields): string => {
    const bookingRequirements = [
      `Number of Travellers: ${data.travellersNumber}`,
      `Travel Dates: From ${data.datesFrom} to ${data.datesTo}`,
      `Departure Country: ${data.departureCountry}`,
      `Departure City: ${data.departureCity}`,
      `Destination Country: ${data.country}`,
      `Destination City: ${data.city}`,
      `Travel Option: ${data.travelOption}`,
      `Hotel Required: ${data.isHotelRequired ? "Yes" : "No"}`,
      `Other Preferences: ${data.otherPreferences || "None"}`,
    ]

    return bookingRequirements.join("\n")
  }

  const onSubmit = (data: BookingRequestFormFields) => {
    setError(null)
    setIsSubmitting(true)

    const bookingPrompt =
      "You are a travel agent. Please assist with the following booking requirements:\n\n" +
      transformBookingData(data) +
      "\n\nProvide suitable travel options including transportation and accommodation details if required. Do not search for real data, just emulate the response providing 3 options in a structured format such as: Option_1_:, Option_2_: and Option_3_:. Keep the response short and concise with most important booking information only."

    startTransition(async () => {
      try {
        const openAIResponse = await axios.post(
          "/api/openai/",
          {
            prompt: bookingPrompt,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )

        if (!openAIResponse.data || !openAIResponse.data.result) {
          toast.error("Error getting booking options from LLM")
          setError("Error getting booking options from LLM")
        }

        const feedback = openAIResponse.data.result.output_text
        setFeedbackBooking(feedback)
        // console.log("LLM feedback:", openAIResponse.data.result.output_text)

        const payload = {
          feedbackBooking: openAIResponse.data.result.output_text,
        }

        const res = await axios.patch(`/api/feed/${feedId}`, payload)
        onSuccess(res.data)
        toast.success("Booking options are prepared!")
      } catch (err) {
        console.log("Error during booking request processing", err)
        setError("Failed to process booking request")
        toast.error("Failed to process booking request")
      } finally {
        setIsSubmitting(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="">
          <TicketsPlane />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Booking Request Form</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            <div className="flex flex-row items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="travellersNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">
                      Number of Travellers
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="w-[50px]" type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="travelOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">
                      Travel Options
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "plane"}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select travel options" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Plane">Plane</SelectItem>
                          <SelectItem value="Train">Train</SelectItem>
                          <SelectItem value="Car">Car</SelectItem>
                          <SelectItem value="Taxi">Taxi</SelectItem>
                          <SelectItem value="Public Transport">
                            Public Transport
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-row items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="datesFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">Date From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="datesTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">Date To</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-row items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="departureCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">
                      Departure Country
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">
                      Destination Country
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-row items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="departureCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">
                      Departure City
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-500">
                      Destination City
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isHotelRequired"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="isHotelRequired"
                      />
                      <FormLabel
                        htmlFor="isHotelRequired"
                        className="text-gray-500"
                      >
                        Is Hotel Required?
                      </FormLabel>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherPreferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-500">
                    Other Preferences
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide any other preferences..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Feedback Field */}
            {feedbackBooking && (
              <FormItem>
                <FormLabel className="text-gray-500">
                  AI-assistant booking options:
                </FormLabel>
                <FormControl>
                  <Textarea
                    value={feedbackBooking}
                    readOnly
                    rows={4}
                    className="max-h-45 resize-none overflow-y-auto"
                  />
                </FormControl>
              </FormItem>
            )}

            {error && <div className="text-sm text-red-500">{error}</div>}

            <div className="flex justify-end gap-2">
              {!feedbackBooking ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isPending}>
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      toast.success("Booking feedback saved successfully!")
                      setOpen(false)
                    }}
                  >
                    Save
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
