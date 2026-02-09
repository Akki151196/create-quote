import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
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

      <div className="flex-1 flex flex-col">
        <header className="bg-gradient-to-r from-maroon-800 to-maroon-950 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {showHomeButton && (
                  <Link to="/admin" className="text-white hover:text-maroon-200 transition-colors">
                    <Home className="w-6 h-6" />
                  </Link>
                )}
                {title && (
                  <h1 className="text-2xl font-bold text-white">{title}</h1>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
