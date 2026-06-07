import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Receipt, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMPANY_DETAILS } from '@/lib/constants';
import { useStore } from '@/store/useStore';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Outstanding Payments', href: '/outstanding-payments', icon: AlertCircle },
  { name: 'Receipts', href: '/receipts', icon: Receipt },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { loadData } = useStore();

  useEffect(() => {
    loadData();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <img 
                src={COMPANY_DETAILS.logo} 
                alt="Company Logo" 
                className="h-12 w-auto object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <h1 className="text-xl font-bold text-primary-600">AI Bridge Solutions</h1>
            <p className="text-sm text-gray-600 mt-1">Invoice Management</p>
          </div>
          <nav className="mt-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center px-6 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="mr-3" size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>
        
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
