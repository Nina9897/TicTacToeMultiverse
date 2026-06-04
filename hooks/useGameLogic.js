// hooks/useGameLogic.js

// ========== FUNCIONES COMUNES ==========
export const checkWinner = (board) => {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

export const checkDraw = (board) => {
  return board.every(cell => cell !== '');
};

// ========== MODO CLASICO ==========
export const processClassicMove = (board, currentPlayer, position) => {
  const newBoard = [...board];
  newBoard[position] = currentPlayer;
  return { newBoard };
};

// ========== MODO TEMPORAL ==========
// Cada jugador mantiene maximo 3 fichas
export const processTemporalMove = (board, xHistory, oHistory, currentPlayer, position) => {
  let newBoard = [...board];
  let newXHistory = [...xHistory];
  let newOHistory = [...oHistory];
  
  if (currentPlayer === 'X') {
    newXHistory.push(position);
    if (newXHistory.length > 3) {
      const oldestPos = newXHistory[0];
      if (newBoard[oldestPos] === 'X') {
        newBoard[oldestPos] = '';
      }
      newXHistory = newXHistory.slice(1);
    }
  } else {
    newOHistory.push(position);
    if (newOHistory.length > 3) {
      const oldestPos = newOHistory[0];
      if (newBoard[oldestPos] === 'O') {
        newBoard[oldestPos] = '';
      }
      newOHistory = newOHistory.slice(1);
    }
  }
  
  newBoard[position] = currentPlayer;
  return { newBoard, newXHistory, newOHistory };
};

// ========== MODO CAOS ==========
export const processChaosMove = (board, currentPlayer, position, blockedCells, turnCount) => {
  let newBoard = [...board];
  let newBlockedCells = [...blockedCells];
  let newTurnCount = turnCount + 1;
  
  // Colocar ficha
  newBoard[position] = currentPlayer;
  
  // Bloquear nueva casilla cada 2 turnos
  if (newTurnCount % 2 === 0 && newTurnCount > 0) {
    const availableCells = newBoard
      .map((cell, index) => cell === '' ? index : null)
      .filter(idx => idx !== null && !newBlockedCells.some(b => b.position === idx));
    
    if (availableCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCells.length);
      newBlockedCells.push({
        position: availableCells[randomIndex],
        turnsLeft: Math.random() < 0.5 ? 1 : 2
      });
    }
  }
  
  // Reducir contadores de bloqueo
  newBlockedCells = newBlockedCells
    .map(cell => ({ ...cell, turnsLeft: cell.turnsLeft - 1 }))
    .filter(cell => cell.turnsLeft > 0);
  
  return { newBoard, newBlockedCells, newTurnCount };
};

export const isCellBlocked = (position, blockedCells) => {
  return blockedCells.some(cell => cell.position === position);
};