'use client';

import { useState } from 'react';
import { Send, ChevronDown, Plus, Mail, Clock } from 'lucide-react';
import clsx from 'clsx';
import { useUser } from '@/contexts/UserContext';

interface SidebarProps {
  activeTab: 'inbox' | 'scheduled' | 'sent';
  onTabChange: (tab: 'inbox' | 'scheduled' | 'sent') => void;
  onCompose: () => void;
}

export default function Sidebar({ activeTab, onTabChange, onCompose }: SidebarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useUser();

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user?.name || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userInitials = getInitials(userName);

  const tabs = [
    { id: 'inbox' as const, label: 'Inbox', icon: Mail, count: 2 },
    { id: 'scheduled' as const, label: 'Scheduled', icon: Clock, count: 2 },
    { id: 'sent' as const, label: 'Sent', icon: Send, count: 0 },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-black">ONG</h1>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">{userInitials}</span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-gray-900 truncate">{userName}</p>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>
        {userMenuOpen && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Compose Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onCompose}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Compose
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-1 p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">TAGS</h2>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </div>
                {tab.count > 0 && (
                  <span className="bg-green-500 text-white text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

