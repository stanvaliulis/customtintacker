/**
 * Bleed and safe-area calculation utilities for the design editor.
 *
 * Standard printing terminology:
 *   - Bleed:     extra area outside the cut line that gets trimmed.
 *   - Safe area: margin inside the cut line where important content should stay.
 *   - Cut line:  the actual product boundary.
 *
 * All measurements are based on industry standards for tin tacker signs.
 */

/** 1/8 inch bleed on all sides */
export const BLEED_INCHES = 0.125;

/** 1/4 inch safe area inside cut line */
export const SAFE_AREA_INCHES = 0.25;

/** Pixels per inch for screen display (72 DPI) */
export const PPI = 72;

/**
 * Convert a measurement in inches to pixels at screen resolution.
 */
export function inchesToPixels(inches: number): number {
  return Math.round(inches * PPI);
}

/**
 * Convert a measurement in pixels to inches at screen resolution.
 */
export function pixelsToInches(pixels: number): number {
  return pixels / PPI;
}

/**
 * Get the bleed offset in pixels (the extra margin added outside the cut line).
 */
export function getBleedOffset(): number {
  return inchesToPixels(BLEED_INCHES);
}

/**
 * Get the safe area offset in pixels (the inner margin from the cut line).
 */
export function getSafeAreaOffset(): number {
  return inchesToPixels(SAFE_AREA_INCHES);
}

/**
 * Canvas dimension result including the product area and the total
 * canvas size with bleed added on all sides.
 */
export interface CanvasDimensions {
  /** Product width in pixels (cut-line to cut-line) */
  width: number;
  /** Product height in pixels (cut-line to cut-line) */
  height: number;
  /** Total canvas width including bleed on both sides */
  bleedWidth: number;
  /** Total canvas height including bleed on both sides */
  bleedHeight: number;
}

/**
 * Calculate canvas dimensions from product size in inches.
 *
 * The "width" and "height" are the cut-line dimensions.
 * The "bleedWidth" and "bleedHeight" include the 1/8" bleed on each side.
 */
export function getCanvasDimensions(
  widthInches: number,
  heightInches: number,
): CanvasDimensions {
  const width = inchesToPixels(widthInches);
  const height = inchesToPixels(heightInches);
  const bleed = getBleedOffset();

  return {
    width,
    height,
    bleedWidth: width + bleed * 2,
    bleedHeight: height + bleed * 2,
  };
}
