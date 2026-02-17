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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/admin/quotations/new' && location.pathname.includes('/admin/quotations'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] transition-all duration-200 ${
                isActive
                  ? 'text-red-900'
                  : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-red-900 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
