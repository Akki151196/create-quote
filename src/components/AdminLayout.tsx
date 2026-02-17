import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, Menu, User } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  showHomeButton?: boolean;
}

export function AdminLayout({ children, title, showHomeButton = false }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  const openMobileSidebar = useCallback(() => {
    const event = new CustomEvent('toggleMobileSidebar');
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header
          className="bg-gradient-to-r from-maroon-800 to-maroon-900 flex-shrink-0 z-30 shadow-md"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between px-4 lg:px-6 h-14">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={openMobileSidebar}
                className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors touch-manipulation active:scale-95"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center w-11 h-11 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              {showHomeButton && (
                <Link
                  to="/admin"
                  className="flex items-center justify-center w-11 h-11 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors touch-manipulation active:scale-95"
                >
                  <Home className="w-5 h-5" />
                </Link>
              )}
              {title && (
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate ml-1">{title}</h1>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 lg:pb-8"
          style={{ paddingBottom: 'max(calc(70px + env(safe-area-inset-bottom)), 80px)' }}
        >
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
