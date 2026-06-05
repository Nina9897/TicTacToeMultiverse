// app/game.jsx - CON SOPORTE PARA MODO TIME QUIZ
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
        {isBlocked ? '⌾' : value}
      </Text>
    </TouchableOpacity>
  );
};

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
  
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', '']);
  const [currentTurn, setCurrentTurn] = useState('X');
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [opponent, setOpponent] = useState(null);
  const [xHistory, setXHistory] = useState([]);
  const [oHistory, setOHistory] = useState([]);
  const [blockedCells, setBlockedCells] = useState([]);
  const [turnCount, setTurnCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isUpdatingFromFirebase, setIsUpdatingFromFirebase] = useState(false);
  
  const [totalGames, setTotalGames] = useState(() => {
    if (totalRounds) return parseInt(totalRounds);
    return 3;
  });

  useEffect(() => {
    if (isMultiplayer !== 'true' || !roomCode) return;

    const unsubscribe = subscribeToRoom(roomCode, (room) => {
      if (room) {
        const playersList = Object.values(room.players || {});
        const currentPlayerExists = playersList.some(p => p.id === playerId);
        
        if (!currentPlayerExists && isMultiplayer === 'true') {
          Alert.alert('Sala cerrada', 'Has sido desconectado de la sala', [
            { text: 'OK', onPress: () => router.push('/') }
          ]);
          return;
        }
        
        if (playersList.length < 2 && opponent && !winner) {
          Alert.alert('Jugador desconectado', 'El oponente ha abandonado la partida', [
            { text: 'Volver al inicio', onPress: () => router.push('/') }
          ]);
          return;
        }
        
        const opponentPlayer = playersList.find(p => p.id !== playerId);
        if (opponentPlayer) {
          setOpponent(opponentPlayer);
        }
        
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
        
        if (room.totalRounds && totalGames === 3) {
          setTotalGames(room.totalRounds);
        }
      } else {
        Alert.alert('Sala cerrada', 'La sala ha sido cerrada', [
          { text: 'OK', onPress: () => router.push('/') }
        ]);
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
      await updateGameState(roomCode, newGameState);
    } catch (error) {
      console.error('Error al sincronizar:', error);
    } finally {
      setIsUpdatingFromFirebase(false);
    }
  };

  const resetRound = (newScores, nextRound) => {
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
    
    const gameWinner = checkWinner(newBoard);
    const isDraw = !gameWinner && checkDraw(newBoard);
    
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
    
    setBoard(newBoard);
    setCurrentTurn(newGameState.currentTurn);
    setXHistory(newXHistory);
    setOHistory(newOHistory);
    setBlockedCells(newBlockedCells);
    setTurnCount(newTurnCount);
    
    if (isMultiplayer === 'true') {
      await updateFirebaseState(newGameState);
    }
    
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
          ? `SERIE TERMINADA EN EMPATE\n\n◢ X ${newScores.X} ◣  ◢ O ${newScores.O} ◣`
          : `◢ SERIE GANADA POR JUGADOR ${seriesWinner} ◣\n\n◢ X ${newScores.X} ◣  ◢ O ${newScores.O} ◣`;
        
        Alert.alert('JUEGO TERMINADO', seriesMessage, [
          { text: 'VOLVER', onPress: () => router.push('/') }
        ]);
        return;
      }
      
      setTimeout(() => {
        resetRound(newScores, nextRound);
      }, 2000);
    }
  };

  const handleLeave = async () => {
    Alert.alert('SALIR', '¿Seguro que quieres salir?', [
      { text: 'CANCELAR', style: 'cancel' },
      { 
        text: 'SALIR', 
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
      case 'classic': return 'MODO CLASICO';
      case 'temporal': return 'MODO TEMPORAL';
      case 'chaos': return 'MODO CAOS';
      case 'timequiz': return 'TIME QUIZ';
      default: return 'MODO DESCONOCIDO';
    }
  };

  const getModeSymbol = () => {
    switch(gameMode) {
      case 'classic': return '⬤';
      case 'temporal': return '◈';
      case 'chaos': return '⌾';
      case 'timequiz': return '⏣';
      default: return '⬤';
    }
  };

  const getModeColor = () => {
    switch(gameMode) {
      case 'classic': return '#FF2A6D';
      case 'temporal': return '#05D9E8';
      case 'chaos': return '#B926FF';
      case 'timequiz': return '#FFD700';
      default: return '#FF2A6D';
    }
  };

  const winsNeeded = Math.floor(totalGames / 2) + 1;
  const isMyTurn = isMultiplayer !== 'true' || currentTurn === playerSymbol;
  const isGameActive = !winner;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* FONDO NEON */}
      <View style={styles.backgroundNeon}>
        <View style={styles.neonGrid}>
          {[...Array(20)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLineH, { top: `${i * 5}%` }]} />
          ))}
          {[...Array(12)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLineV, { left: `${i * 8.33}%` }]} />
          ))}
        </View>
        <View style={styles.pulseRing1} />
        <View style={styles.pulseRing2} />
        <View style={styles.floatingShape1}>
          <Text style={styles.shapeText}>⬤</Text>
        </View>
        <View style={styles.floatingShape2}>
          <Text style={styles.shapeText}>◈</Text>
        </View>
        <View style={styles.floatingShape3}>
          <Text style={styles.shapeText}>⌾</Text>
        </View>
        {gameMode === 'timequiz' && (
          <View style={styles.floatingShape4}>
            <Text style={[styles.shapeText, { color: '#FFD700' }]}>⏣</Text>
          </View>
        )}
        <View style={styles.overlayDark} />
      </View>

      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.glitchWrapper}>
            <View style={styles.glitchLayer1}>
              <Text style={styles.titleGlitch}>BATALLA</Text>
            </View>
            <View style={styles.glitchLayer2}>
              <Text style={styles.titleGlitch}>BATALLA</Text>
            </View>
            <View style={styles.glitchLayer3}>
              <Text style={styles.titleGlitch}>BATALLA</Text>
            </View>
            <Text style={styles.titleMain}>BATALLA</Text>
          </View>
          
          <View style={[styles.modeBadge, { borderColor: getModeColor() }]}>
            <Text style={[styles.modeSymbol, { color: getModeColor() }]}>{getModeSymbol()}</Text>
            <Text style={[styles.modeText, { color: getModeColor() }]}>{getModeName()}</Text>
          </View>
          
          {/* Premium Badge para TIME QUIZ */}
          {gameMode === 'timequiz' && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>◢ PREMIUM ◣</Text>
            </View>
          )}
        </View>

        {/* SCORES - CON BORDE Y ETIQUETA TU */}
        <View style={styles.scoreContainer}>
          <View style={[
            styles.scoreCard,
            isMultiplayer === 'true' && playerSymbol === 'X' && styles.currentPlayerCard,
          ]}>
            <View style={[styles.scoreBorder, { borderColor: gameMode === 'timequiz' ? '#FFD700' : '#FF2A6D' }]}>
              <Text style={styles.scoreIcon}>✕</Text>
              <Text style={styles.scoreTitle}>
                {isMultiplayer === 'true' 
                  ? (playerSymbol === 'X' 
                      ? (playerName || 'JUGADOR X') 
                      : (opponent?.name || 'JUGADOR X'))
                  : 'JUGADOR X'}
              </Text>
              <Text style={[styles.scoreValue, { color: gameMode === 'timequiz' ? '#FFD700' : '#FF2A6D' }]}>{scores.X}</Text>
              {gameMode === 'temporal' && (
                <Text style={styles.fichaCount}>FICHAS: {xHistory.length}/3</Text>
              )}
              {isMultiplayer === 'true' && playerSymbol === 'X' && (
                <View style={[styles.youBadge, { backgroundColor: gameMode === 'timequiz' ? '#FFD700' : '#FF2A6D' }]}>
                  <Text style={styles.youBadgeText}>◢ TU ◣</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>◢ VS ◣</Text>
          </View>
          
          <View style={[
            styles.scoreCard,
            isMultiplayer === 'true' && playerSymbol === 'O' && styles.currentPlayerCard,
          ]}>
            <View style={[styles.scoreBorder, { borderColor: '#05D9E8' }]}>
              <Text style={styles.scoreIcon}>○</Text>
              <Text style={styles.scoreTitle}>
                {isMultiplayer === 'true'
                  ? (playerSymbol === 'O' 
                      ? (playerName || 'JUGADOR O') 
                      : (opponent?.name || 'JUGADOR O'))
                  : 'JUGADOR O'}
              </Text>
              <Text style={[styles.scoreValue, { color: '#05D9E8' }]}>{scores.O}</Text>
              {gameMode === 'temporal' && (
                <Text style={styles.fichaCount}>FICHAS: {oHistory.length}/3</Text>
              )}
              {isMultiplayer === 'true' && playerSymbol === 'O' && (
                <View style={[styles.youBadge, { backgroundColor: '#05D9E8' }]}>
                  <Text style={styles.youBadgeText}>◢ TU ◣</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* INFO BAR */}
        <View style={styles.infoBar}>
          <View style={[styles.roundBadge, { backgroundColor: getModeColor() }]}>
            <Text style={styles.roundText}>◢ RONDA {currentRound}/{totalGames} ◣</Text>
          </View>
          <View style={[styles.turnBadge, !isMyTurn && styles.notMyTurnBadge]}>
            <Text style={styles.turnText}>
              {winner 
                ? `◢ GANADOR: ${winner} ◣`
                : isMultiplayer === 'true'
                  ? `${currentTurn === playerSymbol ? '◢ TU TURNO ◣' : '◢ TURNO OPONENTE ◣'}`
                  : `◢ TURNO: ${currentTurn} ◣`}
            </Text>
          </View>
        </View>

        {/* WINS NEEDED */}
        <View style={[styles.winsNeededContainer, { borderColor: getModeColor() }]}>
          <Text style={[styles.winsNeededText, { color: getModeColor() }]}>
            ◢ {winsNeeded} VICTORIAS PARA GANAR LA SERIE ◣
          </Text>
        </View>

        {/* BOARD */}
        <Board 
          board={board}
          onMove={handleMove}
          disabled={!isGameActive || (isMultiplayer === 'true' && currentTurn !== playerSymbol)}
          gameMode={gameMode}
          blockedCells={blockedCells}
        />

        {/* EXIT BUTTON */}
        <TouchableOpacity style={styles.exitButton} onPress={handleLeave}>
          <Text style={styles.exitButtonText}>◢  SALIR  ◣</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a2a',
  },
  
  // FONDO NEON
  backgroundNeon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  
  neonGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FF2A6D',
    opacity: 0.06,
  },
  
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#05D9E8',
    opacity: 0.06,
  },
  
  pulseRing1: {
    position: 'absolute',
    top: '15%',
    left: '-20%',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: '#FF2A6D',
    opacity: 0.12,
  },
  
  pulseRing2: {
    position: 'absolute',
    bottom: '10%',
    right: '-15%',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: '#05D9E8',
    opacity: 0.1,
  },
  
  floatingShape1: {
    position: 'absolute',
    top: '12%',
    left: '8%',
    opacity: 0.12,
    transform: [{ rotate: '15deg' }],
  },
  
  floatingShape2: {
    position: 'absolute',
    top: '25%',
    right: '10%',
    opacity: 0.1,
    transform: [{ rotate: '-10deg' }],
  },
  
  floatingShape3: {
    position: 'absolute',
    bottom: '20%',
    left: '12%',
    opacity: 0.11,
    transform: [{ rotate: '25deg' }],
  },
  
  floatingShape4: {
    position: 'absolute',
    top: '60%',
    right: '15%',
    opacity: 0.09,
    transform: [{ rotate: '-5deg' }],
  },
  
  shapeText: {
    fontSize: 48,
    color: '#FF2A6D',
  },
  
  overlayDark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,42,0.85)',
  },
  
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  
  // HEADER
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  glitchWrapper: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  
  titleMain: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 8,
    textShadowColor: '#FF2A6D',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    zIndex: 10,
  },
  
  titleGlitch: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 8,
    position: 'absolute',
    opacity: 0.5,
  },
  
  glitchLayer1: {
    position: 'absolute',
    left: -3,
    top: -3,
  },
  
  glitchLayer2: {
    position: 'absolute',
    left: 3,
    top: 3,
  },
  
  glitchLayer3: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  
  modeBadge: {
    flexDirection: 'row',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  
  modeSymbol: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  modeText: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  
  premiumBadge: {
    backgroundColor: '#FFD70020',
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  
  // SCORES
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  scoreCard: {
    padding: 10,
    alignItems: 'center',
  },
  
  scoreBorder: {
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    minWidth: width * 0.32,
    backgroundColor: '#0C0C24',
  },
  
  currentPlayerCard: {
    transform: [{ scale: 1.02 }],
  },
  
  scoreIcon: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  
  scoreTitle: {
    fontSize: 10,
    letterSpacing: 1,
    color: '#8888AA',
    marginBottom: 4,
  },
  
  scoreValue: {
    fontSize: 34,
    fontWeight: '900',
  },
  
  fichaCount: {
    fontSize: 8,
    color: '#8888AA',
    marginTop: 4,
    letterSpacing: 1,
  },
  
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  
  youBadgeText: {
    color: '#0a0a1a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  vsContainer: {
    marginHorizontal: 12,
  },
  
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8888AA',
    letterSpacing: 2,
  },
  
  // INFO BAR
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    marginBottom: 15,
    gap: 12,
    flexWrap: 'wrap',
  },
  
  roundBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  
  roundText: {
    color: '#0a0a1a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  turnBadge: {
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  
  notMyTurnBadge: {
    backgroundColor: '#555580',
  },
  
  turnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  winsNeededContainer: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 15,
  },
  
  winsNeededText: {
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  
  // BOARD
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 340,
    backgroundColor: '#0C0C24',
    borderWidth: 1,
    borderColor: '#1A1A40',
    padding: 10,
    marginBottom: 25,
  },
  
  cell: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A40',
    backgroundColor: '#0a0a1a',
    margin: 2,
  },
  
  xCell: {
    backgroundColor: '#1A0A15',
  },
  
  oCell: {
    backgroundColor: '#0A1520',
  },
  
  blockedCell: {
    backgroundColor: '#1A0A0A',
    borderColor: '#FF2A6D',
  },
  
  cellText: {
    fontSize: 44,
    fontWeight: '900',
  },
  
  xText: {
    color: '#FF2A6D',
  },
  
  oText: {
    color: '#05D9E8',
  },
  
  // EXIT BUTTON
  exitButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF2A6D',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  
  exitButtonText: {
    color: '#FF2A6D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
});