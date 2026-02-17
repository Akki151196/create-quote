import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  showHomeButton?: boolean;
}

export function AdminLayout({ children, title, showHomeButton = false }: AdminLayoutProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="bg-gradient-to-r from-maroon-800 to-maroon-950 shadow-lg sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 lg:gap-4 ml-14 lg:ml-0">
                {showHomeButton && (
                  <Link to="/admin" className="text-white hover:text-maroon-200 transition-colors">
                    <Home className="w-5 h-5 lg:w-6 lg:h-6" />
                  </Link>
                )}
                {title && (
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{title}</h1>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
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
