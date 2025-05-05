import { Discussion } from '../types/discussion';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import FullScreenGallery from './FullScreenGallery';
import Image from 'next/image';

interface DiscussionCardProps {
  discussion: Discussion;
  initialHasUpvoted?: boolean;
}

export default function DiscussionCard({ discussion, initialHasUpvoted = false }: DiscussionCardProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [upvotes, setUpvotes] = useState(discussion.replyCount || 0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  useEffect(() => {
    // Update local state when initialHasUpvoted changes
    setHasUpvoted(initialHasUpvoted);
  }, [initialHasUpvoted]);

  const handleUpvote = async () => {
    if (!session) return; // Early return if not logged in

    try {
      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: discussion.id, value: hasUpvoted ? -1 : 1 }),
      });

      if (response.ok) {
        setHasUpvoted(!hasUpvoted);
        setUpvotes(hasUpvoted ? upvotes - 1 : upvotes + 1);
        // Invalidate the posts query to refetch the updated data
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (discussion.imageUrl) {
      setIsGalleryOpen(true);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-purple-500 p-4">
      <div className="flex justify-between items-start gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Description */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-purple-800 mb-2">
              {discussion.title}
            </h3>
            <p className="text-gray-600 mb-2">{discussion.content}</p>
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

          {/* Bottom Section */}
          <div className="flex items-center justify-between">
            {/* Profile Pictures and Stats */}
            <div className="flex items-center gap-2 bg-purple-200 rounded-full p-2">
              {/* Profile Pictures */}
              <div className="flex -space-x-3">
                {discussion.avatars.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar}
                    alt={`User ${index + 1}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-purple-200 object-cover object-center"
                  />
                ))}
              </div>

              {/* Answer Count */}
              <div className="flex-1">
                <div className="text-sm font-normal">
                  {discussion.replyCount} replies
                </div>
              </div>
            </div>

            {/* Voting Section */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUpvote}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  hasUpvoted ? 'text-purple-600' : 'text-gray-400'
                }`}
              >
                <ArrowUpIcon className={`h-5 w-5 ${hasUpvoted ? 'fill-purple-600' : ''}`} />
              </button>
              <span className={`text-sm font-medium ${hasUpvoted ? 'text-purple-600' : 'text-gray-700'}`}>
                {upvotes}
              </span>
            </div>
          </div>
        </div>

        {/* Image on the right */}
        {discussion.imageUrl && (
          <div className="flex-shrink-0">
            <button 
              onClick={handleImageClick}
              className="relative block overflow-hidden rounded-lg hover:opacity-90 transition-opacity w-24 h-24"
            >
              <img
                src={discussion.imageUrl}
                alt={discussion.title}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        )}
      </div>

      {/* Full Screen Gallery */}
      {isGalleryOpen && discussion.imageUrl && (
        <FullScreenGallery
          images={[discussion.imageUrl]}
          initialIndex={0}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  );
}
