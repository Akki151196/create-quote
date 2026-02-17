import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Users, BarChart3, Calendar } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: Home, label: 'Dashboard' },
  { path: '/admin/quotations/new', icon: FileText, label: 'Quote' },
  { path: '/admin/clients', icon: Users, label: 'Clients' },
  { path: '/admin/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Reports' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="flex items-center justify-around" style={{ minHeight: '60px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/admin/quotations/new' && location.pathname.includes('/admin/quotations'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full touch-manipulation active:scale-95 transition-all duration-200 relative ${
                isActive
                  ? 'text-maroon-800'
                  : 'text-gray-500 active:text-gray-700'
              }`}
              style={{ minHeight: '56px', minWidth: '60px' }}
            >
              <div className={`flex flex-col items-center gap-1 ${isActive ? 'transform scale-105' : ''}`}>
                <Icon
                  className={`w-6 h-6 transition-all duration-200 ${isActive ? 'text-maroon-700' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </div>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-maroon-700 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
