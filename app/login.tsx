
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    console.log('User tapped Login button');
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      await login(email, password);
      console.log('Navigating to home screen');
      router.replace('/(tabs)/(home)/');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const bgColor = isDark ? colors.backgroundDark : colors.background;
  const textColor = isDark ? colors.textDark : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondaryDark : colors.textSecondary;
  const inputBg = isDark ? colors.cardDark : colors.card;
  const inputBorder = isDark ? colors.borderDark : colors.border;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: bgColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>POTF</Text>
            </View>
            <Text style={[styles.title, { color: textColor }]}>
              Port of the Future
            </Text>
            <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
              Conference 2026
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={secondaryTextColor}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }
                ]}
                placeholder="Enter password"
                placeholderTextColor={secondaryTextColor}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: secondaryTextColor }]}>
                Use your registered email and the conference password
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
