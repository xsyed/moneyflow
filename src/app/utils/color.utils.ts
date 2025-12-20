/**
 * Determines if a hex color is dark based on relative luminance
 * Uses WCAG formula for relative luminance calculation
 * @param hexColor - Hex color code (with or without #)
 * @returns true if the color is dark (luminance < 0.5), false otherwise
 */
export function isDarkColor(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Calculate relative luminance using WCAG formula
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // If luminance < 0.5, it's a dark color
  return luminance < 0.5;
}
