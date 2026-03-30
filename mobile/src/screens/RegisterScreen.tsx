// Register Screen - Redesigned with web theme
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

export default function RegisterScreen({ navigation }: Props) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    primer_nombre: '',
    primer_apellido: '',
  });
  const { register, isLoading } = useAppStore();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { username, email, password, confirmPassword, primer_nombre, primer_apellido } = formData;

    if (!username.trim() || !email.trim() || !password.trim() || !primer_nombre.trim() || !primer_apellido.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await register({ username, email, password, primer_nombre, primer_apellido });
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al registrarse';
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
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate en AVA</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Usuario"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChangeText={(v) => handleChange('username', v)}
              autoCapitalize="none"
            />

            <Input
              label="Email"
              placeholder="tu@email.com"
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Primer Nombre"
              placeholder="Tu nombre"
              value={formData.primer_nombre}
              onChangeText={(v) => handleChange('primer_nombre', v)}
            />

            <Input
              label="Primer Apellido"
              placeholder="Tu apellido"
              value={formData.primer_apellido}
              onChangeText={(v) => handleChange('primer_apellido', v)}
            />

            <Input
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry
              secureToggle
            />

            <Input
              label="Confirmar Contraseña"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChangeText={(v) => handleChange('confirmPassword', v)}
              secureTextEntry
              secureToggle
            />

            <Button
              title="Registrarse"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
            />

            <Button
              title="¿Ya tienes cuenta? Inicia sesión"
              onPress={() => navigation.goBack()}
              variant="ghost"
              style={styles.loginLink}
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
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logo: {
    fontSize: theme.typography.heading + 8,
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
  registerButton: {
    marginTop: theme.spacing.lg,
  },
  loginLink: {
    marginTop: theme.spacing.md,
  },
});
