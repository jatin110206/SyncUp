import React from 'react';
import { useMessageStore } from '../../store/useMessageStore';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

export const InChatSearch = ({ onClose }) => {
  const {
    inChatSearchQuery,
    setInChatSearchQuery,
    inChatSearchResults,
    currentSearchResultIndex,
    nextSearchResult,
    prevSearchResult,
  } = useMessageStore();

  return (
    <div className="px-4 py-2 bg-dark-950 border-b border-white/10 flex items-center justify-between gap-3 text-xs z-10">
      <div className="flex items-center gap-2 flex-1">
        <Search className="w-4 h-4 text-indigo-400" />
        <input
          type="text"
          value={inChatSearchQuery}
          onChange={(e) => setInChatSearchQuery(e.target.value)}
          placeholder="Search in conversation..."
          className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none"
          autoFocus
        />
      </div>

      {inChatSearchResults.length > 0 && (
        <div className="flex items-center gap-2 text-slate-400">
          <span>
            {currentSearchResultIndex + 1} of {inChatSearchResults.length}
          </span>
          <button
            onClick={prevSearchResult}
            className="p-1 hover:text-white hover:bg-white/10 rounded"
            title="Previous result"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={nextSearchResult}
            className="p-1 hover:text-white hover:bg-white/10 rounded"
            title="Next result"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      <button
        onClick={() => {
          setInChatSearchQuery('');
          onClose();
        }}
        className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
