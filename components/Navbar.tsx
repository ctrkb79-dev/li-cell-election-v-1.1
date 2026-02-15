import React, { useState, useEffect } from 'react';
import { LayoutList, PenTool, Map, Trophy, LayoutDashboard, RefreshCw, Maximize, Minimize, Moon, Sun, Shield } from 'lucide-react';

interface NavbarProps {
  view: string;
  setView: (view: 'dashboard' | 'entry' | 'results' | 'summary' | 'map' | 'winners' | 'admin') => void;
  onReload?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ view, setView, onReload }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize dark mode
  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const handleRefresh = () => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  // Menu Configuration - Can be filtered by permissions later
  const menuItems = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={16} />, permission: 'view_menu_dashboard' },
    { id: 'entry', label: 'এন্ট্রি', icon: <PenTool size={16} />, permission: 'view_menu_entry' },
    { id: 'results', label: 'ফলাফল', icon: <LayoutList size={16} />, permission: 'view_menu_results' },
    { id: 'winners', label: 'বিজয়ী', icon: <Trophy size={16} />, permission: 'view_menu_winners' },
    { id: 'map', label: 'মানচিত্র', icon: <Map size={16} />, permission: 'view_menu_map' },
    { id: 'admin', label: 'এডমিন', icon: <Shield size={16} />, permission: 'view_menu_admin' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm border-b dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center py-3 gap-3 md:gap-0">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-green-600/30">
                  E
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
                  নির্বাচনী ফলাফল
                </h1>
              </div>

              {/* Utility Buttons */}
              <div className="flex items-center gap-1 border-l pl-4 border-gray-200 dark:border-slate-600">
                <button 
                  onClick={handleRefresh}
                  className="p-2 text-gray-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all"
                  title="রিলোড"
                >
                  <RefreshCw size={18} />
                </button>
                
                <button 
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all"
                  title={isFullscreen ? "ছোট পর্দা" : "ফুল স্ক্রিন"}
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>

                <button 
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all"
                  title={isDark ? "লাইট মোড" : "ডার্ক মোড"}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
            
            <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg overflow-x-auto no-scrollbar w-full md:w-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex-1 md:flex-none justify-center ${
                    view === item.id 
                      ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                      : 'text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default Navbar;