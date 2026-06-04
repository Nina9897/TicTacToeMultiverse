// app/game.jsx - SOLO CON BORDE DE COLOR Y ETIQUETA "TÚ"
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  checkWinner, 
  checkDraw,
  processClassicMove,
  processTemporalMove,
  processChaosMove,
  isCellBlocked
} from '../hooks/useGameLogic';
import { subscribeToRoom, updateGameState, leaveRoom } from '../services/firebase';

const { width } = Dimensions.get('window');

// Componente Cell
const Cell = ({ value, onPress, disabled, isBlocked }) => {
  return (
    <TouchableOpacity
      style={[
        styles.cell,
        value === 'X' && styles.xCell,
        value === 'O' && styles.oCell,
        isBlocked && styles.blockedCell,
      ]}
      onPress={onPress}
      disabled={disabled || value !== '' || isBlocked}
    >
      <Text style={[
        styles.cellText,
        value === 'X' && styles.xText,
        value === 'O' && styles.oText,
      ]}>
        {isBlocked ? 'X' : value}
      </Text>
    </TouchableOpacity>
  );
};

// Componente Board
const Board = ({ board, onMove, disabled, gameMode, blockedCells }) => {
  const isCellBlockedChaos = (index) => {
    if (gameMode !== 'chaos') return false;
    return blockedCells?.some(cell => cell.position === index) || false;
  };

  return (
    <View style={styles.board}>
      {board.map((value, index) => (
        <Cell
          key={index}
          value={value}
          onPress={() => onMove(index)}
          disabled={disabled}
          isBlocked={isCellBlockedChaos(index)}
        />
      ))}
    </View>
  );
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { gameMode, isMultiplayer, roomCode, playerId, playerName, playerSymbol, totalRounds } = params;
  
  // Estado general del juego
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', '']);
  const [currentTurn, setCurrentTurn] = useState('X');
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [opponent, setOpponent] = useState(null);
  
  // Estado especifico para MODO TEMPORAL
  const [xHistory, setXHistory] = useState([]);
  const [oHistory, setOHistory] = useState([]);
  
  // Estado especifico para MODO CAOS
  const [blockedCells, setBlockedCells] = useState([]);
  const [turnCount, setTurnCount] = useState(0);
  
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isUpdatingFromFirebase, setIsUpdatingFromFirebase] = useState(false);
  
  // Total de partidas (por defecto 3)
  const [totalGames, setTotalGames] = useState(() => {
    if (totalRounds) return parseInt(totalRounds);
    return 3;
  });

  // Suscribirse a cambios en Firebase (solo multijugador)
  useEffect(() => {
    if (isMultiplayer !== 'true' || !roomCode) return;

    console.log('Suscribiendo a sala:', roomCode);

    const unsubscribe = subscribeToRoom(roomCode, (room) => {
      if (room) {
        console.log('Datos recibidos de Firebase:', {
          players: room.players,
          gameState: room.gameState
        });
        
        // ========== DETECTAR DESCONEXIÓN DEL OPONENTE ==========
        const playersList = Object.values(room.players || {});
        const currentPlayerExists = playersList.some(p => p.id === playerId);
        
        // Si el jugador actual ya no existe en la sala (lo eliminaron)
        if (!currentPlayerExists && isMultiplayer === 'true') {
          console.log('Jugador actual eliminado de la sala');
          Alert.alert(
            'Sala cerrada',
            'Has sido desconectado de la sala',
            [
              { 
                text: 'OK', 
                onPress: () => router.push('/')
              }
            ]
          );
          return;
        }
        
        // Si hay menos de 2 jugadores y antes había 2 (oponente se fue)
        if (playersList.length < 2 && opponent && !winner) {
          console.log('Oponente desconectado');
          Alert.alert(
            'Jugador desconectado',
            'El oponente ha abandonado la partida',
            [
              { 
                text: 'Volver al inicio', 
                onPress: () => router.push('/')
              }
            ]
          );
          return;
        }
        
        // Actualizar oponente correctamente
        const opponentPlayer = playersList.find(p => p.id !== playerId);
        if (opponentPlayer) {
          setOpponent(opponentPlayer);
        }
        
        // ========== LOGS DE DEPURACIÓN ==========
        console.log('=== DATOS RECIBIDOS DE FIREBASE ===');
        console.log('gameMode:', room.gameMode);
        console.log('board:', room.gameState?.board);
        console.log('currentTurn:', room.gameState?.currentTurn);
        console.log('winner:', room.gameState?.winner);
        console.log('scores:', room.gameState?.scores);
        console.log('currentRound:', room.gameState?.currentRound);
        console.log('xHistory:', room.gameState?.xHistory);
        console.log('oHistory:', room.gameState?.oHistory);
        console.log('blockedCells:', room.gameState?.blockedCells);
        console.log('turnCount:', room.gameState?.turnCount);
        console.log('totalRounds:', room.totalRounds);
        console.log('================================');
        
        // Actualizar estado del juego
        if (room.gameState && !isUpdatingFromFirebase) {
          setBoard(room.gameState.board || ['', '', '', '', '', '', '', '', '']);
          setCurrentTurn(room.gameState.currentTurn || 'X');
          setWinner(room.gameState.winner || null);
          setScores(room.gameState.scores || { X: 0, O: 0 });
          setCurrentRound(room.gameState.currentRound || 1);
          setXHistory(room.gameState.xHistory || []);
          setOHistory(room.gameState.oHistory || []);
          setBlockedCells(room.gameState.blockedCells || []);
          setTurnCount(room.gameState.turnCount || 0);
        }
        
        // Actualizar totalGames desde Firebase
        if (room.totalRounds && totalGames === 3) {
          setTotalGames(room.totalRounds);
        }
      } else {
        // Sala no existe o fue eliminada
        console.log('Sala eliminada o no existe');
        Alert.alert(
          'Sala cerrada',
          'La sala ha sido cerrada',
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/')
            }
          ]
        );
      }
    });
    
    return () => unsubscribe();
  }, [roomCode, playerId, isMultiplayer, opponent, winner]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const updateFirebaseState = async (newGameState) => {
    if (isMultiplayer !== 'true' || !roomCode) return;
    setIsUpdatingFromFirebase(true);
    try {
      console.log('=== ENVIANDO A FIREBASE ===');
      console.log('newGameState:', newGameState);
      console.log('===========================');
      await updateGameState(roomCode, newGameState);
    } catch (error) {
      console.error('Error al sincronizar:', error);
    } finally {
      setIsUpdatingFromFirebase(false);
    }
  };

  const resetRound = (newScores, nextRound) => {
    // ========== RESETEAR TODOS LOS ESTADOS ==========
    const resetState = {
      board: ['', '', '', '', '', '', '', '', ''],
      currentTurn: 'X',
      winner: null,
      scores: newScores,
      currentRound: nextRound,
      xHistory: [],
      oHistory: [],
      blockedCells: [],
      turnCount: 0,
    };
    
    setBoard(resetState.board);
    setCurrentTurn(resetState.currentTurn);
    setWinner(null);
    setCurrentRound(nextRound);
    setScores(newScores);
    setXHistory([]);
    setOHistory([]);
    setBlockedCells([]);
    setTurnCount(0);
    
    if (isMultiplayer === 'true') {
      updateFirebaseState(resetState);
    }
  };

  const handleMove = async (position) => {
    // Validaciones basicas
    if (winner) {
      Alert.alert('Partida terminada', 'Esta ronda ya termino');
      return;
    }
    
    if (board[position] !== '') {
      Alert.alert('Casilla ocupada', 'Elige otra posicion');
      return;
    }
    
    if (gameMode === 'chaos' && isCellBlocked(position, blockedCells)) {
      Alert.alert('Casilla Bloqueada', 'Esta casilla esta temporalmente bloqueada');
      return;
    }
    
    if (isMultiplayer === 'true' && currentTurn !== playerSymbol) {
      Alert.alert('No es tu turno', 'Espera a que el oponente juegue');
      return;
    }

    let newBoard = [...board];
    let newXHistory = [...xHistory];
    let newOHistory = [...oHistory];
    let newBlockedCells = [...blockedCells];
    let newTurnCount = turnCount;
    
    const currentPlayer = currentTurn;
    
    // ========== PROCESAR SEGUN MODO DE JUEGO ==========
    if (gameMode === 'classic') {
      const result = processClassicMove(newBoard, currentPlayer, position);
      newBoard = result.newBoard;
      if (currentPlayer === 'X') {
        newXHistory.push(position);
      } else {
        newOHistory.push(position);
      }
    }
    else if (gameMode === 'temporal') {
      const result = processTemporalMove(newBoard, xHistory, oHistory, currentPlayer, position);
      newBoard = result.newBoard;
      newXHistory = result.newXHistory;
      newOHistory = result.newOHistory;
    }
    else if (gameMode === 'chaos') {
      const result = processChaosMove(newBoard, currentPlayer, position, blockedCells, turnCount);
      newBoard = result.newBoard;
      newBlockedCells = result.newBlockedCells;
      newTurnCount = result.newTurnCount;
      if (currentPlayer === 'X') {
        newXHistory.push(position);
      } else {
        newOHistory.push(position);
      }
    }
    
    // Verificar ganador
    const gameWinner = checkWinner(newBoard);
    const isDraw = !gameWinner && checkDraw(newBoard);
    
    // ========== CREAR NUEVO ESTADO CON TODAS LAS PROPIEDADES ==========
    const newGameState = {
      board: newBoard,
      currentTurn: gameWinner ? currentPlayer : (currentPlayer === 'X' ? 'O' : 'X'),
      winner: gameWinner || null,
      scores: scores,
      currentRound: currentRound,
      xHistory: newXHistory,
      oHistory: newOHistory,
      blockedCells: newBlockedCells,
      turnCount: newTurnCount,
    };
    
    // Actualizar estado local
    setBoard(newBoard);
    setCurrentTurn(newGameState.currentTurn);
    setXHistory(newXHistory);
    setOHistory(newOHistory);
    setBlockedCells(newBlockedCells);
    setTurnCount(newTurnCount);
    
    // Sincronizar con Firebase
    if (isMultiplayer === 'true') {
      await updateFirebaseState(newGameState);
    }
    
    // Procesar fin de ronda
    if (gameWinner || isDraw) {
      const newScores = { ...scores };
      let message = '';
      
      if (gameWinner) {
        newScores[gameWinner]++;
        message = `Jugador ${gameWinner} gana la ronda ${currentRound}`;
      } else {
        message = `Ronda ${currentRound} terminada en empate`;
      }
      
      setScores(newScores);
      setWinner(gameWinner);
      
      Alert.alert(gameWinner ? 'Ronda Ganada' : 'Empate', message);
      
      // Calcular victorias necesarias para ganar la serie
      const winsNeeded = Math.floor(totalGames / 2) + 1;
      const nextRound = currentRound + 1;
      let seriesWinner = null;
      
      if (newScores.X >= winsNeeded) {
        seriesWinner = 'X';
      } else if (newScores.O >= winsNeeded) {
        seriesWinner = 'O';
      } else if (nextRound > totalGames) {
        seriesWinner = newScores.X > newScores.O ? 'X' : 
                       newScores.O > newScores.X ? 'O' : 'draw';
      }
      
      if (seriesWinner) {
        const seriesMessage = seriesWinner === 'draw' 
          ? `La serie termino en empate\n\nX ${newScores.X} - ${newScores.O} O`
          : `SERIE GANADA POR JUGADOR ${seriesWinner}\n\nX ${newScores.X} - ${newScores.O} O`;
        
        Alert.alert('Juego Terminado', seriesMessage, [
          { text: 'Volver al inicio', onPress: () => router.push('/') }
        ]);
        return;
      }
      
      setTimeout(() => {
        resetRound(newScores, nextRound);
      }, 2000);
    }
  };

  const handleLeave = async () => {
    Alert.alert('Salir', 'Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Salir', 
        onPress: async () => {
          if (isMultiplayer === 'true' && roomCode) {
            await leaveRoom(roomCode, playerId);
          }
          router.push('/');
        }
      }
    ]);
  };

  const getModeName = () => {
    switch(gameMode) {
      case 'classic': return 'Modo Clasico';
      case 'temporal': return 'Modo Temporal';
      case 'chaos': return 'Modo Caos';
      default: return 'Modo Desconocido';
    }
  };

  const getModeDescription = () => {
    switch(gameMode) {
      case 'classic': return 'Gana 3 en linea';
      case 'temporal': return `Maximo 3 fichas (X:${xHistory.length}/3 O:${oHistory.length}/3)`;
      case 'chaos': return 'Casillas se bloquean aleatoriamente';
      default: return '';
    }
  };

  const winsNeeded = Math.floor(totalGames / 2) + 1;
  const isMyTurn = isMultiplayer !== 'true' || currentTurn === playerSymbol;
  const isGameActive = !winner;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>{getModeName()}</Text>
        </View>
        <Text style={styles.modeDescription}>{getModeDescription()}</Text>
        {isMultiplayer === 'true' && (
          <View style={styles.multiplayerBadge}>
            <Text style={styles.multiplayerText}>Multijugador</Text>
          </View>
        )}
      </View>

      {/* SOLO CAMBIO: Aquí se muestran los nombres con borde de color y etiqueta TU */}
      <View style={styles.scoreContainer}>
        <View style={[
          styles.scoreCard,
          isMultiplayer === 'true' && playerSymbol === 'X' && styles.currentPlayerCard,
          isMultiplayer === 'true' && playerSymbol === 'X' && styles.xBorderCard
        ]}>
          <Text style={styles.playerIcon}>X</Text>
          <Text style={styles.scoreTitle}>
            {isMultiplayer === 'true' 
              ? (playerSymbol === 'X' 
                  ? (playerName || 'Jugador X') 
                  : (opponent?.name || 'Jugador X'))
              : 'Jugador X'}
          </Text>
          <Text style={styles.scoreValue}>{scores.X}</Text>
          {gameMode === 'temporal' && (
            <Text style={styles.fichaCount}>Fichas: {xHistory.length}/3</Text>
          )}
          {isMultiplayer === 'true' && playerSymbol === 'X' && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>TU</Text>
            </View>
          )}
        </View>
        
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        
        <View style={[
          styles.scoreCard,
          isMultiplayer === 'true' && playerSymbol === 'O' && styles.currentPlayerCard,
          isMultiplayer === 'true' && playerSymbol === 'O' && styles.oBorderCard
        ]}>
          <Text style={styles.playerIcon}>O</Text>
          <Text style={styles.scoreTitle}>
            {isMultiplayer === 'true'
              ? (playerSymbol === 'O' 
                  ? (playerName || 'Jugador O') 
                  : (opponent?.name || 'Jugador O'))
              : 'Jugador O'}
          </Text>
          <Text style={styles.scoreValue}>{scores.O}</Text>
          {gameMode === 'temporal' && (
            <Text style={styles.fichaCount}>Fichas: {oHistory.length}/3</Text>
          )}
          {isMultiplayer === 'true' && playerSymbol === 'O' && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>TU</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoBar}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>Ronda {currentRound}/{totalGames}</Text>
        </View>
        <View style={[styles.turnBadge, !isMyTurn && styles.notMyTurnBadge]}>
          <Text style={styles.turnText}>
            {winner 
              ? `Ganador: ${winner}`
              : isMultiplayer === 'true'
                ? `${currentTurn === playerSymbol ? 'TU TURNO' : 'TURNO OPONENTE'}`
                : `Turno: ${currentTurn}`}
          </Text>
        </View>
      </View>

      {/* Indicador de victorias necesarias */}
      <View style={styles.winsNeededContainer}>
        <Text style={styles.winsNeededText}>
          {winsNeeded} victorias para ganar la serie
        </Text>
      </View>

      <Board 
        board={board}
        onMove={handleMove}
        disabled={!isGameActive || (isMultiplayer === 'true' && currentTurn !== playerSymbol)}
        gameMode={gameMode}
        blockedCells={blockedCells}
      />

      <TouchableOpacity style={styles.exitButton} onPress={handleLeave}>
        <Text style={styles.exitButtonText}>
          {isMultiplayer === 'true' ? 'Salir de la partida' : 'Salir al menu'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modeBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 5,
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  multiplayerBadge: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 5,
  },
  multiplayerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: width * 0.35,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentPlayerCard: {
    backgroundColor: '#fff9e6',
  },
  xBorderCard: {
    borderWidth: 3,
    borderColor: '#e74c3c',
  },
  oBorderCard: {
    borderWidth: 3,
    borderColor: '#3498db',
  },
  playerIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  fichaCount: {
    fontSize: 10,
    color: '#3498db',
    marginTop: 5,
  },
  youBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  youBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  vsContainer: {
    marginHorizontal: 15,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#95a5a6',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  roundBadge: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roundText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  turnBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  notMyTurnBadge: {
    backgroundColor: '#95a5a6',
  },
  turnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  winsNeededContainer: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  winsNeededText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    marginBottom: 30,
  },
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
  xCell: {
    backgroundColor: '#ffecec',
  },
  oCell: {
    backgroundColor: '#ececff',
  },
  blockedCell: {
    backgroundColor: '#ffcccc',
    borderColor: '#ff0000',
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
  exitButton: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#95a5a6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});