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
      title="Una app, una entrada"
      subtitle="Entra por email y continúa directo a tus grupos y a la pregunta del día."
    >
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Acceso por email</Text>
        <Text style={styles.infoText}>
          Recibes un enlace temporal y retomas tu sesión sin depender de mensajería externa.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Experiencia de grupo</Text>
        <Text style={styles.infoText}>
          Tu identidad, tus grupos y tus votos viven dentro de la app.
        </Text>
      </View>

      <PrimaryButton
        title="Entrar"
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
