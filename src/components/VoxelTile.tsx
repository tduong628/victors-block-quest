import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { getPressTap } from "../lib/animation";

export interface VoxelTileProps {
  /** Symbol rendered on the upright top-face plate. Prefer this over `children` for the
   * common case — it guarantees the accessible name (when interactive) is the bare glyph. */
  symbol?: ReactNode;
  /** CSS color (var(--tc-400) etc.) used to derive the top/front/side face shades. */
  baseColor: string;
  /** Footprint width — a number is read as px; a string ("100%") is passed through so a
   * parent can drive size responsively. Height matches (1:1 aspect-ratio) so the whole
   * element is the hit target per DESIGN_SPEC.md §9's "whole tile = hit area" rule. */
  size?: number | string;
  /** 0..1 — fills the front-left face bottom-up in teal-pine (mastery brick-fill, §6). */
  fillRatio?: number;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  symbolClassName?: string;
  "data-testid"?: string;
  "aria-label"?: string;
  disabled?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Pseudo-isometric voxel cube (DESIGN_SPEC.md §6): three flat clip-path faces, no 3D
 * transform anywhere in the stack. The symbol sits on `.voxel-tile__content`, a plain
 * absolutely-positioned layer with zero rotation/skew, so the glyph a child is learning
 * always renders upright regardless of the cube's isometric body.
 */
export default function VoxelTile({
  symbol,
  baseColor,
  size = 96,
  fillRatio,
  interactive = true,
  onClick,
  className = "",
  symbolClassName = "",
  disabled = false,
  style,
  children,
  ...rest
}: VoxelTileProps) {
  const cssVars = {
    ["--voxel-base" as string]: baseColor,
    ["--voxel-size" as string]: typeof size === "number" ? `${size}px` : size,
    ...style,
  } as CSSProperties;

  const faces = (
    <>
      <span className="voxel-tile__face voxel-tile__face--right" aria-hidden="true" />
      <span className="voxel-tile__face voxel-tile__face--left" aria-hidden="true">
        {typeof fillRatio === "number" && (
          <span
            className="voxel-tile__fill"
            aria-hidden="true"
            style={{ height: `${Math.max(0, Math.min(1, fillRatio)) * 100}%` }}
          />
        )}
      </span>
      <span className="voxel-tile__face voxel-tile__face--top" aria-hidden="true" />
      <span className="voxel-tile__edges" aria-hidden="true" />
      <span className={`voxel-tile__content font-symbol text-ink ${symbolClassName}`}>
        {symbol}
      </span>
      {children}
    </>
  );

  if (!interactive) {
    return (
      <div className={`voxel-tile voxel-tile--static ${className}`} style={cssVars} {...rest}>
        {faces}
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      className={`voxel-tile ${className}`}
      style={cssVars}
      onClick={onClick}
      disabled={disabled}
      whileTap={getPressTap()}
      whileHover={{ y: -2 }}
      {...rest}
    >
      {faces}
    </motion.button>
  );
}
