"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import Navbar from "../../components/Navbar"
import Head from "next/head"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { useTranslation } from "next-i18next"
import { GetStaticProps } from "next"

export default function StudentToolsPage() {
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState("all")

  const tools = [
    {
      id: "room-allocator",
      title: t('tools.room_allocator.title'),
      description: t('tools.room_allocator.description'),
      longDescription: t('tools.room_allocator.long_description'),
      category: "housing",
      usageCount: 1234,
      features: [
        t('tools.room_allocator.features.random'),
        t('tools.room_allocator.features.fair'),
        t('tools.room_allocator.features.fun'),
        t('tools.room_allocator.features.save')
      ],
      buttonText: t('tools.room_allocator.button'),
      color: "bg-pink-100",
    },
    {
      id: "split-rent-calculator",
      title: t('tools.split_rent.title'),
      description: t('tools.split_rent.description'),
      longDescription: t('tools.split_rent.long_description'),
      category: "finance",
      usageCount: 892,
      features: [
        t('tools.split_rent.features.comparison'),
        t('tools.split_rent.features.weighting'),
        t('tools.split_rent.features.methods'),
        t('tools.split_rent.features.shareable')
      ],
      buttonText: t('tools.split_rent.button'),
      color: "bg-yellow-100",
    },
    {
      id: "wifi-setup-guide",
      title: t('tools.wifi_guide.title'),
      description: t('tools.wifi_guide.description'),
      longDescription: t('tools.wifi_guide.long_description'),
      category: "utilities",
      features: [
        t('tools.wifi_guide.features.providers'),
        t('tools.wifi_guide.features.setup'),
        t('tools.wifi_guide.features.troubleshooting'),
        t('tools.wifi_guide.features.discounts')
      ],
      buttonText: t('tools.wifi_guide.button'),
      color: "bg-blue-100",
    },
    {
      id: "rent-calculator",
      title: t('tools.rent_calculator.title'),
      description: t('tools.rent_calculator.description'),
      longDescription: t('tools.rent_calculator.long_description'),
      category: "finance",
      features: [
        t('tools.rent_calculator.features.bills'),
        t('tools.rent_calculator.features.deposit'),
        t('tools.rent_calculator.features.monthly'),
        t('tools.rent_calculator.features.annual')
      ],
      buttonText: t('tools.rent_calculator.button'),
      color: "bg-red-100",
    },
    {
      id: "move-in-checklist",
      title: t('tools.checklist.title'),
      description: t('tools.checklist.description'),
      longDescription: t('tools.checklist.long_description'),
      category: "housing",
      features: [
        t('tools.checklist.features.printable'),
        t('tools.checklist.features.progress'),
        t('tools.checklist.features.custom'),
        t('tools.checklist.features.sharing')
      ],
      buttonText: t('tools.checklist.button'),
      color: "bg-green-100",
    },
    {
      id: "energy-estimator",
      title: t('tools.energy.title'),
      description: t('tools.energy.description'),
      longDescription: t('tools.energy.long_description'),
      category: "utilities",
      features: [
        t('tools.energy.features.calculator'),
        t('tools.energy.features.breakdown'),
        t('tools.energy.features.tips'),
        t('tools.energy.features.seasonal')
      ],
      buttonText: t('tools.energy.button'),
      color: "bg-purple-100",
    },
  ]

  const filteredTools = activeTab === "all" ? tools : tools.filter((tool) => tool.category === activeTab)

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{t('tools.page_title')} | Lboro Move</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
      </Head>
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 pt-20">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-5xl font-bold tracking-tight">{t('tools.heading')}</h1>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mt-4">
                {t('tools.free_badge')}
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="flex justify-center">
              <TabsList className="bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="all" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  {t('tools.all_tools')}
                </TabsTrigger>
                <TabsTrigger value="housing" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  {t('tools.housing')}
                </TabsTrigger>
                <TabsTrigger value="finance" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  {t('tools.finance')}
                </TabsTrigger>
                <TabsTrigger value="utilities" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                  {t('tools.utilities')}
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

                    <Link href={tool.id === "move-in-checklist" ? "/student-move-in-checklist" : 
                        tool.id === "rent-calculator" ? "/tools/move-out-checklist" : 
                        `/tools/${tool.id}`} className="block">
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

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  }
}
