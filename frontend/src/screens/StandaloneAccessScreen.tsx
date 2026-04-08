import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import api from '../services/api';

type Props = {
  onHome: () => void;
  pollId?: string;
};

const StandaloneAccessScreen: React.FC<Props> = ({ onHome, pollId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [debugLoginUrl, setDebugLoginUrl] = useState<string | null>(null);

  const handleAccess = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      Alert.alert('Datos requeridos', 'Introduce un correo válido para continuar.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setDebugLoginUrl(null);
    setLoading(true);

    try {
      const { data } = await api.startEmailLogin({
        email: normalizedEmail,
        ...(pollId ? { pollId } : {})
      });

      setSuccessMessage(data.message);
      setDebugLoginUrl(data.debugLoginUrl || null);
      Alert.alert('Revisa tu correo', data.message);
    } catch (error: any) {
      console.error('Error acceso por email', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo iniciar el acceso por email.';
      setErrorMessage(message);
      Alert.alert('Acceso no disponible', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      eyebrow="Acceso"
      title="Entrar con email"
      subtitle="Te enviamos un enlace mágico al correo. No necesitas contraseña ni depender de WhatsApp privado."
    >
      <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>Cómo funciona</Text>
        <Text style={styles.hintText}>1) Escribes tu email. 2) Te enviamos un enlace. 3) Al abrirlo quedas autenticado para votar.</Text>
      </View>
      <FieldInput
        label="Email"
        placeholder="tu@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />

      {pollId ? (
        <Text style={styles.contextText}>Accediendo a la encuesta: {pollId}</Text>
      ) : null}

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      {debugLoginUrl ? <Text style={styles.debugText}>DEBUG LINK: {debugLoginUrl}</Text> : null}

      <PrimaryButton
        title={loading ? 'Enviando...' : 'Enviar enlace'}
        onPress={handleAccess}
        loading={loading}
        disabled={!email.trim()}
      />
      <PrimaryButton title="Volver" onPress={onHome} variant="secondary" style={styles.backButton} />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  hintCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    marginBottom: 16
  },
  hintTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#16203a',
    marginBottom: 6
  },
  hintText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5e6983'
  },
  contextText: {
    marginBottom: 10,
    fontSize: 13,
    color: '#475467'
  },
  backButton: {
    marginTop: 10
  },
  errorText: {
    marginBottom: 12,
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  successText: {
    marginBottom: 12,
    color: '#067647',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  debugText: {
    marginBottom: 12,
    color: '#344054',
    fontSize: 12,
    lineHeight: 18
  }
});

export default StandaloneAccessScreen;
