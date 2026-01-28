import React from 'react';
import { Target, Calendar, MessageSquare, Star, ArrowUpRight } from 'lucide-react';

export default function MenteeDashboard() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="border-b border-slate-100 pb-6">
                <h2 className="text-2xl font-light text-slate-900">My Growth Journey</h2>
                <p className="text-slate-600 mt-1">Track your progress and precise next steps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Mentor Card */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4">Current Mentor</h3>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-white shadow-sm mb-3">
                                {/* Placeholder Avatar */}
                                <div className="w-full h-full rounded-full bg-blue-200 flex items-center justify-center text-slate-600 font-bold text-xl">
                                    A
                                </div>
                            </div>
                            <h4 className="text-lg font-medium text-slate-900">Alex Rivera</h4>
                            <p className="text-sm text-slate-600 mb-4">Senior Engineering Manager</p>

                            <div className="flex gap-2 w-full">
                                <button className="flex-1 py-2 text-xs font-medium text-blue-700 bg-slate-50 rounded hover:bg-blue-50 transition-colors">
                                    Profile
                                </button>
                                <button className="flex-1 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                                    Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Goals */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-lg border border-slate-100 shadow-sm h-full">
                        <div className="px-6 py-4 border-b border-brand-blue-50 flex justify-between items-center">
                            <h3 className="font-medium text-slate-900 flex items-center gap-2">
                                <Target className="w-4 h-4 text-orange-500" />
                                Active Goals
                            </h3>
                            <button className="p-1 text-slate-600 hover:text-slate-600">
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-sm font-medium text-slate-900">Master React Design Patterns</h5>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] uppercase font-bold rounded-full">In Progress</span>
                                </div>
                                <p className="text-xs text-slate-600 mb-3">Complete the advanced capability module and review with mentor.</p>
                                <div className="w-full bg-white rounded-full h-1.5 border border-slate-100">
                                    <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-sm font-medium text-slate-900">Prepare for Q2 Promotion Cycle</h5>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] uppercase font-bold rounded-full">Not Started</span>
                                </div>
                                <p className="text-xs text-slate-600 mb-3">Gather peer feedback and update career document.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Next Steps / Schedule */}
            <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-orange-50 rounded-full flex items-center justify-center text-orange-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-light text-slate-900">Next Session: Feb 12</h4>
                        <p className="text-sm text-slate-600">10:00 AM • Monthly Check-in</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded transition-colors">Reschedule</button>
                    <button className="px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors shadow-sm">Prepare Agenda</button>
                </div>
            </div>
        </div>
    );
}
