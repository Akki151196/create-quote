import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Book, List, Package, Users, Calendar as CalendarIcon, CreditCard, Receipt, BarChart3, Settings as SettingsIcon, X, ChevronLeft, ChevronRight, LogOut, User, UtensilsCrossed } from 'lucide-react';
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

  useEffect(() => {
    const handler = () => setIsMobileMenuOpen(prev => !prev);
    window.addEventListener('toggleMobileSidebar', handler);
    return () => window.removeEventListener('toggleMobileSidebar', handler);
  }, []);

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
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-white shadow-2xl lg:shadow-lg min-h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-[70px]' : 'lg:w-64'}
          w-[280px]
        `}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 lg:py-5">
          <Link
            to="/admin"
            className={`flex items-center gap-3 transition-all duration-300 min-w-0 ${isCollapsed ? 'lg:justify-center lg:w-full lg:gap-0' : ''}`}
          >
            <div
              className="flex-shrink-0 bg-maroon-700 rounded-xl flex items-center justify-center"
              style={{ width: '36px', height: '36px', minWidth: '36px' }}
            >
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div className={`${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <h2 className="font-bold text-gray-900 text-sm leading-tight">Royal Catering</h2>
              <p className="text-[11px] text-gray-400">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors touch-manipulation active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`border-b border-gray-100 px-4 py-3 ${isCollapsed ? 'lg:px-2 lg:py-2' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-maroon-50 flex items-center justify-center flex-shrink-0 ring-2 ring-maroon-100">
              <User className="w-4 h-4 text-maroon-700" />
            </div>
            <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <p className="text-sm font-semibold text-gray-900 truncate">Admin</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-[72px] bg-maroon-700 text-white p-1.5 rounded-full shadow-lg hover:bg-maroon-800 transition-all duration-300 hover:scale-110 z-50"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <ul className="space-y-0.5">
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
                    className={`flex items-center rounded-lg transition-all duration-150 touch-manipulation active:scale-[0.97] ${
                      isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'gap-3 px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-maroon-700 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? '' : ''}`} />
                    <span className={`font-medium text-[13px] whitespace-nowrap ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                      {item.label}
                    </span>
                  </Link>

                  {isCollapsed && isHovered && (
                    <div className="hidden lg:block absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
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

        <div className={`border-t border-gray-100 px-3 py-3 ${isCollapsed ? 'lg:px-2' : ''}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-150 touch-manipulation active:scale-[0.97] ${
              isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-3 py-2.5'
            }`}
            style={{ minHeight: '48px' }}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span className={`font-medium text-[13px] ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
