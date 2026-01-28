import React from 'react';
import { Users, Briefcase, TrendingUp, AlertCircle, Plus, Filter, Download } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h2 className="text-2xl font-light text-slate-900">Program Overview</h2>
                    <p className="text-slate-600 mt-1">Governance and oversight for active mentorship cohorts</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center px-4 py-2 border border-brand-blue-300 rounded-md text-blue-600 hover:bg-slate-50 bg-white transition-colors text-sm font-medium">
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </button>
                    <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors shadow-sm text-sm font-medium">
                        <Plus className="w-4 h-4 mr-2" />
                        New Program
                    </button>
                </div>
            </div>

            {/* Summary Band */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">Active Programs</p>
                        <h3 className="text-3xl font-light text-slate-900 mt-2">3</h3>
                        <p className="text-xs text-slate-600 mt-1">Total Mentorship Cohorts</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-full">
                        <Briefcase className="w-6 h-6 text-slate-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">Total Participants</p>
                        <h3 className="text-3xl font-light text-slate-900 mt-2">142</h3>
                        <p className="text-xs text-green-600 mt-1 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +12% vs last month
                        </p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-full">
                        <Users className="w-6 h-6 text-orange-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">Session Completion</p>
                        <h3 className="text-3xl font-light text-slate-900 mt-2">87%</h3>
                        <p className="text-xs text-slate-600 mt-1">On track for Q1 Goals</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">Pending Issues</p>
                        <h3 className="text-3xl font-light text-slate-900 mt-2">5</h3>
                        <p className="text-xs text-red-500 mt-1">Requires Attention</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Main Content Area - Table First Layout */}
            <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-brand-blue-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-medium text-slate-900">Active Cohorts</h3>
                    <div className="flex gap-2">
                        <button className="flex items-center px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </button>
                        <input
                            type="text"
                            placeholder="Search programs..."
                            className="px-4 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-600"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Program Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Duration</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Participants</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Health</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">Global Leadership 2024</div>
                                    <div className="text-xs text-slate-600 sm:hidden">12 Months • 64 Users</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">Jan 2024 - Dec 2024</td>
                                <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">64</td>
                                <td className="px-6 py-4">
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[100px]">
                                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1 inline-block">85% engagement</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-600 hover:text-orange-600 text-sm font-medium transition-colors">Manage</button>
                                </td>
                            </tr>

                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">Q2 Engineering Mentors</div>
                                    <div className="text-xs text-slate-600 sm:hidden">6 Months • 28 Users</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Warning
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">Sep 2024 - Mar 2025</td>
                                <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">28</td>
                                <td className="px-6 py-4">
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[100px]">
                                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1 inline-block">60% engagement</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-600 hover:text-orange-600 text-sm font-medium transition-colors">Manage</button>
                                </td>
                            </tr>

                            <tr className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">New Grad Onboarding</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                        Draft
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">TBD</td>
                                <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">-</td>
                                <td className="px-6 py-4 text-sm text-slate-400">
                                    Not started
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-600 hover:text-orange-600 text-sm font-medium transition-colors">Edit</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
