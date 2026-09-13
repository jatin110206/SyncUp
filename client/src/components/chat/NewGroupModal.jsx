import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useUiStore } from '../../store/useUiStore';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { userService } from '../../services/userService';
import { Avatar } from '../common/Avatar';
import { Search, Check, Users, X, UserPlus, Ban, Loader2, Fingerprint } from 'lucide-react';

export const NewGroupModal = () => {
  const { isNewGroupModalOpen, setNewGroupModalOpen, addToast } = useUiStore();
  const { createGroupChat } = useChatStore();
  const currentUser = useAuthStore((state) => state.user);
  const isUserBlocked = useAuthStore((state) => state.isUserBlocked);

  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isNewGroupModalOpen) {
      setGroupName('');
      setQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setIsSearching(false);
      setIsCreating(false);
    }
  }, [isNewGroupModalOpen]);

  // Debounced search by Unique User ID
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await userService.searchUsers(query.trim());
        const myId = (currentUser?._id || currentUser?.id)?.toString();
        // Filter out self
        const results = (data.users || []).filter(
          (u) => (u._id || u.id)?.toString() !== myId
        );
        setSearchResults(results);
      } catch (err) {
        console.error('[NewGroup] Error searching users by ID:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUser]);

  const handleAddUser = (user) => {
    const uId = (user._id || user.id)?.toString();
    if (selectedUsers.some((u) => (u._id || u.id)?.toString() === uId)) {
      return;
    }
    setSelectedUsers((prev) => [...prev, user]);
  };

  const handleRemoveUser = (userId) => {
    const targetId = userId?.toString();
    setSelectedUsers((prev) =>
      prev.filter((u) => (u._id || u.id)?.toString() !== targetId)
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      addToast('Group name is required', 'error');
      return;
    }
    if (selectedUsers.length < 2) {
      addToast('Please select at least 2 members for a group chat', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const memberIds = selectedUsers.map((u) => u._id || u.id);
      await createGroupChat(groupName.trim(), memberIds);
      setNewGroupModalOpen(false);
      addToast('Group chat created successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to create group chat', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isNewGroupModalOpen}
      onClose={() => setNewGroupModalOpen(false)}
      title="Create New Group Chat"
    >
      <form onSubmit={handleCreateGroup} className="space-y-4">
        {/* Group Name Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Group Name *
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Project SyncUp Team 🚀"
            className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-400"
            required
          />
        </div>

        {/* Selected Members Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Selected Members ({selectedUsers.length})
            </label>
            <span className="text-[11px] text-slate-400">Min. 2 members required</span>
          </div>

          {selectedUsers.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-white/5 border border-white/10 max-h-28 overflow-y-auto">
              {selectedUsers.map((user) => {
                const uId = user._id || user.id;
                const blocked = isUserBlocked(uId);
                const handle = user.username ? `@${user.username}` : '';

                return (
                  <div
                    key={uId}
                    className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-xs text-white"
                  >
                    <Avatar user={user} size="xs" />
                    <span className="font-medium max-w-[120px] truncate">
                      {user.firstname} {handle && <span className="text-indigo-300 font-mono text-[10px]">{handle}</span>}
                    </span>
                    {blocked && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">
                        Blocked
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(uId)}
                      className="p-0.5 rounded hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                      title="Remove from selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-slate-400">
              No members added yet. Search by Unique User ID below to add.
            </div>
          )}
        </div>

        {/* Search Members by User ID Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Add Members by User ID
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type User ID (e.g. @username or user ID)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-400"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
            <span>Only users you search by their ID will appear (no full user directory).</span>
          </p>
        </div>

        {/* Search Results List */}
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {isSearching ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Searching user by ID...</span>
            </div>
          ) : query.trim() && searchResults.length > 0 ? (
            searchResults.map((user) => {
              const uId = (user._id || user.id)?.toString();
              const isSelected = selectedUsers.some(
                (u) => (u._id || u.id)?.toString() === uId
              );
              const blocked = isUserBlocked(uId);
              const handle = user.username ? `@${user.username}` : user.email;

              return (
                <div
                  key={uId}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-brand-600/10 border-brand-500/40 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar user={user} size="sm" showOnline />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white truncate">
                          {user.firstname} {user.lastname}
                        </span>
                        {blocked && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                            <Ban className="w-2.5 h-2.5" /> Blocked
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-brand-300 truncate block">
                        {handle}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => (isSelected ? handleRemoveUser(uId) : handleAddUser(user))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : query.trim() && !isSearching ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-white/5 rounded-xl border border-white/5">
              No user found matching &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              Search by Unique User ID above to select group members
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setNewGroupModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!groupName.trim() || selectedUsers.length < 2 || isCreating}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Group...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Create Group ({selectedUsers.length})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
