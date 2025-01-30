import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import {
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export default function Discussion() {
  const { t } = useTranslation('common');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Top');

  const categories = [
    { name: 'FOR SALE', icon: '💰', description: 'buy and sell student items' },
    {
      name: 'HOUSEMATE FINDER',
      icon: '🏠',
      description: 'find your perfect housemates',
    },
    {
      name: 'HOUSE HUNTING',
      icon: '🔍',
      description: 'tips and advice for finding houses',
    },
    {
      name: 'STUDENT LIFE',
      icon: '🎓',
      description: 'general student discussion',
    },
    { name: 'EVENTS', icon: '🎉', description: 'local events and meetups' },
    { name: 'QUESTIONS', icon: '❓', description: 'ask the community' },
  ];

  const posts = [
    {
      title: 'Looking for one more housemate (Kingfisher)',
      shortDesc:
        "We're a group of 3 students (2 guys, 1 girl) looking for one more housemate to join us in our 4-bedroom student house in Kingfisher for the upcoming academic year, the house is £130 a week including builds.",
      category: '🏠 HOUSEMATE FINDER',
      author: 'Charlie',
      timeAgo: '2h ago',
      upvotes: 12,
      comments: 5,
    },
    {
      title: 'Selling my course textbooks (Computer Science Year 2)',
      shortDesc:
        "Clearing out my textbooks from this year. All in great condition, barely used some of them! Including 'Introduction to Algorithms', 'Database Systems', and 'Computer Networks'. Prices negotiable, pickup from campus.",
      category: '💰 FOR SALE',
      author: 'TechBookWorm',
      timeAgo: '4h ago',
      upvotes: 8,
      comments: 3,
    },
    {
      title: 'Best takeaways near campus that deliver late?',
      shortDesc:
        "I'm pulling an all-nighter for my dissertation and need some food recommendations. What places are still delivering after midnight? Preferably something not too expensive!",
      category: '❓ QUESTIONS',
      author: 'LateNightStudent',
      timeAgo: '6h ago',
      upvotes: 15,
      comments: 12,
    },
    {
      title: 'End of Year Party at Junction - This Friday!',
      shortDesc:
        "We're organizing a massive end of year party this Friday at Junction! £5 entry with student ID, drinks deals all night, and great music. Come celebrate the end of exams with us! Starts at 9PM.",
      category: '🎉 EVENTS',
      author: 'PartyPlanner',
      timeAgo: '12h ago',
      upvotes: 45,
      comments: 28,
    },
    {
      title: 'Tips for viewing student houses?',
      shortDesc:
        "Going to view my first student house tomorrow and I'm not sure what to look out for. Any advice on red flags or important things to check? Don't want to get stuck in a bad house next year!",
      category: '🔍 HOUSE HUNTING',
      author: 'FirstTimer',
      timeAgo: '1d ago',
      upvotes: 32,
      comments: 19,
    },
    {
      title: 'Selling my mini fridge - perfect for student room',
      shortDesc:
        'Moving out and selling my mini fridge. Perfect condition, only used for one year. Great for keeping drinks cold in your room! £30 ONO. Can deliver within reasonable distance.',
      category: '💰 FOR SALE',
      author: 'MovingOut2023',
      timeAgo: '1d ago',
      upvotes: 6,
      comments: 4,
    },
    {
      title: '2 girls looking for 2 more to complete house share',
      shortDesc:
        "We're two second-year Psychology students looking for 2 more girls to complete our house share for next year. House is on Victoria Road, £125pw including bills. We're clean, sociable but respectful of study time!",
      category: '🏠 HOUSEMATE FINDER',
      author: 'PsychGirls',
      timeAgo: '1d ago',
      upvotes: 9,
      comments: 7,
    },
    {
      title: 'Anyone else having issues with Campus WiFi?',
      shortDesc:
        'The library WiFi has been super slow today, especially around the silent study area. Anyone else experiencing this? Really need to submit my assignment today!',
      category: '❓ QUESTIONS',
      author: 'WiFiWarrior',
      timeAgo: '2d ago',
      upvotes: 28,
      comments: 15,
    },
    {
      title: 'Society Meetup - Board Games Night',
      shortDesc:
        "The Board Games Society is hosting a casual games night this Thursday in the Student Union, Room 3. Everyone welcome, whether you're a member or not! We'll have plenty of games, snacks, and good vibes.",
      category: '🎉 EVENTS',
      author: 'BoardGamePro',
      timeAgo: '2d ago',
      upvotes: 21,
      comments: 8,
    },
    {
      title: 'Warning: Avoid Sunrise Lettings!',
      shortDesc:
        "Just wanted to warn everyone about our experience with Sunrise Lettings. They've been terrible with maintenance, took 3 months to fix our heating, and now they're trying to charge us for pre-existing damage.",
      category: '🔍 HOUSE HUNTING',
      author: 'AngryTenant',
      timeAgo: '3d ago',
      upvotes: 89,
      comments: 42,
    },
    {
      title: 'Study group for MATH201 Final',
      shortDesc:
        "Anyone want to form a study group for the MATH201 final? Planning to meet in the library every Tuesday and Thursday evening. All welcome, especially if you're good at calculus!",
      category: '🎓 STUDENT LIFE',
      author: 'MathWhiz',
      timeAgo: '3d ago',
      upvotes: 15,
      comments: 11,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main content wrapper */}
      <div className="pt-16 sm:pt-20">
        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="lg:w-3/4">
              {/* Action Bar */}
              <div className="flex items-center gap-3 mb-4">
                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {/* Dynamic icon based on selected option */}
                    {selectedSort === 'Top' && (
                      <ArrowTrendingUpIcon className="h-5 w-5" />
                    )}
                    {selectedSort === 'New' && (
                      <ClockIcon className="h-5 w-5" />
                    )}
                    {selectedSort === 'Trending' && (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M13 7L20 14M20 14L13 21M20 14H4"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    <span className="hidden sm:inline">{selectedSort}</span>
                    <svg
                      className={`h-4 w-4 ml-1 transform transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                      {['Top', 'New', 'Trending'].map((option) => (
                        <button
                          key={option}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                            selectedSort === option
                              ? 'text-purple-600'
                              : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedSort(option);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {option === 'Top' && (
                              <ArrowTrendingUpIcon className="h-5 w-5" />
                            )}
                            {option === 'New' && (
                              <ClockIcon className="h-5 w-5" />
                            )}
                            {option === 'Trending' && (
                              <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13 7L20 14M20 14L13 21M20 14H4"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                            {option}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Filter button */}
                  <button className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
                    <FunnelIcon className="h-5 w-5" />
                  </button>

                  {/* Desktop Create Post button */}
                  <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full shadow-sm hover:bg-purple-700 transition-colors">
                    <PlusIcon className="h-5 w-5" />
                    <span className="font-medium">Create Post</span>
                  </button>
                </div>
              </div>

              {/* Floating Action Button for Create Post on Mobile */}
              <div className="fixed bottom-20 right-4 sm:hidden z-50">
                <button className="flex items-center justify-center w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors">
                  <PlusIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Remove the padding at the bottom since we no longer have a full-width button */}
              <div>
                {/* Posts List */}
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                              {post.category}
                            </span>
                            <span>
                              Posted by{' '}
                              <span className="hover:underline hover:cursor-pointer">
                                {post.author}
                              </span>
                            </span>
                            <span>•</span>
                            <span>{post.timeAgo}</span>
                          </div>
                          <h3 className="text-xl font-medium mb-2 mt-2">
                            {post.title}
                          </h3>
                          <div className="relative">
                            <p className="text-gray-600 mb-2">
                              {truncateText(post.shortDesc, 175)}
                            </p>
                            {post.shortDesc.length > 175 && (
                              <div className="absolute bottom-0 right-0 left-0 h-full bg-gradient-to-t from-white to-transparent pointer-events-none" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <ChatBubbleLeftIcon className="h-5 w-5" />
                            <span>{post.comments} comments</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center text-gray-500">
                          <button className="hover:text-purple-600">▲</button>
                          <span className="text-sm font-medium">
                            {post.upvotes}
                          </span>
                          <button className="hover:text-purple-600">▼</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Categories only visible on desktop */}
            <div className="hidden lg:block lg:w-1/4">
              {/* Categories */}
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <h2 className="text-lg font-bold mb-4">Categories</h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Link
                      key={category.name}
                      href={`/discussion/${category.name
                        .toLowerCase()
                        .replace(' ', '-')}`}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
                    >
                      <span className="text-xl pr-2">{category.icon}</span>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {category.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
