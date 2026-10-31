import { motion } from "framer-motion";
import { Radio, Check } from "lucide-react";
import { C, FONT_DISPLAY } from "./homeTokens";

export default function HomePremiumBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl"
      style={{ border: `1px solid ${C.amberDim}` }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(115deg, ${C.ink} 0%, #1a1306 45%, ${C.ink} 100%)`,
        }}
      />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-7 px-6 sm:px-10 md:px-12 py-9 sm:py-11">
        <div className="max-w-xl">
          <span
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 all-font"
            style={{
              backgroundColor: "rgba(255,122,51,0.15)",
              color: C.blue,
            }}
          >
            <Radio size={11} /> Special Broadcast
          </span>
          <motion.h2
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            style={{
              fontFamily: FONT_DISPLAY,
              color: C.paper,
              letterSpacing: "0.01em",
            }}
            className="text-4xl sm:text-5xl leading-none"
          >
            NeoPlay+ Premium
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-3 text-sm sm:text-base max-w-md"
            style={{ color: C.body }}
          >
            Tune in without interruptions. Early access to new channels, offline
            downloads, and saves that follow you everywhere.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="flex flex-wrap gap-x-5 gap-y-2 mt-5"
          >
            {[
              "Ad-free viewing",
              "Early access drops",
              "Offline channels",
              "Cloud saves",
            ].map((f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: C.muted }}
              >
                <Check size={12} color={C.purple} /> {f}
              </span>
            ))}
          </motion.div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="px-7 py-4 rounded-xl font-bold whitespace-nowrap transition-transform cursor-pointer text-sm shrink-0"
          style={{ backgroundColor: C.blue, color: C.ink }}
        >
          Tune In to Premium
        </motion.button>
      </div>
    </motion.section>
  );
}

