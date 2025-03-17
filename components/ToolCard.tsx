import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  emoji: string;
  action: string;
  usageCount?: number;
  showAvatars?: boolean;
}

export default function ToolCard({ title, description, href, emoji, action, usageCount, showAvatars = false }: ToolCardProps) {
  // Using UI Faces API for placeholder avatars
  const avatars = [
    { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64', alt: 'Phoenix Baker' },
    { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64', alt: 'Olivia Rhye' },
    { src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64', alt: 'Lana Steiner' },
    { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=64&h=64', alt: 'Demi Wilkinson' },
  ];

  return (
    <Link href={href}>
      <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-b from-purple-50/50 to-white p-1 transition-transform hover:scale-[1.02]">
        <div className="relative h-full rounded-lg bg-white p-6">
          {/* Main Content */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <span className="text-xl">{emoji}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            </div>
            <p className="mb-4 text-gray-600">{description}</p>

            {/* Stacked Avatars with Count - Only shown if showAvatars is true */}
            {showAvatars && usageCount && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-3">
                  {avatars.map((avatar, i) => (
                    <div key={i} className="relative h-8 w-8 rounded-full ring-2 ring-white">
                      <Image
                        src={avatar.src}
                        alt={avatar.alt}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-600">{usageCount.toLocaleString()} students used</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 transition-colors">
            {action}
          </button>

          {/* Subtle Decorative Elements */}
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-purple-100/50 blur-2xl" />
          <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-purple-100/30 blur-2xl" />
        </div>
      </div>
    </Link>
  );
}
