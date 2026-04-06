import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import api from '../services/api';

type Props = {
  onHome: () => void;
  onGroupLobby: (params: {
    token: string;
    userName?: string | null;
    avatarColor?: string | null;
    avatarImage?: string | null;
  }) => void;
};

const StandaloneAccessScreen: React.FC<Props> = ({ onHome, onGroupLobby }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAccess = async () => {
    if (!name.trim()) {
      Alert.alert('Datos requeridos', 'Necesitamos tu nombre para abrir el modo standalone.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const { data } = await api.loginStandalone({
        name: name.trim()
      });

      onGroupLobby({
        token: data.token,
        userName: data.user.name,
        avatarColor: data.user.avatarColor,
        avatarImage: data.user.avatarImage
      });
    } catch (error: any) {
      console.error('Error acceso standalone', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo abrir la encuesta.';
      setErrorMessage(message);
      Alert.alert('Acceso no disponible', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      eyebrow="Standalone"
      title="Abrir encuesta sin bot"
      subtitle="Este modo es útil para pruebas, acceso manual y usos fuera de WhatsApp, pero termina en el mismo flujo de negocio."
    >
      <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>Qué necesitas</Text>
        <Text style={styles.hintText}>Solo te pedimos un nombre visible. La identidad interna se genera automáticamente sin guardar teléfono.</Text>
      </View>
      <FieldInput
        label="Nombre"
        placeholder="Cómo quieres aparecer"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <PrimaryButton
        title={loading ? 'Abriendo...' : 'Continuar'}
        onPress={handleAccess}
        loading={loading}
        disabled={!name.trim()}
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
  backButton: {
    marginTop: 10
  },
  errorText: {
    marginBottom: 12,
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  }
});

export default StandaloneAccessScreen;
