import React, { useEffect, useState } from 'react';
import { addDonationComment, getDonationComments } from '../api/donationApi';
import { DonationComment } from '../types';
import { useToast } from '../context/ToastContext';

interface CommentThreadProps {
  donationId: string;
  currentUserId?: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ donationId, currentUserId }) => {
  const [comments, setComments] = useState<DonationComment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchComments = async () => {
    try {
      const pageResponse = await getDonationComments(donationId, 0, 100);
      setComments(pageResponse.content);
    } catch {
      // Ignore if unauthenticated
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 10000); // 10s polling for real-time chat
    return () => clearInterval(interval);
  }, [donationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSubmitting(true);
    try {
      const created = await addDonationComment(donationId, newMessage.trim());
      setComments((prev) => [...prev, created]);
      setNewMessage('');
      showSuccess('Comment sent successfully');
    } catch {
      showError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          💬 Donation Direct Chat & Coordination Notes
        </h4>
        <span className="text-xs text-slate-400">{comments.length} message(s)</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[260px] mb-4">
        {loading ? (
          <div className="text-xs text-slate-400 text-center py-6">Loading messages...</div>
        ) : comments.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-6">
            No direct messages yet. Send a note to coordinate pickup timing or instructions.
          </div>
        ) : (
          comments.map((comment) => {
            const isMe = currentUserId === comment.author.id;
            return (
              <div
                key={comment.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">{comment.author.fullName}</span>
                  <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                    {comment.author.role}
                  </span>
                  <span>• {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600/90 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                  }`}
                >
                  {comment.message}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message or pickup note..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          maxLength={1000}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !newMessage.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
        >
          {submitting ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
