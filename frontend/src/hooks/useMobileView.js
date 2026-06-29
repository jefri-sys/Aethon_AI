import { useState, useEffect } from 'react';

export default function useMobileView() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    
    // Set initial value
    setIsMobile(mediaQuery.matches);
    
    // Listener function
    const handleMediaQueryChange = (e) => {
      setIsMobile(e.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, []);

  return isMobile;
}
