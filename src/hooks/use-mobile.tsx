import * as React from "react"

const MOBILE_BREAKPOINT = 768 // md breakpoint

export function useIsMobile() {
  // Initialize state based on the current value of matchMedia if window is available,
  // otherwise undefined (which will become false via !!isMobile for SSR)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  });

  React.useEffect(() => {
    // Ensure this effect only runs on the client
    if (typeof window === 'undefined') {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Handler to update state
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Set initial state correctly on client mount, using mql.matches.
    // This ensures consistency if the useState initializer ran when window was defined but mql wasn't immediately available,
    // or if the mql.matches state changed between useState initialization and useEffect execution.
    setIsMobile(mql.matches);

    // Add listener for future changes
    mql.addEventListener('change', onChange);

    // Cleanup listener on unmount
    return () => mql.removeEventListener('change', onChange);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  return !!isMobile;
}
