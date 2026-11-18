import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../ui/CustomSelect';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

export const ComposeMessageModal: React.FC = () => {
  const { isComposeMessageOpen, setIsComposeMessageOpen, handleComposeNewMessage } = useApp();
  const [form, setForm] = useState({
    recipient: 'Claire Carter (Parent · Class 302)',
    subject: 'Mid-Term Progress Update',
    body: '',
  });

  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: () => setIsComposeMessageOpen(false),
  });

  if (!isComposeMessageOpen) return null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.body.trim()) return;
    handleComposeNewMessage(form.recipient, form.subject, form.body);
    setForm({
      recipient: 'Claire Carter (Parent · Class 302)',
      subject: 'Mid-Term Progress Update',
      body: '',
    });
  };

  return (
    <div
      ref={backdropRef}
      data-modal-sheet-backdrop="true"
      className="animate-ui-fade fixed inset-0 z-50 bg-black/35 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
    >
      <form
        ref={setSheetElement}
        {...sheetGestureProps}
        onSubmit={onSubmit}
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[26px] p-6 space-y-4 shadow-2xl animate-bottom-sheet"
      >
        <div
          data-sheet-handle="true"
          className="sm:hidden flex justify-center py-2 -mt-3 -mb-1 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-10 h-1 bg-black/15 rounded-full animate-sheet-handle" />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-[#1C1D21]">New Message</h3>
          <button
            type="button"
            onClick={animateClose}
            className="w-8 h-8 rounded-full hover:bg-[#F4F5F8] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Recipient</label>
            <CustomSelect
              className="w-full"
              triggerClassName="px-3.5 py-2 rounded-xl border-black/[0.1] text-[13px]"
              value={form.recipient}
              onChange={(val) => setForm({ ...form, recipient: val })}
              ariaLabel="Recipient"
              options={[
                { value: 'Claire Carter (Parent · Class 302)', label: 'Claire Carter (Parent · Class 302)' },
                { value: 'Mark Anderson (Parent · Class 302)', label: 'Mark Anderson (Parent · Class 302)' },
                { value: 'Sophie Martin (Parent · Class 303)', label: 'Sophie Martin (Parent · Class 303)' },
                { value: 'Dr. Clara Vance (Academic Coordinator)', label: 'Dr. Clara Vance (Academic Coordinator)' },
              ]}
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Subject</label>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-[#6E717A] mb-1">Message</label>
            <textarea
              required
              rows={3}
              placeholder="Write your message..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] outline-none focus:border-[#ee2e65]"
            />
          </div>
        </div>
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={animateClose}
            className={`${ACTION_BTN_SECONDARY} flex-1`}
          >
            <X className="w-4 h-4 sm:hidden shrink-0" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            className={`${ACTION_BTN_PRIMARY} flex-1`}
          >
            <Send className="w-4 h-4 sm:hidden shrink-0" />
            <span className="sm:hidden">Send</span>
            <span className="hidden sm:inline">Send Message</span>
          </button>
        </div>
      </form>
    </div>
  );
};
