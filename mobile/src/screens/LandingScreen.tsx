// Landing Screen - Welcome page before login/register
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LandingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#122017" />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>AVA</Text>
          <Text style={styles.subtitle}>Sistema de Asistencia</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            Asistencia Virtual
          </Text>
          <Text style={styles.descriptionSub}>
            Sistema de asistencia para la UNIFA
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#122017', // Dark green (web design)
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#39E079', // Primary green (web design)
  },
  subtitle: {
    fontSize: 18,
    color: '#f6f8f7', // Light (web design)
    marginTop: 8,
  },
  descriptionSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  description: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f6f8f7',
    textAlign: 'center',
  },
  descriptionSub: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#39E079', // Primary green
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#122017', // Dark green text
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#39E079',
  },
  registerButtonText: {
    color: '#39E079', // Primary green text
    fontSize: 18,
    fontWeight: 'bold',
  },
});
