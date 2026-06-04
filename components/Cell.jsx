// components/Cell.jsx
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';

export default function Cell({ value, onPress, disabled, isBlocked }) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  const getDisplayValue = () => {
    if (isBlocked) return 'X';
    if (!value) return '';
    return value;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.cell,
          disabled && styles.disabledCell,
          value === 'X' && styles.xCell,
          value === 'O' && styles.oCell,
          isBlocked && styles.blockedCell,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isBlocked}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.cellText,
          value === 'X' && styles.xText,
          value === 'O' && styles.oText,
          isBlocked && styles.blockedText,
        ]}>
          {getDisplayValue()}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 105,
    height: 105,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ecf0f1',
    backgroundColor: '#FFFFFF',
    margin: 2,
    borderRadius: 12,
  },
  disabledCell: {
    opacity: 0.8,
  },
  xCell: {
    backgroundColor: '#ffecec',
  },
  oCell: {
    backgroundColor: '#ececff',
  },
  blockedCell: {
    backgroundColor: '#ffcccc',
    borderColor: '#ff0000',
    borderWidth: 2,
  },
  cellText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  xText: {
    color: '#e74c3c',
  },
  oText: {
    color: '#3498db',
  },
  blockedText: {
    fontSize: 32,
    color: '#ff0000',
  },
});