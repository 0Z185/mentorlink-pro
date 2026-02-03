import React from 'react';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Briefcase } from 'lucide-react';

interface SidebarProps {
    role: 'admin' | 'mentor' | 'mentee';
    currentTab: string;
    onNavigate: (tab: string) => void;
    onSignOut?: () => void;
}

export default function Sidebar({ role, currentTab, onNavigate, onSignOut }: SidebarProps) {
    const getNavItems = () => {
        switch (role) {
            case 'admin':
                return [
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                    { id: 'programs', icon: Briefcase, label: 'Programs' },
                    { id: 'people', icon: Users, label: 'People' },
                    { id: 'reports', icon: BookOpen, label: 'Reports' },
                    { id: 'settings', icon: Settings, label: 'Settings' },
                ];
            case 'mentor':
                return [
                    { id: 'dashboard', icon: Users, label: 'My Mentees' },
                    { id: 'sessions', icon: BookOpen, label: 'Sessions' },
                ];
            case 'mentee':
                return [
                    { id: 'dashboard', icon: LayoutDashboard, label: 'My Growth' },
                    { id: 'sessions', icon: BookOpen, label: 'Sessions' },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    return (
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 z-30 shadow-xl">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-light tracking-wide text-white">
                    Mentor<span className="font-semibold text-orange-500">Link</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                    {role === 'admin' ? 'Governance' : role} Portal
                </p>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = currentTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 group
                  ${isActive
                                    ? 'bg-slate-800 text-orange-400 border-l-4 border-orange-500'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={onSignOut}
                    className="w-full flex items-center px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
