import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useUiStore } from '../store/useUiStore';
import { userService } from '../services/userService';
import { Avatar } from '../components/common/Avatar';
import { User, Mail, Shield, Lock, Upload, Save, Check, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { user, updateUser, fetchProfile } = useAuthStore();
  const { addToast } = useUiStore();
  const navigate = useNavigate();

  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState(user?.status || 'Hey there! I am using SyncUp.');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const data = await userService.updateProfile({ firstname, lastname, username, bio, status });
      updateUser(data.user);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile';
      addToast(errorMsg, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New password and confirm password do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await userService.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password changed successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsUploadingImage(true);
      try {
        const data = await userService.uploadProfilePicture(reader.result);
        updateUser(data.user);
        addToast('Profile picture uploaded successfully!', 'success');
      } catch (err) {
        addToast(err.message || 'Failed to upload profile picture', 'error');
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-dark-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Account Profile</h2>
              <p className="text-xs text-slate-400">Manage your persona, status, and security settings</p>
            </div>
          </div>
        </div>

        {/* Avatar Hero Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar user={user} size="2xl" showOnline />
            <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              {isUploadingImage ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-white" />
              )}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">
              {user?.firstname} {user?.lastname}
            </h3>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </p>
            <p className="text-xs text-indigo-400 font-medium mt-2">
              Status: "{user?.status || 'Hey there! I am using SyncUp.'}"
            </p>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleUpdateProfile} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-semibold text-white tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Personal Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Custom Unique User ID</span>
              <span className="text-[10px] text-indigo-400 font-mono">Assigned by You</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jatin_dev or user123"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono text-white"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Choose your custom unique ID. Other users can type this ID or your email to search and connect with you.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Status Message (Max 100 chars)
            </label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="e.g. Coding 👨‍💻 | Available for chat"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Bio (Max 200 chars)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a little about yourself..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2"
            >
              {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-semibold text-white tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            Security & Password
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
