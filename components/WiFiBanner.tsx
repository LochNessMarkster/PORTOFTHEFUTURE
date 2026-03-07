
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export function WiFiBanner() {
  const colorScheme = useColorScheme();

  const titleText = 'Conference Wi-Fi';
  const networkText = 'Network: UH Guest';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <IconSymbol
          ios_icon_name="wifi"
          android_material_icon_name="wifi"
          size={24}
          color={colors.accent}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {titleText}
        </Text>
        <Text style={styles.network}>
          {networkText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  network: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
