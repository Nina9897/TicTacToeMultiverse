// app/lobby.jsx - VERSIÓN COMPLETA CON totalRounds
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
        
        // Si el juego comienza, ir a la pantalla de juego
        if (room.status === 'playing' && room.players) {
          const currentPlayer = playersList.find(p => p.id === playerId);
          if (currentPlayer) {
            router.replace({
              pathname: '/game',
              params: {
                roomCode,
                playerId,
                playerName,
                playerSymbol: currentPlayer.symbol,
                gameMode: room.gameMode,
                isMultiplayer: 'true',
                totalRounds: room.totalRounds?.toString() || '3', // ← AGREGAR totalRounds
              }
            });
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
      case 'classic': return 'Modo Clasico';
      case 'temporal': return 'Modo Temporal';
      case 'chaos': return 'Modo Caos';
      default: return 'Modo Desconocido';
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sala de Espera</Text>
          <View style={styles.modeBadge}>
            <Text style={styles.modeText}>{getGameModeName()}</Text>
          </View>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Codigo de sala</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={copyRoomCode}>
            <Text style={styles.copyButtonText}>
              {copied ? 'Copiado!' : 'Copiar codigo'}
            </Text>
          </TouchableOpacity>
        </View>

        {isCreator === 'true' && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>Escanear para unirse</Text>
            <QRCode value={roomCode} size={150} />
          </View>
        )}

        <View style={styles.playersContainer}>
          <Text style={styles.playersTitle}>
            Jugadores ({players.length}/2)
          </Text>
          
          {players.map((player, index) => (
            <View key={index} style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerSymbol}>
                  {player.symbol === 'X' ? 'X' : 'O'}
                </Text>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
              {player.isHost && (
                <View style={styles.hostBadge}>
                  <Text style={styles.hostText}>Anfitrion</Text>
                </View>
              )}
              <View style={[styles.statusDot, { backgroundColor: 'green' }]} />
            </View>
          ))}
          
          {players.length === 1 && (
            <View style={styles.waitingCard}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.waitingText}>
                Esperando jugador...
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {players.length === 1 
              ? 'Comparte el codigo con tu amigo para comenzar'
              : 'Ambos jugadores estan listos! El juego comenzara en breve'}
          </Text>
        </View>

        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Salir de la sala</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  modeBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  modeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  codeCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  codeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  roomCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3498db',
    letterSpacing: 4,
  },
  copyButton: {
    marginTop: 10,
    backgroundColor: '#2ecc71',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '100%',
  },
  qrLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  playersContainer: {
    width: '100%',
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  hostBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  hostText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  waitingText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoBox: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
  },
  infoText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 14,
  },
  leaveButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});