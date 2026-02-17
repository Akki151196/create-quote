import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Book, List, Package, Users, Calendar as CalendarIcon, CreditCard, Receipt, BarChart3, Settings as SettingsIcon, Menu, X, ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { path: '/admin', icon: Home, label: 'Dashboard' },
  { path: '/admin/quotations/new', icon: FileText, label: 'New Quotation' },
  { path: '/admin/menu-templates', icon: Book, label: 'Menu Templates' },
  { path: '/admin/menu-items', icon: List, label: 'Menu Items' },
  { path: '/admin/packages', icon: Package, label: 'Packages' },
  { path: '/admin/clients', icon: Users, label: 'Clients' },
  { path: '/admin/calendar', icon: CalendarIcon, label: 'Calendar' },
  { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { path: '/admin/expenses', icon: Receipt, label: 'Expenses' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/settings', icon: SettingsIcon, label: 'Settings' },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-2 left-2 z-50 w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-300 active:scale-95 touch-manipulation"
        style={{ minWidth: '48px', minHeight: '48px' }}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700 transition-transform duration-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 transition-transform duration-300" />
        )}
      </button>

      <div
        className={`lg:hidden fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          bg-white shadow-lg min-h-screen flex flex-col
          transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[70px]' : 'lg:w-64'}
          w-72
        `}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className={`border-b border-gray-200 transition-all duration-300 ${isCollapsed ? 'lg:p-3' : 'p-6'}`}>
          <Link to="/admin" className={`flex items-center transition-all duration-300 ${isCollapsed ? 'lg:justify-center lg:gap-0' : 'gap-3'}`}>
            <img
              src="/xraakgc9_img_0167-removebg-preview.png"
              alt="Royal Catering"
              className={`bg-maroon-700 rounded-full p-2 transition-all duration-300 ${isCollapsed ? 'lg:h-10 lg:w-10' : 'h-12 w-12'}`}
            />
            <div className={`transition-all duration-300 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <h2 className="font-bold text-gray-800 text-sm">Royal Catering</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </Link>
        </div>

        <div className={`border-b border-gray-200 transition-all duration-300 ${isCollapsed ? 'lg:p-2' : 'p-4'}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-maroon-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-maroon-700" />
            </div>
            <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 bg-maroon-700 text-white p-1.5 rounded-full shadow-lg hover:bg-maroon-800 transition-all duration-300 hover:scale-110 z-50"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isHovered = hoveredItem === item.path;

              return (
                <li
                  key={item.path}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center rounded-xl transition-all duration-200 touch-manipulation active:scale-95 ${
                      isCollapsed ? 'lg:justify-center lg:px-3 lg:py-3' : 'gap-3 px-4 py-3.5'
                    } ${
                      isActive
                        ? 'bg-maroon-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{ minHeight: '48px' }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200" />
                    <span className={`font-medium text-sm transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                      {item.label}
                    </span>
                  </Link>

                  {isCollapsed && isHovered && (
                    <div className="hidden lg:block absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                      <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`border-t border-gray-200 transition-all duration-300 ${isCollapsed ? 'lg:p-2' : 'p-4'}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 touch-manipulation active:scale-95 ${
              isCollapsed ? 'lg:justify-center lg:px-3 lg:py-3' : 'px-4 py-3.5'
            }`}
            style={{ minHeight: '52px' }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`font-medium text-sm ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
