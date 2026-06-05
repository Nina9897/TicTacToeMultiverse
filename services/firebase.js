// services/firebase.js - VERSIÓN COMPLETA CON SOPORTE TIME QUIZ
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  update, 
  onDisconnect,
  serverTimestamp
} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC867rl-IaZ1PFNHhfE0GpuelT6jDiRzcs",
  authDomain: "tictactoemultiverse.firebaseapp.com",
  databaseURL: "https://tictactoemultiverse-default-rtdb.firebaseio.com",
  projectId: "tictactoemultiverse",
  storageBucket: "tictactoemultiverse.firebasestorage.app",
  messagingSenderId: "418406887362",
  appId: "1:418406887362:web:c78352d92ffabb5798b05b",
  measurementId: "G-4K03RMSVW5"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoom = async (roomCode, playerName, gameMode, totalRounds = 3) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const playerId = generateRoomCode() + Date.now();
  
  // Estado inicial según el modo de juego
  let gameState = {
    board: Array(9).fill(''),
    currentTurn: 'X',
    winner: null,
    scores: { X: 0, O: 0 },
    currentRound: 1,
    xHistory: [],
    oHistory: [],
    blockedCells: [],
    turnCount: 0,
  };
  
  // Estado específico para TIME QUIZ
  if (gameMode === 'timequiz') {
    gameState = {
      ...gameState,
      energy: { X: 50, O: 50 },
      gameTimeline: [],
      waitingForAnswer: true,
      currentQuestion: null,
      moveCount: 0,
    };
  }
  
  const roomData = {
    roomCode,
    gameMode,
    totalRounds,
    status: 'waiting',
    players: {
      [playerId]: {
        id: playerId,
        name: playerName,
        symbol: 'X',
        isHost: true,
        joinedAt: serverTimestamp(),
      }
    },
    gameState: gameState,
    createdAt: serverTimestamp(),
  };
  
  await set(roomRef, roomData);
  const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
  onDisconnect(playerRef).remove();
  
  return { roomCode, playerId, playerSymbol: 'X' };
};

export const joinRoom = async (roomCode, playerName) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  return new Promise((resolve, reject) => {
    onValue(roomRef, (snapshot) => {
      const room = snapshot.val();
      
      if (!room) {
        reject(new Error('Sala no encontrada'));
        return;
      }
      
      if (room.status === 'playing') {
        reject(new Error('La partida ya comenzo'));
        return;
      }
      
      const playerCount = Object.keys(room.players || {}).length;
      if (playerCount >= 2) {
        reject(new Error('Sala llena'));
        return;
      }
      
      const playerId = generateRoomCode() + Date.now();
      const playerSymbol = playerCount === 0 ? 'X' : 'O';
      
      const updates = {};
      updates[`rooms/${roomCode}/players/${playerId}`] = {
        id: playerId,
        name: playerName,
        symbol: playerSymbol,
        isHost: false,
        joinedAt: serverTimestamp(),
      };
      
      // Si es TIME QUIZ, asegurar que el nuevo jugador tenga energía
      if (room.gameMode === 'timequiz' && playerSymbol === 'O') {
        updates[`rooms/${roomCode}/gameState/energy/O`] = 50;
      }
      
      if (playerCount + 1 >= 2) {
        updates[`rooms/${roomCode}/status`] = 'playing';
      }
      
      update(ref(database), updates).then(() => {
        const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
        onDisconnect(playerRef).remove();
        resolve({ 
          playerId, 
          playerSymbol, 
          gameMode: room.gameMode,
          totalRounds: room.totalRounds || 3
        });
      }).catch(reject);
    }, { onlyOnce: true });
  });
};

export const subscribeToRoom = (roomCode, callback) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  return onValue(roomRef, (snapshot) => {
    const room = snapshot.val();
    callback(room);
  });
};

// 🔥 FUNCIÓN PRINCIPAL - Guarda el estado COMPLETO para TODOS los modos
export const updateGameState = async (roomCode, gameState) => {
  if (!roomCode || !gameState) return;
  
  let safeGameState;
  
  // Obtener el modo de juego actual
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await new Promise((resolve) => {
    onValue(roomRef, (snap) => resolve(snap), { onlyOnce: true });
  });
  const room = snapshot.val();
  const gameMode = room?.gameMode || 'classic';
  
  // Crear estado seguro según el modo
  if (gameMode === 'timequiz') {
    safeGameState = {
      board: gameState.board || Array(9).fill(''),
      currentTurn: gameState.currentTurn || 'X',
      winner: gameState.winner || null,
      scores: gameState.scores || { X: 0, O: 0 },
      currentRound: gameState.currentRound || 1,
      xHistory: gameState.xHistory || [],
      oHistory: gameState.oHistory || [],
      blockedCells: gameState.blockedCells || [],
      turnCount: gameState.turnCount || 0,
      // Time Quiz específico
      energy: gameState.energy || { X: 50, O: 50 },
      gameTimeline: gameState.gameTimeline || [],
      waitingForAnswer: gameState.waitingForAnswer !== undefined ? gameState.waitingForAnswer : true,
      currentQuestion: gameState.currentQuestion || null,
      moveCount: gameState.moveCount || 0,
    };
  } else {
    safeGameState = {
      board: gameState.board || Array(9).fill(''),
      currentTurn: gameState.currentTurn || 'X',
      winner: gameState.winner || null,
      scores: gameState.scores || { X: 0, O: 0 },
      currentRound: gameState.currentRound || 1,
      xHistory: gameState.xHistory || [],
      oHistory: gameState.oHistory || [],
      blockedCells: gameState.blockedCells || [],
      turnCount: gameState.turnCount || 0,
    };
  }
  
  const gameStateRef = ref(database, `rooms/${roomCode}/gameState`);
  await set(gameStateRef, safeGameState);
};

// Función específica para TIME QUIZ (actualiza todo el estado del modo)
export const updateTimeQuizState = async (roomCode, gameState) => {
  if (!roomCode || !gameState) return;
  
  const timeQuizState = {
    board: gameState.board || Array(9).fill(''),
    currentTurn: gameState.currentTurn || 'X',
    winner: gameState.winner || null,
    scores: gameState.scores || { X: 0, O: 0 },
    currentRound: gameState.currentRound || 1,
    xHistory: gameState.xHistory || [],
    oHistory: gameState.oHistory || [],
    blockedCells: gameState.blockedCells || [],
    turnCount: gameState.turnCount || 0,
    energy: gameState.energy || { X: 50, O: 50 },
    gameTimeline: gameState.gameTimeline || [],
    waitingForAnswer: gameState.waitingForAnswer !== undefined ? gameState.waitingForAnswer : true,
    currentQuestion: gameState.currentQuestion || null,
    moveCount: gameState.moveCount || 0,
  };
  
  const gameStateRef = ref(database, `rooms/${roomCode}/gameState`);
  await set(gameStateRef, timeQuizState);
};

// Función para actualizar solo el tablero (más eficiente)
export const updateBoard = async (roomCode, board, currentTurn) => {
  if (!roomCode || !board) return;
  
  const updates = {};
  updates[`rooms/${roomCode}/gameState/board`] = board;
  updates[`rooms/${roomCode}/gameState/currentTurn`] = currentTurn;
  
  try {
    await update(ref(database), updates);
    console.log('Board actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar board:', error);
    throw error;
  }
};

// Función para actualizar el movimiento completo (para modos especiales)
export const updateMove = async (roomCode, gameState) => {
  if (!roomCode || !gameState) {
    console.error('Error: roomCode y gameState son requeridos');
    return;
  }
  
  // Obtener el modo de juego
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await new Promise((resolve) => {
    onValue(roomRef, (snap) => resolve(snap), { onlyOnce: true });
  });
  const room = snapshot.val();
  const gameMode = room?.gameMode || 'classic';
  
  let safeGameState;
  
  if (gameMode === 'timequiz') {
    safeGameState = {
      board: Array.isArray(gameState.board) ? gameState.board : Array(9).fill(''),
      currentTurn: gameState.currentTurn || (gameState.isXTurn ? 'X' : 'O'),
      winner: gameState.winner || null,
      scores: gameState.scores || { X: 0, O: 0 },
      currentRound: gameState.currentRound || 1,
      xHistory: gameState.xHistory || [],
      oHistory: gameState.oHistory || [],
      blockedCells: gameState.blockedCells || [],
      turnCount: gameState.turnCount || 0,
      energy: gameState.energy || { X: 50, O: 50 },
      gameTimeline: gameState.gameTimeline || [],
      waitingForAnswer: gameState.waitingForAnswer !== undefined ? gameState.waitingForAnswer : true,
      currentQuestion: gameState.currentQuestion || null,
      moveCount: gameState.moveCount || 0,
    };
  } else if (gameMode === 'temporal') {
    safeGameState = {
      board: Array.isArray(gameState.board) ? gameState.board : Array(9).fill(''),
      currentTurn: gameState.currentTurn || (gameState.isXTurn ? 'X' : 'O'),
      winner: gameState.winner || null,
      scores: gameState.scores || { X: 0, O: 0 },
      currentRound: gameState.currentRound || 1,
      xHistory: gameState.xHistory || [],
      oHistory: gameState.oHistory || [],
      blockedCells: [],
      turnCount: 0,
    };
  } else if (gameMode === 'chaos') {
    safeGameState = {
      board: Array.isArray(gameState.board) ? gameState.board : Array(9).fill(''),
      currentTurn: gameState.currentTurn || (gameState.isXTurn ? 'X' : 'O'),
      winner: gameState.winner || null,
      scores: gameState.scores || { X: 0, O: 0 },
      currentRound: gameState.currentRound || 1,
      xHistory: [],
      oHistory: [],
      blockedCells: gameState.blockedCells || [],
      turnCount: gameState.turnCount || 0,
    };
  } else {
    safeGameState = {
      board: Array.isArray(gameState.board) ? gameState.board : Array(9).fill(''),
      currentTurn: gameState.currentTurn || (gameState.isXTurn ? 'X' : 'O'),
      winner: gameState.winner || null,
      scores: gameState.scores || { X: 0, O: 0 },
      currentRound: gameState.currentRound || 1,
      xHistory: [],
      oHistory: [],
      blockedCells: [],
      turnCount: 0,
    };
  }
  
  console.log('Enviando updateMove a Firebase:', safeGameState);
  
  try {
    const gameStateRef = ref(database, `rooms/${roomCode}/gameState`);
    await set(gameStateRef, safeGameState);
    console.log('Move actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar move:', error);
    throw error;
  }
};

// Función para actualizar el turno (rápida)
export const updateTurn = async (roomCode, currentTurn) => {
  if (!roomCode || !currentTurn) return;
  
  const updates = {};
  updates[`rooms/${roomCode}/gameState/currentTurn`] = currentTurn;
  
  try {
    await update(ref(database), updates);
  } catch (error) {
    console.error('Error al actualizar turno:', error);
  }
};

// Función para actualizar el tablero después de un movimiento
export const updateGameMove = async (roomCode, newBoard, nextTurn, winner = null) => {
  if (!roomCode || !newBoard) return;
  
  const updates = {};
  updates[`rooms/${roomCode}/gameState/board`] = newBoard;
  updates[`rooms/${roomCode}/gameState/currentTurn`] = nextTurn;
  if (winner !== null) {
    updates[`rooms/${roomCode}/gameState/winner`] = winner;
  }
  
  try {
    await update(ref(database), updates);
  } catch (error) {
    console.error('Error al actualizar movimiento:', error);
  }
};

export const leaveRoom = async (roomCode, playerId) => {
  if (!roomCode || !playerId) return;
  
  const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
  await set(playerRef, null);
  
  const roomRef = ref(database, `rooms/${roomCode}`);
  onValue(roomRef, (snapshot) => {
    const room = snapshot.val();
    if (room && Object.keys(room.players || {}).length === 0) {
      set(roomRef, null);
      console.log('Sala eliminada por estar vacía');
    }
  }, { onlyOnce: true });
};