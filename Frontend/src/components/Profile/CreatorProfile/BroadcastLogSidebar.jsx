import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const cardHover = {
  rest: { y: 0, scale: 1, boxShadow: '0px 0px 0px rgba(139, 92, 246, 0)' },
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

export default function BroadcastLogSidebar() {
  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
        <Clock className="w-4 h-4 text-cyan-400" />
        <h3 className="font-bold text-base text-slate-200">Broadcast Node Activity Log</h3>
      </div>
      
      <div className="space-y-3">
        <div className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl space-y-2">
          <div className="flex justify-between items-start text-xs">
            <span className="font-bold text-slate-200">System Bootloader Engine</span>
            <span className="text-[10px]  text-emerald-400">Online</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">Zero-Dependency Matrix Engine core structural initialization parameters processed successfully.</p>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl space-y-2">
          <div className="flex justify-between items-start text-xs">
            <span className="font-bold text-slate-200">Creative Shader Masterclass</span>
            <span className="text-[10px]  text-amber-400">Tier Locked</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">Become a tier supporter node to deploy architectural shader files directly into your active directory canvas loops.</p>
        </div>
      </div>
    </GlassCard>
  );
}
