// Reusable Button component
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import theme from '../utils/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.buttonText : theme.colors.primary}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  variant_primary: {
    backgroundColor: theme.colors.button,
  },
  variant_secondary: {
    backgroundColor: theme.colors.card,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  size_sm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  size_md: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  size_lg: {
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  
  // Text styles
  text: {
    fontWeight: theme.typography.bold,
  },
  text_primary: {
    color: theme.colors.buttonText,
  },
  text_secondary: {
    color: theme.colors.text,
  },
  text_outline: {
    color: theme.colors.primary,
  },
  text_ghost: {
    color: theme.colors.primary,
  },
  textSize_sm: {
    fontSize: theme.typography.small,
  },
  textSize_md: {
    fontSize: theme.typography.body,
  },
  textSize_lg: {
    fontSize: theme.typography.heading,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
});
