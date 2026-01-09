'use client';

import { useEffect, useState } from 'react';
import { adminApi, User, Pagination } from '@/lib/api';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadUsers(page);
    }, [page]);

    const loadUsers = async (p: number) => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers(p);
            setUsers(res.data.users);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (id: string, newRole: string) => {
        try {
            await adminApi.updateUser(id, { role: newRole });
            setUsers(users.map(u => u.id === id ? { ...u, role: newRole as any } : u));
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update role');
        }
    };

    const handleStatusChange = async (id: string, isActive: boolean) => {
        try {
            await adminApi.updateUser(id, { isActive });
            setUsers(users.map(u => u.id === id ? { ...u, isActive } : u));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Add User
                    </button>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Export
                    </button>
                </div>
            </div>

            <div className="bg-[#1E293B]/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users found</td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {user.firstName[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{user.firstName} {user.lastName}</div>
                                                    <div className="text-xs text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                                            >
                                                <option value="client">Client</option>
                                                <option value="doctor">Doctor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleStatusChange(user.id, !user.isActive)}
                                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    user.isActive 
                                                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                }`}
                                            >
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-white transition-colors">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                        <span className="text-sm text-slate-400">
                            Showing page {pagination.page} of {pagination.pages}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-slate-700"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={pagination.page === pagination.pages}
                                className="px-3 py-1 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-slate-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
