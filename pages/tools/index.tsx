import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../../components/Navbar';
import ToolCard from '../../components/ToolCard';

export default function StudentToolsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-12 pt-24">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 uppercase tracking-tight">Student Tools</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            Free tools created by students, for students.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ToolCard
            title="Room Allocator"
            description="Fairly assign rooms with a fun spin-the-wheel game."
            action="Spin The Wheel"
            emoji="🎡"
            usageCount={1234}
            showAvatars={true}
            href="/tools/room-allocator"
          />

          <ToolCard
            title="Split Rent Calculator"
            description="Calculate fair rent splits based on room sizes and features."
            action="Calculate Split"
            emoji="🤑"
            usageCount={892}
            showAvatars={true}
            href="/tools/split-rent"
          />

          <ToolCard
            title="WiFi Setup Guide"
            description="Get online with our step-by-step guide. Includes cheapest WIFI providers!"
            action="View Guide"
            emoji="📶"
            href="/tools/wifi-setup"
          />

          <ToolCard
            title="Rent Calculator"
            description="Calculate total rental costs including bills and deposits."
            action="Calculate Costs"
            emoji="🧮"
            href="/tools/rent-calculator"
          />

          <ToolCard
            title="Move-In Checklist"
            description="Complete checklist for moving into your student home. Written by current and former students."
            action="View Checklist"
            emoji="✅"
            href="/tools/move-in-checklist"
          />

          <ToolCard
            title="Energy Estimator"
            description="Estimate your monthly energy consumption and costs."
            action="Estimate Costs"
            emoji="⚡"
            href="/tools/energy-estimator"
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
