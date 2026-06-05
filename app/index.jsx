// app/index.jsx - CON NUEVO MODO TIME QUIZ
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRoom, joinRoom, generateRoomCode } from '../services/firebase';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState('classic');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const gameModes = [
    { id: 'classic', name: 'CLÁSICO', description: 'REGLAS TRADICIONALES', symbol: '⬤', color1: '#FF2A6D', color2: '#FF6B4A' },
    { id: 'temporal', name: 'TEMPORAL', description: 'FICHAS QUE DESAPARECEN', symbol: '◈', color1: '#05D9E8', color2: '#00E5FF' },
    { id: 'chaos', name: 'CAOS', description: 'CASILLAS BLOQUEADAS', symbol: '⌾', color1: '#B926FF', color2: '#D946EF' },
    { id: 'timequiz', name: 'TIME QUIZ', description: 'PREMIUM: PREGUNTAS + VIAJE TEMPORAL', symbol: '⏣', color1: '#FFD700', color2: '#FFA500' },
  ];

  useEffect(() => {
    loadSavedName();
  }, []);

  const loadSavedName = async () => {
    try {
      const savedName = await AsyncStorage.getItem('playerName');
      if (savedName) {
        setPlayerName(savedName);
      }
    } catch (error) {
      console.error('Error al cargar nombre:', error);
    }
  };

  const savePlayerName = async (name) => {
    try {
      if (name && name.trim()) {
        await AsyncStorage.setItem('playerName', name.trim());
        console.log('Nombre guardado:', name);
      }
    } catch (error) {
      console.error('Error al guardar nombre:', error);
    }
  };

  const handleNameChange = (text) => {
    setPlayerName(text);
  };

  const handleNameBlur = () => {
    if (playerName && playerName.trim()) {
      savePlayerName(playerName);
      setIsEditingName(false);
    }
  };

  const handleSaveName = () => {
    if (playerName && playerName.trim()) {
      savePlayerName(playerName);
      setIsEditingName(false);
      Alert.alert('Éxito', `Nombre "${playerName}" guardado`);
    } else {
      Alert.alert('Error', 'Ingresa un nombre válido');
    }
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }
    await savePlayerName(playerName);
    setLoading(true);
    try {
      const newRoomCode = generateRoomCode();
      const { roomCode, playerId, playerSymbol } = await createRoom(newRoomCode, playerName, selectedMode);
      router.push({
        pathname: '/lobby',
        params: { roomCode, playerId, playerName, isCreator: 'true', gameMode: selectedMode },
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la sala');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Ingresa el código de sala');
      return;
    }
    await savePlayerName(playerName);
    setLoading(true);
    try {
      const { playerId, playerSymbol, gameMode } = await joinRoom(roomCode.toUpperCase(), playerName);
      router.push({
        pathname: '/lobby',
        params: { roomCode: roomCode.toUpperCase(), playerId, playerName, isCreator: 'false', gameMode },
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const startLocalGame = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }
    savePlayerName(playerName);
    
    // Redirigir según el modo seleccionado
    if (selectedMode === 'timequiz') {
      router.push({
        pathname: '/timequiz',
        params: { gameMode: selectedMode, isMultiplayer: 'false', playerName: playerName },
      });
    } else {
      router.push({
        pathname: '/game',
        params: { gameMode: selectedMode, isMultiplayer: 'false', playerName: playerName },
      });
    }
  };

  const getModeStyle = (modeId) => {
    if (selectedMode !== modeId) return {};
    const colors = { classic: '#FF2A6D', temporal: '#05D9E8', chaos: '#B926FF', timequiz: '#FFD700' };
    return {
      borderWidth: 2,
      borderColor: colors[modeId],
      shadowColor: colors[modeId],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    };
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* FONDO CON SIMBOLOS */}
      <View style={styles.backgroundGrid}>
        <Text style={styles.bgSymbol1}>⬤</Text>
        <Text style={styles.bgSymbol2}>◈</Text>
        <Text style={styles.bgSymbol3}>⌾</Text>
        <Text style={styles.bgSymbol4}>✕</Text>
        <Text style={styles.bgSymbol5}>○</Text>
        <Text style={styles.bgSymbol6}>◢</Text>
        <Text style={styles.bgSymbol7}>◣</Text>
        <Text style={styles.bgSymbol8}>◆</Text>
        <Text style={styles.bgSymbol9}>◇</Text>
        <Text style={styles.bgSymbol10}>⬟</Text>
        <Text style={styles.bgSymbol11}>⬚</Text>
        <Text style={styles.bgSymbol12}>▣</Text>
        <View style={styles.gradientOverlay} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER CENTRADO */}
        <View style={styles.headerCenter}>
          <View style={styles.glitchWrapper}>
            <View style={styles.glitchLayer1}>
              <Text style={styles.titleGlitch}>TRES EN RAYA</Text>
            </View>
            <View style={styles.glitchLayer2}>
              <Text style={styles.titleGlitch}>TRES EN RAYA</Text>
            </View>
            <View style={styles.glitchLayer3}>
              <Text style={styles.titleGlitch}>TRES EN RAYA</Text>
            </View>
            <Text style={styles.titleMain}>TRES EN RAYA</Text>
          </View>
          
          <View style={styles.subtitleContainer}>
            <View style={styles.decoLine} />
            <Text style={styles.subtitle}>MULTIVERSO ARCADE</Text>
            <View style={styles.decoLine} />
          </View>
        </View>

        {/* MODOS DE JUEGO */}
        <View style={styles.modesSection}>
          <View style={styles.sectionBadge}>
            <Text style={styles.badgeText}>◢  MODOS DE JUEGO  ◣</Text>
          </View>
          
          {gameModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.modeCard, getModeStyle(mode.id)]}
              onPress={() => setSelectedMode(mode.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.modeSymbolContainer, { backgroundColor: mode.color1 + '15' }]}>
                <Text style={[styles.modeSymbol, { color: mode.color1, textShadowColor: mode.color1, textShadowRadius: 8 }]}>{mode.symbol}</Text>
              </View>
              <View style={styles.modeInfo}>
                <Text style={[styles.modeName, { color: mode.color1 }]}>{mode.name}</Text>
                <Text style={styles.modeDesc}>{mode.description}</Text>
              </View>
              {selectedMode === mode.id && (
                <View style={[styles.activeBadge, { backgroundColor: mode.color1 }]}>
                  <Text style={styles.activeBadgeText}>▶</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* TARJETA DE JUGADOR */}
        <View style={styles.playerCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>◢</Text>
            <Text style={styles.cardTitle}>PERFIL DE JUGADOR</Text>
            <Text style={styles.cardIcon}>◣</Text>
          </View>
          
          {isEditingName || !playerName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.playerInput}
                placeholder="[ INGRESA TU NOMBRE ]"
                placeholderTextColor="#333355"
                value={playerName}
                onChangeText={handleNameChange}
                onBlur={handleNameBlur}
                autoFocus={!playerName}
                maxLength={20}
              />
              <TouchableOpacity style={styles.neonButtonSmall} onPress={handleSaveName}>
                <Text style={styles.neonButtonSmallText}>[[ GUARDAR ]]</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.playerDisplay}
              onPress={() => setIsEditingName(true)}
            >
              <Text style={styles.playerSymbol}>◆</Text>
              <Text style={styles.playerName}>{playerName}</Text>
              <Text style={styles.playerEditHint}>[EDITAR]</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ARENA ONLINE */}
        <View style={styles.onlineSection}>
          <View style={styles.scanLine}>
            <Text style={styles.scanText}>══════  ✦  ARENA ONLINE  ✦  ══════</Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateRoom}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#050508" size="small" />
            ) : (
              <>
                <Text style={styles.createButtonIcon}>◢</Text>
                <Text style={styles.createButtonText}>CREAR SALA</Text>
                <Text style={styles.createButtonIcon}>◣</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.joinRow}>
            <View style={styles.codeWrapper}>
              <Text style={styles.codePrefix}>CÓDIGO DE SALA</Text>
              <TextInput
                style={styles.codeField}
                placeholder="XXXXXX"
                placeholderTextColor="#333355"
                value={roomCode}
                onChangeText={setRoomCode}
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>
            
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoinRoom}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#050508" size="small" />
              ) : (
                <Text style={styles.joinButtonText}>▶ UNIRSE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* MODO LOCAL */}
        <TouchableOpacity style={styles.localBanner} onPress={startLocalGame}>
          <View style={styles.localBannerLeft}>
            <Text style={styles.localIcon}>⌂</Text>
            <View>
              <Text style={styles.localTitle}>BATALLA LOCAL</Text>
              <Text style={styles.localSub}>2 JUGADORES · MISMO DISPOSITIVO</Text>
            </View>
          </View>
          <View style={styles.localBannerRight}>
            <Text style={styles.localArrow}>▶▶</Text>
          </View>
        </TouchableOpacity>

        {/* PREMIUM INFO - Solo para el modo TIME QUIZ */}
        {selectedMode === 'timequiz' && (
          <View style={styles.premiumInfo}>
            <Text style={styles.premiumTitle}>◢ MODO PREMIUM ◣</Text>
            <Text style={styles.premiumText}>✦ RESPONDE PREGUNTAS PARA JUGAR</Text>
            <Text style={styles.premiumText}>✦ GANA ENERGÍA POR ACIERTOS</Text>
            <Text style={styles.premiumText}>✦ VIAJA EN EL TIEMPO Y CAMBIA EL JUEGO</Text>
            <Text style={styles.premiumText}>✦ CREA LÍNEAS TEMPORALES ALTERNAS</Text>
          </View>
        )}

        {/* PIE DE PÁGINA */}
        <View style={styles.statsFooter}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>MODOS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>✦</Text>
            <Text style={styles.statLabel}>MULTIJUGADOR</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>∞</Text>
            <Text style={styles.statLabel}>GRATIS</Text>
          </View>
        </View>

      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Text style={styles.loadingSymbol}>◈</Text>
            <ActivityIndicator size="large" color="#FF2A6D" />
            <Text style={styles.loadingText}>CONECTANDO...</Text>
            <Text style={styles.loadingDots}>◢ ◣ ◤ ◥</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020206',
  },

  /* FONDO CON SÍMBOLOS */
  backgroundGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2,2,6,0.85)',
  },
  bgSymbol1: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    fontSize: 60,
    color: '#FF2A6D',
    opacity: 0.08,
    transform: [{ rotate: '15deg' }],
  },
  bgSymbol2: {
    position: 'absolute',
    top: '20%',
    right: '8%',
    fontSize: 45,
    color: '#05D9E8',
    opacity: 0.07,
    transform: [{ rotate: '-10deg' }],
  },
  bgSymbol3: {
    position: 'absolute',
    bottom: '15%',
    left: '10%',
    fontSize: 70,
    color: '#B926FF',
    opacity: 0.06,
    transform: [{ rotate: '25deg' }],
  },
  bgSymbol4: {
    position: 'absolute',
    top: '50%',
    right: '15%',
    fontSize: 35,
    color: '#FF2A6D',
    opacity: 0.05,
  },
  bgSymbol5: {
    position: 'absolute',
    bottom: '30%',
    right: '20%',
    fontSize: 50,
    color: '#05D9E8',
    opacity: 0.06,
    transform: [{ rotate: '-20deg' }],
  },
  bgSymbol6: {
    position: 'absolute',
    top: '70%',
    left: '20%',
    fontSize: 40,
    color: '#B926FF',
    opacity: 0.07,
  },
  bgSymbol7: {
    position: 'absolute',
    top: '15%',
    left: '30%',
    fontSize: 25,
    color: '#FF2A6D',
    opacity: 0.05,
  },
  bgSymbol8: {
    position: 'absolute',
    bottom: '45%',
    left: '45%',
    fontSize: 55,
    color: '#05D9E8',
    opacity: 0.04,
    transform: [{ rotate: '45deg' }],
  },
  bgSymbol9: {
    position: 'absolute',
    top: '85%',
    right: '35%',
    fontSize: 30,
    color: '#B926FF',
    opacity: 0.06,
  },
  bgSymbol10: {
    position: 'absolute',
    top: '40%',
    left: '75%',
    fontSize: 48,
    color: '#FF2A6D',
    opacity: 0.05,
    transform: [{ rotate: '-15deg' }],
  },
  bgSymbol11: {
    position: 'absolute',
    bottom: '60%',
    right: '50%',
    fontSize: 38,
    color: '#05D9E8',
    opacity: 0.04,
  },
  bgSymbol12: {
    position: 'absolute',
    top: '55%',
    left: '15%',
    fontSize: 42,
    color: '#B926FF',
    opacity: 0.05,
    transform: [{ rotate: '30deg' }],
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
    zIndex: 10,
  },

  /* HEADER CENTRADO */
  headerCenter: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 10,
  },
  glitchWrapper: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  titleMain: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    textShadowColor: '#FF2A6D',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    zIndex: 10,
  },
  titleGlitch: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 6,
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
  
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  decoLine: {
    width: 30,
    height: 2,
    backgroundColor: '#FF2A6D',
    opacity: 0.6,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 5,
    color: '#8888AA',
    fontWeight: '600',
  },

  /* MODOS SECTION */
  modesSection: {
    marginBottom: 24,
  },
  sectionBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 4,
    color: '#FF2A6D',
    borderWidth: 1,
    borderColor: '#FF2A6D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FF2A6D10',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C0C18',
    padding: 14,
    marginBottom: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#1A1A30',
  },
  modeSymbolContainer: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeSymbol: {
    fontSize: 34,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  modeDesc: {
    fontSize: 9,
    color: '#555580',
    letterSpacing: 1,
    marginTop: 3,
  },
  activeBadge: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadgeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  /* PLAYER CARD */
  playerCard: {
    backgroundColor: '#0C0C18',
    borderWidth: 1,
    borderColor: '#1A1A30',
    padding: 16,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardIcon: {
    color: '#FF2A6D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#8888AA',
  },
  nameEditContainer: {
    gap: 10,
  },
  playerInput: {
    backgroundColor: '#020206',
    borderWidth: 1,
    borderColor: '#FF2A6D',
    color: '#FF2A6D',
    fontSize: 14,
    padding: 12,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
  },
  neonButtonSmall: {
    backgroundColor: '#FF2A6D',
    paddingVertical: 10,
    alignItems: 'center',
  },
  neonButtonSmallText: {
    color: '#020206',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  playerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1A1A30',
    backgroundColor: '#020206',
  },
  playerSymbol: {
    color: '#FF2A6D',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  playerEditHint: {
    fontSize: 9,
    color: '#555580',
    letterSpacing: 1,
  },

  /* ONLINE SECTION */
  onlineSection: {
    marginBottom: 24,
    backgroundColor: '#0C0C18',
    borderWidth: 1,
    borderColor: '#1A1A30',
    padding: 16,
  },
  scanLine: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scanText: {
    fontSize: 8,
    letterSpacing: 3,
    color: '#05D9E8',
  },
  createButton: {
    backgroundColor: '#05D9E8',
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  createButtonIcon: {
    color: '#020206',
    fontSize: 12,
    fontWeight: 'bold',
  },
  createButtonText: {
    color: '#020206',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeWrapper: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#1A1A30',
    backgroundColor: '#020206',
  },
  codePrefix: {
    fontSize: 8,
    color: '#555580',
    letterSpacing: 2,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  codeField: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    color: '#05D9E8',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#B926FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },

  /* LOCAL BANNER */
  localBanner: {
    backgroundColor: '#1A0A18',
    borderWidth: 1,
    borderColor: '#FF2A6D',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  localBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  localIcon: {
    fontSize: 28,
    color: '#FF2A6D',
  },
  localTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  localSub: {
    fontSize: 8,
    color: '#FF6690',
    letterSpacing: 1,
    marginTop: 2,
  },
  localBannerRight: {
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  localArrow: {
    color: '#020206',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  /* PREMIUM INFO */
  premiumInfo: {
    backgroundColor: '#1A1A0A',
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 14,
    marginBottom: 16,
  },
  premiumTitle: {
    textAlign: 'center',
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },

  /* STATS FOOTER */
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1A1A30',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF2A6D',
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#555580',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1A1A30',
  },

  /* LOADING OVERLAY */
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2,2,6,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF2A6D',
    padding: 24,
    backgroundColor: '#0C0C18',
  },
  loadingSymbol: {
    fontSize: 32,
    color: '#FF2A6D',
    marginBottom: 12,
  },
  loadingText: {
    color: '#FF2A6D',
    marginTop: 12,
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  loadingDots: {
    color: '#666688',
    marginTop: 8,
    fontSize: 10,
    letterSpacing: 2,
  },
});