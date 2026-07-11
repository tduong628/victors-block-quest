import { useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";

export const snapSpring: Transition = { type: "spring", stiffness: 320, damping: 24, mass: 0.9 };
export const snapSoft: Transition = { type: "spring", stiffness: 260, damping: 26, mass: 1.0 };
export const brickPop: Transition = { type: "spring", stiffness: 400, damping: 18, mass: 0.7 };
export const pressTap = { scale: 0.94 } as const;

export const reducedCrossFade: Transition = { duration: 0.12, ease: "linear" };
export const reducedTap = {} as const;

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

// React-component variant of prefersReducedMotion() that re-renders when the OS preference
// changes mid-session (framer-motion's useReducedMotion subscribes to the matchMedia listener).
export function useReducedMotionPreference(): boolean {
  return useReducedMotion() ?? false;
}
