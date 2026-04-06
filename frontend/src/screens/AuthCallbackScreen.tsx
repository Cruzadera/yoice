import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import api from '../services/api';
import AppShell from '../components/ui/AppShell';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  token?: string;
  pollId?: string;
  onStandaloneFallback: () => void;
  onOnboarding: (params: { token: string; pollId: string; identityLabel: string }) => void;
  onPoll: (params: {
    token: string;
    pollId: string;
    userName?: string | null;
    avatarColor?: string | null;
    avatarImage?: string | null;
  }) => void;
};

const AuthCallbackScreen: React.FC<Props> = ({ token = '', pollId = '', onStandaloneFallback, onOnboarding, onPoll }) => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      if (!token || !pollId) {
        setErrorMessage('El enlace no incluye token o pollId. Revisa el enlace que llega por WhatsApp.');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.authenticateWhatsapp(token, pollId);

        if (data.nextStep === 'onboarding') {
          onOnboarding({
            token,
            pollId,
            identityLabel: 'Acceso de WhatsApp verificado'
          });
          return;
        }

        onPoll({
          token,
          pollId,
          userName: data.user.name,
          avatarColor: data.user.avatarColor,
          avatarImage: data.user.avatarImage
        });
      } catch (error) {
        console.error('Error en autologin', error);
        setErrorMessage('No pudimos validar el acceso automático. Pide un enlace nuevo o revisa el token.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [onOnboarding, onPoll, pollId, token]);

  return (
    <AppShell
      eyebrow="Autologin"
      title="Entrando en tu encuesta"
      subtitle="Validamos el enlace de WhatsApp y te llevamos al siguiente paso sin login manual."
    >
      <View style={styles.statusCard}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#4f6cff" />
            <Text style={styles.message}>Conectando con el backend y recuperando tu acceso…</Text>
          </>
        ) : (
          <>
            <Text style={styles.errorTitle}>Acceso no disponible</Text>
            <Text style={styles.message}>{errorMessage}</Text>
            <PrimaryButton title="Reintentar" onPress={() => window.location.reload()} />
            <PrimaryButton
              title="Ir al modo standalone"
              onPress={onStandaloneFallback}
              variant="secondary"
              style={styles.secondaryButton}
            />
          </>
        )}
      </View>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    padding: 20
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16203a',
    marginBottom: 10
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#5e6983',
    marginBottom: 18
  },
  secondaryButton: {
    marginTop: 10
  }
});

export default AuthCallbackScreen;
