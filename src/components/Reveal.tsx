import { createContext, useContext } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

// Subtle appear-on-scroll. 16px rise, 500ms, strong ease-out (cubic-bezier(0.23,1,0.32,1)),
// once only. Reduced motion: opacity only, shorter.
const EASE = [0.23, 1, 0.32, 1] as const;
const InGroup = createContext(false);

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds before this reveal starts (standalone / item use). */
  delay?: number;
  /** Makes this a group: direct Reveal children inherit its trigger and appear staggered by this many seconds. */
  stagger?: number;
  /** Rise distance in px. */
  y?: number;
}

const Reveal = ({ children, className, delay = 0, stagger, y = 16 }: RevealProps) => {
  const reduce = useReducedMotion();
  const inGroup = useContext(InGroup);
  const dist = reduce ? 0 : y;

  const variants: Variants = {
    hidden: { opacity: 0, y: dist },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.25 : 0.5, ease: EASE, delay },
    },
  };

  // A group parent only orchestrates (no movement of its own) so children are not moved twice.
  if (stagger !== undefined) {
    const groupVariants: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: stagger, delayChildren: delay } },
    };
    return (
      <InGroup.Provider value>
        <motion.div
          className={className}
          variants={groupVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        >
          {children}
        </motion.div>
      </InGroup.Provider>
    );
  }

  if (inGroup) {
    return (
      <motion.div className={className} variants={variants}>
        <InGroup.Provider value={false}>{children}</InGroup.Provider>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
