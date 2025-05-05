import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
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
import { useState, useEffect, useMemo } from 'react';
import NewPostModal from '../../components/modals/NewPostModal';
import FilterModal from '../../components/modals/FilterModal';
import { useRouter } from 'next/router';
import { useProtectedAction } from '../../hooks/useProtectedAction';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Post } from '../../types/post';
import Head from 'next/head';
import Layout from '../../components/Layout';

const categories = [
  { id: 'housemate-finder', icon: '🏠', label: 'HOUSEMATE FINDER', count: 0 },
  { id: 'for-sale', icon: '💰', label: 'FOR SALE', count: 0 },
  { id: 'events', icon: '🎉', label: 'EVENTS', count: 0 },
  { id: 'questions', icon: '❓', label: 'QUESTIONS', count: 0 },
  { id: 'house-hunting', icon: '🔍', label: 'HOUSE HUNTING', count: 0 },
  { id: 'student-life', icon: '🎓', label: 'STUDENT LIFE', count: 0 },
];

const fetchPosts = async ({
  category,
  sortBy = 'new',
}: {
  category: string;
  sortBy: string;
}): Promise<Post[]> => {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  params.append('sortBy', sortBy);
  
  const response = await fetch(`/api/posts?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  return response.json();
};

const fetchAllPosts = async (): Promise<Post[]> => {
  const response = await fetch('/api/posts?sortBy=new');
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  return response.json();
};

interface DiscussionProps {
  initialPosts: Post[];
  initialAllPosts: Post[];
  initialCategory: string;
  initialSort: string;
}

export default function Discussion({
  initialPosts,
  initialAllPosts,
  initialCategory,
  initialSort
}: DiscussionProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const runProtectedAction = useProtectedAction();
  const { data: session } = useSession();
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeSort, setActiveSort] = useState(initialSort);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
  const { category } = router.query;
  const queryClient = useQueryClient();

  // Initialize query client with server-side data
  useEffect(() => {
    // Set initial data for the posts query
    queryClient.setQueryData(
      ['posts', initialCategory, initialSort], 
      initialPosts
    );
    
    // Set initial data for all posts
    queryClient.setQueryData(['posts', 'all'], initialAllPosts);
  }, [queryClient, initialPosts, initialAllPosts, initialCategory, initialSort]);

  // Update state when URL changes
  useEffect(() => {
    const sortParam = router.query.sort as string;
    if (sortParam) {
      setActiveSort(sortParam);
    } else {
      setActiveSort('new');
    }
  }, [router.query]);

  // Add effect to refetch data when activeSort changes
  useEffect(() => {
    // Skip initial render
    if (typeof window !== 'undefined') {
      queryClient.fetchQuery({
        queryKey: ['posts', category || 'All', activeSort],
        queryFn: () => fetchPosts({
          category: category as string || 'All',
          sortBy: activeSort
        })
      });
    }
  }, [activeSort, category, queryClient]);

  const { data: posts = initialPosts, isLoading, isFetching } = useQuery({
    queryKey: ['posts', category || 'All', activeSort],
    queryFn: () => fetchPosts({
      category: category as string || 'All', 
      sortBy: activeSort
    }),
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    initialData: initialPosts
  });

  // Combined loading state (initial load or refetching)
  const isLoadingPosts = isLoading || isFetching;

  // Get all posts for category counts - this query should run independently
  const { data: allPosts = initialAllPosts } = useQuery({
    queryKey: ['posts', 'all'],
    queryFn: fetchAllPosts,
    staleTime: 1000 * 60,
    enabled: true, // Explicitly enable
    initialData: initialAllPosts
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize counts for all categories to 0
    categories.forEach(cat => {
      counts[cat.id] = 0;
    });
    
    // Count posts for each category
    if (allPosts && allPosts.length > 0) {
      allPosts.forEach((post: Post) => {
        if (post.category) {
          counts[post.category] = (counts[post.category] || 0) + 1;
        }
      });
    }
    
    return counts;
  }, [allPosts]);

  useEffect(() => {
    setSelectedCategory((category as string) || 'All');
  }, [category]);

  const handleUpvote = async (postId: string) => {
    runProtectedAction(async () => {
      const currentPost = posts.find(p => p.id === postId);
      if (!currentPost) return;

      const isUpvoted = currentPost.hasUpvoted;

      try {
        // Optimistically update the UI
        queryClient.setQueryData(['posts', category || 'All', activeSort], (oldData: Post[]) =>
          oldData.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                hasUpvoted: !isUpvoted,
                _count: {
                  ...post._count,
                  votes: isUpvoted ? post._count.votes - 1 : post._count.votes + 1
                }
              };
            }
            return post;
          })
        );

        // Make the API call
        const response = await fetch('/api/posts/vote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            postId, 
            value: isUpvoted ? -1 : 1 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to vote');
        }

        // Get the updated post data
        const updatedPost = await response.json();

        // Update the cache with the server response
        queryClient.setQueryData(['posts', category || 'All', activeSort], (oldData: Post[]) =>
          oldData.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                ...updatedPost,
                hasUpvoted: updatedPost.hasUpvoted,
                _count: updatedPost._count
              };
            }
            return post;
          })
        );
      } catch (error) {
        console.error('Error voting:', error);
        // Revert the optimistic update on error
        queryClient.setQueryData(['posts', category || 'All', activeSort], (oldData: Post[]) =>
          oldData.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                hasUpvoted: isUpvoted,
                _count: {
                  ...post._count,
                  votes: isUpvoted ? post._count.votes : post._count.votes - 1
                }
              };
            }
            return post;
          })
        );
      }
    });
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === category) {
      // Clear category filter
      router.push({
        pathname: '/discussion',
        query: activeSort === 'top' ? { sort: 'top' } : {}
      }, undefined, { shallow: true });
    } else {
      // Apply category filter
      router.push({
        pathname: '/discussion',
        query: {
          category: categoryId,
          ...(activeSort === 'top' ? { sort: 'top' } : {})
        },
      }, undefined, { shallow: true });
    }
    
    // Update selected category
    setSelectedCategory(categoryId === category ? 'All' : categoryId);
  };

  const handleCreatePost = () => {
    runProtectedAction(() => {
      setShowNewPostModal(true);
    });
  };

  const handleCloseModal = () => {
    // Close the modal
    setShowNewPostModal(false);
    
    // Refetch posts to show any newly created posts
    queryClient.invalidateQueries({
      queryKey: ['posts'],
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const handleNewSort = () => {
    // Use shallow routing to update URL without full page reload
    router.push({
      pathname: '/discussion',
      query: category ? { category } : {}
    }, undefined, { shallow: true });
    
    // Update state and trigger data refetch
    setActiveSort('new');
  };

  const handleTopSort = () => {
    // Use shallow routing to update URL without full page reload
    router.push({
      pathname: '/discussion',
      query: {
        ...(category ? { category } : {}),
        sort: 'top'
      }
    }, undefined, { shallow: true });
    
    // Update state and trigger data refetch
    setActiveSort('top');
  };

  return (
    <Layout>
      <Head>
        <title>Student Discussion | Lboro Move</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 pb-24">
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
                    {['new', 'top'].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          if (option === 'new') {
                            handleNewSort();
                          } else {
                            handleTopSort();
                          }
                          setIsTopMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-left ${
                          activeSort === option
                            ? 'text-purple-600 bg-purple-50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {option === 'new' ? (
                          <ClockIcon className="h-5 w-5" />
                        ) : (
                          <ChartBarIcon className="h-5 w-5" />
                        )}
                        <span className="capitalize">{option}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-3">
                {['new', 'top'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      if (option === 'new') {
                        handleNewSort();
                      } else {
                        handleTopSort();
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      activeSort === option
                        ? 'bg-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option === 'new' ? (
                      <ClockIcon className="h-5 w-5" />
                    ) : (
                      <ChartBarIcon className="h-5 w-5" />
                    )}
                    <span className="capitalize">{option}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreatePost}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Create new post</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {isLoadingPosts ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post: Post) => (
                    <div
                      key={post.id}
                      className="relative bg-white rounded-lg shadow-sm mb-4 flex overflow-hidden border border-gray-200"
                    >
                      <button
                        onClick={() => handleUpvote(post.id)}
                        className={`flex flex-col items-center justify-center w-16 border-r transition-colors group cursor-pointer ${
                          post.hasUpvoted 
                            ? 'bg-purple-50 hover:bg-purple-100' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        } border-gray-200`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <ArrowUpIcon 
                            className={`h-4 w-4 sm:h-5 sm:w-5 mb-1 transition-colors ${
                              post.hasUpvoted 
                                ? 'text-purple-600 fill-purple-600' 
                                : 'text-gray-400 group-hover:text-gray-500'
                            }`} 
                          />
                          <span className={`text-xs sm:text-sm font-medium transition-colors ${
                            post.hasUpvoted 
                              ? 'text-purple-600' 
                              : 'text-gray-700 group-hover:text-gray-900'
                          }`}>
                            {post._count.votes}
                          </span>
                        </div>
                      </button>

                      <div className="flex-1 flex">
                        <div className="flex-1 p-6">
                          <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-gray-800">{post.title}</h2>
                            <p className="text-gray-500 mt-2 font-medium">{post.content}</p>
                            
                            <div className="bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-900 text-xs lowercase font-medium w-fit mt-4">
                              {post.category || 'general'}
                            </div>

                            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mt-6">
                              <span className="truncate">
                                Posted by {post.author.firstName} • {formatTimeAgo(post.createdAt)}
                              </span>

                              <div className="flex items-center gap-1 ml-2 text-black">
                                <ChatBubbleLeftIcon className="h-4 w-4 text-black" />
                                <span>{post._count.comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {post.imageUrl && (
                          <div className="flex-shrink-0 w-32 md:w-48 lg:w-56">
                            <Image
                              src={post.imageUrl}
                              alt="Post image"
                              width={224}
                              height={224}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
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

            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">CATEGORIES</h2>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`w-full flex items-start text-left px-3 py-2.5 rounded-lg transition-colors ${
                        category === cat.id
                          ? 'bg-purple-50 text-purple-600'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-xl mr-2.5">{cat.icon}</span>
                      <div className="flex flex-col items-start">
                        <span className="font-medium uppercase text-sm">{cat.label}</span>
                        <span className="text-xs text-gray-500">
                          {categoryCounts ? categoryCounts[cat.id] || 0 : 0} posts
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
          <NewPostModal onClose={handleCloseModal} />
        )}
        {showFilterModal && <FilterModal onClose={() => setShowFilterModal(false)} />}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, query }) => {
  try {
    // Get the category from the query params
    const category = query.category as string || 'All';
    const sortBy = (query.sort as string) || 'new';
    
    // Fetch posts server-side for the initial render
    const postsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/posts?${
      new URLSearchParams({
        ...(category !== 'All' ? { category } : {}),
        sortBy
      }).toString()
    }`);
    
    // Fetch all posts for category counts
    const allPostsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/posts?sortBy=new`);
    
    let initialPosts = [];
    let allPosts = [];
    
    if (postsResponse.ok) {
      initialPosts = await postsResponse.json();
    }
    
    if (allPostsResponse.ok) {
      allPosts = await allPostsResponse.json();
    }
    
    return {
      props: {
        ...(await serverSideTranslations(locale ?? 'en', ['common'])),
        initialPosts,
        initialAllPosts: allPosts,
        initialCategory: category,
        initialSort: sortBy
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        ...(await serverSideTranslations(locale ?? 'en', ['common'])),
        initialPosts: [],
        initialAllPosts: [],
        initialCategory: 'All',
        initialSort: 'new'
      },
    };
  }
};

