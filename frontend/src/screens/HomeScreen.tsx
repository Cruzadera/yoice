import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  onStandaloneAccess: () => void;
};

const HomeScreen: React.FC<Props> = ({ onStandaloneAccess }) => {
  return (
    <AppShell
      eyebrow="Acceso"
      title="Una app, dos entradas"
      subtitle="Mantenemos el flujo de WhatsApp y añadimos acceso por email para entrar sin depender de mensajes privados del bot."
    >
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Modo WhatsApp</Text>
        <Text style={styles.infoText}>
          El bot puede compartir el enlace del grupo. Si no tienes sesión, la app te pedirá autenticarte.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Modo Email</Text>
        <Text style={styles.infoText}>
          Introduces tu correo y recibes un magic link para entrar sin contraseña.
        </Text>
      </View>

      <PrimaryButton
        title="Entrar con email"
        onPress={onStandaloneAccess}
      />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    marginBottom: 14
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#16203a',
    marginBottom: 6
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5e6983'
  }
});

export default HomeScreen;
