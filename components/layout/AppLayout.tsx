import React from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

interface LayoutProps {
    children: React.ReactNode;
    role?: 'admin' | 'mentor' | 'mentee';
    activeTab: string;
    onTabChange: (tab: string) => void;
    onSignOut?: () => void;
}

export default function AppLayout({ children, role = 'admin', activeTab, onTabChange, onSignOut }: LayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navigation */}
            <Sidebar role={role} currentTab={activeTab} onNavigate={onTabChange} onSignOut={onSignOut} />
            <MobileNav role={role} currentTab={activeTab} onNavigate={onTabChange} />

            {/* Main Content Area */}
            <main className="md:ml-64 min-h-screen transition-all duration-300 ease-in-out">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
