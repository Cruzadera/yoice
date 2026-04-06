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
      subtitle="Mantenemos el flujo llamado desde WhatsApp y añadimos un acceso standalone para abrir la misma encuesta sin duplicar producto."
    >
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Modo WhatsApp</Text>
        <Text style={styles.infoText}>
          El bot envía un enlace con `token` y `pollId`, y la app entra directa al onboarding o a la encuesta.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Modo Standalone</Text>
        <Text style={styles.infoText}>
          La app pide teléfono, nombre opcional y `pollId`, genera el mismo token interno y reutiliza el mismo backend.
        </Text>
      </View>

      <PrimaryButton
        title="Entrar en modo standalone"
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
