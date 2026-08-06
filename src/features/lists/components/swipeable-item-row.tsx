"use client";

import { motion, type PanInfo } from "motion/react";
import { Check, Trash2 } from "lucide-react";

/** Distance the row must be dragged to trigger an action. */
const SWIPE_THRESHOLD = 80;

/**
 * Wraps a list row with horizontal swipe gestures.
 * - Swipe right → onSwipeRight (toggle checked)
 * - Swipe left  → onSwipeLeft (delete)
 * The row snaps back to origin on release unless an action fires.
 * Existing tap controls inside the row keep working (drag needs movement).
 */
export function SwipeableItemRow({
  children,
  onSwipeRight,
  onSwipeLeft,
}: {
  children: React.ReactNode;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}) {
  function handleDragEnd(_event: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) onSwipeRight();
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipeLeft();
  }

  return (
    <div className="relative overflow-hidden">
      {/* Reveal on right swipe: green check (left edge) */}
      <div className="absolute inset-y-0 left-0 flex items-center bg-emerald-500/90 pl-6 text-white">
        <Check className="size-5" />
      </div>
      {/* Reveal on left swipe: red trash (right edge) */}
      <div className="absolute inset-y-0 right-0 flex items-center bg-destructive pr-6 text-white">
        <Trash2 className="size-5" />
      </div>
      <motion.div
        drag="x"
        dragSnapToOrigin
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.98 }}
        className="relative bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
}
