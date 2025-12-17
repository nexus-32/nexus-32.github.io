import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);
  const [layoutOverride, setLayoutOverride] = React.useState<'auto' | 'mobile' | 'desktop'>('auto');

  React.useEffect(() => {
    const readOverride = () => {
      try {
        const v = window.localStorage.getItem('mw_forceLayout');
        if (v === 'mobile' || v === 'desktop' || v === 'auto') return v;
      } catch {
        // ignore
      }
      return 'auto' as const;
    };

    setLayoutOverride(readOverride());

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    const onSettingsChanged = () => {
      setLayoutOverride(readOverride());
    };
    window.addEventListener('mw-settings-changed', onSettingsChanged);

    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener('mw-settings-changed', onSettingsChanged);
    };
  }, []);

  if (layoutOverride === 'mobile') return true;
  if (layoutOverride === 'desktop') return false;

  return !!isMobile;
}
