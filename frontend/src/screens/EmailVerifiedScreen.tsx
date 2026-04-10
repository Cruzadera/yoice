import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import PrimaryButton from '../components/ui/PrimaryButton';

type Props = {
  token?: string;
  email?: string;
  onContinue: () => void;
  onFallback: () => void;
};

const EmailVerifiedScreen: React.FC<Props> = ({ token = '', email, onContinue, onFallback }) => {
  useEffect(() => {
    if (!token) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onContinue();
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [token, onContinue]);

  const normalizedEmail = useMemo(() => {
    if (!email) {
      return '';
    }
    return email.trim().toLowerCase();
  }, [email]);

  return (
    <AppShell eyebrow="Email" title="Correo verificado" subtitle="Tu acceso ya esta listo.">
      <View style={styles.statusCard}>
        <Text style={styles.title}>Registro completado</Text>
        {normalizedEmail ? (
          <Text style={styles.message}>Se verifico y registro tu cuenta con {normalizedEmail}.</Text>
        ) : (
          <Text style={styles.message}>Se verifico y registro tu cuenta correctamente.</Text>
        )}

        {token ? (
          <>
            <Text style={styles.note}>En breve te llevamos al inicio con sesion activa.</Text>
            <PrimaryButton title="Entrar ahora" onPress={onContinue} />
          </>
        ) : (
          <>
            <Text style={styles.note}>No pudimos completar el acceso desde este enlace.</Text>
            <PrimaryButton title="Volver al inicio" onPress={onFallback} />
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
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16203a',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4a5677',
    marginBottom: 14,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b789d',
    marginBottom: 16,
  },
});

export default EmailVerifiedScreen;
