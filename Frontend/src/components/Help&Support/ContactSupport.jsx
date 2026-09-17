// src/components/helpSupport/ContactSupport.jsx

import { motion } from "framer-motion";
import {
  FiMail,
  FiMessageCircle,
  FiFileText,
  FiArrowRight,
} from "react-icons/fi";

const contacts = [
  {
    title: "Email Support",
    icon: FiMail,
    desc: "Send us your questions and we'll respond as soon as possible.",
    action: "support@neoplay.com",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Live Chat",
    icon: FiMessageCircle,
    desc: "Chat with our support team during working hours.",
    action: "Coming Soon",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Support Ticket",
    icon: FiFileText,
    desc: "Create a support ticket and track your issue.",
    action: "Open Ticket",
    color: "from-green-500 to-emerald-500",
  },
];

export default function ContactSupport() {
  return (
    <section>

      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold">
          Contact Support
        </h2>

        <p className="text-gray-400 mt-3">
          Still need help? Reach out to our support team.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 all-font">

        {contacts.map((item, index) => {

          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.15,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -8,
              }}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7"
            >

              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r ${item.color}`}
              >
                <Icon size={30} />
              </div>

              <h3 className="mt-6 text-2xl font-semibold">
                {item.title}
              </h3>

              <p className="mt-4 text-gray-400 leading-7">
                {item.desc}
              </p>

              <button
                className="mt-8 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
              >
                {item.action}

                <FiArrowRight />
              </button>

            </motion.div>
          );

        })}

      </div>

    </section>
  );
}