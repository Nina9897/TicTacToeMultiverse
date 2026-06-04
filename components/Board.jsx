// components/Board.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Cell from './Cell';

export default function Board({ board, onMove, disabled, gameMode, blockedCells }) {
  // 🔥 Validación: Si board es undefined, usar array vacío para evitar errores
  const safeBoard = board || Array(9).fill(null);
  
  const isCellBlocked = (index) => {
    if (gameMode !== 'chaos') return false;
    return blockedCells?.some(cell => cell.position === index) || false;
  };

  // Log para depuración (opcional, puedes eliminarlo después)
  if (!board) {
    console.warn('Board recibió board como undefined, usando array por defecto');
  }

  return (
    <View style={styles.board}>
      {safeBoard.map((value, index) => (
        <Cell
          key={index}
          value={value}
          onPress={() => onMove(index)}
          disabled={disabled || value !== null}
          isBlocked={isCellBlocked(index)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
});