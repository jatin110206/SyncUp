import React from 'react';

export const ChatSkeleton = () => (
  <div className="space-y-3 p-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 animate-pulse">
        <div className="w-11 h-11 rounded-full bg-slate-700/50 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-700/50 rounded w-1/3" />
          <div className="h-3 bg-slate-700/30 rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export const MessageSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex items-start gap-3 max-w-[70%]">
      <div className="w-8 h-8 rounded-full bg-slate-700/50 flex-shrink-0 animate-pulse" />
      <div className="p-3 rounded-2xl bg-slate-800/60 w-48 space-y-2 animate-pulse">
        <div className="h-3 bg-slate-700/50 rounded w-full" />
        <div className="h-3 bg-slate-700/50 rounded w-2/3" />
      </div>
    </div>

    <div className="flex items-start gap-3 max-w-[70%] ml-auto flex-row-reverse">
      <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex-shrink-0 animate-pulse" />
      <div className="p-3 rounded-2xl bg-indigo-900/40 w-56 space-y-2 animate-pulse">
        <div className="h-3 bg-indigo-700/40 rounded w-full" />
        <div className="h-3 bg-indigo-700/40 rounded w-1/2" />
      </div>
    </div>

    <div className="flex items-start gap-3 max-w-[70%]">
      <div className="w-8 h-8 rounded-full bg-slate-700/50 flex-shrink-0 animate-pulse" />
      <div className="p-3 rounded-2xl bg-slate-800/60 w-36 space-y-2 animate-pulse">
        <div className="h-3 bg-slate-700/50 rounded w-full" />
      </div>
    </div>
  </div>
);
