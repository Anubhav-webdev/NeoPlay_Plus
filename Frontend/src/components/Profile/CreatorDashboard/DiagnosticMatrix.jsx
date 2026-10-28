import { motion } from 'framer-motion';
import { TrendingUp, MessageSquare, CornerDownRight } from 'lucide-react';

export default function DiagnosticMatrix({ commentTab, setCommentTab, filteredComments, submitReplyToComment }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* CHANNEL ADVICE */}
      <div className="lg:col-span-1">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 p-5 rounded-[24px] shadow-2xl h-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-red-400" /> Channel Advice
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/60 rounded-xl border-l-4 border-purple-500 hover:bg-slate-900/50 transition-colors">
                <span className="text-[9px] font-bold uppercase text-purple-400 block tracking-widest mb-1">Trending Parameter</span>
                <p className="text-xs text-slate-400 leading-relaxed">Publish verified videos, images, or posts to start building channel activity.</p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border-l-4 border-blue-500 hover:bg-slate-900/50 transition-colors">
                <span className="text-[9px] font-bold uppercase text-blue-400 block tracking-widest mb-1">Velocity Metric Advice</span>
                <p className="text-xs text-slate-400 leading-relaxed">Your published content and view counts appear here as your channel grows.</p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border-l-4 border-red-500 hover:bg-slate-900/50 transition-colors">
                <span className="text-[9px] font-bold uppercase text-red-400 block tracking-widest mb-1">Engagement Trigger</span>
                <p className="text-xs text-slate-400 leading-relaxed">New comments on your published content will appear in the reply queue.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMMENTS TERMINAL */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[24px] shadow-2xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />Comments Reply
            </h3>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['all', 'video', 'image', 'tweet'].map(tab => (
                <button key={tab} onClick={() => setCommentTab(tab)} className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors ${commentTab === tab ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
                  {tab === 'tweet' ? 'Tweets' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[320px] overflow-y-auto flex-1 bg-slate-950/10">
            {filteredComments.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No comments on your published content yet.</p>
            ) : filteredComments.map(comment => (
              <div key={comment.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div className="flex gap-3">
                    <img src={comment.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"} alt="User Matrix" className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800/80" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{comment.author}</span>
                        <span className="text-[10px] text-slate-500">{comment.handle}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase bg-slate-950 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-md max-w-[150px] truncate">{comment.assetTitle}</span>
                </div>

                {comment.replyText ? (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="ml-11 p-3 bg-slate-950 border border-purple-500/20 rounded-xl text-xs flex items-start gap-2">
                    <CornerDownRight className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-bold uppercase text-purple-400 block tracking-widest mb-0.5">Studio Reply Committed</span>
                      <p className="text-slate-300 italic">"{comment.replyText}"</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="ml-11 flex gap-2">
                    <input type="text" placeholder="Route reply back down stream..." onKeyDown={(e) => { if (e.key === 'Enter') { submitReplyToComment(comment.id, e.target.value); e.target.value = ''; } }} className="bg-slate-950 border border-slate-800/80 rounded-xl text-xs px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors text-white w-full max-w-sm" />
                    <button onClick={(e) => { const input = e.target.previousSibling; submitReplyToComment(comment.id, input.value); input.value = ''; }} className="bg-purple-600 hover:bg-purple-500 text-white text-[9px] px-3.5 font-bold uppercase tracking-widest border border-purple-500/40 rounded-xl transition-all">Reply</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}