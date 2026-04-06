import React, { useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import ProfileIconButton from '../components/ui/ProfileIconButton';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import api from '../services/api';

type Props = {
  token: string;
  userName?: string | null;
  avatarColor?: string | null;
  avatarImage?: string | null;
  onPoll: (params: {
    token: string;
    pollId: string;
    userName?: string | null;
    avatarColor?: string | null;
    avatarImage?: string | null;
  }) => void;
  onProfile: () => void;
};

const GroupLobbyScreen: React.FC<Props> = ({ token, userName, avatarColor, avatarImage, onPoll, onProfile }) => {
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<{
    id: string;
    name: string;
    inviteCode: string;
    memberCount: number;
    pollReady: boolean;
  } | null>(null);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Grupo', 'Escribe un nombre para el grupo.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.createGroup(token, groupName.trim());
      setCreatedGroup({
        id: data.group.id,
        name: data.group.name,
        inviteCode: data.group.inviteCode,
        memberCount: data.memberCount,
        pollReady: data.pollReady
      });

      if (data.pollReady && data.poll) {
        onPoll({ token, pollId: data.poll.id, userName, avatarColor, avatarImage });
        return;
      }

      Alert.alert(
        'Grupo creado',
        `Comparte el código ${data.group.inviteCode}. La encuesta diaria se activará cuando haya al menos 2 personas.`
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo crear el grupo.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Grupo', 'Introduce el código de invitación.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.joinGroup(token, inviteCode.trim());
      setCreatedGroup({
        id: data.group.id,
        name: data.group.name,
        inviteCode: data.group.inviteCode,
        memberCount: data.memberCount,
        pollReady: data.pollReady
      });

      if (data.pollReady && data.poll) {
        onPoll({ token, pollId: data.poll.id, userName, avatarColor, avatarImage });
        return;
      }

      Alert.alert('Grupo actualizado', 'Aún no hay suficientes personas para activar la encuesta diaria.');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo unir al grupo.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareGroup = async () => {
    if (!createdGroup) {
      return;
    }

    try {
      await Share.share({
        message: `Únete al grupo "${createdGroup.name}" con este código: ${createdGroup.inviteCode}`
      });
    } catch (error) {
      Alert.alert('Compartir', 'No se pudo abrir el panel de compartir.');
    }
  };

  return (
    <AppShell
      eyebrow="Grupos"
      title={userName ? `Hola ${userName}` : 'Tu grupo'}
      subtitle="En modo standalone entras primero a un grupo y desde ahí te llevamos a la encuesta activa del día."
      headerAction={<ProfileIconButton name={userName} avatarColor={avatarColor} avatarImage={avatarImage} onPress={onProfile} />}
    >
      {createdGroup ? (
        <View style={styles.shareCard}>
          <Text style={styles.shareTitle}>{createdGroup.name}</Text>
          <Text style={styles.shareCode}>{createdGroup.inviteCode}</Text>
          <Text style={styles.shareHint}>
            {createdGroup.pollReady
              ? `Encuesta activa para ${createdGroup.memberCount} personas.`
              : `Faltan personas. Miembros actuales: ${createdGroup.memberCount}.`}
          </Text>
          <PrimaryButton title="Compartir grupo" onPress={handleShareGroup} variant="secondary" />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crear grupo</Text>
        <FieldInput
          label="Nombre del grupo"
          placeholder="Ej. Piso, amigos, oficina"
          value={groupName}
          onChangeText={setGroupName}
        />
        <PrimaryButton title={loading ? 'Creando...' : 'Crear grupo'} onPress={handleCreate} loading={loading} />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unirse con código</Text>
        <FieldInput
          label="Código"
          placeholder="ABC123"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <PrimaryButton
          title={loading ? 'Uniéndote...' : 'Unirse al grupo'}
          onPress={handleJoin}
          variant="secondary"
          loading={loading}
          disabled={!inviteCode.trim()}
        />
      </View>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 8
  },
  sectionTitle: {
    marginBottom: 14,
    fontSize: 18,
    fontWeight: '800',
    color: '#11182c'
  },
  divider: {
    height: 1,
    backgroundColor: '#dde4f7',
    marginVertical: 18
  },
  shareCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    marginBottom: 18
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#13203a'
  },
  shareCode: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#16203a'
  },
  shareHint: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20,
    color: '#5e6983'
  }
});

export default GroupLobbyScreen;
