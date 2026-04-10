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
  waGroupId?: string;
  waGroupName?: string;
  onAuthenticated?: (params: AuthenticatedParams) => void;
};

const StandaloneAccessScreen: React.FC<Props> = ({ pollId, waGroupId, waGroupName, onAuthenticated }) => {
  const isWhatsAppFlow = !!waGroupId;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ── WhatsApp flow: name only ──────────────────────────

  const handleWhatsAppAccess = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Escribe tu nombre para continuar.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const { data } = await api.startWhatsappAccess({
        name: name.trim(),
        ...(pollId ? { pollId } : {}),
        ...(waGroupId ? { waGroupId } : {}),
        ...(waGroupName ? { waGroupName } : {}),
      });

      onAuthenticated?.({
        token: data.token,
        pollId: data.pollId || pollId,
        userName: data.user.name,
        avatarColor: data.user.avatarColor,
        avatarImage: data.user.avatarImage,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'No se pudo entrar.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Email flow ────────────────────────────────────────

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
        ...(pollId ? { pollId } : {}),
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

  // ── Render ────────────────────────────────────────────

  if (isWhatsAppFlow) {
    return (
      <AppShell
        eyebrow="Acceso"
        title="Entrar en Votia"
        subtitle={waGroupName ? `Vienes del grupo "${decodeURIComponent(waGroupName)}"` : 'Acceso desde WhatsApp'}
      >
        <FieldInput
          label="Tu nombre"
          placeholder="Ej. María"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <PrimaryButton
          title={loading ? 'Entrando...' : 'Entrar'}
          onPress={handleWhatsAppAccess}
          loading={loading}
          disabled={!name.trim()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Acceso"
      title="Entrar en Votia"
      subtitle="Te enviamos un enlace al correo para acceder."
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
