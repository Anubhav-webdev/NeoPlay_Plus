// src/components/helpSupport/CommunityGuidelines.jsx

import { motion } from "framer-motion";
import {
  FiShield,
  FiUsers,
  FiSlash,
  FiBookOpen,
  FiCheckCircle,
  FiFlag,
} from "react-icons/fi";

const guidelines = [
  {
    title: "Respect Everyone",
    icon: FiUsers,
    desc: "Treat everyone with kindness. Harassment, hate speech, and bullying are not allowed.",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "No Spam",
    icon: FiSlash,
    desc: "Avoid repetitive posts, fake engagement, misleading content, or unwanted promotions.",
    color: "from-red-500 to-orange-500",
  },
  {
    title: "Respect Copyright",
    icon: FiBookOpen,
    desc: "Only upload content you own or have permission to share.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Safe Content",
    icon: FiShield,
    desc: "Content containing violence, illegal activities, or harmful material may be removed.",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Authentic Accounts",
    icon: FiCheckCircle,
    desc: "Do not impersonate individuals, brands, or organizations.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    title: "Report Violations",
    icon: FiFlag,
    desc: "Use the Report page to report users or content that violates our guidelines.",
    color: "from-yellow-500 to-orange-500",
  },
];

export default function CommunityGuidelines() {
  return (
    <section>

      <div className="text-center mb-12">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
          <FiShield />
          Community Guidelines
        </div>

        <h2 className="text-4xl font-bold mt-5">
          Keep NeoPlay+ Safe
        </h2>

        <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
          Help us create a respectful and enjoyable community by following these simple guidelines.
        </p>

      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 all-font">

        {guidelines.map((item, index) => {

          const Icon = item.icon;

          return (

            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -8,
                scale: 1.02,
              }}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:border-green-500/40 transition-all"
            >

              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center`}
              >
                <Icon size={30} />
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                {item.title}
              </h3>

              <p className="mt-3 text-gray-400 leading-7">
                {item.desc}
              </p>

            </motion.div>

          );

        })}

      </div>

    </section>
  );
}