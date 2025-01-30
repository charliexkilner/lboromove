import { Discuession } from '../types/discussion';

interface DiscussionCardProps {
  discussion: Discuession;
}

export default function DiscussionCard({ discussion }: DiscussionCardProps) {
  return (
    <div className="relative w-full md:w-[300px] md:aspect-square">
      <div className="bg-white rounded-lg border border-purple-500 p-6 flex flex-col h-auto md:absolute md:inset-0">
        {/* Title */}
        <div className="mb-4 md:mb-auto">
          <h3 className="text-2xl font-semibold text-purple-800 mb-2">
            {discussion.title}
          </h3>
          <a
            href="#"
            className="text-sm text-purple-600 hover:underline inline-flex items-center gap-1 underline underline-offset-4"
          >
            join the discussion
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>

        {/* Profile Pictures and Stats */}
        <div className="flex items-center gap-2 bg-purple-200 rounded-full p-2">
          {/* Profile Pictures */}
          <div className="flex -space-x-3">
            {discussion.avatars.map((avatar, index) => (
              <img
                key={index}
                src={avatar}
                alt={`User ${index + 1}`}
                className="w-8 h-8 rounded-full border-2 border-purple-200 object-cover object-center"
              />
            ))}
          </div>

          {/* Answer Count */}
          <div className="flex-1">
            <div className="text-sm font-normal">
              {discussion.replyCount} replies
            </div>
            {/* Last reply 
            <div className="text-sm text-gray-500">
              Last reply {discussion.lastReplied}
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
