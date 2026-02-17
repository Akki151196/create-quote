import { ReactNode, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Menu, User } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  showHomeButton?: boolean;
}

export function AdminLayout({ children, title, showHomeButton = false }: AdminLayoutProps) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 flex flex-col lg:ml-0">
        <header
          className="bg-gradient-to-r from-maroon-800 to-maroon-950 shadow-lg sticky top-0 z-30"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4" style={{ minHeight: '64px' }}>
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-3 lg:gap-4 ml-14 lg:ml-0">
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden lg:flex items-center justify-center text-white hover:text-maroon-200 transition-colors p-2 hover:bg-white/10 rounded-lg touch-manipulation active:scale-95"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  aria-label="Toggle sidebar"
                >
                  <Menu className="w-6 h-6" />
                </button>
                {showHomeButton && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-center text-white hover:text-maroon-200 transition-colors p-2 hover:bg-white/10 rounded-lg touch-manipulation active:scale-95"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                  >
                    <Home className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Link>
                )}
                {title && (
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{title}</h1>
                )}
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
