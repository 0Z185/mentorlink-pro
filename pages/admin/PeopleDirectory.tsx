import React, { useState } from 'react';
import { Search, Filter, UserCheck, UserX, Clock, Mail, Building2, ChevronRight, MoreHorizontal } from 'lucide-react';
import { User, UserRole, UserStatus } from '../../types';

interface PeopleDirectoryProps {
    users: User[];
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
}

export default function PeopleDirectory({ users, onApprove, onReject }: PeopleDirectoryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.department.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const getStatusBadge = (status: UserStatus) => {
        switch (status) {
            case UserStatus.APPROVED:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <UserCheck size={12} className="mr-1" /> Approved
                    </span>
                );
            case UserStatus.PENDING:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Clock size={12} className="mr-1" /> Pending
                    </span>
                );
            case UserStatus.REJECTED:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                        <UserX size={12} className="mr-1" /> Rejected
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">People Directory</h2>
                    <p className="text-slate-600 mt-1">Manage and view all users across the organization.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-bold active:scale-[0.98]">
                        Invite New User
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or department..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Role:</span>
                        <select
                            className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">All Roles</option>
                            <option value={UserRole.MENTOR}>Mentors</option>
                            <option value={UserRole.MENTEE}>Mentees</option>
                            <option value={UserRole.HR_ADMIN}>HR Admins</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Status:</span>
                        <select
                            className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value={UserStatus.APPROVED}>Approved</option>
                            <option value={UserStatus.PENDING}>Pending</option>
                            <option value={UserStatus.REJECTED}>Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 font-bold">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                        {user.name}
                                                        {user.user_id === '3' && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">YOU</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail size={10} /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <Building2 size={14} className="text-slate-400" />
                                                {user.department}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold uppercase tracking-tight py-1 px-2 rounded-md ${user.role === UserRole.HR_ADMIN ? 'text-indigo-600 bg-indigo-50' :
                                                    user.role === UserRole.MENTOR ? 'text-blue-600 bg-blue-50' :
                                                        'text-slate-600 bg-slate-100'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.status === UserStatus.PENDING && (
                                                    <>
                                                        <button
                                                            onClick={() => onReject?.(user.user_id)}
                                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                                            title="Reject"
                                                        >
                                                            <UserX size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => onApprove?.(user.user_id)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                                                            title="Approve"
                                                        >
                                                            <UserCheck size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        No users found matching your search and filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div>Showing {filteredUsers.length} of {users.length} users</div>
                    <div className="flex items-center gap-1">
                        Page 1 of 1
                    </div>
                </div>
            </div>
        </div>
    );
}
