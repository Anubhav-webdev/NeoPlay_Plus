import React from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart2, Flame, UserPlus } from 'lucide-react';

const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -6,
    scale: 1.01,
    boxShadow: '0px 10px 30px rgba(139, 92, 246, 0.12)',
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

const GlassCard = ({ children, className = '', ...props }) => (
  <motion.div
    variants={cardHover}
    initial="rest"
    whileHover="hover"
    className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[24px] p-6 text-white shadow-xl transition-colors duration-300 hover:border-purple-500/30 ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

export default function MetricArchitecture({ followingCount, setActiveModal }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <GlassCard onClick={() => setActiveModal('followers')} className="cursor-pointer group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Followers</span>
          <Users className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">3,842</div>
        <p className="text-[10px] text-purple-400 mt-2 font-bold uppercase tracking-wider flex items-center gap-1">Open Registry &rarr;</p>
      </GlassCard>

      <GlassCard className="relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Viewers</span>
          <BarChart2 className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">142.9K</div>
        <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wider">High Vibe</p>
      </GlassCard>

      <GlassCard className="relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Algo Pulse</span>
          <Flame className="w-4 h-4 text-red-400 cd-live-dot rounded-full" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">98.4%</div>
        <p className="text-[10px] text-red-400 mt-2 font-bold uppercase tracking-wider">Optimal Threshold</p>
      </GlassCard>

      <GlassCard onClick={() => setActiveModal('following')} className="cursor-pointer group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Following Channel</span>
          <UserPlus className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{followingCount}</div>
        <p className="text-[10px] text-cyan-400 mt-2 font-bold uppercase tracking-wider flex items-center gap-1">Manage Connections &rarr;</p>
      </GlassCard>
    </div>
  );
}