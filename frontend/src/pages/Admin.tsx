import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { apiClient } from '../services/apiClient';
import { type User, type SystemStats } from '../types/pagesTypes';
import Button from '../components/ui/Button';
import Navigation from '../components/Navigation';

export default function Admin() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleError, handleSuccess, handleWarning } = useError();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<SystemStats>({
        totalUsers: 0,
        adminUsers: 0,
        regularUsers: 0,
        totalImages: 0,
        totalGenerations: 0,
        totalCost: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const usersData = await apiClient.getAllUsers() as any;
            setUsers(usersData.users || []);
            
            // Calculate stats
            const allUsers = usersData.users || [];
            setStats({
                totalUsers: allUsers.length,
                // @ts-ignore
                adminUsers: allUsers.filter(u => u.role === 'admin').length,
                // @ts-ignore
                regularUsers: allUsers.filter(u => u.role === 'user').length,
                totalImages: 0, // We'd need a backend endpoint for this
                totalGenerations: 0, // We'd need a backend endpoint for this
                totalCost: 0, // We'd need a backend endpoint for this
            });
        } catch (error) {
            handleError(error, 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setActionLoading(userId);
        try {
            await apiClient.updateUserRole(userId, newRole);
            handleSuccess(`User role updated to ${newRole}`);
            await loadData(); // Refresh data
        } catch (error) {
            handleError(error, 'Failed to update user role');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!window.confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
            return;
        }

        setActionLoading(userId);
        try {
            await apiClient.deleteUser(userId);
            handleSuccess('User deleted successfully');
            await loadData(); // Refresh data
        } catch (error) {
            handleError(error, 'Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-custom-bg text-white flex items-center justify-center">
                <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-stone-700 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/60">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-custom-bg text-white">
        <Navigation />
        
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-white/60 mt-1">System administration and user management</p>
            </div>
            <div className="flex gap-3">
                <Button 
                onClick={loadData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500"
                >
                Refresh Data
                </Button>
                <Button 
                onClick={() => navigate('/')}
                className="bg-transparent border border-white/20 hover:bg-white/10"
                >
                Back to Dashboard
                </Button>
            </div>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-darkblue rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <div className="text-sm text-white/70">Total Users</div>
            </div>
            
            <div className="bg-darkblue rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold">{stats.adminUsers}</div>
                <div className="text-sm text-white/70">Admin Users</div>
            </div>
            
            <div className="bg-darkblue rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold">{stats.regularUsers}</div>
                <div className="text-sm text-white/70">Regular Users</div>
            </div>
            
            <div className="bg-darkblue rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold">-</div>
                <div className="text-sm text-white/70">Total Images</div>
            </div>
            </div>

            {/* User Management */}
            <div className="bg-darkblue rounded-lg border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/20">
                <h2 className="text-xl font-semibold">User Management</h2>
                <p className="text-white/60 text-sm mt-1">Manage user accounts, roles, and permissions</p>
            </div>
            
            {users.length === 0 ? (
                <div className="p-8 text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-white/60">No users found</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-black/30">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                    {users.map((userItem) => (
                        <tr key={userItem.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                            <div className="text-sm font-medium text-white">
                                {userItem.username}
                            </div>
                            <div className="text-sm text-white/60">
                                {userItem.email}
                            </div>
                            <div className="text-xs text-white/40 font-mono">
                                ID: {userItem.id.slice(0, 8)}...
                            </div>
                            </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userItem.role === 'admin' 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                            {userItem.role}
                            </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                            {formatDate(userItem.created_at)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                            {userItem.role === 'user' ? (
                                <Button
                                onClick={() => handleRoleChange(userItem.id, 'admin')}
                                disabled={actionLoading === userItem.id || userItem.id === user?.id}
                                className="bg-purple-600 hover:bg-purple-500 px-3 py-1 text-xs"
                                >
                                {actionLoading === userItem.id ? '...' : 'Make Admin'}
                                </Button>
                            ) : (
                                <Button
                                onClick={() => handleRoleChange(userItem.id, 'user')}
                                disabled={actionLoading === userItem.id || userItem.id === user?.id}
                                className="bg-orange-600 hover:bg-orange-500 px-3 py-1 text-xs"
                                >
                                {actionLoading === userItem.id ? '...' : 'Make User'}
                                </Button>
                            )}
                            
                            <Button
                                onClick={() => {
                                setSelectedUser(userItem);
                                setShowUserModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs"
                            >
                                View
                            </Button>
                            
                            <Button
                                onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                disabled={actionLoading === userItem.id || userItem.id === user?.id}
                                className="bg-red-600 hover:bg-red-500 px-3 py-1 text-xs"
                            >
                                {actionLoading === userItem.id ? '...' : 'Delete'}
                            </Button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
            </div>

            {/* System Actions */}
            <div className="mt-8 bg-darkblue rounded-lg border border-white/20 p-6">
            <h2 className="text-xl font-semibold mb-4">System Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h3 className="font-medium mb-2">⚠️ User Warnings</h3>
                <p className="text-sm text-white/70 mb-3">
                    Review users with suspicious activity or usage patterns.
                </p>
                <Button
                    onClick={() => handleWarning('User analytics coming soon')}
                    className="bg-yellow-600 hover:bg-yellow-500 w-full"
                >
                    Review Users
                </Button>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-medium mb-2">📊 System Analytics</h3>
                <p className="text-sm text-white/70 mb-3">
                    View detailed system usage statistics and trends.
                </p>
                <Button
                    onClick={() => handleError(new Error('Advanced analytics coming soon'), 'Info')}
                    className="bg-blue-600 hover:bg-blue-500 w-full"
                >
                    View Analytics
                </Button>
                </div>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h3 className="font-medium mb-2">🔧 System Health</h3>
                <p className="text-sm text-white/70 mb-3">
                    Check system performance and service status.
                </p>
                <Button
                    onClick={() => handleSuccess('All systems operational!')}
                    className="bg-green-600 hover:bg-green-500 w-full"
                >
                    Check Status
                </Button>
                </div>
            </div>
            </div>
        </div>

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
            <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowUserModal(false)}
            >
            <div 
                className="bg-darkblue rounded-lg max-w-md w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">User Details</h3>
                    <Button
                    onClick={() => setShowUserModal(false)}
                    className="bg-transparent hover:bg-white/10"
                    >
                    ×
                    </Button>
                </div>
                
                <div className="space-y-4">
                    <div>
                    <label className="text-sm text-white/60">Username</label>
                    <div className="font-medium">{selectedUser.username}</div>
                    </div>
                    
                    <div>
                    <label className="text-sm text-white/60">Email</label>
                    <div className="font-medium">{selectedUser.email}</div>
                    </div>
                    
                    <div>
                    <label className="text-sm text-white/60">Role</label>
                    <div className="font-medium">
                        <span className={`px-2 py-1 rounded text-xs ${
                        selectedUser.role === 'admin' 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                        {selectedUser.role}
                        </span>
                    </div>
                    </div>
                    
                    <div>
                    <label className="text-sm text-white/60">User ID</label>
                    <div className="font-mono text-sm">{selectedUser.id}</div>
                    </div>
                    
                    <div>
                    <label className="text-sm text-white/60">Created At</label>
                    <div className="font-medium">{formatDate(selectedUser.created_at)}</div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}