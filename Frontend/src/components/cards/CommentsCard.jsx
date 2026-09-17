import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import sleek, modern icons from react-icons
import { 
  HiHandThumbUp, 
  HiHandThumbDown, 
  HiOutlineHandThumbUp, 
  HiOutlineHandThumbDown 
} from 'react-icons/hi2';
import { 
    FiSend, 
  FiChevronLeft, 
  FiChevronRight,
  FiChevronDown
} from 'react-icons/fi';

export default function CommentsCard({
  tweetId,
  initialComments = []
}) {
 const [comments, setComments] = useState(initialComments);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  // Visibility and Pagination settings
  const [visibleCountDesktop, setVisibleCountDesktop] = useState(5);
  const [mobileCarouselIndex, setMobileCarouselIndex] = useState(0); 

  // Expanded replies state
  const [expandedReplies, setExpandedReplies] = useState(new Set([1]));

  // Interaction Sets
  const [likedComments, setLikedComments] = useState(new Set([1]));
  const [dislikedComments, setDislikedComments] = useState(new Set());

  // Drag constraints helper reference for Framer Motion mobile drag
  const mobileSliderConstraintsRef = useRef(null);

  // Submitting a parent comment
  const handleAddComment = () => {
    if (!inputText.trim()) return;
    const newComment = {
      id: Date.now(),
      user: 'You',
      handle: '@you_developer',
      text: inputText.trim(),
      time: Date.now(),
      likes: 0,
      dislikes: 0,
      replies: []
    };
    setComments([newComment, ...comments]);
    setInputText('');
  };

  // Submitting an inline reply
  const handleAddReply = (commentId) => {
    if (!replyText.trim()) return;
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [
              ...(c.replies || []),
              {
                id: Date.now(),
                user: 'You',
                handle: '@you_developer',
                text: replyText.trim(),
                time: Date.now()
              }
            ]
          };
        }
        return c;
      })
    );

    // Automatically expand replies drawer
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });

    setReplyText('');
    setReplyingTo(null);
  };

  // Visibility toggle for replies
  const toggleRepliesVisibility = (commentId) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Likes toggle
  const toggleLike = (id) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setDislikedComments(dPrev => {
          const dNext = new Set(dPrev);
          dNext.delete(id);
          return dNext;
        });
      }
      return next;
    });
  };

  // Dislikes toggle
  const toggleDislike = (id) => {
    setDislikedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setLikedComments(lPrev => {
          const lNext = new Set(lPrev);
          lNext.delete(id);
          return lNext;
        });
      }
      return next;
    });
  };

  // Mobile Carousel Page Switcher
  const handleNextMobilePage = () => {
    if (mobileCarouselIndex < comments.length - 1) {
      setMobileCarouselIndex(prev => prev + 1);
    }
  };

  const handlePrevMobilePage = () => {
    if (mobileCarouselIndex > 0) {
      setMobileCarouselIndex(prev => prev - 1);
    }
  };

  return (
    <div>
      
      {/* Container Wrapper */}
      <div className="w-full max-w-5xl bg-[#0f121d] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Dynamic Background Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Input Box Row */}
        <div className="flex items-start space-x-4 mb-8 bg-[#161a29]/60 p-4 rounded-2xl border border-slate-800/40">
          {/* Logo / Profile Avatar */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-50 via-pink-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/15 shrink-0">
            DM
          </div>

          {/* Input Area */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type your comment..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              className="w-full bg-[#121522] border border-slate-800 focus:border-purple-500/50 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            
            {/* Action Send Button */}
            <button
              onClick={handleAddComment}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                inputText.trim() 
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow' 
                  : 'text-slate-600 hover:text-slate-500'
              }`}
            >
              < FiSend className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LAPTOP VIEW: Standard Vertical Comment Listing                           */}
        {/* ========================================================================= */}
        <div className="hidden md:block">
          <motion.div layout className="space-y-6">
            <AnimatePresence initial={false}>
              {comments.slice(0, visibleCountDesktop).map((comment) => {
                const hasLiked = likedComments.has(comment.id);
                const hasDisliked = dislikedComments.has(comment.id);
                const showReplies = expandedReplies.has(comment.id);
                const totalLikes = (comment.likes || 0) + (hasLiked ? 1 : 0);

                return (
                  <motion.div
                    key={comment.id}
                    layout="position"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                    className="border-b border-slate-800/40 pb-5 last:border-0"
                  >
                    <div className="flex space-x-3 items-start">
                      {/* Comment User Avatar */}
                      <div className={`h-9 w-9 rounded-full bg-gradient-to-br  from-slate-700 to-red-800} flex items-center justify-center text-xs font-bold text-white shadow shrink-0`}>
                        {comment.user.charAt(0)}
                      </div>

                      {/* Main Comment Bubble */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-200">{comment.user}</span>
                          <span className="text-[12px] text-slate-500">{comment.handle}</span>
                          <span className="text-[12px] text-slate-600">• {formatTimeAgo(comment.time)}</span>
                        </div>
                        
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed break-words">
                          {comment.text}
                        </p>

                        {/* Interactive Row Controls */}
                        <div className="flex items-center space-x-2 mt-3 text-[11px] font-semibold text-slate-500">
                          {/* Like Button */}
                          <button
                            onClick={() => toggleLike(comment.id)}
                            className={`flex items-center space-x-1 p-1 rounded-md hover:bg-slate-800/60 transition ${
                              hasLiked ? 'text-pink-500' : 'hover:text-slate-300'
                            }`}
                          >
                            {hasLiked ? <HiHandThumbUp className="w-4 h-4" /> : <HiOutlineHandThumbUp className="w-4 h-4" />}
                            <span>{totalLikes}</span>
                          </button>

                          {/* Dislike Button */}
                          <button
                            onClick={() => toggleDislike(comment.id)}
                            className={`flex items-center p-1 rounded-md hover:bg-slate-800/60 transition ${
                              hasDisliked ? 'text-purple-400' : 'hover:text-slate-300'
                            }`}
                          >
                            {hasDisliked ? <HiHandThumbDown className="w-4 h-4" /> : <HiOutlineHandThumbDown className="w-4 h-4" />}
                          </button>

                          <div className="h-3 w-px bg-slate-800 my-auto"></div>

                          {/* Reply Toggle Input Button */}
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="hover:text-slate-300 hover:bg-slate-800/60 px-2 py-0.5 rounded transition"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Show/Hide Nested Replies Toggle */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="pl-12 mt-2">
                        <button
                          onClick={() => toggleRepliesVisibility(comment.id)}
                          className="text-xs font-extrabold text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-2"
                        >
                          <span className="flex items-center">
                            {showReplies ? (
                              <FiChevronDown className="w-4 h-4" />
                            ) : (
                              <FiChevronRight className="w-4 h-4" />
                            )}
                          </span>
                          <span>{showReplies ? 'Hide replies' : `Show ${comment.replies.length} replies`}</span>
                        </button>
                      </div>
                    )}

                    {/* Nested Replies Drawer */}
                    <AnimatePresence>
                      {showReplies && comment.replies && comment.replies.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden pl-12 space-y-3 mt-3 border-l-2 border-slate-800/60 ml-4"
                        >
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-2 items-start py-1">
                              <div className={`h-6 w-6 rounded-full bg-gradient-to-br from-slate-700 to-green-800} flex items-center justify-center text-[12px] font-bold text-white shrink-0`}>
                                {reply.user.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[11px] font-bold text-slate-300">{reply.user}</span>
                                  <span className="text-[9px] text-slate-500">• {formatTimeAgo(reply.time)}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">{reply.text}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Inline Reply Input Drawer */}
                    <AnimatePresence>
                      {replyingTo === comment.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="pl-12 mt-3 flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            placeholder={`Reply to ${comment.user}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                            className="flex-1 bg-[#121522] border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddReply(comment.id)}
                            className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-all"
                          >
                            < FiSend className="w-3 h-3" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Desktop Read More Button */}
          {comments.length > visibleCountDesktop && (
            <div className="text-center pt-6 border-t border-slate-800/40">
              <button
                onClick={() => setVisibleCountDesktop(prev => prev + 5)}
                className="px-6 py-2 rounded-full border border-slate-800 bg-[#161a29] hover:bg-[#1f243a] text-xs font-bold text-slate-300 hover:text-white transition-all shadow"
              >
                Read More Comments (+{comments.length - visibleCountDesktop} remaining)
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MOBILE VIEW: Horizontal Slider Showing 1 card at a time                  */}
        {/* ========================================================================= */}
        <div className="block md:hidden">
          {/* Controls Panel */}
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs text-slate-400 font-bold">
              Showing {mobileCarouselIndex + 1} of {comments.length}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevMobilePage}
                disabled={mobileCarouselIndex === 0}
                className={`p-2 rounded-lg border border-slate-800/80 transition-all ${
                  mobileCarouselIndex === 0 ? 'opacity-40 cursor-not-allowed bg-slate-900/40' : 'bg-[#161a29] hover:bg-slate-800 text-white'
                }`}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMobilePage}
                disabled={mobileCarouselIndex >= comments.length - 1}
                className={`p-2 rounded-lg border border-slate-800/80 transition-all ${
                  mobileCarouselIndex >= comments.length - 1 ? 'opacity-40 cursor-not-allowed bg-slate-900/40' : 'bg-[#161a29] hover:bg-slate-800 text-white'
                }`}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Swiper Card Container */}
          <div ref={mobileSliderConstraintsRef} className="overflow-hidden relative py-2">
            <motion.div
              drag="x"
              dragConstraints={mobileSliderConstraintsRef}
              className="flex gap-4 w-full cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'pan-y' }}
            >
              {comments.slice(mobileCarouselIndex, mobileCarouselIndex + 1).map((comment) => {
                const hasLiked = likedComments.has(comment.id);
                const hasDisliked = dislikedComments.has(comment.id);
                const showReplies = expandedReplies.has(comment.id);
                const totalLikes = (comment.likes || 0) + (hasLiked ? 1 : 0);

                return (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex-1 min-w-[260px] bg-[#121522]/90 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      {/* User Metadata */}
                      <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800/50 mb-3">
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600  flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                          {comment.user.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{comment.user}</h4>
                          <span className="text-[12px] text-slate-500 truncate block">{comment.handle}</span>
                        </div>
                      </div>

                      {/* Content text */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {comment.text}
                      </p>
                    </div>

                    {/* Interactions Footer */}
                    <div className="mt-4 pt-2 border-t border-slate-800/40">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleLike(comment.id)}
                            className={`flex items-center space-x-1 ${hasLiked ? 'text-pink-500' : ''}`}
                          >
                            {hasLiked ? <HiHandThumbUp className="w-3.5 h-3.5" /> : <HiOutlineHandThumbUp className="w-3.5 h-3.5" />}
                            <span>{totalLikes}</span>
                          </button>
                          
                          <button
                            onClick={() => toggleDislike(comment.id)}
                            className={`${hasDisliked ? 'text-purple-400' : ''}`}
                          >
                            {hasDisliked ? <HiHandThumbDown className="w-3.5 h-3.5" /> : <HiOutlineHandThumbDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Reply Toggle */}
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-purple-400 font-bold hover:underline"
                        >
                          Reply
                        </button>
                      </div>

                      {/* Mobile View Replies indicator & Toggle */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2 pt-1 border-t border-slate-800/10">
                          <button
                            onClick={() => toggleRepliesVisibility(comment.id)}
                            className="text-[12px] font-extrabold text-slate-400 flex items-center justify-between w-full"
                          >
                            <span className="flex items-center space-x-2">
                              {showReplies ? (
                                <>
                                  <FiChevronDown className="w-4 h-4" />
                                  <span>Hide replies</span>
                                </>
                              ) : (
                                <>
                                  <FiChevronRight className="w-4 h-4" />
                                  <span>View {comment.replies.length} replies</span>
                                </>
                              )}
                            </span>
                          </button>

                          {showReplies && (
                            <div className="mt-2 space-y-2 max-h-[100px] overflow-y-auto pr-1 bg-[#161a29]/40 p-2 rounded-lg border border-slate-800/40">
                              {comment.replies.map(reply => (
                                <div key={reply.id} className="text-[12px] border-b border-slate-800/20 pb-1 last:border-none">
                                  <span className="font-bold text-slate-300">{reply.user}: </span>
                                  <span className="text-slate-400">{reply.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mobile Inline Reply Field */}
                      {replyingTo === comment.id && (
                        <div className="mt-2.5 flex items-center space-x-1.5">
                          <input
                            type="text"
                            placeholder="Add reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                            className="flex-1 bg-[#161a29] border border-slate-800 rounded-lg py-1 px-2.5 text-[11px] text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddReply(comment.id)}
                            className="p-1.5 bg-purple-600 rounded-lg text-white"
                          >
                            < FiSend className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple time-formatting helper
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};