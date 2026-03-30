// Design tokens for AVA 2.0 Mobile App
// Based on web design (Tailwind config)

export const colors = {
  // Primary colors (web design)
  primary: '#39E079', // Main green
  primaryDark: '#2BC868',
  primaryLight: '#4EEA8F',
  
  // Background colors
  background: '#122017', // Dark green/black
  backgroundLight: '#f6f8f7', // Light gray
  
  // Text colors
  text: '#f6f8f7', // Primary text (light)
  textSecondary: '#a0a0a0', // Secondary text
  textDark: '#122017', // Dark text (on light backgrounds)
  
  // Semantic colors
  success: '#39E079',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Component colors
  card: '#1a2a1f', // Card background (slightly lighter than background)
  cardLight: '#ffffff', // Light card background
  input: '#1a2a1f', // Input background
  inputBorder: '#39E079', // Input border
  button: '#39E079', // Button background
  buttonText: '#122017', // Button text
  buttonTextLight: '#f6f8f7', // Light button text
  
  // Tab bar (if using bottom tabs)
  tabBar: '#122017',
  tabBarActive: '#39E079',
  tabBarInactive: '#a0a0a0',
};

export const typography = {
  // Font families
  fontFamily: 'Lexend', // Web design font
  
  // Font sizes
  title: 48,
  subtitle: 18,
  heading: 24,
  body: 16,
  small: 14,
  tiny: 12,
  
  // Font weights
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Default export with all tokens
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadow,
};

export default theme;
