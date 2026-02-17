import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Book, List, Package, Users, Calendar as CalendarIcon, CreditCard, Receipt, BarChart3, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

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

export function Sidebar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white shadow-lg min-h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-200">
          <Link to="/admin" className="flex items-center gap-3">
            <img
              src="/xraakgc9_img_0167-removebg-preview.png"
              alt="Royal Catering"
              className="h-12 w-12 bg-maroon-700 rounded-full p-2"
            />
            <div>
              <h2 className="font-bold text-gray-800 text-sm">Royal Catering</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-maroon-700 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
