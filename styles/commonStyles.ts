
import { StyleSheet } from 'react-native';

// Port of the Future Conference 2026 - Deep Navy Theme
export const colors = {
  // Core colors - Deep Navy System
  background: '#012A4A',        // Deep navy background
  card: '#0B4F7A',              // Medium navy cards
  cardAlt: '#0E4A73',           // Card alt / Inputs
  accent: '#19B5D8',            // Bright cyan selected states
  
  // Text colors
  text: '#FFFFFF',              // White primary text
  textSecondary: '#A9C7DE',     // Muted blue secondary text
  textMuted: '#7FA8C4',         // Muted text
  
  // UI colors
  error: '#FF5C7A',             // Error state
  success: '#10B981',           // Success state
  warning: '#F59E0B',           // Warning state
  
  // Utility colors
  border: 'rgba(169, 199, 222, 0.2)',  // Subtle borders
  overlay: 'rgba(1, 42, 74, 0.9)',     // Modal overlays
  
  // Legacy support (for gradual migration)
  primary: '#19B5D8',           // Maps to accent
  primaryDark: '#0E4A73',
  primaryLight: '#19B5D8',
  
  // Dark mode (same as light for this theme)
  backgroundDark: '#012A4A',
  cardDark: '#0B4F7A',
  textDark: '#FFFFFF',
  textSecondaryDark: '#A9C7DE',
  borderDark: 'rgba(169, 199, 222, 0.2)',
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: colors.cardDark,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  titleDark: {
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  subtitleDark: {
    color: colors.textSecondaryDark,
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputDark: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.borderDark,
    color: colors.textDark,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
});
