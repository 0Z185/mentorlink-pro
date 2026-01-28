import React, { useState } from 'react';
import { Menu, X, LayoutDashboard, Users, BookOpen, Settings, LogOut, Briefcase } from 'lucide-react';

interface MobileNavProps {
    role: 'admin' | 'mentor' | 'mentee';
    currentTab: string;
    onNavigate: (tab: string) => void;
}

export default function MobileNav({ role, currentTab, onNavigate }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);

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
        <div className="md:hidden bg-slate-900 text-white sticky top-0 z-40 shadow-md">
            <div className="flex items-center justify-between p-4">
                <div>
                    <h1 className="text-lg font-light tracking-wide text-white">
                        Mentor<span className="font-semibold text-orange-500">Link</span>
                    </h1>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-white hover:text-orange-400 focus:outline-none"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {isOpen && (
                <nav className="border-t border-slate-800 bg-slate-900 absolute w-full left-0 shadow-xl">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => {
                            const isActive = currentTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onNavigate(item.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200
                  ${isActive
                                            ? 'bg-slate-800 text-orange-400'
                                            : 'text-slate-100 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                        <button className="w-full flex items-center px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md">
                            <LogOut className="mr-3 h-5 w-5" />
                            Sign Out
                        </button>
                    </div>
                </nav>
            )}
        </div>
    );
}
