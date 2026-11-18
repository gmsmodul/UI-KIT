import React, { useState } from 'react';
import { Search, Plus, ChevronLeft, CheckCheck, Send, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SplitFilterButton } from '../ui/SplitFilterButton';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

export const MessagesPage: React.FC = () => {
  const {
    messagesThreads,
    setMessagesThreads,
    selectedThreadId,
    handleSelectThread,
    handleSendMessageReply,
    setIsComposeMessageOpen,
    unreadMessagesCount,
    triggerToast,
  } = useApp();

  const [messageSearch, setMessageSearch] = useState('');
  const [messageFilterTab, setMessageFilterTab] = useState<'All' | 'Unread'>('All');
  const [messageDraft, setMessageDraft] = useState('');
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'chat'>('list');

  const filteredThreads = messagesThreads.filter((t) => {
    const matchesTab = messageFilterTab === 'All' || t.unread;
    const matchesQuery =
      t.sender.toLowerCase().includes(messageSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(messageSearch.toLowerCase()) ||
      t.role.toLowerCase().includes(messageSearch.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const activeThread =
    messagesThreads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || messagesThreads[0];

  const onReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageDraft.trim() || !activeThread) return;
    handleSendMessageReply(activeThread.id, messageDraft.trim());
    setMessageDraft('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 md:pb-6 border-b border-black/[0.05]">
        <div className="hidden md:block">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-tight text-[#1C1D21]">Messages</h1>
            {unreadMessagesCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFECEB] text-[#942922] text-[11.5px] font-bold">
                {unreadMessagesCount} Unread
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto">
          {unreadMessagesCount > 0 && (
            <span className="md:hidden mr-auto px-2.5 py-1 rounded-full bg-[#FFECEB] text-[#942922] text-[11.5px] font-bold">
              {unreadMessagesCount} Unread
            </span>
          )}
          <button
            onClick={() => {
              setMessagesThreads((prev) => prev.map((t) => ({ ...t, unread: false })));
              triggerToast('Inbox Updated', 'All conversations marked as read.', 'success');
            }}
            className={ACTION_BTN_SECONDARY}
          >
            <CheckCheck className="w-4 h-4 sm:hidden shrink-0" />
            <span className="sm:hidden">Read</span>
            <span className="hidden sm:inline">Mark all read</span>
          </button>
          <button
            onClick={() => setIsComposeMessageOpen(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">New Message</span>
          </button>
        </div>
      </div>

      {/* Unified 12-Col Split Workspace: Side-by-side on tablet & PC (md:), drilldown on mobile */}
      <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden grid grid-cols-1 md:grid-cols-12 md:divide-x divide-black/[0.06] items-stretch">
        {/* Left 5 Cols on Tablet/PC: Thread List (Hidden on mobile if chat view is active) */}
        <div
          className={`${
            mobileActiveView === 'chat' ? 'hidden md:flex' : 'flex'
          } md:col-span-5 flex-col`}
        >
          <div className="p-3.5 border-b border-black/[0.06] flex items-center gap-2 bg-[#FAFBFD]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8A8D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                placeholder="Search sender or subject..."
                className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-black/[0.09] text-[12.5px] outline-none focus:border-[#ee2e65]"
              />
            </div>
            <SplitFilterButton
              value={messageFilterTab}
              onChange={(val) => setMessageFilterTab(val as 'All' | 'Unread')}
              icon={Mail}
              variant="surface"
              align="right"
              ariaLabel="Filter pesan"
              options={[
                { value: 'All', label: 'All Messages', mobileLabel: 'All' },
                {
                  value: 'Unread',
                  label: 'Unread',
                  mobileLabel: 'Unread',
                  badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
                  badgeClassName: 'bg-[#FFECEB] text-[#942922]',
                },
              ]}
            />
          </div>

          <div className="divide-y divide-black/[0.05] max-h-[520px] overflow-y-auto">
            {filteredThreads.map((thread) => {
              const isSelected = activeThread?.id === thread.id;
              const lastMsg = thread.messages[thread.messages.length - 1];
              return (
                <button
                  key={thread.id}
                  onClick={() => {
                    handleSelectThread(thread.id);
                    setMobileActiveView('chat');
                  }}
                  className={`w-full text-left p-4 transition-colors cursor-pointer border-l-2 ${
                    isSelected
                      ? 'bg-[#FEF1F5]/70 border-l-[#ee2e65]'
                      : thread.unread
                      ? 'bg-[#FAFBFD] border-l-[#FBC2D4] hover:bg-[#FAFBFD]'
                      : 'bg-white border-l-transparent hover:bg-[#FAFBFD]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold ${thread.color}`}>
                          {thread.initials}
                        </span>
                        {thread.online && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-white absolute bottom-0 right-0" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-semibold text-[#1C1D21] truncate">{thread.sender}</span>
                          {thread.unread && <span className="w-2 h-2 rounded-full bg-[#ee2e65] shrink-0" />}
                        </div>
                        <div className="text-[11px] text-[#8A8D98] truncate">{thread.role}</div>
                      </div>
                    </div>
                    <span className="text-[10.5px] text-[#8A8D98] shrink-0 tabular-nums">{thread.time}</span>
                  </div>

                  <div className="mt-2">
                    <div className="text-[12px] font-semibold text-[#1C1D21] truncate">{thread.subject}</div>
                    <p className="text-[11.5px] text-[#6E717A] truncate mt-0.5">
                      {lastMsg?.fromMe ? `You: ${lastMsg.text}` : lastMsg?.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols on Tablet/PC: Active Conversation Thread (Hidden on mobile if list view is active) */}
        {activeThread && (
          <div
            className={`${
              mobileActiveView === 'list' ? 'hidden md:flex' : 'flex'
            } md:col-span-7 bg-[#FAFBFD]/50 flex-col justify-between min-h-[500px]`}
          >
            {/* Conversation Top Bar */}
            <div className="bg-white px-5 py-4 border-b border-black/[0.06] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back to List button */}
                <button
                  type="button"
                  onClick={() => setMobileActiveView('list')}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-[#F4F5F8] text-[#1C1D21] cursor-pointer"
                  title="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${activeThread.color}`}>
                  {activeThread.initials}
                </span>
                <div className="min-w-0">
                  <div className="text-[14.5px] font-semibold text-[#1C1D21] truncate">{activeThread.sender}</div>
                  <div className="text-[11.5px] text-[#8A8D98] truncate">{activeThread.role} · {activeThread.subject}</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E6F9F0] text-[#146C43] text-[11px] font-semibold shrink-0">
                {activeThread.online ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Message Bubbles */}
            <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[360px]">
              {activeThread.messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.fromMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[82%] px-4 py-3 rounded-[20px] text-[13px] leading-relaxed ${
                      m.fromMe
                        ? 'bg-[#ee2e65] text-white rounded-br-md'
                        : 'bg-white text-[#1C1D21] border border-black/[0.07] rounded-bl-md'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-[#8A8D98] mt-1 px-1 tabular-nums">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Reply Input Bar */}
            <form onSubmit={onReplySubmit} className="bg-white p-3.5 border-t border-black/[0.06] flex items-center gap-2.5">
              <input
                type="text"
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder={`Reply to ${activeThread.sender}...`}
                className="flex-1 h-9 bg-[#FAFBFD] border border-black/[0.07] rounded-full px-4 text-[13px] outline-none focus:bg-white focus:border-[#ee2e65]"
              />
              <button
                type="submit"
                className={ACTION_BTN_PRIMARY}
              >
                <Send className="w-4 h-4 sm:hidden shrink-0" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
