import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import api from '../services/api';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  token: string;
  pollId: string;
  identityLabel: string;
  onGroupList: (params: {
    token: string;
    userName?: string | null;
    avatarColor?: string | null;
    avatarImage?: string | null;
  }) => void;
};

const OnboardingScreen: React.FC<Props> = ({ token, pollId, identityLabel, onGroupList }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Escribe cómo quieres aparecer en la encuesta.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.saveUserName(token, name.trim());

      onGroupList({
        token,
        userName: data.name,
        avatarColor: data.avatarColor,
        avatarImage: data.avatarImage
      });
    } catch (error) {
      console.error('Error guardando nombre', error);
      Alert.alert('Error', 'No se pudo guardar tu nombre.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      eyebrow="Primer acceso"
      title="¿Cómo te llamas?"
      subtitle="Así te verán los demás en las encuestas."
    >
      <View style={styles.phonePill}>
        <Text style={styles.phoneLabel}>Estado</Text>
        <Text style={styles.phoneValue}>✓ Acceso verificado</Text>
      </View>

      <FieldInput
        label="Tu nombre"
        placeholder="Ej. María"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <PrimaryButton
        title={loading ? 'Guardando...' : 'Continuar a la encuesta'}
        onPress={handleSubmit}
        disabled={!name.trim()}
        loading={loading}
      />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  phonePill: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    marginBottom: 16
  },
  phoneLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#607095',
    marginBottom: 6
  },
  phoneValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15203a'
  }
});

export default OnboardingScreen;
