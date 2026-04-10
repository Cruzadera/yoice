import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AppShell from '../components/ui/AppShell';
import PrimaryButton from '../components/ui/PrimaryButton';
import ProfileIconButton from '../components/ui/ProfileIconButton';
import api, { PollResponse } from '../services/api';
import { getAvatarUri } from '../utils/avatar';

type Props = {
  token: string;
  pollId: string;
  userName?: string | null;
  avatarColor?: string | null;
  avatarImage?: string | null;
  onResults: (poll: PollResponse) => void;
  onProfile: () => void;
  onGroupList?: () => void;
};

const COLORS = ['#ffb703', '#ff6b6b', '#4f6cff', '#20c997', '#6f42c1', '#fd7e14'];

const PollScreen: React.FC<Props> = ({ token, pollId, userName, avatarColor, avatarImage, onResults, onProfile, onGroupList }) => {
  const [poll, setPoll] = useState<PollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');

  const loadPoll = async () => {
    try {
      const { data } = await api.getPoll(token, pollId);
      setPoll(data);
      setSelectedOption(data.userVote?.optionId || '');
      if (data.userVote) {
        onResults(data);
      }
    } catch (error) {
      console.error('Error cargando encuesta', error);
      Alert.alert('Error', 'No se pudo obtener la encuesta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoll();
  }, [pollId, token]);

  const submitVote = async () => {
    if (!poll) {
      return;
    }

    if (!selectedOption) {
      Alert.alert('Tu voto', 'Selecciona una persona.');
      return;
    }

    setSubmitting(true);

    try {
      await api.submitVote(token, pollId, selectedOption);
      const { data } = await api.getPoll(token, pollId);
      setPoll(data);
      setSelectedOption(data.userVote?.optionId || selectedOption);
      onResults(data);
    } catch (error: any) {
      console.error('Error enviando voto', error);
      const message =
        error?.response?.data?.message || 'No se pudo registrar el voto. Comprueba si ya has votado.';
      Alert.alert('Voto no registrado', message);
    } finally {
      setSubmitting(false);
    }
  };

  const voteLocked = !!poll?.userVote || !!poll?.expired;
  const visibleOptions = poll?.options.filter((option) => option.userId !== poll.currentUserId) || [];

  return (
    <AppShell
      eyebrow="Encuesta"
      title={poll?.question || 'Cargando encuesta'}
      subtitle="Vota rápido y consulta cómo va la encuesta del grupo."
      headerAction={<ProfileIconButton name={userName} avatarColor={avatarColor} avatarImage={avatarImage} onPress={onProfile} />}
    >
      {onGroupList ? (
        <Pressable onPress={onGroupList} style={styles.backLink}>
          <Text style={styles.backLinkText}>{"← Mis grupos"}</Text>
        </Pressable>
      ) : null}
      {loading || !poll ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#4f6cff" />
          <Text style={styles.loaderText}>Recuperando la encuesta y tu estado de voto…</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Estado</Text>
            <Text style={styles.heroValue}>
              {poll.expired ? 'Encuesta cerrada' : poll.userVote ? 'Ya has votado' : 'Pendiente de voto'}
            </Text>
            <Text style={styles.heroHint}>
              {poll.expiresAt
                ? `Cierra: ${new Date(poll.expiresAt).toLocaleString()}`
                : 'Sin fecha de cierre configurada'}
            </Text>
            <Text style={styles.metaText}>
              {poll.questionMeta.category} · {poll.questionMeta.selectionType}
            </Text>
          </View>

          <View style={styles.optionsGrid}>
            {visibleOptions.map((option, index) => {
              const active = selectedOption === option.id;
              const color = COLORS[index % COLORS.length];

              return (
                <Pressable
                  key={option.id}
                  style={[styles.optionCard, active && styles.optionCardActive, voteLocked && styles.optionCardLocked]}
                  disabled={voteLocked}
                  onPress={() => setSelectedOption(option.id)}
                >
                  <View style={styles.optionIdentity}>
                    <Image
                      source={{
                        uri: getAvatarUri({
                          name: option.label,
                          avatarImage: option.user.avatarImage,
                          avatarColor: option.user.avatarColor,
                          color: active ? 'ffffff' : color
                        })
                      }}
                      style={[styles.optionAvatar, { borderColor: color }]}
                    />
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {visibleOptions.length === 0 ? (
            <Text style={styles.emptyText}>
              Aún no hay suficientes personas en el grupo para votar. Comparte el grupo y vuelve cuando se una alguien más.
            </Text>
          ) : null}

          <PrimaryButton
            title={
              submitting
                ? 'Guardando voto...'
                : poll.userVote || poll.expired
                  ? 'Ver resultados'
                  : 'Enviar voto'
            }
            onPress={poll.userVote || poll.expired ? () => onResults(poll) : submitVote}
            loading={submitting}
            disabled={submitting || visibleOptions.length === 0}
          />
        </ScrollView>
      )}
    </AppShell>
  );
};

const styles = StyleSheet.create({
  backLink: {
    marginBottom: 12,
  },
  backLinkText: {
    color: '#4f6cff',
    fontSize: 14,
    fontWeight: '500',
  },
  loaderBox: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#eef2ff'
  },
  loaderText: {
    marginTop: 12,
    color: '#607095',
    fontSize: 15,
    lineHeight: 21
  },
  heroCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#eaf0ff',
    marginBottom: 18
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#607095',
    marginBottom: 8
  },
  heroValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#13203a'
  },
  heroHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#61708d',
    fontWeight: '600'
  },
  optionsGrid: {
    marginBottom: 18
  },
  optionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d7def4',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 10
  },
  optionIdentity: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  optionAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    marginRight: 12,
    backgroundColor: '#ffffff'
  },
  optionCardActive: {
    backgroundColor: '#16203a',
    borderColor: '#16203a'
  },
  optionCardLocked: {
    opacity: 0.7
  },
  optionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c2742'
  },
  optionTextActive: {
    color: '#ffffff'
  },
  metaText: {
    marginTop: 8,
    fontSize: 13,
    color: '#556684',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  emptyText: {
    color: '#66738f',
    fontSize: 14,
    lineHeight: 20
  }
});

export default PollScreen;
