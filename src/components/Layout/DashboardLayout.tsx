import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, 
  LayoutDashboard, 
  MessageSquare, 
  MessageCircle, 
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Book
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/eq-bot', icon: <MessageSquare size={20} />, label: 'EQ Bot' },
    { to: '/debate-bot', icon: <MessageCircle size={20} />, label: 'Debate Bot' },
    { to: '/quiz', icon: <Book size={20} />, label: 'CS Quizzes' },
    { to: '/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
        }`
      }
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <span className="mr-3">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BrainCircuit className="h-8 w-8 text-indigo-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-800">BrightSide</h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header and menu */}
      <div className="flex flex-col flex-1">
        <header className="bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <BrainCircuit className="h-6 w-6 text-indigo-600" />
              <h1 className="ml-2 text-lg font-bold text-gray-800">BrightSide</h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="bg-white border-b border-gray-200 py-2 px-4 space-y-1">
              {navItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-red-600 rounded-lg hover:bg-red-50"
              >
                <LogOut size={20} className="mr-3" />
                Logout
              </button>
            </div>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;