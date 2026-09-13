import React from 'react';
import { usePresenceStore } from '../../store/usePresenceStore';

export const OnlineBadge = ({ userId, showText = true }) => {
  const onlineUsers = usePresenceStore((state) => state.onlineUsers);
  const idStr = userId ? (typeof userId === 'object' && userId !== null ? userId._id || userId.id || userId : userId).toString() : null;
  const isOnline = idStr ? onlineUsers.has(idStr) : false;

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline
            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse-subtle'
            : 'bg-slate-500'
        }`}
      />
      {showText && (
        <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};
