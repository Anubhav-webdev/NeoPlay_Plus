import { useState } from 'react';
import { FaFlag, FaTimes } from 'react-icons/fa';

export default function ReportCard({ tweet, onClose, onSubmit }) {
  const [reason, setReason] = useState('spam');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reportReasons = [
    ['spam', 'Spam or misleading'],
    ['harassment', 'Harassment'],
    ['hate', 'Hate or abusive content'],
    ['violence', 'Violence'],
    ['copyright', 'Copyright infringement'],
    ['sexual', 'Sexual content'],
    ['misinformation', 'Misinformation'],
    ['other', 'Other'],
  ];

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(reason);
    } catch (submitError) {
      setError(submitError.message || 'Could not submit this report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f121d] border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800/50 p-2 rounded-full transition"
        >
          <FaTimes size={14} />
        </button>

        <div className="flex items-center space-x-3 text-red-400 mb-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <FaFlag size={20} />
          </div>
          <h2 className="text-xl font-bold">Report Post</h2>
        </div>

        <p className="text-sm text-slate-400 mb-6">
          You are reporting a post by <span className="font-bold text-slate-200">@{tweet.handle}</span>.
          Please select a reason for this report.
        </p>

        <div className="space-y-2 mb-4">
          {reportReasons.map(([value, label]) => (
            <label
              key={value}
              className="flex items-center space-x-3 p-3 rounded-xl border border-slate-800 hover:bg-[#161a29] cursor-pointer transition"
            >
              <input
                type="radio"
                name="reportReason"
                value={value}
                checked={reason === value}
                onChange={() => setReason(value)}
                className="text-purple-500 bg-slate-900 border-slate-700 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>

        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
