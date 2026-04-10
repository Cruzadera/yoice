import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import api from '../services/api';
import AppShell from '../components/ui/AppShell';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  token?: string;
  pollId?: string;
  waGroupId?: string;
  waGroupName?: string;
  onStandaloneFallback: () => void;
  onOnboarding: (params: { token: string; pollId: string; identityLabel: string }) => void;
  onGroupList: (params: {
    token: string;
    userName?: string | null;
    avatarColor?: string | null;
    avatarImage?: string | null;
  }) => void;
};

const AuthCallbackScreen: React.FC<Props> = ({ token = '', pollId = '', waGroupId, waGroupName, onStandaloneFallback, onOnboarding, onGroupList }) => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setErrorMessage('El enlace no es válido. Pide uno nuevo.');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.authenticateWhatsapp(token, pollId, waGroupId, waGroupName);

        if (data.nextStep === 'onboarding') {
          onOnboarding({
            token,
            pollId: data.pollId || pollId,
            identityLabel: 'Acceso de WhatsApp verificado'
          });
          return;
        }

        onGroupList({
          token,
          userName: data.user.name,
          avatarColor: data.user.avatarColor,
          avatarImage: data.user.avatarImage
        });
      } catch (error) {
        console.error('Error en autologin', error);
        setErrorMessage('No pudimos completar el acceso. Pide un enlace nuevo.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [onOnboarding, onGroupList, pollId, token, waGroupId, waGroupName]);

  return (
    <AppShell
      eyebrow="Acceso"
      title="Entrando…"
    >
      <View style={styles.statusCard}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#4f6cff" />
            <Text style={styles.message}>Un momento…</Text>
          </>
        ) : (
          <>
            <Text style={styles.errorTitle}>Acceso no disponible</Text>
            <Text style={styles.message}>{errorMessage}</Text>
            <PrimaryButton title="Reintentar" onPress={() => window.location.reload()} />
            <PrimaryButton
              title="Entrar con email"
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
