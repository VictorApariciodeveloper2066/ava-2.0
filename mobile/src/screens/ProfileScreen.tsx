// Profile Screen - View and edit user profile
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, updateProfile, logout } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    primer_nombre: user?.primer_nombre || '',
    primer_apellido: user?.primer_apellido || '',
    telefono: user?.telefono || '',
    ci: user?.ci || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Error al actualizar perfil';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'estudiante':
        return 'Estudiante';
      case 'profesor':
        return 'Profesor';
      case 'comandante':
        return 'Comandante';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.primer_nombre?.[0] || user?.username?.[0] || '?'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.role}>{getRoleLabel(user?.role || 'estudiante')}</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editButton}>
              {isEditing ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Usuario</Text>
          <Text style={styles.value}>{user?.username}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Primer Nombre</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.primer_nombre}
              onChangeText={(v) => handleChange('primer_nombre', v)}
              placeholder="Tu nombre"
            />
          ) : (
            <Text style={styles.value}>{user?.primer_nombre || 'No establecido'}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Primer Apellido</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.primer_apellido}
              onChangeText={(v) => handleChange('primer_apellido', v)}
              placeholder="Tu apellido"
            />
          ) : (
            <Text style={styles.value}>{user?.primer_apellido || 'No establecido'}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cédula</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.ci}
              onChangeText={(v) => handleChange('ci', v)}
              placeholder="Tu cédula"
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.value}>{user?.ci || 'No establecido'}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Teléfono</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.telefono}
              onChangeText={(v) => handleChange('telefono', v)}
              placeholder="Tu teléfono"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{user?.telefono || 'No establecido'}</Text>
          )}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Notificaciones</Text>
          <Text style={styles.settingValue}>
            {user?.notificaciones_activas ? 'Activadas' : 'Desactivadas'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Formato de Hora</Text>
          <Text style={styles.settingValue}>{user?.formato_hora || '12h'}</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>AVA v2.0 - Sistema de Asistencia</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  role: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#1a73e8',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    margin: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});