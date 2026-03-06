
import { StyleSheet } from 'react-native';

// Port of the Future Conference 2026 - Nautical Theme
export const colors = {
  // Nautical color palette
  background: '#061A2B', // Deep navy
  card: '#0B2B45', // Harbor blue
  cardGlass: 'rgba(11, 43, 69, 0.85)', // Glass effect
  
  // Accent colors
  primary: '#1FB6A6', // Ocean teal
  primaryLight: '#7DE2D1', // Seafoam
  
  // Text colors
  text: '#F5FAFF',
  textMuted: 'rgba(245, 250, 255, 0.75)',
  
  // UI elements
  border: 'rgba(255, 255, 255, 0.10)',
  
  // Status colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  
  // Legacy support (for components that still use these)
  backgroundDark: '#061A2B',
  cardDark: '#0B2B45',
  textDark: '#F5FAFF',
  textSecondaryDark: 'rgba(245, 250, 255, 0.75)',
  borderDark: 'rgba(255, 255, 255, 0.10)',
  
  // Light mode (fallback - app is primarily dark nautical)
  backgroundLight: '#F8FAFC',
  cardLight: '#FFFFFF',
  textLight: '#1E293B',
  textSecondaryLight: '#64748B',
  borderLight: '#E2E8F0',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
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
