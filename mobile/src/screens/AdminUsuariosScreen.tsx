// Admin Usuarios Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import theme from '../utils/theme';
import apiService from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  ci: string;
  role: string;
  activo: boolean;
}

export default function AdminUsuariosScreen({ navigation }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('todos');

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    filterUsuarios();
  }, [usuarios, searchQuery, filterRole]);

  const loadUsuarios = async () => {
    try {
      const response = await apiService.get('/admin/usuarios');
      setUsuarios(response.data.usuarios || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsuarios();
  };

  const filterUsuarios = () => {
    let filtered = usuarios;
    
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.ci && u.ci.includes(searchQuery))
      );
    }
    
    if (filterRole !== 'todos') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    setFilteredUsuarios(filtered);
  };

  const handleDesactivar = async (userId: number) => {
    Alert.alert(
      'Desactivar Usuario',
      '¿Estás seguro de que quieres desactivar este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.post(`/admin/usuarios/${userId}/desactivar`);
              Alert.alert('Éxito', 'Usuario desactivado');
              loadUsuarios();
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo desactivar el usuario');
            }
          }
        }
      ]
    );
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'estudiante': return '🎓 Estudiante';
      case 'profesor': return '👨‍🏫 Profesor';
      case 'admin': return '🛠️ Admin';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuario..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {['todos', 'estudiante', 'profesor', 'admin'].map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.filterButton, filterRole === role && styles.filterButtonActive]}
            onPress={() => setFilterRole(role)}
          >
            <Text style={[styles.filterText, filterRole === role && styles.filterTextActive]}>
              {role === 'todos' ? 'Todos' : getRoleName(role)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6b6b" />
        }
      >
        <Text style={styles.resultCount}>
          {filteredUsuarios.length} usuario{filteredUsuarios.length !== 1 ? 's' : ''}
        </Text>

        {filteredUsuarios.map((usuario) => (
          <View key={usuario.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{usuario.nombre || usuario.username}</Text>
              <Text style={styles.userEmail}>{usuario.email}</Text>
              <Text style={styles.userRole}>{getRoleName(usuario.role)}</Text>
              {usuario.ci && <Text style={styles.userCI}>CI: {usuario.ci}</Text>}
            </View>
            
            <View style={styles.userActions}>
              <View style={[styles.statusBadge, usuario.activo ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
              
              {usuario.activo && (
                <TouchableOpacity
                  style={styles.desactivarButton}
                  onPress={() => handleDesactivar(usuario.id)}
                >
                  <Text style={styles.desactivarText}>Desactivar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {filteredUsuarios.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  searchInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },

  // Filter
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  filterButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: '#ff6b6b',
  },
  filterText: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: theme.typography.bold,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  resultCount: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },

  // User Card
  userCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    marginBottom: theme.spacing.md,
  },
  userName: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  userRole: {
    fontSize: theme.typography.small,
    color: '#ff6b6b',
    marginTop: 4,
  },
  userCI: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },

  // User Actions
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusActive: {
    backgroundColor: theme.colors.primary,
  },
  statusInactive: {
    backgroundColor: '#ff4444',
  },
  statusText: {
    color: theme.colors.textDark,
    fontSize: theme.typography.tiny,
    fontWeight: theme.typography.bold,
  },
  desactivarButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  desactivarText: {
    color: '#ff4444',
    fontSize: theme.typography.small,
    fontWeight: theme.typography.semibold,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
