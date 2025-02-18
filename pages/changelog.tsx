import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Navbar from '../components/Navbar';
import ChangelogCard from '../components/ChangelogCard';

export default function Changelog() {
  const changes = [
    {
      date: 'February 11 2025',
      title: 'Multi-language Support & UI Improvements',
      icon: '🌍',
      description: `Recent Updates & Improvements:
      • Added multi-language support for Hindi and Mandarin
      • Updated tab system styling with improved spacing
      • Made tab titles uppercase with proper spacing
      • Removed 'Large Kitchen' and 'Garden' filter tabs
      • Fixed text overlap issues in tab navigation
      • Added right padding to last tab for better visibility
      • Improved hero section text sizing and spacing
      • Fixed filter button positioning under hero text
      • Updated translations for all UI elements
      • Improved mobile responsiveness of property cards
      • Added property count display on active tabs
      
      Known Issues:
      • Property cards occasionally become unclickable
      • Translation system sometimes falls back to English
      • Tab scrolling can be jumpy on mobile devices
      • Property modal images sometimes fail to load
      • Filter system occasionally resets unexpectedly
      • ENOSPC errors during development
      • Property card layout breaks on certain screens`,
    },
    {
      date: 'Jan 30th 2025',
      title: 'Major Updates, New Features, and Bugs Solved',
      icon: '🐛',
      description: `Recent Updates & Improvements:
      
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
      title: 'Initial Release',
      icon: '🚀',
      description: `Launch of LboroMove's Changelog:
      
      Core Features:
      • Property listings with detailed information and images
      • Multi-language support (English, Chinese, Hindi)
      • Responsive design for all devices
      • Real-time currency conversion for international students
      
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
      • Golden Triangle properties
      • Great Value properties (under £130/week)
      • Solo Living options (1 bedroom properties)
      • Additional category tabs for future filters`,
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
