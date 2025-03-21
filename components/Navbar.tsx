import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Home, MessageCircle, Tool } from 'react-feather';
import Image from 'next/image';
import AuthModal from './AuthModal';

// Make sure you have this export
export default function Navbar() {
  const router = useRouter();
  const { locale, pathname } = router;
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Replace with your auth state
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    // Prefetch all main navigation routes
    const routes = ['/', '/discussion', '/tools', '/student-move-in-checklist'];

    routes.forEach((route) => {
      if (router.pathname !== route) {
        router.prefetch(route);
      }
    });
  }, [router]);

  const getNavLinkClass = (path: string) => {
    const isActive = pathname === path;
    return isActive
      ? 'text-black uppercase border-b-2 border-black font-medium'
      : 'text-gray-600 hover:text-black uppercase hover:border-b-2 hover:border-black';
  };

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locale = e.target.value;
    router.push(router.pathname, router.asPath, { locale });
  };

  const LanguageSelector = () => (
    <select
      onChange={changeLanguage}
      value={locale}
      className="px-2 py-2 text-2xl rounded-full border border-gray-300 bg-white text-md font-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <option value="en">🇬🇧</option>
      <option value="hi">🇮🇳</option>
      <option value="zh">🇨🇳 </option>
    </select>
  );

  const defaultAvatar =
    'https://cdn.profoto.com/cdn/053149e/contentassets/d39349344d004f9b8963df1551f24bf4/profoto-albert-watson-steve-jobs-pinned-image-original.jpg?width=1280&quality=75&format=jpg';

  return (
    <>
      {/* Top Navigation */}
      <nav className="bg-white/70 backdrop-filter backdrop-blur-lg border-b fixed top-0 w-full z-[998]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between md:justify-around">
          {/* Logo */}
          <div className="md:w-48">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-purple-600">
                LBOROMOVE
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link
              href="/"
              className={`px-1 py-2 border-b-2 font-medium ${
                pathname === '/'
                  ? 'border-purple-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              HOUSES
            </Link>
            <Link
              href="/discussion"
              className={`px-1 py-2 border-b-2 font-medium ${
                pathname === '/discussion'
                  ? 'border-purple-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              DISCUSSION
            </Link>
            <Link
              href="/tools"
              className={`px-1 py-2 border-b-2 font-medium ${
                pathname === '/tools'
                  ? 'border-purple-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              TOOLS
            </Link>
          </div>

          {/* Language Selector and Profile */}
          <div className="md:w-48 flex justify-end items-center gap-3">
            {/* Profile - Hidden on mobile */}
            <button
              onClick={() => !isAuthenticated && setShowAuthModal(true)}
              className="hidden md:block w-8 h-8 rounded-full overflow-hidden relative hover:ring-2 hover:ring-purple-500 transition-all"
            >
              <Image
                src={defaultAvatar}
                alt="Profile"
                fill
                className="object-cover"
              />
            </button>
            <select
              value={locale}
              onChange={(e) => {
                router.push(router.pathname, router.asPath, {
                  locale: e.target.value,
                });
              }}
              className="border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="en">🇬🇧 English</option>
              <option value="hi">🇮🇳 हिंदी</option>
              <option value="zh">🇨🇳 中文</option>
            </select>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Mobile Bottom Navigation */}
      <nav 
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-filter backdrop-blur-lg border-t z-[998] transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-around items-center h-[72px]">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === '/' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">HOUSES</span>
          </Link>
          <Link
            href="/discussion"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === '/discussion' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs mt-1">DISCUSSION</span>
          </Link>
          <Link
            href="/tools"
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === '/tools' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <Tool className="w-6 h-6" />
            <span className="text-xs mt-1">TOOLS</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
