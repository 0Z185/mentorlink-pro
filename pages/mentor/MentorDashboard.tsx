import React from 'react';
import { Users, Calendar, Clock, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

export default function MentorDashboard() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Welcome / Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-2xl font-light text-slate-900">Mentor Workspace</h2>
                    <p className="text-slate-600 mt-1">Focus on your mentees' growth and upcoming sessions.</p>
                </div>
                <div>
                    <button className="px-5 py-2.5 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm">
                        Log Session Notes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Column: Mentees & Sessions */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Upcoming Sessions Card */}
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="font-medium text-slate-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                Upcoming Sessions
                            </h3>
                            <button className="text-xs font-medium text-slate-600 hover:text-orange-600">View Calendar</button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {[1, 2].map((i) => (
                                <div key={i} className="p-6 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-50 text-blue-700 flex flex-col items-center justify-center text-center border border-slate-100 flex-shrink-0">
                                        <span className="text-[10px] font-bold uppercase leading-none">Feb</span>
                                        <span className="text-lg font-bold leading-none mt-1">{10 + i}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-slate-900 font-medium text-sm">Career Pathing Review</h4>
                                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> 10:00 AM - 11:00 AM
                                            <span className="w-1 h-1 bg-blue-50 rounded-full"></span>
                                            with Sarah Jenkins
                                        </p>
                                    </div>
                                    <button className="px-3 py-1.5 border border-brand-blue-200 rounded text-xs font-medium text-slate-600 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-colors">
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Mentees */}
                    <div>
                        <h3 className="text-lg font-light text-slate-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-600" />
                            Your Mentees
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: "Sarah Jenkins", role: "Junior Developer", progress: 65 },
                                { name: "Michael Chen", role: "Product Associate", progress: 30 }
                            ].map((mentee, i) => (
                                <div key={i} className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm hover:border-orange-200 transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                            {mentee.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-900 group-hover:text-orange-700 transition-colors">{mentee.name}</h4>
                                            <p className="text-xs text-slate-600">{mentee.role}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-slate-600">
                                            <span>Goal Progress</span>
                                            <span className="font-medium text-slate-600">{mentee.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                            <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${mentee.progress}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                                        <button className="text-xs font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1">
                                            View Profile <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Sidebar Column: Resources & Tasks */}
                <div className="space-y-6">

                    {/* Action Required */}
                    <div className="bg-white p-5 rounded-lg border border-orange-100 shadow-sm">
                        <h3 className="text-sm font-medium text-orange-800 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Action Required
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3 items-start p-3 bg-brand-orange-50/50 rounded-md">
                                <div className="mt-0.5 w-2 h-2 rounded-full bg-orange-400 shrink-0"></div>
                                <div>
                                    <p className="text-xs font-medium text-slate-900">Approve Goal: "Learn Typescript"</p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">Submitted by Sarah J. 2 days ago</p>
                                    <button className="mt-2 text-xs text-orange-700 font-medium hover:underline">Review Goal</button>
                                </div>
                            </li>
                            <li className="flex gap-3 items-start p-3 bg-brand-orange-50/50 rounded-md">
                                <div className="mt-0.5 w-2 h-2 rounded-full bg-orange-400 shrink-0"></div>
                                <div>
                                    <p className="text-xs font-medium text-slate-900">Complete Session Feedback</p>
                                    <p className="text-[10px] text-blue-600 mt-0.5">Session held on Jan 24</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Mentor Guides
                        </h3>
                        <ul className="space-y-2">
                            {['Effective Goal Setting', 'Constructive Feedback', 'The First 90 Days'].map(topic => (
                                <li key={topic}>
                                    <a href="#" className="block px-3 py-2 rounded text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                                        {topic}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    );
}
