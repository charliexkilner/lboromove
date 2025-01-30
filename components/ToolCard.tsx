import React from 'react';
import Link from 'next/link';

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  emoji?: string;
}

const TOOL_EMOJIS: { [key: string]: string } = {
  'Split Rent Calculator': '💰',
  'Student WiFi Setup Guide': '📡',
  'Room Allocator': '🎲',
  'Rent Calculator': '🧮',
  'Move-in Checklist': '✅',
  'Energy Usage Estimator': '⚡',
};

export default function ToolCard({ title, description, href }: ToolCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TOOL_EMOJIS[title]}</span>
            <h3 className="text-lg font-medium uppercase">{title}</h3>
          </div>
        </div>
        <p className="text-gray-600 lowercase">{description}</p>
      </div>
    </Link>
  );
}
