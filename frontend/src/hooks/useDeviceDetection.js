import { useState, useEffect } from 'react';

const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    screenWidth: 0,
    screenHeight: 0,
    userAgent: '',
    browser: '',
    os: '',
    deviceType: 'desktop'
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Mobile device detection
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent);
      
      // More specific mobile detection
      const isAndroid = /Android/i.test(userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
      const isIPhone = /iPhone/i.test(userAgent);
      const isIPad = /iPad/i.test(userAgent);
      
      // Screen size based detection
      const isMobileScreen = screenWidth <= 768;
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
      const isDesktopScreen = screenWidth > 1024;
      
      // Touch device detection
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Browser detection
      let browser = 'Unknown';
      if (/Chrome/i.test(userAgent) && !/Edg|OPR/i.test(userAgent)) {
        browser = 'Chrome';
      } else if (/Firefox/i.test(userAgent)) {
        browser = 'Firefox';
      } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
        browser = 'Safari';
      } else if (/Edg/i.test(userAgent)) {
        browser = 'Edge';
      } else if (/OPR/i.test(userAgent)) {
        browser = 'Opera';
      }
      
      // OS detection
      let os = 'Unknown';
      if (/Windows/i.test(userAgent)) {
        os = 'Windows';
      } else if (/Mac/i.test(userAgent)) {
        os = 'macOS';
      } else if (/Linux/i.test(userAgent)) {
        os = 'Linux';
      } else if (/Android/i.test(userAgent)) {
        os = 'Android';
      } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        os = 'iOS';
      }
      
      // Determine final device type
      let deviceType = 'desktop';
      let isMobile = false;
      let isTablet = false;
      let isDesktop = false;
      
      if (isMobileDevice || (isMobileScreen && isTouchDevice)) {
        if (isIPad || (isTabletScreen && isTouchDevice)) {
          deviceType = 'tablet';
          isTablet = true;
        } else {
          deviceType = 'mobile';
          isMobile = true;
        }
      } else {
        deviceType = 'desktop';
        isDesktop = true;
      }
      
      // Override for specific cases
      if (isIPad) {
        deviceType = 'tablet';
        isMobile = false;
        isTablet = true;
        isDesktop = false;
      }
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth,
        screenHeight,
        userAgent,
        browser,
        os,
        deviceType,
        isAndroid,
        isIOS,
        isIPhone,
        isIPad
      });
    };

    // Initial detection
    detectDevice();

    // Re-detect on window resize
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);
    
    // Re-detect on orientation change (mobile)
    const handleOrientationChange = () => {
      setTimeout(detectDevice, 100); // Small delay for orientation change
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
};

export default useDeviceDetection;