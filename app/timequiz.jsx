// app/timequiz.jsx - CON INDICADOR DE TURNO EN PREGUNTAS
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// ========== BASE DE DATOS DE PREGUNTAS ==========
const QUESTIONS_DB = {
  cultura: [
    { question: '¿Quién pintó la Mona Lisa?', options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Rembrandt'], correct: 2, difficulty: 'facil' },
    { question: '¿Cuál es la capital de Francia?', options: ['Londres', 'Berlín', 'París', 'Madrid'], correct: 2, difficulty: 'facil' },
    { question: '¿Qué obra escribió Miguel de Cervantes?', options: ['La Celestina', 'Don Quijote', 'El Lazarillo', 'La vida es sueño'], correct: 1, difficulty: 'normal' },
    { question: '¿En qué continente está Egipto?', options: ['Asia', 'Europa', 'África', 'América'], correct: 2, difficulty: 'facil' },
  ],
  matematicas: [
    { question: '¿Cuánto es 12 x 12?', options: ['124', '134', '144', '154'], correct: 2, difficulty: 'facil' },
    { question: '¿Cuál es la raíz cuadrada de 64?', options: ['6', '7', '8', '9'], correct: 2, difficulty: 'facil' },
    { question: 'Resuelve: 5 + 3 x 2', options: ['16', '11', '13', '10'], correct: 1, difficulty: 'normal' },
    { question: '¿Cuánto es 15 x 8?', options: ['100', '110', '115', '120'], correct: 3, difficulty: 'facil' },
  ],
  historia: [
    { question: '¿En qué año comenzó la Segunda Guerra Mundial?', options: ['1937', '1938', '1939', '1940'], correct: 2, difficulty: 'normal' },
    { question: '¿Quién fue el primer presidente de Estados Unidos?', options: ['Adams', 'Jefferson', 'Washington', 'Franklin'], correct: 2, difficulty: 'facil' },
    { question: '¿Qué civilización construyó Machu Picchu?', options: ['Aztecas', 'Mayas', 'Incas', 'Olmecas'], correct: 2, difficulty: 'normal' },
  ],
  ingles: [
    { question: '¿Cómo se dice "perro" en inglés?', options: ['Cat', 'Dog', 'Bird', 'Fish'], correct: 1, difficulty: 'facil' },
    { question: '¿Qué significa "Hello"?', options: ['Adiós', 'Gracias', 'Hola', 'Por favor'], correct: 2, difficulty: 'facil' },
    { question: '¿Cuál es el pasado de "Go"?', options: ['Goed', 'Went', 'Gone', 'Going'], correct: 1, difficulty: 'normal' },
  ],
  programacion: [
    { question: '¿Qué significa HTML?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyper Transfer ML'], correct: 0, difficulty: 'normal' },
    { question: '¿Qué lenguaje se usa para React Native?', options: ['Python', 'Java', 'JavaScript', 'Swift'], correct: 2, difficulty: 'facil' },
    { question: '¿Qué es un array?', options: ['Una variable', 'Una lista de datos', 'Una función', 'Un objeto'], correct: 1, difficulty: 'normal' },
  ],
};

const getRandomQuestion = () => {
  const categories = ['cultura', 'matematicas', 'historia', 'ingles', 'programacion'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const questions = QUESTIONS_DB[randomCategory];
  const randomQuestion = { ...questions[Math.floor(Math.random() * questions.length)] };
  randomQuestion.category = randomCategory;
  return randomQuestion;
};

const Cell = ({ value, onPress, disabled, isWinningCell }) => {
  return (
    <TouchableOpacity
      style={[styles.cell, isWinningCell && styles.winningCell]}
      onPress={onPress}
      disabled={disabled || value !== ''}
    >
      <Text style={[styles.cellText, value === 'X' && styles.xText, value === 'O' && styles.oText]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const QuestionModal = ({ visible, question, onAnswer, onSkip, onExit, loading, currentPlayer }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);

  if (!question) return null;

  const getCategoryColor = () => {
    const colors = {
      cultura: '#FF6B4A',
      matematicas: '#4ECDC4',
      historia: '#FFE66D',
      ingles: '#4A90E2',
      programacion: '#B926FF',
    };
    return colors[question.category] || '#FFD700';
  };

  const getCategoryName = () => {
    const names = {
      cultura: 'CULTURA',
      matematicas: 'MATH',
      historia: 'HISTORIA',
      ingles: 'ENGLISH',
      programacion: 'CODE',
    };
    return names[question.category] || 'QUIZ';
  };

  const handleAnswer = (index) => {
    setSelectedOption(index);
    setShowResult(true);
    
    setTimeout(() => {
      onAnswer(index === question.correct);
      setSelectedOption(null);
      setShowResult(false);
    }, 1000);
  };

  const handleSkip = () => {
    Alert.alert(
      'SALTAR TURNO',
      '¿Seguro que quieres saltar el turno? Perderás la oportunidad de jugar esta ronda',
      [
        { text: 'CANCELAR', style: 'cancel' },
        { text: 'SALTAR', onPress: onSkip }
      ]
    );
  };

  const playerColor = currentPlayer === 'X' ? '#FF2A6D' : '#05D9E8';
  const playerSymbol = currentPlayer === 'X' ? '✕' : '○';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { borderColor: getCategoryColor() }]}>
          <View style={[styles.modalHeader, { backgroundColor: getCategoryColor() }]}>
            <Text style={styles.modalCategory}>◢ {getCategoryName()} ◣</Text>
          </View>
          
          {/* INDICADOR DE TURNO */}
          <View style={[styles.turnIndicator, { backgroundColor: playerColor + '20', borderColor: playerColor }]}>
            <Text style={[styles.turnIndicatorText, { color: playerColor }]}>
              ◢ TURNO DEL JUGADOR {playerSymbol} ◣
            </Text>
          </View>
          
          <Text style={styles.modalQuestion}>{question.question}</Text>
          
          <View style={styles.optionsContainer}>
            {question.options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  selectedOption === idx && showResult && idx === question.correct && styles.correctOption,
                  selectedOption === idx && showResult && idx !== question.correct && styles.wrongOption,
                  { borderColor: getCategoryColor() }
                ]}
                onPress={() => handleAnswer(idx)}
                disabled={showResult || loading}
              >
                <Text style={[styles.optionText, { color: getCategoryColor() }]}>
                  {String.fromCharCode(65 + idx)}. {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>◢ SALTAR TURNO ◣</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exitModalButton} onPress={onExit}>
              <Text style={styles.exitModalButtonText}>◢ SALIR ◣</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalFooter}>
            <Text style={styles.modalHint}>✦ RESPONDE CORRECTAMENTE PARA JUGAR ✦</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const TimelineModal = ({ visible, timelines, onSelectTimeline, currentEnergy, onClose }) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.timelineModal}>
          <Text style={styles.timelineTitle}>◢ LÍNEAS TEMPORALES ◣</Text>
          <Text style={[styles.energyDisplay, { color: '#FFD700' }]}>⚡ ENERGÍA: {currentEnergy}</Text>
          
          <ScrollView style={styles.timelineList}>
            {timelines.length === 0 ? (
              <Text style={styles.noTimelineText}>No hay líneas temporales aún</Text>
            ) : (
              timelines.map((timeline, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.timelineItem}
                  onPress={() => onSelectTimeline(idx)}
                  disabled={currentEnergy < 20}
                >
                  <Text style={styles.timelineNumber}>◢ TIMELINE #{idx + 1}</Text>
                  <Text style={styles.timelineInfo}>
                    Turno: {timeline.moveNumber} | Energía: 20
                  </Text>
                  {currentEnergy >= 20 ? (
                    <Text style={styles.timelineAction}>▶ VIAJAR ◀</Text>
                  ) : (
                    <Text style={styles.timelineDisabled}>ENERGÍA INSUFICIENTE</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          
          <TouchableOpacity style={styles.closeTimelineButton} onPress={onClose}>
            <Text style={styles.closeTimelineText}>◢ CERRAR ◣</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function TimeQuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { gameMode, isMultiplayer, playerName } = params;
  
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', '']);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [energy, setEnergy] = useState({ X: 50, O: 50 });
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(3);
  
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [waitingForAnswer, setWaitingForAnswer] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  
  const [gameTimeline, setGameTimeline] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);
  
  const [moveCount, setMoveCount] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!winner && moveCount < 9 && waitingForAnswer) {
      startNewQuestion();
    }
  }, [currentPlayer, waitingForAnswer, winner]);

  const startNewQuestion = () => {
    setQuestionLoading(true);
    const newQuestion = getRandomQuestion();
    setCurrentQuestion(newQuestion);
    setShowQuestion(true);
    setWaitingForAnswer(false);
    setQuestionLoading(false);
  };

  const saveToTimeline = (newBoard, player, moveNum) => {
    const timelineEntry = {
      board: [...newBoard],
      player: player,
      energyCost: 20,
      round: currentRound,
      moveNumber: moveNum,
      timestamp: Date.now(),
    };
    setGameTimeline(prev => [...prev, timelineEntry]);
  };

  const handleAnswer = async (isCorrect) => {
    setShowQuestion(false);
    
    if (isCorrect) {
      Alert.alert('✓ CORRECTO', 'Puedes colocar tu ficha +20 de energía', [{ text: 'JUGAR' }]);
      setEnergy(prev => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] + 20
      }));
      setWaitingForAnswer(false);
    } else {
      Alert.alert('✗ INCORRECTO', 'Pierdes el turno', [{ text: 'CONTINUAR' }]);
      switchPlayer();
    }
  };

  const handleSkipTurn = () => {
    setShowQuestion(false);
    switchPlayer();
  };

  const handleExitGame = () => {
    Alert.alert(
      'SALIR DEL JUEGO',
      '¿Seguro que quieres salir? Se perderá el progreso de la partida',
      [
        { text: 'CANCELAR', style: 'cancel' },
        { text: 'SALIR', onPress: () => router.back() }
      ]
    );
  };

  const checkWinner = (boardState) => {
    const lines = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    
    for (let line of lines) {
      const [a,b,c] = line;
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return { winner: boardState[a], line };
      }
    }
    return null;
  };

  const handleMove = (position) => {
    if (winner) {
      Alert.alert('Partida terminada', 'Esta ronda ya terminó');
      return;
    }
    
    if (board[position] !== '') {
      Alert.alert('Casilla ocupada', 'Elige otra posición');
      return;
    }
    
    if (waitingForAnswer) {
      Alert.alert('RESPONDE PRIMERO', 'Debes responder la pregunta antes de jugar');
      return;
    }
    
    saveToTimeline(board, currentPlayer, moveCount + 1);
    
    const newBoard = [...board];
    newBoard[position] = currentPlayer;
    setBoard(newBoard);
    
    const winInfo = checkWinner(newBoard);
    const isDraw = !winInfo && moveCount + 1 === 9;
    
    if (winInfo) {
      setWinner(currentPlayer);
      setWinningLine(winInfo.line);
      const newScores = { ...scores, [currentPlayer]: scores[currentPlayer] + 1 };
      setScores(newScores);
      setEnergy(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 30 }));
      
      const winsNeeded = Math.floor(totalRounds / 2) + 1;
      if (newScores[currentPlayer] >= winsNeeded) {
        Alert.alert('VICTORIA', `¡Jugador ${currentPlayer} gana la serie!`, [
          { text: 'VOLVER', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Ronda Ganada', `Jugador ${currentPlayer} gana la ronda ${currentRound}`, [
          { text: 'SIGUIENTE RONDA', onPress: () => resetRound(newScores) }
        ]);
      }
    } else if (isDraw) {
      const winner = energy.X > energy.O ? 'X' : energy.O > energy.X ? 'O' : 'EMPATE';
      if (winner !== 'EMPATE') {
        const newScores = { ...scores, [winner]: scores[winner] + 1 };
        setScores(newScores);
        Alert.alert('EMPATE', `Gana por energía: Jugador ${winner}`, [
          { text: 'SIGUIENTE RONDA', onPress: () => resetRound(newScores) }
        ]);
      } else {
        Alert.alert('EMPATE TOTAL', 'No hay ganador', [
          { text: 'SIGUIENTE RONDA', onPress: () => resetRound(scores) }
        ]);
      }
    } else {
      setMoveCount(moveCount + 1);
      switchPlayer();
    }
  };

  const switchPlayer = () => {
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    setWaitingForAnswer(true);
  };

  const resetRound = (newScores) => {
    setBoard(['', '', '', '', '', '', '', '', '']);
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine([]);
    setMoveCount(0);
    setCurrentRound(currentRound + 1);
    setScores(newScores);
    setWaitingForAnswer(true);
    setGameTimeline([]);
  };

  const travelToTimeline = (timelineIndex) => {
    const timeline = gameTimeline[timelineIndex];
    if (!timeline) return;
    
    if (energy[currentPlayer] < 20) {
      Alert.alert('ENERGÍA INSUFICIENTE', 'Necesitas 20 de energía para viajar en el tiempo');
      return;
    }
    
    setEnergy(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] - 20 }));
    setBoard([...timeline.board]);
    setCurrentPlayer(timeline.player);
    setMoveCount(timeline.moveNumber - 1);
    setShowTimeline(false);
    setWaitingForAnswer(true);
    
    Alert.alert('VIAJE TEMPORAL', `Has retrocedido al Timeline #${timelineIndex + 1}`);
  };

  const winsNeeded = Math.floor(totalRounds / 2) + 1;

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
          <Text style={styles.shapeText}>⏣</Text>
        </View>
        <View style={styles.floatingShape2}>
          <Text style={styles.shapeText}>◈</Text>
        </View>
        <View style={styles.floatingShape3}>
          <Text style={styles.shapeText}>⌾</Text>
        </View>
        <View style={styles.overlayDark} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.glitchWrapper}>
              <View style={styles.glitchLayer1}>
                <Text style={styles.titleGlitch}>TIME QUIZ</Text>
              </View>
              <View style={styles.glitchLayer2}>
                <Text style={styles.titleGlitch}>TIME QUIZ</Text>
              </View>
              <View style={styles.glitchLayer3}>
                <Text style={styles.titleGlitch}>TIME QUIZ</Text>
              </View>
              <Text style={styles.titleMain}>TIME QUIZ</Text>
            </View>
            
            <View style={styles.modeBadge}>
              <Text style={styles.modeText}>◢ PREGUNTAS + VIAJE TEMPORAL ◣</Text>
            </View>
          </View>

          {/* SCORES Y ENERGÍA */}
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreCard, currentPlayer === 'X' && styles.activeTurn]}>
              <Text style={[styles.scoreIcon, styles.xColor]}>✕</Text>
              <Text style={styles.scoreTitle}>JUGADOR X</Text>
              <Text style={[styles.scoreValue, styles.xColor]}>{scores.X}</Text>
              <View style={styles.energyBar}>
                <Text style={styles.energyText}>⚡ {energy.X}</Text>
                <View style={[styles.energyFill, { width: `${Math.min(100, energy.X)}%`, backgroundColor: '#FF2A6D' }]} />
              </View>
            </View>
            
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>◢ VS ◣</Text>
            </View>
            
            <View style={[styles.scoreCard, currentPlayer === 'O' && styles.activeTurn]}>
              <Text style={[styles.scoreIcon, styles.oColor]}>○</Text>
              <Text style={styles.scoreTitle}>JUGADOR O</Text>
              <Text style={[styles.scoreValue, styles.oColor]}>{scores.O}</Text>
              <View style={styles.energyBar}>
                <Text style={styles.energyText}>⚡ {energy.O}</Text>
                <View style={[styles.energyFill, { width: `${Math.min(100, energy.O)}%`, backgroundColor: '#05D9E8' }]} />
              </View>
            </View>
          </View>

          {/* INFO BAR */}
          <View style={styles.infoBar}>
            <View style={styles.roundBadge}>
              <Text style={styles.roundText}>RONDA {currentRound}/{totalRounds}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.timelineButton, gameTimeline.length === 0 && styles.disabledButton]}
              onPress={() => setShowTimeline(true)}
              disabled={gameTimeline.length === 0}
            >
              <Text style={styles.timelineButtonText}>◢ VIAJAR ◣</Text>
            </TouchableOpacity>
            <View style={[styles.turnBadge, waitingForAnswer && styles.waitingTurn]}>
              <Text style={styles.turnText}>
                {winner 
                  ? `◢ GANADOR: ${winner} ◣`
                  : waitingForAnswer 
                    ? '◢ PREGUNTA ACTIVA ◣'
                    : `◢ TURNO: ${currentPlayer} ◣`}
              </Text>
            </View>
          </View>

          {/* WINS NEEDED */}
          <View style={styles.winsContainer}>
            <Text style={styles.winsText}>
              ◢ {winsNeeded} VICTORIAS PARA LA SERIE ◣
            </Text>
          </View>

          {/* BOARD - TABLERO CENTRADO */}
          <View style={styles.boardContainer}>
            <View style={styles.board}>
              <View style={styles.boardRow}>
                <Cell value={board[0]} onPress={() => handleMove(0)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(0)} />
                <Cell value={board[1]} onPress={() => handleMove(1)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(1)} />
                <Cell value={board[2]} onPress={() => handleMove(2)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(2)} />
              </View>
              <View style={styles.boardRow}>
                <Cell value={board[3]} onPress={() => handleMove(3)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(3)} />
                <Cell value={board[4]} onPress={() => handleMove(4)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(4)} />
                <Cell value={board[5]} onPress={() => handleMove(5)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(5)} />
              </View>
              <View style={styles.boardRow}>
                <Cell value={board[6]} onPress={() => handleMove(6)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(6)} />
                <Cell value={board[7]} onPress={() => handleMove(7)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(7)} />
                <Cell value={board[8]} onPress={() => handleMove(8)} disabled={!!winner || waitingForAnswer} isWinningCell={winningLine?.includes(8)} />
              </View>
            </View>
          </View>

          {/* BOTÓN SALIR */}
          <TouchableOpacity style={styles.exitButton} onPress={handleExitGame}>
            <Text style={styles.exitButtonText}>◢  SALIR DEL JUEGO  ◣</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <QuestionModal
        visible={showQuestion}
        question={currentQuestion}
        onAnswer={handleAnswer}
        onSkip={handleSkipTurn}
        onExit={handleExitGame}
        loading={questionLoading}
        currentPlayer={currentPlayer}
      />

      <TimelineModal
        visible={showTimeline}
        timelines={gameTimeline}
        onSelectTimeline={travelToTimeline}
        currentEnergy={energy[currentPlayer]}
        onClose={() => setShowTimeline(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a2a',
  },
  
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
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
    backgroundColor: '#FFD700',
    opacity: 0.06,
  },
  
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#FFD700',
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
    borderColor: '#FFD700',
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
    borderColor: '#FFD700',
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
  
  shapeText: {
    fontSize: 48,
    color: '#FFD700',
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
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  glitchWrapper: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  
  titleMain: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 5,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    zIndex: 10,
  },
  
  titleGlitch: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 5,
    position: 'absolute',
    opacity: 0.5,
  },
  
  glitchLayer1: {
    position: 'absolute',
    left: -2,
    top: -2,
  },
  
  glitchLayer2: {
    position: 'absolute',
    left: 2,
    top: 2,
  },
  
  glitchLayer3: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  
  modeBadge: {
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  
  modeText: {
    color: '#FFD700',
    fontSize: 7,
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  scoreCard: {
    backgroundColor: '#0C0C24',
    borderWidth: 1,
    borderColor: '#1A1A40',
    padding: 8,
    alignItems: 'center',
    width: width * 0.38,
  },
  
  activeTurn: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  
  scoreIcon: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  
  xColor: {
    color: '#FF2A6D',
  },
  
  oColor: {
    color: '#05D9E8',
  },
  
  scoreTitle: {
    fontSize: 8,
    letterSpacing: 1,
    color: '#8888AA',
    marginBottom: 2,
  },
  
  scoreValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  
  energyBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#1A1A40',
    marginTop: 6,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  
  energyFill: {
    height: '100%',
  },
  
  energyText: {
    position: 'absolute',
    top: -12,
    right: 0,
    fontSize: 7,
    color: '#8888AA',
  },
  
  vsContainer: {
    marginHorizontal: 10,
  },
  
  vsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8888AA',
    letterSpacing: 2,
  },
  
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  
  roundBadge: {
    backgroundColor: '#B926FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  
  roundText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  timelineButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  
  timelineButtonText: {
    color: '#0a0a1a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  disabledButton: {
    backgroundColor: '#555580',
    opacity: 0.5,
  },
  
  turnBadge: {
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  
  waitingTurn: {
    backgroundColor: '#FFD700',
  },
  
  turnText: {
    color: '#0a0a1a',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  winsContainer: {
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 16,
  },
  
  winsText: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: '#FFD700',
  },
  
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  
  board: {
    backgroundColor: '#0C0C24',
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 6,
  },
  
  boardRow: {
    flexDirection: 'row',
  },
  
  cell: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A50',
    backgroundColor: '#0a0a1a',
    margin: 2,
  },
  
  winningCell: {
    backgroundColor: '#FFD70020',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  
  cellText: {
    fontSize: 40,
    fontWeight: '900',
  },
  
  xText: {
    color: '#FF2A6D',
  },
  
  oText: {
    color: '#05D9E8',
  },
  
  exitButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF2A6D',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  
  exitButtonText: {
    color: '#FF2A6D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    width: width * 0.92,
    backgroundColor: '#0C0C24',
    borderWidth: 2,
    overflow: 'hidden',
  },
  
  modalHeader: {
    padding: 12,
    alignItems: 'center',
  },
  
  modalCategory: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  
  turnIndicator: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
    borderRadius: 8,
  },
  
  turnIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  
  modalQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    padding: 16,
  },
  
  optionsContainer: {
    padding: 12,
    gap: 8,
  },
  
  optionButton: {
    borderWidth: 1,
    padding: 10,
  },
  
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  correctOption: {
    backgroundColor: '#00FF8820',
    borderColor: '#00FF88',
  },
  
  wrongOption: {
    backgroundColor: '#FF2A6D20',
    borderColor: '#FF2A6D',
  },
  
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  
  skipButton: {
    flex: 1,
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    alignItems: 'center',
  },
  
  skipButtonText: {
    color: '#0a0a1a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  exitModalButton: {
    flex: 1,
    backgroundColor: '#FF2A6D',
    paddingVertical: 8,
    alignItems: 'center',
  },
  
  exitModalButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  modalFooter: {
    padding: 12,
    alignItems: 'center',
  },
  
  modalHint: {
    fontSize: 8,
    letterSpacing: 2,
    color: '#8888AA',
  },
  
  timelineModal: {
    width: width * 0.9,
    backgroundColor: '#0C0C24',
    borderWidth: 2,
    borderColor: '#FFD700',
    padding: 16,
    maxHeight: height * 0.7,
  },
  
  timelineTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  
  energyDisplay: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  
  timelineList: {
    maxHeight: 280,
  },
  
  timelineItem: {
    borderWidth: 1,
    borderColor: '#1A1A40',
    padding: 10,
    marginBottom: 6,
  },
  
  timelineNumber: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  
  timelineInfo: {
    color: '#8888AA',
    fontSize: 9,
  },
  
  timelineAction: {
    color: '#00FF88',
    fontSize: 9,
    marginTop: 5,
    textAlign: 'right',
  },
  
  timelineDisabled: {
    color: '#FF2A6D',
    fontSize: 8,
    marginTop: 5,
    textAlign: 'right',
  },
  
  noTimelineText: {
    color: '#8888AA',
    textAlign: 'center',
    padding: 16,
  },
  
  closeTimelineButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  
  closeTimelineText: {
    color: '#0a0a1a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});