// app/_layout.jsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2C3E50',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Tic Tac Toe Multiverse',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="lobby" 
        options={{ 
          title: 'Sala de Espera',
          headerLeft: null,
          headerBackVisible: false,
        }} 
      />
      <Stack.Screen 
        name="game" 
        options={{ 
          title: 'En Partida',
          headerLeft: null,
          headerBackVisible: false,
        }} 
      />
    </Stack>
  );
}