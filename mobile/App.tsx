// Main App component with navigation
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppStore } from './src/store';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import AttendanceHistoryScreen from './src/screens/AttendanceHistoryScreen';
import JustificativosScreen from './src/screens/JustificativosScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CarreraScreen from './src/screens/CarreraScreen';
import SemestreScreen from './src/screens/SemestreScreen';
import MateriasScreen from './src/screens/MateriasScreen';

const Stack = createNativeStackNavigator();

// Loading Spinner Component
function LoadingSpinner() {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
      <View style={styles.spinnerCircle}>
        <View style={styles.spinnerArc} />
      </View>
    </Animated.View>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingLogo}>AVA</Text>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#122017', // Dark green from web design
        },
        headerTintColor: '#39E079', // Primary green from web design
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {isAuthenticated ? (
        // Authenticated screens
        <>
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen}
            options={{ title: 'AVA - Dashboard', headerShown: false }}
          />
          <Stack.Screen 
            name="Attendance" 
            component={AttendanceScreen}
            options={{ title: 'Marcar Asistencia' }}
          />
          <Stack.Screen 
            name="AttendanceHistory" 
            component={AttendanceHistoryScreen}
            options={{ title: 'Historial de Asistencia' }}
          />
          <Stack.Screen 
            name="Justificativos" 
            component={JustificativosScreen}
            options={{ title: 'Justificativos' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'Mi Perfil' }}
          />
        </>
      ) : (
        // Auth screens
        <>
          <Stack.Screen 
            name="Landing" 
            component={LandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ title: 'Registrarse', headerShown: false }}
          />
          <Stack.Screen 
            name="Carrera" 
            component={CarreraScreen}
            options={{ title: 'Seleccionar Carrera', headerShown: false }}
          />
          <Stack.Screen 
            name="Semestre" 
            component={SemestreScreen}
            options={{ title: 'Seleccionar Semestre', headerShown: false }}
          />
          <Stack.Screen 
            name="Materias" 
            component={MateriasScreen}
            options={{ title: 'Seleccionar Materias', headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#122017', // Dark green from web theme
  },
  loadingLogo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#39E079', // Primary green
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#a0a0a0',
    marginTop: 20,
  },
  spinner: {
    width: 60,
    height: 60,
  },
  spinnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#1a2a1f', // Darker green
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerArc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#39E079', // Primary green
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}