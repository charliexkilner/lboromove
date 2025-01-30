import React from 'react';
import { useTranslation } from 'next-i18next';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Navbar from '../../components/Navbar';
import ToolCard from '../../components/ToolCard';
import Link from 'next/link';

export default function Tools() {
  return (
    <div className="min-h-screen bg-gray-50 pt-28 md:pt-32 px-4">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 uppercase">
          Student Tools
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ToolCard
            title="Room Allocator"
            description="Randomly assign bedrooms to housemates fairly with a spin of the wheel"
            href="/tools/room-allocator"
          />
          <ToolCard
            title="Split Rent Calculator"
            description="Calculate rent splits based on room sizes and features"
            href="/tools/split-rent"
          />
          <ToolCard
            title="Student WiFi Setup Guide"
            description="Set up your student accommodation WiFi in two simple steps"
            href="/tools/wifi-setup"
          />
          <ToolCard
            title="Rent Calculator"
            description="Calculate total rental costs including bills and deposits"
            href="/tools/rent-calculator"
          />
          <Link
            href="/student-move-in-checklist"
            className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <h2 className="text-xl font-bold">MOVE-IN CHECKLIST</h2>
            </div>
            <p className="text-gray-600">
              complete checklist for moving into your student home
            </p>
          </Link>
          <ToolCard
            title="Energy Usage Estimator"
            description="Estimate your monthly energy consumption and costs"
            href="/tools/energy-calculator"
          />
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
