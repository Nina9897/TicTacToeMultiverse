// App.js
import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import GameScreen from './src/app/index';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <GameScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});