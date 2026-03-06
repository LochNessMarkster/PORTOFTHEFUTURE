
import { StyleSheet } from 'react-native';

// Port of the Future Conference 2026 - Nautical Design System
export const colors = {
  // Core nautical theme colors
  background: '#012A4A',      // Deep navy background
  card: '#0B4F7A',            // Medium navy cards
  cardAlt: '#0E4A73',         // Card Alt / Inputs
  accent: '#19B5D8',          // Bright cyan (Accent / Selected)
  
  // Text colors
  primaryText: '#FFFFFF',     // White primary text
  secondaryText: '#A9C7DE',   // Muted blue secondary text
  mutedText: '#7FA8C4',       // Muted text
  
  // UI colors
  error: '#FF5C7A',           // Error state
  border: 'rgba(255,255,255,0.10)', // Subtle borders
  
  // Legacy aliases for backward compatibility
  primary: '#19B5D8',
  primaryDark: '#0E4A73',
  primaryLight: '#19B5D8',
  secondary: '#19B5D8',
  
  // Dark mode (same as light for this theme)
  backgroundDark: '#012A4A',
  cardDark: '#0B4F7A',
  textDark: '#FFFFFF',
  textSecondaryDark: '#A9C7DE',
  borderDark: 'rgba(255,255,255,0.10)',
  
  // Additional UI states
  success: '#10B981',
  warning: '#F59E0B',
  highlight: '#19B5D8',
  highlightDark: '#0E4A73',
  
  // Deprecated - kept for compatibility
  text: '#FFFFFF',
  textSecondary: '#A9C7DE',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDark: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 8,
  },
  titleDark: {
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    marginBottom: 16,
  },
  subtitleDark: {
    color: colors.textSecondaryDark,
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.primaryText,
  },
  inputDark: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.borderDark,
    color: colors.textDark,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: colors.mutedText,
    opacity: 0.5,
  },
});
