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
  ArrowUpIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import NewPostModal from '../../components/modals/NewPostModal';
import FilterModal from '../../components/modals/FilterModal';
import { useRouter } from 'next/router';

type Post = {
  id: string;
  title: string;
  shortDesc: string;
  category: string;
  author: string;
  timeAgo: string;
  comments: number;
  upvotes: number;
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

type Category = {
  id: string;
  icon: string;
  label: string;
  count: number;
};

const generateDummyPosts = (): Post[] => {
  return [
    // Housemate Finder posts
    {
      id: '1',
      title: 'Looking for a housemate in Golden Triangle',
      shortDesc:
        'I have a spare room in a 3-bed house near UEA. £450pcm including bills. Available from September.',
      category: 'housemate-finder',
      author: 'Emily',
      timeAgo: '2 hours ago',
      comments: 7,
      upvotes: 12,
    },
    {
      id: '2',
      title: 'Postgrad student seeking quiet flatmate',
      shortDesc:
        'PhD student looking for a considerate flatmate for a 2-bed apartment in city center. £500pcm + bills.',
      category: 'housemate-finder',
      author: 'Michael',
      timeAgo: '1 day ago',
      comments: 3,
      upvotes: 5,
    },

    // For Sale posts
    {
      id: '3',
      title: 'Desk and office chair - perfect for students',
      shortDesc:
        'Selling my IKEA desk and ergonomic chair. Both in excellent condition. £80 for both or can sell separately.',
      category: 'for-sale',
      author: 'Alex',
      timeAgo: '5 hours ago',
      comments: 9,
      upvotes: 4,
    },
    {
      id: '4',
      title: 'Textbooks for Computer Science courses',
      shortDesc:
        'Various CS textbooks for sale. Most are in good condition with minimal highlighting. £10-25 each.',
      category: 'for-sale',
      author: 'Jamie',
      timeAgo: '3 days ago',
      comments: 2,
      upvotes: 3,
    },

    // Events posts
    {
      id: '5',
      title: 'House party this Saturday - all welcome!',
      shortDesc:
        'Hosting a house party in my place near the SU. Starting at 8pm, bring your own drinks!',
      category: 'events',
      author: 'Sophie',
      timeAgo: '1 day ago',
      comments: 15,
      upvotes: 22,
    },
    {
      id: '6',
      title: 'Study group for Economics finals',
      shortDesc:
        'Meeting at the library this Thursday at 2pm to prepare for Economics finals. All welcome!',
      category: 'events',
      author: 'Daniel',
      timeAgo: '12 hours ago',
      comments: 4,
      upvotes: 8,
    },

    // Questions posts
    {
      id: '7',
      title: 'Best letting agents in Norwich?',
      shortDesc:
        'Looking for recommendations for student-friendly letting agents. Who has had good experiences?',
      category: 'questions',
      author: 'Olivia',
      timeAgo: '6 hours ago',
      comments: 11,
      upvotes: 7,
    },
    {
      id: '8',
      title: 'How to deal with noisy neighbors?',
      shortDesc:
        "My neighbors party until 3am most nights. I've tried talking to them but no luck. Any advice?",
      category: 'questions',
      author: 'Ben',
      timeAgo: '2 days ago',
      comments: 14,
      upvotes: 18,
    },

    // House Hunting posts
    {
      id: '9',
      title: 'Any houses still available for September?',
      shortDesc:
        'Our group of 4 is still looking for a house for next academic year. Any leads would be appreciated!',
      category: 'house-hunting',
      author: 'Grace',
      timeAgo: '3 hours ago',
      comments: 5,
      upvotes: 4,
    },
    {
      id: '10',
      title: 'Advice on Golden Triangle vs. City Center',
      shortDesc:
        'Trying to decide between a house in Golden Triangle or a flat in the city center. Pros and cons?',
      category: 'house-hunting',
      author: 'Tom',
      timeAgo: '4 days ago',
      comments: 8,
      upvotes: 6,
    },

    // Student Life posts
    {
      id: '11',
      title: 'Best places to study on campus?',
      shortDesc:
        "Looking for quiet study spots on campus that aren't always packed. Any hidden gems?",
      category: 'student-life',
      author: 'Zoe',
      timeAgo: '7 hours ago',
      comments: 12,
      upvotes: 15,
    },
    {
      id: '12',
      title: 'Cheapest supermarkets near UEA',
      shortDesc:
        'Which supermarkets offer the best value for money? Trying to save on my food budget this term.',
      category: 'student-life',
      author: 'Ryan',
      timeAgo: '5 days ago',
      comments: 10,
      upvotes: 20,
    },

    // Posts with no category
    {
      id: '13',
      title: 'Lost my student ID card',
      shortDesc:
        'Lost my student ID somewhere between the library and the SU yesterday. Has anyone found it?',
      category: '',
      author: 'Lily',
      timeAgo: '1 day ago',
      comments: 3,
      upvotes: 2,
    },
    {
      id: '14',
      title: 'Anyone want to start a band?',
      shortDesc:
        'I play guitar and am looking for other musicians to jam with. All skill levels welcome!',
      category: '',
      author: 'Josh',
      timeAgo: '2 days ago',
      comments: 6,
      upvotes: 9,
    },
    {
      id: '15',
      title: 'Free furniture to collect',
      shortDesc:
        'Moving out and have some furniture to give away. Must collect from Golden Triangle by this weekend.',
      category: '',
      author: 'Emma',
      timeAgo: '8 hours ago',
      comments: 18,
      upvotes: 25,
    },
  ];
};

export default function Discussion() {
  const { t } = useTranslation('common');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Top');
  const [votes, setVotes] = useState<{ [key: string]: boolean }>({});
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeSort, setActiveSort] = useState('trending');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const router = useRouter();
  const { category } = router.query;
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'housemate-finder', icon: '🏠', label: 'HOUSEMATE FINDER', count: 0 },
    { id: 'for-sale', icon: '💰', label: 'FOR SALE', count: 0 },
    { id: 'events', icon: '🎉', label: 'EVENTS', count: 0 },
    { id: 'questions', icon: '❓', label: 'QUESTIONS', count: 0 },
    { id: 'house-hunting', icon: '🔍', label: 'HOUSE HUNTING', count: 0 },
    { id: 'student-life', icon: '🎓', label: 'STUDENT LIFE', count: 0 },
  ]);

  const sortOptions = [
    { id: 'new', label: 'New', icon: ClockIcon },
    { id: 'top', label: 'Top', icon: ChartBarIcon },
  ];

  const getSortedPosts = (posts: Post[], sortType: string) => {
    if (sortType === 'new') {
      // Sort by time (most recent first)
      // This is a simple implementation - in a real app you'd parse the timeAgo properly
      return [...posts].sort((a, b) => {
        // Convert timeAgo to approximate hours for sorting
        const getHours = (timeStr: string) => {
          if (timeStr.includes('hour')) {
            return parseInt(timeStr.split(' ')[0]);
          } else if (timeStr.includes('day')) {
            return parseInt(timeStr.split(' ')[0]) * 24;
          }
          return 0;
        };
        return getHours(a.timeAgo) - getHours(b.timeAgo);
      });
    } else if (sortType === 'top') {
      // Sort by upvotes (highest first)
      return [...posts].sort((a, b) => b.upvotes - a.upvotes);
    }
    return posts;
  };

  useEffect(() => {
    // Update selectedCategory based on URL query
    setSelectedCategory((category as string) || 'All');

    // Use dummy data instead of API fetch
    setLoading(true);
    try {
      const dummyPosts = generateDummyPosts();
      setPosts(dummyPosts);

      // Create a new array with updated counts
      const updatedCategories = categories.map((cat) => ({
        ...cat,
        count: dummyPosts.filter((post: Post) => post.category === cat.id)
          .length,
      }));

      // Update the categories state
      setCategories(updatedCategories);

      // Filter posts if category is selected
      let filtered = category
        ? dummyPosts.filter((post: Post) => post.category === category)
        : dummyPosts;

      // Apply sorting
      filtered = getSortedPosts(filtered, activeSort);

      setFilteredPosts(filtered);
    } catch (error) {
      console.error('Error with dummy posts:', error);
    } finally {
      setLoading(false);
    }
  }, [category, activeSort]);

  useEffect(() => {
    if (posts.length > 0) {
      const filtered = category
        ? posts.filter((post) => post.category === category)
        : posts;

      setFilteredPosts(getSortedPosts(filtered, activeSort));
    }
  }, [activeSort]);

  const handleUpvote = (postTitle: string) => {
    setVotes((prev) => ({
      ...prev,
      [postTitle]: !prev[postTitle],
    }));
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === category) {
      router.push('/discussion');
    } else {
      router.push({
        pathname: '/discussion',
        query: { category: categoryId },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <div className="sm:hidden">
              <button
                onClick={() => setIsTopMenuOpen(!isTopMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm"
              >
                <ChartBarIcon className="h-5 w-5" />
                <span className="capitalize">{activeSort}</span>
                <ChevronDownIcon
                  className={`h-5 w-5 transition-transform ${
                    isTopMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isTopMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg py-1 z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setActiveSort(option.id);
                        setIsTopMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left ${
                        activeSort === option.id
                          ? 'text-purple-600 bg-purple-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <option.icon className="h-5 w-5" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-3">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveSort(option.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    activeSort === option.id
                      ? 'bg-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <option.icon className="h-5 w-5" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowNewPostModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Create new post</span>
            <span className="sm:hidden">Post</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post, index) => (
                  <div
                    key={index}
                    className="relative bg-white rounded-lg shadow-sm p-6 mb-4"
                  >
                    <div className="pr-12 sm:pr-16">
                      <h2 className="text-lg font-medium mb-2">{post.title}</h2>
                      <p className="text-gray-600 mb-4">{post.shortDesc}</p>

                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mt-4">
                        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                          <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded-full text-gray-600 whitespace-nowrap lowercase">
                            {post.category}
                          </div>

                          <span className="truncate">
                            Posted by {post.author} • {post.timeAgo}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => handleUpvote(post.title)}
                      className={`flex flex-col items-center justify-center w-12 sm:w-16 h-full border-l ${
                        votes[post.title]
                          ? 'border-purple-200 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                      } transition-colors group cursor-pointer absolute right-0 top-0`}
                    >
                      <ArrowUpIcon
                        className={`h-4 w-4 sm:h-5 sm:w-5 mb-1 transition-colors ${
                          votes[post.title]
                            ? 'text-purple-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`text-xs sm:text-sm font-medium transition-colors ${
                          votes[post.title]
                            ? 'text-purple-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {post.upvotes + (votes[post.title] ? 1 : 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No discussions found in this category.
                </p>
                <button
                  onClick={() => router.push('/discussion')}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  View All Discussions
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">CATEGORIES</h2>
              <div className="space-y-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full flex items-start text-left px-4 py-3 rounded-lg transition-colors ${
                      category === cat.id
                        ? 'bg-purple-50 text-purple-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-2xl mr-3">{cat.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium uppercase">{cat.label}</span>
                      <span className="text-sm text-gray-500">
                        {cat.count} posts
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNewPostModal && (
        <NewPostModal onClose={() => setShowNewPostModal(false)} />
      )}
      {showFilters && <FilterModal onClose={() => setShowFilters(false)} />}
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
