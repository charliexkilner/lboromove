import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Navbar from '../components/Navbar';
import ChangelogCard from '../components/ChangelogCard';

export default function Changelog() {
  const changes = [
    {
      date: 'February 19 2025',
      title: 'TO-DO',
      icon: '📜',
      description: `Lots to do but feeling good about the progress so far - see below: 
      • Add a "Saved Properties" feature to allow users to save properties they are interested in and display it on their profile
      • Make sure all loc8me properties are showing
      • If I have time add other scraping options like Toplets
      • Try and workout how to get student user type to work - do landlord and admin later
      • Try and finish all the student tools and make sure they work 
      • Design the student user profile page and make sure it works
      • Translate all of the student tools to mandarin and hindi
      • Add an image version to the discussion cards
      • Make the filters on the right hand side on the discussion be rounded full buttons on mobile
      • Make the padding below the filter button less and make the padding above the title bigger`,
    },
    {
      date: 'February 18 2025',
      title: 'Feature Request: Flatmate Finder',
      icon: '🏡',
      description: `As seen on LSU discussion board people are looking for "rather than just putting random people with other random people, a profile could help students find friends easier as they'll have more in common. University of Sheffield do this really well. It enables students to choose their flat based on the personalities of others already in the flat"
      "It is also not just morning / night owl type things on the profile"
      Based on this I will be implementing a flatemate finder on the discussion page of the website and there will be infiormation about that person on their profile. I was also thinking that similar to LinkedIn when they can change your profile to "looking for work" maybe student's profiles can be public if searching for flatmates although it just shows basic information about them not their favourites etc that only they can see.`,
    },
    {
      date: 'February 18 2025',
      title: 'Feature Request: Walk Score',
      icon: '🚶‍♂️',
      description: `Implement a walk score on properties that rank how easy it is to walk to campus and to walk to town - see similiar version on Zillow for inspiration.`,
    },
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
