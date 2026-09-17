// src/components/helpSupport/PrivacySafety.jsx

import { motion } from "framer-motion";
import {
  FiLock,
  FiShield,
  FiKey,
  FiEye,
  FiSmartphone,
  FiDatabase,
} from "react-icons/fi";

const privacyItems = [
  {
    title: "Secure Login",
    icon: FiLock,
    desc: "Your account is protected with secure authentication and encrypted passwords.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    title: "Privacy Controls",
    icon: FiEye,
    desc: "Control who can view your profile, playlists, and uploaded content.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Data Protection",
    icon: FiDatabase,
    desc: "NeoPlay+ protects your personal information using modern security practices.",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Account Recovery",
    icon: FiKey,
    desc: "Recover your account quickly using your registered email address.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    title: "Trusted Devices",
    icon: FiSmartphone,
    desc: "View and manage devices connected to your NeoPlay+ account.",
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Platform Security",
    icon: FiShield,
    desc: "We continuously monitor the platform to help keep your account and content safe.",
    color: "from-cyan-500 to-blue-500",
  },
];

export default function PrivacySafety() {
  return (
    <section>

     
      <div className="relative group cursor-pointer">
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 sidebar-font">
                  Neoplay+ Help & Support Zone
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />
              </span>
            </h2>
          </div>
           <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
          <FiShield />
          Privacy & Security
        </div>

        <h2 className="mt-5 text-4xl font-bold">
          Your Privacy Matters
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-gray-400">
          NeoPlay+ is designed with privacy and security in mind, helping you
          stay in control of your account and personal information.
        </p>

      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 all-font">

        {privacyItems.map((item, index) => {

          const Icon = item.icon;

          return (

            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: .45,
                delay: index * .08,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -8,
                scale: 1.02,
              }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-blue-500/40 transition-all"
            >

              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${item.color}`}
              >
                <Icon size={30} />
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                {item.title}
              </h3>

              <p className="mt-3 leading-7 text-gray-400">
                {item.desc}
              </p>

            </motion.div>

          );

        })}

      </div>

    </section>
  );
}