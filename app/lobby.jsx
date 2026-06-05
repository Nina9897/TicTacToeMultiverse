// app/lobby.jsx - CON SOPORTE PARA MODO TIME QUIZ MULTIJUGADOR
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { subscribeToRoom, leaveRoom } from '../services/firebase';
import QRCode from 'react-native-qrcode-svg';

export default function LobbyScreen() {
  const router = useRouter();
  const { roomCode, playerId, playerName, isCreator, gameMode } = useLocalSearchParams();
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomCode, (room) => {
      if (room) {
        const playersList = Object.values(room.players || {});
        setPlayers(playersList);
        setGameStatus(room.status);
        
        if (room.status === 'playing' && room.players) {
          const currentPlayer = playersList.find(p => p.id === playerId);
          if (currentPlayer) {
            // Redirigir según el modo de juego
            if (room.gameMode === 'timequiz') {
              router.replace({
                pathname: '/timequizMultiplayer',
                params: {
                  roomCode,
                  playerId,
                  playerName,
                  playerSymbol: currentPlayer.symbol,
                  gameMode: room.gameMode,
                  isMultiplayer: 'true',
                  totalRounds: room.totalRounds?.toString() || '3',
                }
              });
            } else {
              router.replace({
                pathname: '/game',
                params: {
                  roomCode,
                  playerId,
                  playerName,
                  playerSymbol: currentPlayer.symbol,
                  gameMode: room.gameMode,
                  isMultiplayer: 'true',
                  totalRounds: room.totalRounds?.toString() || '3',
                }
              });
            }
          }
        }
      } else {
        Alert.alert('Error', 'La sala ha sido cerrada', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      }
    });
    
    return () => unsubscribe();
  }, [roomCode, playerId]);

  const copyRoomCode = () => {
    Alert.alert('Exito', `Codigo ${roomCode} copiado`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    Alert.alert(
      'Salir de la sala',
      'Seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salir', 
          style: 'destructive',
          onPress: async () => {
            await leaveRoom(roomCode, playerId);
            router.replace('/');
          }
        }
      ]
    );
  };

  const getGameModeName = () => {
    switch(gameMode) {
      case 'classic': return 'MODO CLASICO';
      case 'temporal': return 'MODO TEMPORAL';
      case 'chaos': return 'MODO CAOS';
      case 'timequiz': return 'TIME QUIZ';
      default: return 'MODO DESCONOCIDO';
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

  const getModeSymbol = () => {
    switch(gameMode) {
      case 'classic': return '⬤';
      case 'temporal': return '◈';
      case 'chaos': return '⌾';
      case 'timequiz': return '⏣';
      default: return '⬤';
    }
  };

  return (
    <View style={styles.container}>
      {/* FONDO NEON CON PATRONES */}
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
        <View style={styles.pulseRing3} />
        <View style={styles.floatingShape1}>
          <Text style={styles.shapeText}>⬤</Text>
        </View>
        <View style={styles.floatingShape2}>
          <Text style={styles.shapeText}>◈</Text>
        </View>
        <View style={styles.floatingShape3}>
          <Text style={styles.shapeText}>⌾</Text>
        </View>
        <View style={styles.floatingShape4}>
          <Text style={styles.shapeText}>✕</Text>
        </View>
        <View style={styles.floatingShape5}>
          <Text style={styles.shapeText}>○</Text>
        </View>
        <View style={styles.trianguloRojo} />
        <View style={styles.trianguloAzul} />
        <View style={styles.trianguloMorado} />
        <View style={styles.rectNeon1} />
        <View style={styles.rectNeon2} />
        <View style={styles.diagonalLine1} />
        <View style={styles.diagonalLine2} />
        <View style={styles.particle1} />
        <View style={styles.particle2} />
        <View style={styles.particle3} />
        <View style={styles.particle4} />
        <View style={styles.particle5} />
        <View style={styles.particle6} />
        <View style={styles.overlayDark} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* HEADER CENTRADO */}
          <View style={styles.header}>
            <View style={styles.glitchWrapper}>
              <View style={styles.glitchLayer1}>
                <Text style={styles.titleGlitch}>SALA DE ESPERA</Text>
              </View>
              <View style={styles.glitchLayer2}>
                <Text style={styles.titleGlitch}>SALA DE ESPERA</Text>
              </View>
              <View style={styles.glitchLayer3}>
                <Text style={styles.titleGlitch}>SALA DE ESPERA</Text>
              </View>
              <Text style={styles.titleMain}>SALA DE ESPERA</Text>
            </View>
          </View>

          {/* MODO DE JUEGO - ARRIBA */}
          <View style={[styles.modeBadge, { borderColor: getModeColor() }]}>
            <Text style={[styles.modeSymbol, { color: getModeColor() }]}>{getModeSymbol()}</Text>
            <Text style={[styles.modeText, { color: getModeColor() }]}>{getGameModeName()}</Text>
          </View>

          {/* PREMIUM BADGE PARA TIME QUIZ */}
          {gameMode === 'timequiz' && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>◢ MODO PREMIUM ◣</Text>
            </View>
          )}

          {/* JUGADORES - PRIMERO */}
          <View style={styles.playersContainer}>
            <Text style={styles.playersTitle}>
              ◢  JUGADORES ({players.length}/2)  ◣
            </Text>
            
            {players.map((player, index) => (
              <View key={index} style={styles.playerCard}>
                <View style={styles.playerInfo}>
                  <View style={[styles.playerSymbolBox, { backgroundColor: player.symbol === 'X' ? '#FF2A6D' : '#05D9E8' }]}>
                    <Text style={styles.playerSymbol}>{player.symbol}</Text>
                  </View>
                  <Text style={styles.playerName}>{player.name}</Text>
                </View>
                {player.isHost && (
                  <View style={[styles.hostBadge, { backgroundColor: getModeColor() }]}>
                    <Text style={styles.hostText}>◢ HOST ◣</Text>
                  </View>
                )}
                <View style={[styles.statusDot, { backgroundColor: '#00FF88' }]} />
              </View>
            ))}
            
            {players.length === 1 && (
              <View style={styles.waitingCard}>
                <ActivityIndicator size="small" color={getModeColor()} />
                <Text style={[styles.waitingText, { color: getModeColor() }]}>
                  ESPERANDO JUGADOR...
                </Text>
              </View>
            )}
          </View>

          {/* CODIGO DE SALA - CENTRADO */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>◢  CODIGO DE SALA  ◣</Text>
            <Text style={styles.roomCode}>{roomCode}</Text>
            <TouchableOpacity style={[styles.copyButton, { backgroundColor: getModeColor() }]} onPress={copyRoomCode}>
              <Text style={styles.copyButtonText}>
                {copied ? '✓ COPIADO' : '◢ COPIAR ◣'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* QR CODE - SOLO PARA HOST */}
          {isCreator === 'true' && (
            <View style={styles.qrContainer}>
              <Text style={styles.qrLabel}>◢  ESCANEAR QR  ◣</Text>
              <View style={styles.qrWrapper}>
                <QRCode value={roomCode} size={140} color={getModeColor()} backgroundColor="#FFFFFF" />
              </View>
            </View>
          )}

          {/* INFO BOX */}
          <View style={styles.infoBox}>
            <Text style={[styles.infoText, { color: getModeColor() }]}>
              {players.length === 1 ? '✦ COMPARTE EL CODIGO ✦' : '✦ LISTOS PARA JUGAR ✦'}
            </Text>
            <View style={styles.infoLine} />
            <Text style={styles.infoSubtext}>
              {players.length === 1 
                ? 'EL JUEGO COMENZARA CUANDO SE UNA EL SEGUNDO JUGADOR'
                : gameMode === 'timequiz'
                  ? 'MODO TIME QUIZ: RESPONDE PREGUNTAS PARA JUGAR'
                  : 'PREPARANDOSE PARA LA BATALLA...'}
            </Text>
          </View>

          {/* BOTON SALIR - ABAJO */}
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
            <Text style={styles.leaveButtonText}>◢  SALIR  ◣</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a2a',
  },

  /* FONDO NEON */
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
  pulseRing3: {
    position: 'absolute',
    top: '50%',
    left: '30%',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#B926FF',
    opacity: 0.08,
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
  floatingShape5: {
    position: 'absolute',
    bottom: '35%',
    right: '25%',
    opacity: 0.1,
    transform: [{ rotate: '20deg' }],
  },
  shapeText: {
    fontSize: 48,
    color: '#FF2A6D',
  },
  
  trianguloRojo: {
    position: 'absolute',
    top: '70%',
    left: '5%',
    width: 0,
    height: 0,
    borderLeftWidth: 40,
    borderRightWidth: 40,
    borderBottomWidth: 69,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF2A6D',
    opacity: 0.06,
  },
  trianguloAzul: {
    position: 'absolute',
    top: '20%',
    right: '5%',
    width: 0,
    height: 0,
    borderLeftWidth: 35,
    borderRightWidth: 35,
    borderTopWidth: 61,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#05D9E8',
    opacity: 0.06,
  },
  trianguloMorado: {
    position: 'absolute',
    bottom: '50%',
    right: '30%',
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 52,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#B926FF',
    opacity: 0.06,
  },
  
  rectNeon1: {
    position: 'absolute',
    top: '40%',
    left: '2%',
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#FF2A6D',
    opacity: 0.06,
    transform: [{ rotate: '45deg' }],
  },
  rectNeon2: {
    position: 'absolute',
    bottom: '15%',
    right: '8%',
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#05D9E8',
    opacity: 0.06,
    transform: [{ rotate: '30deg' }],
  },
  
  diagonalLine1: {
    position: 'absolute',
    top: '20%',
    left: '-10%',
    width: '120%',
    height: 2,
    backgroundColor: '#05D9E8',
    opacity: 0.04,
    transform: [{ rotate: '35deg' }],
  },
  diagonalLine2: {
    position: 'absolute',
    bottom: '30%',
    left: '-10%',
    width: '120%',
    height: 2,
    backgroundColor: '#B926FF',
    opacity: 0.04,
    transform: [{ rotate: '-25deg' }],
  },
  
  particle1: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF2A6D',
    opacity: 0.4,
  },
  particle2: {
    position: 'absolute',
    top: '35%',
    right: '25%',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#05D9E8',
    opacity: 0.3,
  },
  particle3: {
    position: 'absolute',
    bottom: '25%',
    left: '35%',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#B926FF',
    opacity: 0.35,
  },
  particle4: {
    position: 'absolute',
    top: '55%',
    left: '15%',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FF2A6D',
    opacity: 0.3,
  },
  particle5: {
    position: 'absolute',
    bottom: '45%',
    right: '18%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#05D9E8',
    opacity: 0.25,
  },
  particle6: {
    position: 'absolute',
    top: '75%',
    left: '45%',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#B926FF',
    opacity: 0.3,
  },
  
  overlayDark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,42,0.85)',
  },

  scrollContainer: {
    flexGrow: 1,
    zIndex: 10,
  },
  
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  /* HEADER CENTRADO */
  header: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  glitchWrapper: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 0,
  },
  titleMain: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 5,
    textShadowColor: '#FF2A6D',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    zIndex: 10,
  },
  titleGlitch: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 5,
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
  
  /* MODO BADGE */
  modeBadge: {
    flexDirection: 'row',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
    marginBottom: 15,
  },
  modeSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeText: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 'bold',
  },

  /* PREMIUM BADGE */
  premiumBadge: {
    backgroundColor: '#FFD70020',
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: 'bold',
  },

  /* JUGADORES - PRIORIDAD */
  playersContainer: {
    width: '100%',
    marginBottom: 25,
  },
  playersTitle: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#FF2A6D',
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C0C24',
    borderWidth: 1,
    borderColor: '#1A1A40',
    padding: 14,
    marginBottom: 10,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerSymbolBox: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerSymbol: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  hostBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  hostText: {
    color: '#0a0a1a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C0C24',
    borderWidth: 1,
    borderColor: '#1A1A40',
    padding: 16,
    gap: 12,
  },
  waitingText: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },

  /* CODIGO DE SALA */
  codeCard: {
    backgroundColor: '#0C0C24',
    borderWidth: 1,
    borderColor: '#1A1A40',
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: '#8888AA',
    marginBottom: 10,
  },
  roomCode: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FF2A6D',
    letterSpacing: 6,
  },
  copyButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 12,
  },
  copyButtonText: {
    color: '#0a0a1a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  /* QR */
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#0C0C24',
    borderWidth: 1,
    borderColor: '#1A1A40',
    width: '100%',
  },
  qrLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: '#8888AA',
    marginBottom: 10,
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: '#FFFFFF',
  },

  /* INFO BOX */
  infoBox: {
    backgroundColor: '#0C0C24',
    borderWidth: 1,
    borderColor: '#1A1A40',
    padding: 14,
    width: '100%',
    marginBottom: 25,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoLine: {
    height: 1,
    backgroundColor: '#1A1A40',
    marginVertical: 8,
  },
  infoSubtext: {
    textAlign: 'center',
    color: '#7777AA',
    fontSize: 9,
    letterSpacing: 1,
  },

  /* BOTON SALIR */
  leaveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF2A6D',
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  leaveButtonText: {
    color: '#FF2A6D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
});