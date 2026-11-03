import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";

interface LoaderProps {
  ready: boolean;
  progress: number;
  reducedMotion: boolean;
}

const Loader = ({ ready, progress, reducedMotion }: LoaderProps) => {
  const pct = Math.round(Math.min(100, Math.max(0, progress)));
  const indeterminate = pct === 0;

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="loader"
          className="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-volt-bg px-6 text-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.6, ease: "easeOut" }}
          aria-busy="true"
        >
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-volt-cyan" aria-hidden="true" fill="currentColor" />
            <span className="bg-gradient-to-r from-volt-cyan to-volt-magenta bg-clip-text font-heading text-3xl font-black uppercase tracking-[0.2em] text-transparent sm:text-4xl">
              Volt
            </span>
          </div>

          <div className="w-full max-w-xs">
            <div
              role="progressbar"
              aria-label="Loading the lounge"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={indeterminate ? undefined : pct}
              className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r from-volt-cyan to-volt-magenta transition-[width] duration-300 ease-out motion-reduce:transition-none ${
                  indeterminate ? "w-1/3 animate-pulse motion-reduce:animate-none" : ""
                }`}
                style={indeterminate ? undefined : { width: `${pct}%` }}
              />
            </div>
            <p className="mt-3 font-heading text-xs uppercase tracking-[0.2em] text-slate-300">
              Powering up the lounge{indeterminate ? "" : ` ${pct}%`}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
