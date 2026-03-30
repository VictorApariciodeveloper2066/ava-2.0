// Reusable Input component
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import theme from '../utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
  secureToggle?: boolean;
}

export default function Input({
  label,
  error,
  containerStyle,
  icon,
  secureToggle = false,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={theme.colors.textSecondary}
          {...props}
        />
        
        {secureToggle && secureTextEntry && (
          <TouchableOpacity
            style={styles.secureToggle}
            onPress={() => setIsSecure(!isSecure)}
          >
            <Text style={styles.secureToggleText}>
              {isSecure ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.small,
    fontWeight: theme.typography.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  icon: {
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  secureToggle: {
    paddingHorizontal: theme.spacing.md,
  },
  secureToggleText: {
    fontSize: 18,
  },
  error: {
    fontSize: theme.typography.tiny,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
