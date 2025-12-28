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

/**
 * Color mapping for dark mode
 * Maps light entry colors to their darker equivalents for dark mode
 */
const DARK_MODE_COLOR_MAP: Record<string, string> = {
  '#fafafa': '#808080',   // Light gray → Medium gray
  '#00A5E3': '#005A8A',   // Blue → Dark blue
  '#8DD7BF': '#2E6E55',   // Teal → Dark teal
  '#FFBF65': '#996B29',   // Orange → Dark orange
  '#FF96C5': '#994A6B'    // Pink → Dark pink
};

/**
 * Get the dark mode equivalent of a color
 * @param hexColor - Light mode hex color (with or without #)
 * @returns Dark mode hex color if mapping exists, otherwise original color
 */
export function getDarkModeColor(hexColor: string): string {
  // Normalize color format
  const normalized = (hexColor.startsWith('#') ? hexColor : `#${hexColor}`).toUpperCase();

  // Find mapped color (case-insensitive)
  const mappedColor = Object.entries(DARK_MODE_COLOR_MAP).find(
    ([light]) => light.toUpperCase() === normalized
  );

  return mappedColor ? mappedColor[1] : hexColor;
}
