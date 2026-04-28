import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import api from '../services/api';

type AuthenticatedParams = {
  token: string;
  pollId?: string;
  userName?: string | null;
  avatarColor?: string | null;
  avatarImage?: string | null;
};

type Props = {
  pollId?: string;
  onAuthenticated?: (params: AuthenticatedParams) => void;
};

const StandaloneAccessScreen: React.FC<Props> = ({ pollId, onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEmailAccess = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      Alert.alert('Datos requeridos', 'Introduce un correo válido para continuar.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const { data } = await api.startEmailLogin({
        email: normalizedEmail,
        ...(pollId ? { pollId } : {})
      });

      if (data.directLogin && data.token) {
        onAuthenticated?.({
          token: data.token,
          pollId: data.pollId ?? pollId,
          userName: data.user?.name,
          avatarColor: data.user?.avatarColor,
          avatarImage: data.user?.avatarImage,
        });
        return;
      }

      setSuccessMessage(`Revisa tu bandeja de entrada (${normalizedEmail}).`);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'No se pudo enviar el enlace.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      eyebrow="Acceso"
      title="Entrar en Yoice"
      subtitle="Te enviamos un enlace al correo para entrar y continuar con tus grupos."
    >
      <FieldInput
        label="Email"
        placeholder="tu@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      {pollId ? <Text style={styles.contextText}>Accediendo a la encuesta: {pollId}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      <PrimaryButton
        title={loading ? 'Comprobando...' : successMessage ? 'Verificar email' : 'Comprobar email'}
        onPress={handleEmailAccess}
        loading={loading}
        disabled={!email.trim()}
      />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  contextText: { marginBottom: 10, fontSize: 13, color: '#475467' },
  errorText: { marginBottom: 12, color: '#b42318', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  successText: { marginBottom: 12, color: '#067647', fontSize: 14, lineHeight: 20, fontWeight: '600' },
});

export default StandaloneAccessScreen;
