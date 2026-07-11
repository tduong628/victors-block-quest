import { useReducedMotion } from "framer-motion";
import type { Target, TargetAndTransition, Transition } from "framer-motion";

export const snapSpring: Transition = { type: "spring", stiffness: 320, damping: 24, mass: 0.9 };
export const snapSoft: Transition = { type: "spring", stiffness: 260, damping: 26, mass: 1.0 };
export const brickPop: Transition = { type: "spring", stiffness: 400, damping: 18, mass: 0.7 };
export const pressTap = { scale: 0.94 } as const;

export const reducedCrossFade: Transition = { duration: 0.12, ease: "linear" };
export const reducedTap = {} as const;

export interface MotionVariant {
  initial: Target;
  animate: Target;
  transition: Transition;
}

// prefers-reduced-motion must gate spring configs directly (not only via CSS media queries),
// because Framer Motion springs animate transform/opacity through JS-driven RAF, which a
// CSS @media block cannot intercept.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getSnapSpring(): Transition {
  return prefersReducedMotion() ? reducedCrossFade : snapSpring;
}

export function getSnapSoft(): Transition {
  return prefersReducedMotion() ? reducedCrossFade : snapSoft;
}

export function getBrickPop(): Transition {
  return prefersReducedMotion() ? reducedCrossFade : brickPop;
}

export function getPressTap(): typeof pressTap | typeof reducedTap {
  return prefersReducedMotion() ? reducedTap : pressTap;
}

// Swapping only the `transition` timing is not enough: under reduced motion, DESIGN_SPEC.md §9
// requires killing translate/scale/overshoot entirely, not just easing them differently. Every
// signature-moment helper below returns a full { initial, animate, transition } trio so a caller
// that spreads the result can never end up animating x/y/scale while motion is reduced.
function buildVariant(reducedMotion: boolean, full: MotionVariant): MotionVariant {
  if (!reducedMotion) {
    return full;
  }
  return {
    initial: { opacity: full.initial.opacity ?? 0 },
    animate: { opacity: full.animate.opacity ?? 1 },
    transition: reducedCrossFade,
  };
}

// Map assembly on load: nodes drop-and-snap into place (DESIGN_SPEC.md §5.1).
export function getDropSnapVariant(): MotionVariant {
  return buildVariant(prefersReducedMotion(), {
    initial: { y: -24, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: snapSpring,
  });
}

// Discover giant symbol snapping to full size (DESIGN_SPEC.md §5.2).
export function getScaleInVariant(): MotionVariant {
  return buildVariant(prefersReducedMotion(), {
    initial: { scale: 0.85, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: snapSpring,
  });
}

// Generic screen/card enter transition (DESIGN_SPEC.md §5, snapSoft-driven moments).
export function getEnterVariant(): MotionVariant {
  return buildVariant(prefersReducedMotion(), {
    initial: { y: 12, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: snapSoft,
  });
}

export type WrongAnswerCue =
  | { kind: "shake"; animate: TargetAndTransition; transition: Transition }
  | { kind: "flash" };

// Find-it wrong-tap feedback: a horizontal shake normally, a --tc-600 border flash under reduced
// motion (DESIGN_SPEC.md §5.3 and §9 — the shake is explicitly replaced, not just shortened).
export function getWrongAnswerCue(): WrongAnswerCue {
  if (prefersReducedMotion()) {
    return { kind: "flash" };
  }
  return { kind: "shake", animate: { x: [0, -6, 6, -4, 0] }, transition: { duration: 0.18 } };
}

// React-component variant of prefersReducedMotion() that re-renders when the OS preference
// changes mid-session (framer-motion's useReducedMotion subscribes to the matchMedia listener).
export function useReducedMotionPreference(): boolean {
  return useReducedMotion() ?? false;
}
