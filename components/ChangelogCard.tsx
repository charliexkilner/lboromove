import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'react-feather';

interface ChangelogCardProps {
  date: string;
  title: string;
  description: string;
  icon?: string;
}

export default function ChangelogCard({
  date,
  title,
  description,
  icon = '📝',
}: ChangelogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="text-purple-600 text-sm mb-2 font-bold uppercase">
        {date}
      </div>
      <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
        {title} <span>{icon}</span>
      </h2>
      <div
        className={`relative ${
          !isExpanded ? 'max-h-[200px] overflow-hidden' : ''
        }`}
      >
        <p className="text-gray-600 whitespace-pre-wrap">{description}</p>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
      >
        {isExpanded ? (
          <>
            Show Less <ChevronUp size={20} />
          </>
        ) : (
          <>
            Show More <ChevronDown size={20} />
          </>
        )}
      </button>
    </div>
  );
}
