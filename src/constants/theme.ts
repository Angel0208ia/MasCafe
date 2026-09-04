/**
 * Tokens de diseño tomados del mockup de Mas Café.
 */
export const colors = {
  background: '#FAF6F0',
  surface: '#FFFFFF',
  primary: '#3B2318',
  onPrimary: '#FFFFFF',
  border: '#EFE6DA',
  chipBorder: '#DFD3C3',
  thumb: '#F3E9DC',
  text: '#1B1512',
  muted: '#8B7E73',
  success: '#2E7D32',
  danger: '#B3261E',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const font = {
  title: 26,
  heading: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

export const layout = {
  contentMaxWidth: 1120,
  narrowMaxWidth: 820,
  detailMaxWidth: 1040,
  tabletBreakpoint: 720,
  desktopBreakpoint: 960,
};

export function getScreenPadding(width: number): number {
  if (width < 360) return spacing.md;
  if (width >= layout.tabletBreakpoint) return spacing.xl;
  return spacing.lg;
}
