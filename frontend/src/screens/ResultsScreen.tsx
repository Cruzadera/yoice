import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import AvatarStack from '../components/results/AvatarStack';
import PrimaryButton from '../components/ui/PrimaryButton';
import { ResultVoter } from '../components/results/types';
import ProfileIconButton from '../components/ui/ProfileIconButton';
import { PollResponse } from '../services/api';
import { getAvatarUri } from '../utils/avatar';

type Props = {
  poll: PollResponse;
  userName?: string | null;
  avatarColor?: string | null;
  avatarImage?: string | null;
  onBack: () => void;
  onProfile: () => void;
};

const COLORS = ['#ffb703', '#ff6b6b', '#4f6cff', '#20c997', '#6f42c1', '#fd7e14'];

const ResultsScreen: React.FC<Props> = ({ poll, userName, avatarColor, avatarImage, onBack, onProfile }) => {
  const results = poll.results.filter((result) => result.votes > 0);
  const maxVotes = Math.max(...(results.map((result) => result.votes) || [0]));

  return (
    <AppShell
      eyebrow="Resultados"
      title={poll.question}
      subtitle="Así va la votación ahora mismo."
      headerAction={<ProfileIconButton name={userName} avatarColor={avatarColor} avatarImage={avatarImage} onPress={onProfile} />}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {results.length > 0 ? (
          results.map((result, index) => {
            const color = COLORS[index % COLORS.length];
            const percentage = maxVotes > 0 ? Math.max((result.votes / maxVotes) * 100, 14) : 0;
            const voters: ResultVoter[] = result.voters.map((voter) => ({
              id: `${result.optionId}-${voter.id}`,
              name: voter.name,
              avatar: getAvatarUri({
                name: voter.name,
                avatarImage: voter.avatarImage,
                avatarColor: voter.avatarColor,
                color: 'ffffff',
                size: 72
              })
            }));

            return (
              <View key={result.optionId} style={styles.resultRowCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultIdentity}>
                    <Image
                      source={{
                        uri: getAvatarUri({
                          name: result.label,
                          avatarImage: result.avatarImage,
                          avatarColor: result.avatarColor,
                          color: 'ffffff'
                        })
                      }}
                      style={[styles.resultAvatar, { backgroundColor: color }]}
                    />
                    <Text style={styles.resultLabel}>{result.label}</Text>
                  </View>
                  <Text style={styles.resultCount}>{result.votes} voto(s)</Text>
                </View>

                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
                </View>

                <View style={styles.resultFooter}>
                  <Text style={styles.resultVotersText}>{result.voters.map((voter) => voter.name).join(', ')}</Text>
                  <AvatarStack voters={voters} accentColor={color} size={32} />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Todavía no hay votos registrados.</Text>
        )}

        <View style={styles.backCard}>
          <PrimaryButton title="Mis grupos" onPress={onBack} variant="secondary" />
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  resultRowCard: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#d8e0f4'
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resultIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  resultAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12
  },
  resultLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#1c2742'
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4a5c86'
  },
  barTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#d7def4',
    overflow: 'hidden',
    marginTop: 12
  },
  barFill: {
    height: '100%',
    borderRadius: 999
  },
  resultFooter: {
    marginTop: 12
  },
  resultVotersText: {
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#66738f'
  },
  emptyText: {
    color: '#66738f',
    fontSize: 14,
    lineHeight: 20
  },
  backCard: {
    paddingTop: 20
  }
});

export default ResultsScreen;
