
import FAQSection from "../Help&Support/FAQSection";
import ContactSupport from "../Help&Support/ContactSupport";
import CommunityGuidelines from "../Help&Support/CommunityGuidelines";
import PrivacySafety from "../Help&Support/PrivacySafety";

import { motion } from "framer-motion";

export default function HelpSupport() {
  return (
    <main className="min-h-screen bg-transparent text-[#F8FAFC] overflow-hidden">

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -50, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[450px] h-[450px] rounded-full bg-purple-700/20 blur-[120px] top-0 left-0"
        />

        <motion.div
          animate={{
            x: [0, -100, 60, 0],
            y: [0, 80, -60, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[450px] h-[450px] rounded-full bg-blue-700/20 blur-[120px] bottom-0 right-0"
        />
      </div>

      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10 space-y-24">
          <PrivacySafety />
         <FAQSection />
         <CommunityGuidelines />
         <ContactSupport />


      </div>

    </main>
  );
}