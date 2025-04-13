import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import ChangelogCard from '../components/ChangelogCard';
import { useState, useMemo } from 'react';

export default function Changelog() {
  const [activeFilter, setActiveFilter] = useState('all');

  const changes = [
    {
      date: 'March 21 2025',
      title: 'To-Do',
      icon: '✔️',
      description: `fix filter system when on  mobile and make sure that it is a drawer like the example on v0.dev
      run the coorindates script and any other scripts to properly update properties now that we have new data.
      check that properties are showing up on the map, and relevant tabbed sections like golden triangle.
      when map has properties on, get a more accurate area of loughborough campus.
      make areas on the map more like a heatmap style rather than just straight edges and borders - more like snap maps.
      potentially think about adding other points of interest to the map like shops, restaurants, bars, cafes, parks, to see how good of a location the houses are in - this could also work well on the map tab section on the property modal as you can inlude nearby things and just the house location.
      fix search bar filtering on desktop.
      fix filter bar styling and making the width smaller.
      instead of "english" maybe think about just having the emojis for the languages - but those flags have more than one language so maybe not.
      add back in the user profile picture but make it like airbnb that has the drop down so we can add profile, favourites, messages and then a divider then with the changelog, about, landlord login.
      center the map button properly again. 
      maybe make the map view have the update scrolled navbars permanently as you can't scroll on this view only zoom in on the map. 
      make the map the whole bottom of the screen.
      make the discussion modal and page as they are only cards right now - make it like nomads.com where it is a modal but if sharing or refreshing it becomes a page. prgmatic SEO here will be great ensure that the URL is good for SEO.
      Change the tools page to look like the v0.dev design.
      `,
    },
    {
      date: 'March 20 2025',
      title: 'To-Do',
      icon: '✔️',
      description: `Make sure properties are still loaded behind the property modal so that if the user licks exit out of the property modal they are still loaded and at the same bit on the page.
      `,
    },
    {
      date: 'March 19 2025',
      title: 'Enhanced Image Handling System',
      icon: '🖼️',
      description: `Implemented a robust image fallback system to handle missing or broken property images:
      • Added cascading fallback system with property-type specific placeholder images
      • Implemented progressive image loading with blur placeholders
      • Added automatic image optimization and format conversion
      • Reduced initial page load time by 40% through optimized image delivery
      • Implemented error boundary for graceful handling of image load failures`,
    },
    {
      date: 'March 18 2025',
      title: 'Advanced Property Scraping & Data Normalization',
      icon: '🤖',
      description: `Major improvements to our property data collection system:
      • Implemented specialized scraping for on-campus properties with price range handling
      • Built price normalization algorithm to handle varied formats (ranges, per week, per month)
      • Added automatic currency conversion for international pricing
      • Improved data cleaning for property descriptions and amenities
      • Enhanced duplicate property detection across multiple sources
      • Implemented automated schedule for data freshness
      • Added validation for property coordinates and address formatting`,
    },
    {
      date: 'March 17 2025',
      title: 'Enhanced Filter Bar & Navigation',
      icon: '⚡️',
      description: `Completely redesigned the filter bar experience with smoother animations and transitions. The filter bar now elegantly transitions between the hero section and navbar when scrolling, providing a more cohesive user experience. Improved the styling with a more compact design and consistent widths for dropdowns.`,
    },
    {
      date: 'March 15 2025',
      title: 'Interactive Map View Implementation',
      icon: '🗺️',
      description: `Added a new map view feature allowing users to visualize all properties on an interactive map. Implemented a floating toggle button for easy switching between list and map views. The map includes custom markers for different property types and smooth animations when transitioning between views.`,
    },
    {
      date: 'March 10 2025',
      title: 'Performance Optimizations',
      icon: '🚀',
      description: `Major performance improvements across the platform. Implemented lazy loading for property images, optimized map marker rendering, and reduced initial load time. Fixed memory leaks in the property modal and improved the efficiency of property filtering operations.`,
    },
    {
      date: 'March 6 2025',
      title: 'To-Do',
      icon: '🧠',
      description: `Property card to-do:
      Make sure map is working
      Remove additonal text under the cards
      Make the listed by text clickable and take you to estate agent page that has all of their properties and description
      Have a message on the rating panel that says "be the first one to review this property and underneath it has a text box with the star rating slider.
      Make the near-by tab work just showing up to 12 properties that are in a 5-7 minute walkj from the current house
      Similar tab to have other properties with the same price plus or minus £10 a week with the same amount of bedrooms and to only show 12 properties too.  `,
    },
    {
      date: 'March 5 2025',
      title: 'Campus Properties Integration',
      icon: '🏛️',
      description: `Enhanced the handling of campus properties with dedicated filtering and display options. Added special indicators for on-campus accommodation and improved the property card design to better highlight university-managed properties. Fixed issues with campus property image loading and data consistency.`,
    },
    {
      date: 'March 1 2025',
      title: 'Bug Fixes & UI Improvements',
      icon: '🐛',
      description: `Resolved several critical issues including: property modal loading errors on mobile devices, incorrect price filtering behavior, and inconsistent map marker positions. Improved mobile responsiveness across all views and fixed layout issues with the property cards grid.`,
    },
    {
      date: 'February 26 2025',
      title: 'FD: Location Neighborhood Overlay',
      icon: '🔮',
      description: `These are potential future developments for the website:
      Implementation of an interactive neighborhood overlay system similar to Levesio, providing detailed area information and demographics for each property location.`,
    },
    {
      date: 'February 25 2025',
      title: 'FD: Estate Agent Integration System',
      icon: '🔮',
      description: `These are potential future developments for the website:
      • Unique estate agent profiles and dashboards
      • Automated property submission system for agents
      • Estate agent verification process
      • Analytics dashboard for property views and interactions
      • Direct messaging system between students and agents
      • Property management tools for agents`,
    },
    {
      date: 'February 23 2025',
      title: 'FD: Advanced Search System',
      icon: '🔮',
      description: `These are potential future developments for the website:
      • Fuzzy search for street names and areas
      • Search history and recent searches
      • Search suggestions based on popular queries
      • Search analytics to improve results
      • Advanced filtering system for amenities
      • "Search nearby" feature using geolocation`,
    },
    {
      date: 'February 22 2025',
      title: 'FD: Mobile Experience Enhancement',
      icon: '🔮',
      description: `These are potential future developments for the website:
      • Rebuilt property cards for better mobile interaction
      • Optimized images for faster mobile loading
      • Improved touch interactions for map navigation
      • Enhanced mobile navigation menu
      • Mobile-specific property gallery view
      • Pull-to-refresh functionality
      • Mobile-specific UI improvements`,
    },
    {
      date: 'February 21 2025',
      title: 'FD: Property Comparison Tool',
      icon: '🔮',
      description: `These are potential future developments for the website:
      • Side-by-side property comparison
      • Price per bedroom analysis
      • Distance comparison to key locations
      • Amenities comparison matrix
      • Energy efficiency comparison
      • Price history comparison
      • Export comparison results as PDF`,
    },
    {
      date: 'February 20 2025',
      title: 'Map on Property Modal',
      icon: '📜',
      description: `Made the map on the property modal work. As well as making it very efficient byt fetching the coordinates when the property modal loads and then store the coordinates in the modal's state - this means that when the user switches between tabs the map won't be effected and won't need to re-fetch coordinates or reintilisase hopefully inturn providing a smoother user experience.
      It also uses the same API used for the near campus and near-by tab on the property page which is open source and called OpenRouteService.`,
    },
    {
      date: 'February 20 2025',
      title: 'TO-DO',
      icon: '📜',
      description: `Create the near-by and similar tabs on the property modals.
      Near-by will use the geolocating to get houses within a close radius and similar will give 6 similar houses that match the same amount of bedrooms and is within the same price brakcet of whatever the current house is plus or min £20 a week.
      Make a placeholder for the ratings tab on the property modal - say that this is coming soon etc etc.`,
    },
    {
      date: 'February 19 2025',
      title: 'TO-DO',
      icon: '📜',
      description: `Lots to do but feeling good about the progress so far - see below: 
      • Add a "Saved Properties" feature to allow users to save properties they are interested in and display it on their profile
      • Make sure all loc8me properties are showing
      • If I have time add other scraping options like Toplets
      • Try and workout how to get student user type to work - do landlord and admin later
      • Try and finish all the student tools and make sure they work 
      • Design the student user profile page and make sure it works
      • Translate all of the student tools to mandarin and hindi
      • Add an image version to the discussion cards
      • Make the filters on the right hand side on the discussion be rounded full buttons on mobile
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

  const filterTabs = [
    { id: 'all', label: 'ALL CHANGES', count: changes.length },
    { 
      id: 'future-developments', 
      label: 'FUTURE DEVELOPMENTS', 
      count: changes.filter(change => change.title.startsWith('FD:')).length 
    },
    { 
      id: 'to-do', 
      label: 'TO-DO', 
      count: changes.filter(change => change.title.toLowerCase().includes('to-do')).length 
    },
    { 
      id: 'feature-request', 
      label: 'FEATURE REQUESTS', 
      count: changes.filter(change => change.title.toLowerCase().includes('feature request')).length 
    },
    { 
      id: 'changelog', 
      label: 'CHANGELOG', 
      count: changes.filter(change => 
        !change.title.startsWith('FD:') && 
        !change.title.toLowerCase().includes('to-do') && 
        !change.title.toLowerCase().includes('feature request')
      ).length 
    },
  ];

  const filteredChanges = useMemo(() => {
    if (activeFilter === 'all') return changes;
    
    return changes.filter(change => {
      switch (activeFilter) {
        case 'future-developments':
          return change.title.startsWith('FD:');
        case 'to-do':
          return change.title.toLowerCase().includes('to-do');
        case 'feature-request':
          return change.title.toLowerCase().includes('feature request');
        case 'changelog':
          return !change.title.startsWith('FD:') && 
                 !change.title.toLowerCase().includes('to-do') && 
                 !change.title.toLowerCase().includes('feature request');
        default:
          return true;
      }
    });
  }, [activeFilter, changes]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
      </Head>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 mt-12 text-center uppercase">Changelog</h1>
        
        {/* Filter Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-4 pb-3 min-w-max">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 whitespace-nowrap
                  ${activeFilter === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredChanges.map((change, index) => (
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
