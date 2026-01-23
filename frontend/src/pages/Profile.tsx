import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Profile() {
    const navigate = useNavigate();
    const { user, updateUser, logout, logoutAllDevices, isLoading } = useAuth();
    const { handleError, handleSuccess, handleInfo } = useError();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                email: user.email,
            });
        }
    }, [user]);

    const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleSave = async () => {
        if (!user) return;

        setIsUpdating(true);
        try {
            const updates: { username?: string; email?: string } = {};
            
            if (formData.username !== user.username) {
                updates.username = formData.username;
            }
            if (formData.email !== user.email) {
                updates.email = formData.email;
            }

            if (Object.keys(updates).length > 0) {
                await updateUser(updates);
                handleSuccess('Profile updated successfully!');
                setIsEditing(false);
            } else {
                handleInfo('No changes to save');
            }
        } catch (error) {
            handleError(error, 'Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                username: user.username,
                email: user.email,
            });
        }
        setIsEditing(false);
    };

    const handleLogoutAll = async () => {
        try {
            await logoutAllDevices();
            handleSuccess('Logged out from all devices successfully!');
        } catch (error) {
            handleError(error, 'Failed to logout from all devices');
        }
    };

    if (!user) {
        return (
        <div className="min-h-screen bg-custom-bg text-white flex items-center justify-center">
            <div className="text-center">
            <p>Loading profile...</p>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-custom-bg text-white">
        {/* Header */}
        <header className="w-full bg-custom-bg border-b border-white/20 p-4">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <Button 
                onClick={() => navigate('/')}
                className="bg-transparent border border-white/20 hover:bg-white/10"
            >
                Back to Dashboard
            </Button>
            </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto p-6">
            <div className="bg-darkblue rounded-xl shadow-dark border border-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Account Information</h2>
            
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">User ID</label>
                    <div className="p-3 bg-custom-bg/50 border border-white/10 rounded-lg">
                    <code className="text-sm">{user.id}</code>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2">Role</label>
                    <div className="p-3 bg-custom-bg/50 border border-white/10 rounded-lg">
                    <span className={`px-2 py-1 rounded text-sm ${
                        user.role === 'admin' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                        {user.role}
                    </span>
                    </div>
                </div>
                </div>

                {isEditing ? (
                <div className="space-y-4">
                    <Input 
                    type="text" 
                    label="Username"
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    className="p-3 bg-custom-bg/80 border border-white/20 rounded-lg text-white"
                    />
                    
                    <Input 
                    type="email" 
                    label="Email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className="p-3 bg-custom-bg/80 border border-white/20 rounded-lg text-white"
                    />

                    <div className="flex gap-3 pt-2">
                    <Button 
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-500"
                    >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                        onClick={handleCancel}
                        disabled={isUpdating}
                        className="bg-transparent border border-white/20 hover:bg-white/10"
                    >
                        Cancel
                    </Button>
                    </div>
                </div>
                ) : (
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <div className="p-3 bg-custom-bg/50 border border-white/10 rounded-lg">
                        {user.username}
                    </div>
                    </div>
                    
                    <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <div className="p-3 bg-custom-bg/50 border border-white/10 rounded-lg">
                        {user.email}
                    </div>
                    </div>

                    <div className="pt-2">
                    <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 hover:bg-blue-500"
                    >
                        Edit Profile
                    </Button>
                    </div>
                </div>
                )}
            </div>
            </div>

            {/* Security Settings */}
            <div className="bg-darkblue rounded-xl shadow-dark border border-white/20 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
            
            <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h3 className="font-medium mb-2">🔐 Session Management</h3>
                <p className="text-sm text-white/70 mb-4">
                    Manage your active sessions across devices. Logout from all devices will terminate all active sessions.
                </p>
                
                <div className="flex gap-3">
                    <Button 
                    onClick={logout}
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-500"
                    >
                    {isLoading ? 'Logging out...' : 'Logout Current Device'}
                    </Button>
                    
                    <Button 
                    onClick={handleLogoutAll}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-500"
                    >
                    {isLoading ? 'Logging out...' : 'Logout All Devices'}
                    </Button>
                </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-medium mb-2">📱 Account Security</h3>
                <p className="text-sm text-white/70">
                    Your account is protected with JWT authentication and refresh token rotation. 
                    Sessions automatically expire after 7 days of inactivity.
                </p>
                </div>
            </div>
            </div>

            {/* Account Actions */}
            <div className="bg-darkblue rounded-xl shadow-dark border border-white/20 p-6">
            <h2 className="text-xl font-semibold mb-6">Account Actions</h2>
            
            <div className="space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h3 className="font-medium mb-2 text-red-300">⚠️ Danger Zone</h3>
                <p className="text-sm text-white/70 mb-4">
                    Account deletion is permanent and cannot be undone. All your data will be permanently removed.
                </p>
                
                <Button 
                    onClick={() => alert('Account deletion feature coming soon')}
                    className="bg-red-600 hover:bg-red-500"
                    disabled
                >
                    Delete Account (Coming Soon)
                </Button>
                </div>
            </div>
            </div>
        </main>
        </div>
    );
}