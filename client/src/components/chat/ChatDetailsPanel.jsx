import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useMessageStore } from '../../store/useMessageStore';
import { useUiStore } from '../../store/useUiStore';
import { userService } from '../../services/userService';
import { Avatar } from '../common/Avatar';
import { OnlineBadge } from '../common/OnlineBadge';
import {
  X,
  Shield,
  UserPlus,
  UserMinus,
  Edit2,
  LogOut,
  Image as ImageIcon,
  Check,
  Ban,
  Search,
  Loader2,
  Fingerprint,
} from 'lucide-react';

export const ChatDetailsPanel = ({ chat }) => {
  const currentUser = useAuthStore((state) => state.user);
  const blockedUsers = useAuthStore((state) => state.user?.blockedUsers);
  const blockUser = useAuthStore((state) => state.blockUser);
  const unblockUser = useAuthStore((state) => state.unblockUser);

  const { isChatDetailsOpen, setChatDetailsOpen, setLightboxImage, addToast } = useUiStore();
  const { renameGroup, addGroupMembers, removeGroupMember, leaveGroup } = useChatStore();
  const { messages } = useMessageStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(chat?.groupName || '');

  // Add Member State in Group
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);

  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();
  const getMemberId = (m) => (typeof m === 'object' && m !== null ? m._id || m.id || m : m)?.toString();

  // Debounced search for adding group members by User ID
  useEffect(() => {
    if (!memberSearchQuery.trim()) {
      setMemberSearchResults([]);
      setIsSearchingMembers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMembers(true);
      try {
        const data = await userService.searchUsers(memberSearchQuery.trim());
        const existingMemberIds = (chat?.members || []).map((m) => getMemberId(m));
        const filtered = (data.users || []).filter(
          (u) => !existingMemberIds.includes(getMemberId(u))
        );
        setMemberSearchResults(filtered);
      } catch (err) {
        console.error('[ChatDetails] Error searching users by ID:', err);
      } finally {
        setIsSearchingMembers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [memberSearchQuery, chat?.members]);

  if (!chat || !isChatDetailsOpen) return null;

  const otherMember = chat.isGroupChat
    ? null
    : chat.members?.find((m) => getMemberId(m) !== currentUserId) || chat.members?.[0];

  const otherMemberObj = typeof otherMember === 'object' && otherMember !== null ? otherMember : null;
  const otherMemberIdStr = getMemberId(otherMember);

  const isUserBlockedCheck = (targetId) => {
    if (!targetId || !Array.isArray(blockedUsers)) return false;
    const tStr = targetId.toString();
    return blockedUsers.some(
      (id) => (typeof id === 'object' && id !== null ? id._id || id.id || id : id)?.toString() === tStr
    );
  };

  const isBlocked = otherMemberIdStr ? isUserBlockedCheck(otherMemberIdStr) : false;

  const handleToggleBlock = async () => {
    if (!otherMemberIdStr) {
      addToast('Could not find user ID to block', 'error');
      return;
    }
    try {
      if (isBlocked) {
        await unblockUser(otherMemberIdStr);
        addToast(`Unblocked ${otherMemberObj?.firstname || 'user'}`, 'success');
      } else {
        await blockUser(otherMemberIdStr);
        addToast(`Blocked ${otherMemberObj?.firstname || 'user'}`, 'info');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update block status';
      addToast(msg, 'error');
    }
  };

  const handleToggleBlockMember = async (member) => {
    const memberId = getMemberId(member);
    if (!memberId) return;
    const isCurrentlyBlocked = isUserBlockedCheck(memberId);

    try {
      if (isCurrentlyBlocked) {
        await unblockUser(memberId);
        addToast(`Unblocked ${member.firstname || 'user'}`, 'success');
      } else {
        await blockUser(memberId);
        addToast(`Blocked ${member.firstname || 'user'}`, 'info');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update block status';
      addToast(msg, 'error');
    }
  };

  const handleAddMemberToGroup = async (user) => {
    const userId = getMemberId(user);
    if (!userId) return;
    try {
      await addGroupMembers(chat._id, [userId]);
      setMemberSearchQuery('');
      setMemberSearchResults([]);
      setIsAddingMember(false);
      addToast(`Added ${user.firstname} to the group`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to add member to group', 'error');
    }
  };

  const isAdmin =
    chat.isGroupChat &&
    (getMemberId(chat.groupAdmin) === currentUserId);

  // Extract shared image messages
  const sharedImages = messages.filter((m) => m.image && !m.isDeleted);

  const handleRename = async () => {
    if (!newGroupName.trim()) return;
    try {
      await renameGroup(chat._id, newGroupName.trim());
      setIsEditingName(false);
      addToast('Group renamed successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to rename group', 'error');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeGroupMember(chat._id, memberId);
      addToast('Member removed from group', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group chat?')) {
      try {
        await leaveGroup(chat._id);
        setChatDetailsOpen(false);
        addToast('You have left the group', 'info');
      } catch (err) {
        addToast(err.message || 'Failed to leave group', 'error');
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 320, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        className="h-full bg-dark-900 border-l border-white/10 flex flex-col flex-shrink-0 z-20 overflow-y-auto"
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-white text-base">Chat Details</h3>
          <button
            onClick={() => setChatDetailsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User / Group Info Hero */}
        <div className="p-6 flex flex-col items-center text-center border-b border-white/10">
          <Avatar
            user={otherMember}
            name={chat.isGroupChat ? chat.groupName : undefined}
            isGroup={chat.isGroupChat}
            size="2xl"
          />

          {chat.isGroupChat ? (
            <div className="mt-3 w-full">
              {isEditingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="flex-1 px-3 py-1 rounded-lg glass-input text-sm text-center"
                    autoFocus
                  />
                  <button
                    onClick={handleRename}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h4 className="font-bold text-white text-lg">{chat.groupName}</h4>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-slate-400 hover:text-white p-1 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">{chat.members?.length} members</p>
            </div>
          ) : (
            <div className="mt-3">
              <h4 className="font-bold text-white text-lg">
                {otherMember?.firstname} {otherMember?.lastname}
              </h4>
              <p className="text-xs text-slate-400">{otherMember?.email}</p>
              <div className="mt-2">
                <OnlineBadge userId={otherMember?._id} />
              </div>
            </div>
          )}
        </div>

        {/* Bio / Status Section for 1-on-1 */}
        {!chat.isGroupChat && otherMember && (
          <div className="p-4 border-b border-white/10 space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </span>
              <p className="text-sm text-slate-200 mt-0.5 font-medium">
                {otherMember.status || 'Hey there! I am using SyncUp.'}
              </p>
            </div>

            {otherMember.bio && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Bio
                </span>
                <p className="text-sm text-slate-300 mt-0.5">{otherMember.bio}</p>
              </div>
            )}
          </div>
        )}

        {/* Group Members List Section */}
        {chat.isGroupChat && (
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Group Members ({chat.members?.length})
              </span>
              {isAdmin && (
                <button
                  onClick={() => setIsAddingMember(!isAddingMember)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600/20 text-brand-300 border border-brand-500/30 hover:bg-brand-600 hover:text-white text-xs font-medium transition-colors"
                  title="Add members by searching their Unique User ID"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingMember ? 'Cancel' : 'Add Member'}</span>
                </button>
              )}
            </div>

            {/* Add Member by User ID Panel */}
            {isAddingMember && (
              <div className="p-3 rounded-xl bg-white/5 border border-brand-500/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Add Member by User ID</span>
                  <span className="text-[10px] text-slate-400 font-normal">Search by @username</span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search User ID (e.g. @john)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg glass-input text-xs text-white placeholder-slate-400"
                    autoFocus
                  />
                </div>

                {isSearchingMembers ? (
                  <div className="p-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                    <span>Searching User ID...</span>
                  </div>
                ) : memberSearchQuery.trim() && memberSearchResults.length > 0 ? (
                  <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                    {memberSearchResults.map((user) => {
                      const uId = getMemberId(user);
                      const isMemberBlocked = isUserBlockedCheck(uId);

                      return (
                        <div
                          key={uId}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar user={user} size="xs" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-white block truncate">
                                  {user.firstname} {user.lastname}
                                </span>
                                {isMemberBlocked && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Blocked
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-brand-300 truncate block">
                                {user.username ? `@${user.username}` : user.email}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMemberToGroup(user)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1 shadow-sm transition-colors flex-shrink-0"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : memberSearchQuery.trim() && !isSearchingMembers ? (
                  <div className="p-2 text-center text-xs text-slate-400 bg-white/5 rounded-lg">
                    No user found matching &quot;{memberSearchQuery}&quot;
                  </div>
                ) : null}
              </div>
            )}

            {/* Members List with Block/Unblock and Remove actions */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chat.members?.map((member) => {
                const mId = getMemberId(member);
                const isMe = mId === currentUserId;
                const isMemberAdmin =
                  (typeof chat.groupAdmin === 'object' ? getMemberId(chat.groupAdmin) : chat.groupAdmin?.toString()) === mId;
                const isMemberBlocked = !isMe && isUserBlockedCheck(mId);
                const handle = member.username ? `@${member.username}` : member.email;

                return (
                  <div
                    key={mId}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar user={member} size="sm" showOnline={!isMemberBlocked} />
                      <div className="text-xs min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white truncate">
                            {member.firstname} {member.lastname}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                          )}
                          {isMemberAdmin && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <Shield className="w-2.5 h-2.5" /> Admin
                            </span>
                          )}
                          {isMemberBlocked && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30">
                              Blocked
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 truncate block">
                          {handle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Block / Unblock Button (for other members in the group) */}
                      {!isMe && (
                        <button
                          onClick={() => handleToggleBlockMember(member)}
                          className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isMemberBlocked
                              ? 'text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/10 border border-emerald-500/30'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent'
                          }`}
                          title={isMemberBlocked ? `Unblock ${member.firstname}` : `Block ${member.firstname}`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {/* Remove Member Button (Group Admin only) */}
                      {isAdmin && !isMe && (
                        <button
                          onClick={() => handleRemoveMember(mId)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                          title="Remove Member from Group"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shared Media Grid */}
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              Shared Media ({sharedImages.length})
            </span>
          </div>

          {sharedImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {sharedImages.map((msg) => (
                <button
                  key={msg._id}
                  onClick={() => setLightboxImage(msg.image)}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-white/10 hover:opacity-80 transition-opacity"
                >
                  <img src={msg.image} alt="Shared media" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No shared media yet</p>
          )}
        </div>

        {/* 1-on-1 Block User Button */}
        {!chat.isGroupChat && otherMember && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">User ID:</span>
              <span className="font-mono text-slate-300 select-all font-semibold">{otherMember._id}</span>
            </div>
            <button
              onClick={handleToggleBlock}
              className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                isBlocked
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white'
              }`}
            >
              <Ban className="w-4 h-4" />
              <span>{isBlocked ? `Unblock ${otherMember.firstname}` : `Block ${otherMember.firstname}`}</span>
            </button>
          </div>
        )}

        {/* Leave Group Button */}
        {chat.isGroupChat && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold text-xs hover:bg-rose-500 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Group Chat</span>
            </button>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
};
