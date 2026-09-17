import { motion } from "framer-motion";
import { Radio, TrendingUp, Users, Eye } from "lucide-react";
import { C, StatCard } from "./HomeConstants";

export default function HomeDashboard() {
  const stats = [
    { icon: Radio, value: "18+", label: "Total Users", accent: C.purple },
    { icon: TrendingUp, value: "56+", label: "Trending Today", accent: C.blue },
    { icon: Users, value: "12+", label: "Total Creators", accent: C.purple },
    { icon: Eye, value: "48.2M", label: "Total Views", accent: C.paper },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.08, duration: 0.35 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </motion.section>
  );
}

