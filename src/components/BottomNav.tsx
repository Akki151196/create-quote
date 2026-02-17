import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Users, BarChart3 } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: Home, label: 'Dashboard' },
  { path: '/admin/quotations/new', icon: FileText, label: 'Quotation' },
  { path: '/admin/clients', icon: Users, label: 'Clients' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'text-maroon-700 bg-maroon-50'
                  : 'text-gray-600 hover:text-maroon-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-maroon-700' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
