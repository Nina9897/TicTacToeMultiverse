// services/firebase.js - VERSIÓN COMPLETA CORREGIDA
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
    gameState: {
      board: Array(9).fill(''),
      currentTurn: 'X',
      winner: null,
      scores: { X: 0, O: 0 },
      currentRound: 1,
      xHistory: [],
      oHistory: [],
      blockedCells: [],
      turnCount: 0,
    },
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

// 🔥 FUNCION CORREGIDA - Guarda el estado COMPLETO para todos los modos
export const updateGameState = async (roomCode, gameState) => {
  if (!roomCode || !gameState) return;
  
  const gameStateRef = ref(database, `rooms/${roomCode}/gameState`);
  await set(gameStateRef, {
    board: gameState.board || Array(9).fill(''),
    currentTurn: gameState.currentTurn || 'X',
    winner: gameState.winner || null,
    scores: gameState.scores || { X: 0, O: 0 },
    currentRound: gameState.currentRound || 1,
    // Modo Temporal
    xHistory: gameState.xHistory || [],
    oHistory: gameState.oHistory || [],
    // Modo Caos
    blockedCells: gameState.blockedCells || [],
    turnCount: gameState.turnCount || 0,
  });
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
  
  const safeGameState = {
    board: Array.isArray(gameState.board) ? gameState.board : Array(9).fill(''),
    currentTurn: gameState.currentTurn || (gameState.isXTurn ? 'X' : 'O'),
    winner: gameState.winner || null,
    scores: gameState.scores || { X: 0, O: 0 },
    currentRound: gameState.currentRound || 1,
    xHistory: gameState.xHistory || [],
    oHistory: gameState.oHistory || [],
    blockedCells: gameState.blockedCells || [],
    turnCount: gameState.turnCount || 0,
  };
  
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