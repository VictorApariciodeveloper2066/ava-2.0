// Sidebar Component - Navigation drawer
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import theme from '../utils/theme';

const { width } = Dimensions.get('window');

type SidebarItem = {
  icon: string;
  label: string;
  onPress: () => void;
};

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
  items: SidebarItem[];
  userName?: string;
  userRole?: string;
};

export default function Sidebar({
  visible,
  onClose,
  items,
  userName,
  userRole,
}: SidebarProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.sidebar}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userName || 'Usuario'}</Text>
                <Text style={styles.userRole}>{userRole || 'Estudiante'}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Menu Items */}
            <View style={styles.menu}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => {
                    item.onPress();
                    onClose();
                  }}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>AVA 2.0</Text>
              <Text style={styles.footerSubtext}>Sistema de Asistencia</Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: width * 0.75,
    backgroundColor: theme.colors.background,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: theme.typography.bold,
    color: theme.colors.textDark,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.body + 2,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  userRole: {
    fontSize: theme.typography.small,
    color: theme.colors.primary,
    marginTop: 2,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#2a3a2f',
    marginVertical: theme.spacing.sm,
  },
  
  // Menu
  menu: {
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
    width: 30,
  },
  menuLabel: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  
  // Footer
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#2a3a2f',
  },
  footerText: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
  },
  footerSubtext: {
    fontSize: theme.typography.tiny,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
