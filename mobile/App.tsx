// Main App component with navigation
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
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

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, isLoading, checkAuth } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Cargando...</Text>
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
        </>
      )}
    </Stack.Navigator>
  );
}

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