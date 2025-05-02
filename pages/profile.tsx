import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import PropertyCard from "../components/PropertyCard";
import DiscussionCard from "../components/DiscussionCard";
import { Property as PrismaProperty, Prisma, UserRole } from "@prisma/client";
import { useRouter } from "next/router";
import { Discuession } from "../types/discussion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Session } from "next-auth";
import { ArrowUpIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

// Define property type to match PropertyWithOptionalFields
type PropertyWithOptionalFields = Prisma.PropertyGetPayload<{}> & {
  propertyType?: string;
  furnished?: boolean;
  available?: boolean;
  imageUrl?: string;
  slug?: string;
  _imageKey?: number;
};

// Extend Session type to include our custom user fields
interface ExtendedSession extends Session {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    role: UserRole;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" };
  const [activeTab, setActiveTab] = useState("favorites");

  const { data: favorites = [], isLoading: isFavoritesLoading } = useQuery<PropertyWithOptionalFields[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await fetch('/api/user/favorites');
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      return response.json();
    },
    enabled: !!session,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const { data: userDiscussions = [], isLoading: isDiscussionsLoading } = useQuery<Discuession[]>({
    queryKey: ['userDiscussions'],
    queryFn: async () => {
      const response = await fetch('/api/user/discussions');
      if (!response.ok) {
        throw new Error('Failed to fetch user discussions');
      }
      return response.json();
    },
    enabled: !!session && activeTab === "discussions",
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const handleFavoriteChange = (propertyId: number, isFavorite: boolean) => {
    // The actual API call is handled in PropertyCard
    // This is just for optimistic updates
    queryClient.setQueryData(['favorites'], (oldData: PropertyWithOptionalFields[] | undefined) => {
      if (!oldData) return [];
      if (isFavorite) {
        return [...oldData, { id: propertyId } as PropertyWithOptionalFields];
      } else {
        return oldData.filter((fav) => fav.id !== propertyId);
      }
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

  const handleUpvote = async (postId: string) => {
    if (!session) return;
    try {
      const response = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, value: 1 }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to vote');
      }
      
      // Invalidate the discussions query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['userDiscussions'] });
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Profile | Lboro Move</title>
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Profile | Lboro Move</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
      </Head>
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:gap-8">
            <div className="relative w-32 h-32 mx-auto md:mx-0 mb-6 md:mb-0 rounded-full overflow-hidden">
              <Image
                src={session.user.image || "/placeholder-avatar.jpg"}
                alt={session.user.name || "Profile picture"}
                fill
                className="rounded-full object-cover"
                sizes="(max-width: 768px) 128px, 128px"
                priority
              />
            </div>
            <div className="w-full text-center md:text-left">
              <div className="md:flex md:justify-between md:items-start">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    {session.user.firstName} {session.user.lastName}
                  </h1>
                  <p className="text-gray-600 mb-4 md:mb-0">{session.user.email}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="favorites" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <div className="flex justify-center">
            <TabsList className="bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="favorites" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                Favourite Houses
              </TabsTrigger>
              <TabsTrigger value="discussions" className="px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">
                My Discussions
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {activeTab === 'favorites' ? 'Favourite Houses' : 'My Discussions'}
          </h2>
          {activeTab === 'favorites' && (
            <span className="text-gray-600">
              {favorites?.length || 0} houses
            </span>
          )}
          {activeTab === 'discussions' && (
            <span className="text-gray-600">
              {userDiscussions?.length || 0} discussions
            </span>
          )}
        </div>

        {activeTab === "favorites" && (
          <div>
            {isFavoritesLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : favorites?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((property: PropertyWithOptionalFields) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property}
                    isFavorite={true}
                    onFavoriteChange={handleFavoriteChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No favourite properties yet.</p>
                <Link href="/properties" className="text-primary hover:underline mt-2 inline-block">
                  Browse Properties
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "discussions" && (
          <div>
            {isDiscussionsLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : userDiscussions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You haven't participated in any discussions yet.</p>
                <Link 
                  href="/discussion" 
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Start a discussion
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userDiscussions.map((post) => (
                  <div
                    key={post.id}
                    className="relative bg-white rounded-lg shadow-sm mb-4 flex overflow-hidden border border-gray-200"
                  >
                    <button
                      onClick={() => handleUpvote(post.id)}
                      className="flex flex-col items-center justify-center w-16 border-r bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors group cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <ArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5 mb-1 text-gray-400 group-hover:text-gray-500" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {post.upvotes}
                        </span>
                      </div>
                    </button>

                    <div className="flex-1 p-6">
                      <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-gray-800">{post.title}</h2>
                        <p className="text-gray-500 mt-2 font-medium">{post.content}</p>
                        <div className="bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-900 text-xs lowercase font-medium w-fit mt-4">
                          {post.category || 'general'}
                        </div>

                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mt-6">
                          <span className="truncate">
                            Posted by {post.author.firstName} • {formatTimeAgo(post.lastReplied)}
                          </span>

                          <div className="flex items-center gap-1 ml-2 text-black">
                            <ChatBubbleLeftIcon className="h-4 w-4 text-black" />
                            <span>{post.replyCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 