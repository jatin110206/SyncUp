import React from 'react';
import { usePresenceStore } from '../../store/usePresenceStore';

export const Avatar = ({ user, src, name, size = 'md', showOnline = false, isGroup = false }) => {
  const userObj = typeof user === 'object' && user !== null ? user : null;
  const userId = userObj ? userObj._id || userObj.id : typeof user === 'string' ? user : null;

  const onlineUsers = usePresenceStore((state) => state.onlineUsers);
  const idStr = userId ? (typeof userId === 'object' && userId !== null ? userId._id || userId.id || userId : userId).toString() : null;
  const isOnline = idStr ? onlineUsers.has(idStr) : false;

  const imageSrc = src || userObj?.profilePicture || userObj?.profileImage;
  const displayName =
    name ||
    (userObj ? `${userObj.firstname || ''} ${userObj.lastname || ''}`.trim() || userObj.email : '') ||
    'User';

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const badgeSizeClasses = {
    xs: 'w-2 h-2 bottom-0 right-0',
    sm: 'w-2.5 h-2.5 bottom-0 right-0',
    md: 'w-3 h-3 bottom-0 right-0',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
    xl: 'w-4.5 h-4.5 bottom-1 right-1',
    '2xl': 'w-6 h-6 bottom-1 right-1',
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${sizeClasses[size] || sizeClasses.md}`}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={displayName}
          className="w-full h-full rounded-full object-cover ring-2 ring-white/10"
        />
      ) : (
        <div
          className={`w-full h-full rounded-full flex items-center justify-center font-semibold tracking-wider text-white ring-2 ring-white/10 ${
            isGroup
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600'
              : 'bg-gradient-to-tr from-slate-700 via-indigo-900 to-slate-800'
          }`}
        >
          {isGroup ? '👥' : getInitials(displayName)}
        </div>
      )}

      {showOnline && !isGroup && (
        <span
          className={`absolute rounded-full ring-2 ring-dark-950 ${badgeSizeClasses[size] || badgeSizeClasses.md} ${
            isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-500'
          }`}
        />
      )}
    </div>
  );
};
