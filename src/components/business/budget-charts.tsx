"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartNoAxesCombined, SquareArrowOutUpRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  Tooltip,
} from "recharts"
import { useState } from "react"
import Link from "next/link"

const chartConfig = {
  revenues: {
    label: "revenues",
    color: "violet",
  },
} satisfies ChartConfig

/*
clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 700 },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi", revenues: 1200 },
      { name: "WILLHABEN", id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc", revenues: 2000 },
      { name: "Heute.at", id: "1ef11ffb-41d7-4c78-a59d-10a01bed96dd", revenues: 1500 },
    ],
*/

const data1 = [
  {
    name: "Jan",
    revenues: 3700,
    revenueGoals: 5000,
    clients: 4,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 700 },
    ],
  },
  {
    name: "Feb",
    revenues: 6900,
    revenueGoals: 5000,
    clients: 6,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 700 },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi", revenues: 1200 },
      {
        name: "WILLHABEN",
        id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc",
        revenues: 2000,
      },
    ],
  },
  {
    name: "Mar",
    revenues: 8400,
    revenueGoals: 9000,
    clients: 7,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 700 },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi", revenues: 1200 },
      {
        name: "WILLHABEN",
        id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc",
        revenues: 2000,
      },
      {
        name: "Heute.at",
        id: "1ef11ffb-41d7-4c78-a59d-10a01bed96dd",
        revenues: 1500,
      },
    ],
  },
  {
    name: "Apr",
    revenues: 4900,
    revenueGoals: 6000,
    clients: 5,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 700 },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi", revenues: 1200 },
    ],
  },
  {
    name: "May",
    revenues: 4900,
    revenueGoals: 4000,
    clients: 5,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 700 },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi", revenues: 1200 },
    ],
  },
  {
    name: "Jun",
    revenues: 3700,
    revenueGoals: 5000,
    clients: 4,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 700 },
    ],
  },
  {
    name: "Jul",
    revenues: 1500,
    revenueGoals: 2500,
    clients: 2,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
    ],
  },
  {
    name: "Aug",
    revenues: 1000,
    revenueGoals: 2000,
    clients: 1,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
    ],
  },
  {
    name: "Sep",
    revenues: 3000,
    revenueGoals: 3000,
    clients: 3,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
    ],
  },
  {
    name: "Oct",
    revenues: 8400,
    revenueGoals: 7000,
    clients: 7,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1000 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 500 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1500 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 700 },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi", revenues: 1200 },
      {
        name: "WILLHABEN",
        id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc",
        revenues: 2000,
      },
      {
        name: "Heute.at",
        id: "1ef11ffb-41d7-4c78-a59d-10a01bed96dd",
        revenues: 1500,
      },
    ],
  },
  {
    name: "Nov",
    revenues: 4000,
    revenueGoals: 7000,
    clients: 5,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb", revenues: 1500 },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl", revenues: 300 },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff", revenues: 1200 },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf", revenues: 500 },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi", revenues: 500 },
    ],
  },
]

const data2 = [
  {
    name: "Jan",
    clients: 4,
    targetClients: 4,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
    ],
  },
  {
    name: "Feb",
    clients: 6,
    targetClients: 7,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
      { name: "WILLHABEN", id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc" },
    ],
  },
  {
    name: "Mar",
    clients: 7,
    targetClients: 8,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
      { name: "WILLHABEN", id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc" },
      { name: "Heute.at", id: "1ef11ffb-41d7-4c78-a59d-10a01bed96dd" },
    ],
  },
  {
    name: "Apr",
    clients: 5,
    targetClients: 7,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
    ],
  },
  {
    name: "May",
    clients: 5,
    targetClients: 6,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
    ],
  },
  {
    name: "Jun",
    clients: 4,
    targetClients: 3,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
    ],
  },
  {
    name: "Jul",
    clients: 2,
    targetClients: 1,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
    ],
  },
  {
    name: "Aug",
    clients: 1,
    targetClients: 0,
    clientNames: [{ name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" }],
  },
  {
    name: "Sep",
    clients: 3,
    targetClients: 3,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
    ],
  },
  {
    name: "Oct",
    clients: 7,
    targetClients: 5,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
      { name: "WILLHABEN", id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc" },
      { name: "Heute.at", id: "1ef11ffb-41d7-4c78-a59d-10a01bed96dd" },
    ],
  },
  {
    name: "Nov",
    clients: 4,
    targetClients: 7,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
    ],
  },
]

const data3 = [
  {
    name: "Automotive",
    clients: 4,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
    ],
  },
  {
    name: "Retail",
    clients: 6,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
      { name: "WILLHABEN", id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc" },
    ],
  },
  {
    name: "E-commerce",
    clients: 7,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
    ],
  },
  {
    name: "FMCG",
    clients: 5,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
      { name: "WILLHABEN", id: "4c40b3c5-5d29-437a-97c8-3ed8d50932dc" },
      { name: "Heute.at", id: "1ef11ffb-41d7-4c78-a59d-10a01bed96dd" },
    ],
  },
  {
    name: "Real estate",
    clients: 5,
    clientNames: [
      { name: "XXX Lutz", id: "cmf80m50800073b6on748qtxb" },
      { name: "SPAR", id: "cmf80ws0000093b6ood9bsdtl" },
      { name: "HUTCHISON", id: "cmf80xjjm000b3b6ok7gh29ff" },
      { name: "A1", id: "cmfawbb9i00013b6ondhccvmf" },
      { name: "LAOLA1", id: "cmfawd58q00033b6ogaqm57xi" },
    ],
  },
]

interface MonthlyData {
  name: string // Month name
  clients: number // Number of clients
  revenues?: number
  revenueGoals?: number
  targetClients?: number
  clientNames: { name: string; id: string; revenues?: number }[] // Array of client objects with name and id
}

/*
<ChartTooltip
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
*/

export default function BudgetCharts() {
  const [dialogData, setDialogData] = useState<MonthlyData | null>(null) // State to hold the data for the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false) // State to control dialog visibility

  const handleBarClick = (data: MonthlyData) => {
    setDialogData(data) // Set the data for the clicked bar
    setIsDialogOpen(true) // Open the dialog
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartNoAxesCombined size={24} />
            Budget and Statistics Charts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revs" className="w-full">
            <TabsList>
              <TabsTrigger value="revs">Monthly Revenues</TabsTrigger>
              <TabsTrigger value="deals">Client Deals</TabsTrigger>
              <TabsTrigger value="types">Client Types</TabsTrigger>
            </TabsList>
            <TabsContent value="revs" className="p-0">
              <ChartContainer
                config={chartConfig}
                className="h-[200px] w-[340px] p-0"
              >
                <BarChart
                  accessibilityLayer
                  data={data1}
                  margin={{ top: 0, right: 0, left: -15, bottom: -10 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-90}
                    textAnchor="start"
                    dy={10}
                  />
                  <YAxis />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    height={0}
                    formatter={(value) => {
                      const legendNames: Record<string, string> = {
                        revenues: "Achieved Revenues",
                        revenueGoals: "Revenue Goals",
                      }
                      return legendNames[value as string] || value
                    }}
                  />
                  <Bar
                    dataKey="revenues"
                    fill="#3b82f6"
                    radius={4}
                    onClick={(data) => handleBarClick(data)}
                  />
                  <Bar
                    dataKey="revenueGoals"
                    fill="#10b981" // Green for revenue goals
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            </TabsContent>

            <TabsContent value="deals">
              <ChartContainer
                config={chartConfig}
                className="h-[200px] w-[340px]"
              >
                <BarChart
                  accessibilityLayer
                  data={data2}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-90}
                    textAnchor="start"
                    dy={10}
                  />
                  <YAxis />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    height={0}
                    formatter={(value) => {
                      const legendNames: Record<string, string> = {
                        clients: "Achieved Clients",
                        targetClients: "Target Clients",
                      }
                      return legendNames[value as string] || value
                    }}
                  />
                  <Bar
                    dataKey="clients"
                    fill="#ff8904"
                    radius={4}
                    onClick={(data) => handleBarClick(data)}
                  />
                  <Bar dataKey="targetClients" fill="#10b981" radius={4} />
                </BarChart>
              </ChartContainer>
            </TabsContent>

            <TabsContent value="types">
              <ChartContainer
                config={chartConfig}
                className="h-[200px] w-[340px]"
              >
                <PieChart
                  width={340}
                  height={200}
                  margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
                >
                  <Pie
                    data={data3}
                    dataKey="clients"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={(entry) => `${entry.name}: ${entry.clients}`}
                    onClick={(data) => handleBarClick(data)}
                  >
                    {data3.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#3b82f6",
                            "#f97316",
                            "#10b981",
                            "#ef4444",
                            "#8b5cf6",
                          ][index % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                </PieChart>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monthly Data</DialogTitle>
          </DialogHeader>
          {dialogData && (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex flex-row justify-between gap-6">
                <div className="flex flex-row items-center justify-center gap-2">
                  <p className="text-sm text-gray-400">Month:</p>{" "}
                  {dialogData.name}
                </div>
                <div className="flex flex-row items-center justify-center gap-2">
                  <p className="text-sm text-gray-400">Clients:</p>{" "}
                  {dialogData.clients}
                </div>
              </div>

              <div className="flex flex-row justify-between gap-6">
                {dialogData.revenues && (
                  <div className="flex flex-row items-center justify-center gap-2">
                    <p className="text-sm text-gray-400">Revenues:</p>{" "}
                    {dialogData.revenues}
                  </div>
                )}
                {dialogData.revenueGoals && (
                  <div className="flex flex-row items-center justify-center gap-2">
                    <p className="text-sm text-gray-400">Target revenues:</p>{" "}
                    {dialogData.revenueGoals}
                  </div>
                )}
                {dialogData.targetClients && (
                  <div className="flex flex-row items-center justify-center gap-2">
                    <p className="text-sm text-gray-400">Target clients:</p>{" "}
                    {dialogData.targetClients}
                  </div>
                )}
              </div>

              <ul>
                {dialogData.clientNames.map((client, index) => (
                  <li key={index}>
                    <div className="flex flex-row items-center justify-between gap-4">
                      {client.name}
                      {client.revenues && (
                        <span className="text-sm text-gray-500">
                          EUR: {client.revenues}
                        </span>
                      )}
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-blue-500 hover:underline"
                      >
                        <SquareArrowOutUpRight size={16} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
