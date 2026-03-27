// Attendance History Screen - View attendance history
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAppStore } from '../store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AttendanceRecord } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AttendanceHistoryScreen({ navigation }: Props) {
  const { attendanceHistory, loadAttendanceHistory } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceHistory();
    setRefreshing(false);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'presente':
        return '#4caf50';
      case 'ausente':
        return '#f44336';
      case 'justificado':
        return '#ff9800';
      default:
        return '#999';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'presente':
        return 'Presente';
      case 'ausente':
        return 'Ausente';
      case 'justificado':
        return 'Justificado';
      default:
        return state;
    }
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.courseName}>{item.course_name || `Curso #${item.course_id}`}</Text>
        <View style={[styles.badge, { backgroundColor: getStateColor(item.state) }]}>
          <Text style={styles.badgeText}>{getStateLabel(item.state)}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>📅 {item.date}</Text>
        <Text style={styles.detailText}>🕐 {item.time}</Text>
      </View>
    </View>
  );

  // Calculate stats
  const presenteCount = attendanceHistory.filter(a => a.state === 'presente').length;
  const ausenteCount = attendanceHistory.filter(a => a.state === 'ausente').length;
  const justificadoCount = attendanceHistory.filter(a => a.state === 'justificado').length;
  const total = attendanceHistory.length;
  const percentage = total > 0 ? Math.round((presenteCount / total) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{percentage}%</Text>
          <Text style={styles.statLabel}>Asistencia</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#4caf50' }]}>{presenteCount}</Text>
          <Text style={styles.statLabel}>Presentes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#f44336' }]}>{ausenteCount}</Text>
          <Text style={styles.statLabel}>Ausentes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#ff9800' }]}>{justificadoCount}</Text>
          <Text style={styles.statLabel}>Justificados</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={attendanceHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay registro de asistencia</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});