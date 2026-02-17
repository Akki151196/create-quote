import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Users, BarChart3, Calendar } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: Home, label: 'Home' },
  { path: '/admin/quotations/new', icon: FileText, label: 'Quote' },
  { path: '/admin/clients', icon: Users, label: 'Clients' },
  { path: '/admin/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Reports' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 4px)' }}
    >
      <div className="flex items-stretch justify-around" style={{ height: '56px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/admin/quotations/new' && location.pathname.includes('/admin/quotations'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 relative touch-manipulation active:bg-gray-50 transition-colors ${
                isActive ? 'text-maroon-700' : 'text-gray-400'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-maroon-700 rounded-full" />
              )}
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className={`text-[10px] mt-0.5 leading-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
