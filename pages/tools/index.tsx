"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import Navbar from "../../components/Navbar"

export default function StudentToolsPage() {
  const [activeTab, setActiveTab] = useState("all")

  const tools = [
    {
      id: "room-allocator",
      title: "Room Allocator",
      description: "Fairly assign rooms with a fun spin-the-wheel game.",
      longDescription:
        "No more arguments about who gets which room! This interactive tool uses a fair random selection process that makes room allocation fun and transparent.",
      category: "housing",
      usageCount: 1234,
      features: ["Random allocation", "Fair distribution", "Fun interface", "Save results"],
      buttonText: "Spin The Wheel",
      color: "bg-pink-100",
    },
    {
      id: "split-rent-calculator",
      title: "Split Rent Calculator",
      description: "Calculate fair rent splits based on room sizes and features.",
      longDescription:
        "Different rooms have different values. This calculator helps you determine a fair price for each room based on size, features, and amenities.",
      category: "finance",
      usageCount: 892,
      features: ["Room comparison", "Feature weighting", "Multiple methods", "Shareable results"],
      buttonText: "Calculate Split",
      color: "bg-yellow-100",
    },
    {
      id: "wifi-setup-guide",
      title: "WiFi Setup Guide",
      description: "Get online with our step-by-step guide. Includes cheapest WiFi providers!",
      longDescription:
        "Fast, reliable internet is essential. Our guide walks you through setting up your connection and finding the best deals for student housing.",
      category: "utilities",
      features: ["Provider comparison", "Setup instructions", "Troubleshooting tips", "Student discounts"],
      buttonText: "View Guide",
      color: "bg-blue-100",
    },
    {
      id: "rent-calculator",
      title: "Rent Calculator",
      description: "Calculate total rental costs including bills and deposits.",
      longDescription:
        "Understand the true cost of renting by factoring in all expenses. This calculator helps you budget for rent, bills, deposits, and other housing costs.",
      category: "finance",
      features: ["Bill estimation", "Deposit calculation", "Monthly breakdown", "Annual summary"],
      buttonText: "Calculate Costs",
      color: "bg-red-100",
    },
    {
      id: "move-in-checklist",
      title: "Move-In Checklist",
      description: "Complete checklist for moving into your student home. Written by current and former students.",
      longDescription:
        "Don't forget anything when moving in! This comprehensive checklist covers everything you need to do before, during, and after moving into your student accommodation.",
      category: "housing",
      features: ["Printable list", "Progress tracking", "Customizable items", "Roommate sharing"],
      buttonText: "View Checklist",
      color: "bg-green-100",
    },
    {
      id: "energy-estimator",
      title: "Energy Estimator",
      description: "Estimate your monthly energy consumption and costs.",
      longDescription:
        "Understand and manage your energy usage. This tool helps you estimate electricity and gas costs based on your living situation and habits.",
      category: "utilities",
      features: ["Usage calculator", "Cost breakdown", "Saving tips", "Seasonal estimates"],
      buttonText: "Estimate Costs",
      color: "bg-purple-100",
    },
  ]

  const filteredTools = activeTab === "all" ? tools : tools.filter((tool) => tool.category === activeTab)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 pt-20">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-5xl font-bold tracking-tight">STUDENT TOOLS</h1>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mt-4">
                100% Free
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="flex justify-center">
              <TabsList className="bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="all" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  All Tools
                </TabsTrigger>
                <TabsTrigger value="housing" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  Housing
                </TabsTrigger>
                <TabsTrigger value="finance" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  Finance
                </TabsTrigger>
                <TabsTrigger value="utilities" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  Utilities
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="group relative overflow-hidden rounded-lg border bg-background transition-all hover:shadow-md flex flex-col"
              >
                <div className={`relative ${tool.color} h-48 flex flex-col items-center justify-center`}>
                  <h3 className="text-2xl font-semibold text-center px-4 mb-8">{tool.title}</h3>

                  {tool.id === "room-allocator" && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <div className="bg-white rounded-full px-4 py-1.5 shadow-sm flex items-center">
                        <div className="flex -space-x-2 mr-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 border border-white"></div>
                          <div className="w-6 h-6 rounded-full bg-gray-400 border border-white"></div>
                          <div className="w-6 h-6 rounded-full bg-gray-500 border border-white"></div>
                        </div>
                        <span className="text-sm font-medium">1,234 students used</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 text-center flex-1 flex flex-col">
                  <p className="text-gray-500 text-sm mb-6">{tool.description}</p>

                  <div className="mt-auto space-y-6">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {tool.features?.slice(0, 4).map((feature, i) => (
                        <div key={i} className="flex items-center justify-center text-xs text-gray-500">
                          <div className="h-2 w-2 rounded-full bg-purple-600 mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Link href={`/tools/${tool.id}`} className="block">
                      <Button className="w-full group bg-purple-600 hover:bg-purple-700 text-white font-medium py-3">
                        {tool.buttonText}
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 text-white" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
