
import { StyleSheet } from 'react-native';

// Port of the Future Conference 2026 Theme
export const colors = {
  // Primary brand colors - maritime/ocean theme
  primary: '#0066CC', // Deep ocean blue
  primaryDark: '#004C99',
  primaryLight: '#3385D6',
  
  // Secondary colors
  secondary: '#00A3E0', // Bright cyan
  accent: '#FF6B35', // Coral orange for CTAs
  
  // Neutral colors
  background: '#FFFFFF',
  backgroundDark: '#0A1929',
  card: '#F8FAFC',
  cardDark: '#1E293B',
  
  // Text colors
  text: '#1E293B',
  textDark: '#F1F5F9',
  textSecondary: '#64748B',
  textSecondaryDark: '#94A3B8',
  
  // UI colors
  border: '#E2E8F0',
  borderDark: '#334155',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  
  // Highlight
  highlight: '#E0F2FE',
  highlightDark: '#0C4A6E',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputDark: {
    backgroundColor: colors.backgroundDark,
    borderColor: colors.borderDark,
    color: colors.textDark,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
});
