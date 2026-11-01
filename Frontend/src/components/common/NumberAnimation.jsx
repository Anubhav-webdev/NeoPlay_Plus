import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

/**
 * Formats standard numbers into compact YouTube-style notation (e.g. 1.2K, 4.5M).
 */
export function formatCompactNumber(num) {
  if (typeof num !== "number" || isNaN(num)) return "0";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(num);
}

function RollingDigit({ digit }) {
  const num = parseInt(digit, 10);
  const isNumber = !isNaN(num);

  const animatedValue = useSpring(isNumber ? num : 0, {
stiffness: 100,
damping: 22,
mass: 0.8,
  });

  useEffect(() => {
    if (isNumber) {
      animatedValue.set(num);
    }
  }, [num, isNumber, animatedValue]);

  // Interpolate y offset dynamically for fluid motion
  const y = useTransform(animatedValue, (v) => `${-v * 10}%`);

  if (!isNumber) {
    return <span className="inline-block select-none">{digit}</span>;
  }
  return (
    <span className="relative inline-block h-[1em] overflow-hidden leading-none align-baseline">
      <motion.span
        style={{ y }}
        className="flex flex-col text-center will-change-transform"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="flex h-[1em] items-center justify-center leading-none select-none"
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
/**
 * Smooth YouTube Rolling Digit Counter
 */
export default function NumberAnimation({
  value = 0,
  compact = true,
  className = "",
}) {
  const formatted = compact
    ? formatCompactNumber(value)
    : Math.round(value).toLocaleString();

  const characters = formatted.split("");

  return (
    <span
      className={`inline-flex items-baseline font-mono tabular-nums leading-none tracking-normal ${className}`}
    >
      {characters.map((char, index) => (
        <RollingDigit
          key={`${characters.length - index}`}
          digit={char}
        />
      ))}
    </span>
  );
}