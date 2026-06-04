// app/index.jsx - CORREGIDO (Guarda nombre correctamente)
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
    { id: 'classic', name: 'Modo Clasico', description: 'Reglas tradicionales', color: '#3498db' },
    { id: 'temporal', name: 'Modo Temporal', description: 'Fichas desaparecen tras 3 turnos', color: '#e67e22' },
    { id: 'chaos', name: 'Modo Caos', description: 'Casillas bloqueadas aleatoriamente', color: '#9b59b6' },
  ];

  // Cargar nombre guardado al iniciar
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

  // 🔥 FUNCIÓN PARA GUARDAR NOMBRE
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

  // 🔥 NUEVA FUNCIÓN: Guardar nombre manualmente
  const handleSaveName = () => {
    if (playerName && playerName.trim()) {
      savePlayerName(playerName);
      setIsEditingName(false);
      Alert.alert('Exito', `Nombre "${playerName}" guardado`);
    } else {
      Alert.alert('Error', 'Ingresa un nombre valido');
    }
  };

  // 🔥 CORREGIDO: Guardar nombre antes de crear sala
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }

    // Guardar nombre antes de continuar
    await savePlayerName(playerName);

    setLoading(true);
    try {
      const newRoomCode = generateRoomCode();
      const { roomCode, playerId, playerSymbol } = await createRoom(newRoomCode, playerName, selectedMode);
      
      router.push({
        pathname: '/lobby',
        params: {
          roomCode,
          playerId,
          playerName,
          isCreator: 'true',
          gameMode: selectedMode,
        }
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la sala');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CORREGIDO: Guardar nombre antes de unirse a sala
  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Ingresa el codigo de sala');
      return;
    }

    // Guardar nombre antes de continuar
    await savePlayerName(playerName);

    setLoading(true);
    try {
      const { playerId, playerSymbol, gameMode } = await joinRoom(roomCode.toUpperCase(), playerName);
      
      router.push({
        pathname: '/lobby',
        params: {
          roomCode: roomCode.toUpperCase(),
          playerId,
          playerName,
          isCreator: 'false',
          gameMode,
        }
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CORREGIDO: Guardar nombre antes de juego local
  const startLocalGame = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }
    
    // Guardar nombre antes de continuar
    savePlayerName(playerName);
    
    router.push({
      pathname: '/game',
      params: { 
        gameMode: selectedMode,
        isMultiplayer: 'false',
        playerName: playerName,
      }
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>TIC TAC TOE</Text>
          <Text style={styles.subtitle}>MULTIVERSE</Text>
          <View style={styles.divider} />
        </View>

        {/* Sección de nombre de jugador */}
        <View style={styles.inputContainer}>
          <View style={styles.nameHeader}>
            <Text style={styles.inputLabel}>Tu nombre</Text>
            {!isEditingName && playerName && (
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <Text style={styles.editButton}>Cambiar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isEditingName || !playerName ? (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#999"
                value={playerName}
                onChangeText={handleNameChange}
                onBlur={handleNameBlur}
                autoFocus={!playerName}
                maxLength={20}
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                <Text style={styles.saveButtonText}>Guardar Nombre</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.nameDisplay}
              onPress={() => setIsEditingName(true)}
            >
              <Text style={styles.nameDisplayText}>{playerName}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Modos de juego */}
        <View style={styles.modesContainer}>
          <Text style={styles.sectionTitle}>Selecciona tu modo de juego</Text>
          
          {gameModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeCard,
                selectedMode === mode.id && { 
                  borderColor: mode.color,
                  backgroundColor: mode.color + '20',
                  borderWidth: 2,
                },
              ]}
              onPress={() => setSelectedMode(mode.id)}
            >
              <View style={[styles.modeIcon, { backgroundColor: mode.color }]}>
                <Text style={styles.modeIconText}>
                  {mode.id === 'classic' ? 'C' : mode.id === 'temporal' ? 'T' : 'X'}
                </Text>
              </View>
              <View style={styles.modeInfo}>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
              </View>
              {selectedMode === mode.id && (
                <View style={styles.checkMark}>
                  <Text style={styles.checkMarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Multijugador Online */}
        <View style={styles.multiplayerSection}>
          <View style={styles.sectionDividerContainer}>
            <View style={styles.sectionDividerLine} />
            <Text style={styles.sectionDividerText}>MULTIJUGADOR ONLINE</Text>
            <View style={styles.sectionDividerLine} />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, styles.createButton]} 
            onPress={handleCreateRoom}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>CREAR SALA ONLINE</Text>
            )}
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Codigo de sala"
            placeholderTextColor="#999"
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
          />
          
          <TouchableOpacity 
            style={[styles.button, styles.joinButton]} 
            onPress={handleJoinRoom}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>UNIRSE A SALA</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Juego Local */}
        <TouchableOpacity style={styles.localButton} onPress={startLocalGame}>
          <Text style={styles.localButtonText}>JUEGO LOCAL (2 jugadores)</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>REGLAS DEL TORNEO</Text>
            <Text style={styles.footerText}>Serie de 3 partidas</Text>
            <Text style={styles.footerSubtext}>Gana 2 partidas para ser el campeon</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Conectando...</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 5,
    letterSpacing: 4,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    borderRadius: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  nameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editButton: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nameDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nameDisplayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modeIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modeDescription: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 2,
  },
  checkMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  multiplayerSection: {
    marginBottom: 20,
  },
  sectionDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#2ecc71',
  },
  joinButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  localButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  localButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 10,
    marginBottom: 10,
  },
  footerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
});