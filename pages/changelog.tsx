import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Navbar from '../components/Navbar';
import ChangelogCard from '../components/ChangelogCard';

export default function Changelog() {
  const changes = [
    {
      date: 'Jan 30th 2025',
      title: 'Major Updates, New Features, and Bugs Solved',
      icon: '🐛',
      description: `Recent Updates & Improvements
Property System:
• Improved URL structure for better SEO (/house/street-name-loughborough-id)
• Fixed property modal loading and caching issues
• Added proper image navigation dots on desktop view
• Implemented better loading states and error handling
• Fixed hydration errors in property pages
• Added proper TypeScript types throughout the application

New Tools & Features:
• Added Room Allocator Tool
  - Interactive spinning wheel for fair room allocation
  - Supports multiple housemates and rooms
  - Animated results with confetti effect
  - Mobile responsive design

• Created Student Move-In Checklist
  - Comprehensive guide for student moving
  - Categorized sections (Documents, Kitchen, Bathroom, etc.)
  - Mobile-friendly layout
  - SEO optimized content

Technical Improvements:
• Implemented React Query for better data fetching
• Fixed multiple TypeScript type errors
• Improved mobile responsiveness across all pages
• Enhanced error handling and loading states
• Added proper cache control headers
• Fixed navigation and routing issues

Next Up:
• User accounts implementation
• Additional student tools
• Estate agent portal development
• Property description AI generation
• Saved properties feature`,
    },
    {
      date: 'January 27 2024',
      title: 'TO-DO',
      icon: '✅',
      description: `Today:
      - User accounts
      - Make student tools - initial tools
      - Start scraping other student house websites
      - Add a helpful student blog to the tools that can also be used for SEO
      - Rough plan for using AI to gerneate uniform descriptions for properties
      - Workout MVP features for the estate agent side of the website
      - Design the MVP for the estate agent side of the website
      - Design user account page and what it looks like when saving properties - be sure to include saved properties and then a collection of maximum 20 properties that have been recently viewed.
      - Update the property cards so that when you click off them or the X it doesn't load the page againa nd saves where you are on the page as if you are 100 properties down into your search you don't want to have to start again`,
    },
    {
      date: 'January 27 2024',
      title: 'Initial Release',
      icon: '🚀',
      description: `Launch of LboroMove's Changelog:

Core Features:
• Property listings with detailed information and images
• Multi-language support (English, Chinese, Hindi)
• Responsive design for all devices
• Real-time currency conversion for international students (on property pages)

Property Features:
• Property cards with image galleries and key information
• Price, bedroom, and bathroom information
• Distance to town and campus
• Property amenities display
• Like and copy link of properties to share with friends

Search & Filter:
• Smart filtering system by:
  - Number of bedrooms
  - Number of bathrooms
  - Price range
  - Property type

Location Categories:
• All Houses view
• Golden Triangle properties (filtered by specific streets)
• Great Value properties (under £130/week)
• Solo Living options (1 bedroom properties)
• Additional category tabs for future filters

Today's Updates:
• Added Golden Triangle street filtering
• Implemented Solo Living property filtering
• Added Great Value properties section
• Enhanced property count display for each category
• Improved property card layout and information display`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 mt-12">Changelog</h1>
        <div className="space-y-6">
          {changes.map((change, index) => (
            <ChangelogCard
              key={index}
              date={change.date}
              title={change.title}
              description={change.description}
              icon={change.icon}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
