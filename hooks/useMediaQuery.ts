import { useState, useEffect } from 'react';

/**
 * Custom hook to check if a media query matches
 * @param query The media query to check (e.g. '(max-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
const useMediaQuery = (query: string): boolean => {
  // Initialize with false for SSR - will be updated on client
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create the media query list
    const media = window.matchMedia(query);
    
    // Set the initial value
    setMatches(media.matches);

    // Define the callback for media query changes
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add the event listener
    media.addEventListener('change', handleChange);

    // Clean up the listener when the component unmounts
    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, [query]); // Re-run when query changes

  return matches;
};

export { useMediaQuery }; 