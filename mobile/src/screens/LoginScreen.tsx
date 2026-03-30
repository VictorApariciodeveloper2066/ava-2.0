// Login Screen - Redesigned with web theme
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Input from '../components/Input';
import theme from '../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAppStore();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    try {
      await login(username, password);
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Error al iniciar sesión. Verifica tu conexión.';
      Alert.alert('Error', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>AVA</Text>
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Usuario / Email"
              placeholder="Ingresa tu usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              secureToggle
            />

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />

            <Button
              title="¿No tienes cuenta? Regístrate"
              onPress={() => navigation.navigate('Register')}
              variant="ghost"
              style={styles.registerLink}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    fontSize: theme.typography.title,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: theme.spacing.lg,
  },
  registerLink: {
    marginTop: theme.spacing.md,
  },
});