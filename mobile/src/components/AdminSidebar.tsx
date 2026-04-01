// Admin Sidebar - Navigation drawer for admin features
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
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
};

export default function AdminSidebar({
  visible,
  onClose,
  items,
  userName,
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
              <View style={styles.adminAvatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
              <View style={styles.adminInfo}>
                <Text style={styles.adminName}>{userName || 'Administrador'}</Text>
                <Text style={styles.adminRole}>🛠️ Administrador</Text>
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
              <Text style={styles.footerText}>AVA 2.0 - Admin Panel</Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const { width: screenWidth } = require('react-native').Dimensions.get('window');

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
    width: screenWidth * 0.8,
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
  adminAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: theme.typography.bold,
    color: '#fff',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: theme.typography.body + 2,
    fontWeight: theme.typography.bold,
    color: theme.colors.text,
  },
  adminRole: {
    fontSize: theme.typography.small,
    color: '#ff6b6b',
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
    color: theme.colors.textSecondary,
  },
});
