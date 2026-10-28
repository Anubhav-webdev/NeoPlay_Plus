import { motion } from "framer-motion";
import { Users, BarChart2, Flame, UserPlus } from "lucide-react";

const metrics = [
  { key: "publishedCount", label: "Published", icon: Flame, color: "text-purple-400" },
  { key: "totalViews", label: "Total views", icon: BarChart2, color: "text-blue-400" },
  { key: "subscriberCount", label: "Subscribers", icon: Users, color: "text-cyan-400" },
  { key: "contentCount", label: "All content", icon: UserPlus, color: "text-green-400" },
];

export default function MetricArchitecture({ analytics }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map(({ key, label, icon: Icon, color }) => (
        <motion.div
          key={key}
          whileHover={{ y: -4 }}
          className="rounded-[24px] border border-slate-800/60 bg-slate-900/40 p-6 text-white shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <div className="text-xl font-bold tracking-tight sm:text-2xl">
            {(analytics?.[key] || 0).toLocaleString()}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
