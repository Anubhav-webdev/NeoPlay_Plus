// src/components/helpSupport/FAQSection.jsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronDown,
  FiHelpCircle,
} from "react-icons/fi";

const faqData = [
  {
    id: "account",
    title: "Account & Login",
    faqs: [
      {
        question: "How do I reset my password?",
        answer:
          "Go to the Login page and click 'Forgot Password' to receive a password reset link.",
      },
      {
        question: "Can I change my email address?",
        answer:
          "Yes. Visit Profile Settings and update your email after verification.",
      },
    ],
  },
  {
    id: "videos",
    title: "Videos",
    faqs: [
      {
        question: "Why is my video still processing?",
        answer:
          "Large videos take longer to process. Please wait a few minutes before refreshing.",
      },
      {
        question: "Which video formats are supported?",
        answer:
          "NeoPlay+ supports MP4, MOV, AVI and WebM uploads.",
      },
    ],
  },
  {
    id: "playlist",
    title: "Playlist & Wishlist",
    faqs: [
      {
        question: "How do I create a playlist?",
        answer:
          "Open any video and click Save → Create Playlist.",
      },
      {
        question: "What's the difference between Playlist and Wishlist?",
        answer:
          "Playlists organize multiple items, while Wishlist saves content you want to view later.",
      },
    ],
  },
  {
    id: "creator",
    title: "Creator Studio",
    faqs: [
      {
        question: "How do I become a creator?",
        answer:
          "Open Creator Studio and complete your creator profile before uploading content.",
      },
      {
        question: "Why was my upload rejected?",
        answer:
          "Uploads may be rejected if they violate community guidelines or supported file requirements.",
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    faqs: [
      {
        question: "Why am I not receiving notifications?",
        answer:
          "Check your notification settings and ensure browser notifications are enabled.",
      },
      {
        question: "Can I disable email notifications?",
        answer:
          "Yes. Go to Settings → Notifications and customize your preferences.",
      },
    ],
  },
  {
    id: "subscription",
    title: "Subscription",
    faqs: [
      {
        question: "Can I cancel my subscription anytime?",
        answer:
          "Yes. You can manage or cancel your subscription from Account Settings.",
      },
      {
        question: "Will my premium features stop immediately?",
        answer:
          "Premium access remains active until the current billing period ends.",
      },
    ],
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-600/10 border border-purple-500/20 px-4 py-2 text-purple-300 text-sm">
          <FiHelpCircle />
          Frequently Asked Questions
        </div>

        <h2 className="text-4xl font-bold mt-5">
          Common Questions
        </h2>

        <p className="text-gray-400 mt-3">
          Find quick answers to the most common questions.
        </p>
      </div>

      <div className="space-y-10 all-font">

        {faqData.map((section) => (

          <div key={section.id} id={section.id}>

            <h3 className="text-2xl font-bold mb-5">
              {section.title}
            </h3>

            <div className="space-y-4">

              {section.faqs.map((faq, index) => {

                const itemId = `${section.id}-${index}`;

                return (
                  <div
                    key={itemId}
                    className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                  >

                    <button
                      onClick={() =>
                        setOpen(open === itemId ? null : itemId)
                      }
                      className="w-full flex items-center justify-between p-5 text-left"
                    >

                      <span className="font-medium">
                        {faq.question}
                      </span>

                      <motion.div
                        animate={{
                          rotate: open === itemId ? 180 : 0,
                        }}
                      >
                        <FiChevronDown size={22} />
                      </motion.div>

                    </button>

                    <AnimatePresence>

                      {open === itemId && (

                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                          }}
                          exit={{
                            opacity: 0,
                            height: 0,
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 text-gray-400 leading-7">
                            {faq.answer}
                          </div>
                        </motion.div>

                      )}

                    </AnimatePresence>

                  </div>
                );

              })}

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}