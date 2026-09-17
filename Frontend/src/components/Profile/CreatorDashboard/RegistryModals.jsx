import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function RegistryModals({ activeModal, setActiveModal, followers, following, handleUnfollowTarget }) {
  return (
    <AnimatePresence>
      {activeModal === 'followers' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Followers </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {followers.map(f => (
                <div key={f.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={f.avatar} alt="Visualization" className="w-8 h-8 rounded-xl border border-slate-800 bg-slate-900" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">{f.name}</p>
                      <p className="text-[12px] text-slate-500">{f.handle}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest bg-slate-900 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">Following</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {activeModal === 'following' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Connection Subscriptions</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {following.length === 0 ? (
                <p className="text-xs text-slate-600 uppercase font-bold text-center py-6 tracking-wide">No remaining active channels followed.</p>
              ) : (
                following.map(f => (
                  <div key={f.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-cyan-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={f.avatar} alt="Identity Visualization" className="w-8 h-8 rounded-xl border border-slate-800 bg-slate-900" />
                      <div>
                        <p className="text-xs font-bold text-slate-200">{f.name}</p>
                        <p className="text-[12px] text-slate-500">{f.handle}</p>
                      </div>
                    </div>
                    <button onClick={() => handleUnfollowTarget(f.id)} className="px-3 py-1 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/50 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-400 transition-all rounded-lg">Unfollow</button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}