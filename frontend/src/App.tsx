import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import AuthCallbackScreen from './screens/AuthCallbackScreen';
import GroupListScreen from './screens/GroupListScreen';
import GroupLobbyScreen from './screens/GroupLobbyScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PollScreen from './screens/PollScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResultsScreen from './screens/ResultsScreen';
import StandaloneAccessScreen from './screens/StandaloneAccessScreen';
import EmailVerifiedScreen from './screens/EmailVerifiedScreen';
import api, { PollResponse } from './services/api';
import { clearToken, loadToken, saveToken } from './utils/session';

type ScreenState =
  | { name: 'Bootstrapping' }
  | { name: 'StandaloneAccess'; pollId?: string; waGroupId?: string; waGroupName?: string }
  | { name: 'GroupList'; token: string; userName?: string | null; avatarColor?: string | null; avatarImage?: string | null }
  | {
      name: 'GroupLobby';
      token: string;
      userName?: string | null;
      avatarColor?: string | null;
      avatarImage?: string | null;
      initialGroup?: {
        id: string;
        name: string;
        inviteCode: string;
        memberCount: number;
        pollReady: boolean;
      };
    }
  | { name: 'EmailVerified'; token?: string; pollId?: string; waGroupId?: string; waGroupName?: string; email?: string }
  | { name: 'AuthCallback'; token?: string; pollId?: string; waGroupId?: string; waGroupName?: string }
  | { name: 'Onboarding'; token: string; pollId: string; identityLabel: string }
  | { name: 'Poll'; token: string; pollId: string; userName?: string | null; avatarColor?: string | null; avatarImage?: string | null }
  | { name: 'Results'; token: string; poll: PollResponse; userName?: string | null; avatarColor?: string | null; avatarImage?: string | null }
  | {
      name: 'Profile';
      token: string;
      userName?: string | null;
      avatarColor?: string | null;
      avatarImage?: string | null;
      returnTo: 'GroupList' | 'GroupLobby' | 'Poll' | 'Results';
      pollId?: string;
      poll?: PollResponse;
    };

const getStateFromUrl = (rawUrl?: string | null): ScreenState => {
  if (!rawUrl) {
    return { name: 'StandaloneAccess' };
  }

  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname.replace(/^\/+/, '');

    // Read params from both query string and hash fragment
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    const getParam = (key: string) => parsed.searchParams.get(key) || hashParams.get(key) || undefined;

    const token = getParam('token');
    const pollId = getParam('pollId');
    const waGroupId = getParam('waGroupId');
    const waGroupName = getParam('waGroupName');
    const email = getParam('email');

    if (path === 'auth/email/verified' || rawUrl.includes('auth/email/verified')) {
      return { name: 'EmailVerified', token, pollId, waGroupId, waGroupName, email };
    }

    if (path === 'auth/whatsapp' || rawUrl.includes('auth/whatsapp')) {
      return { name: 'AuthCallback', token, pollId, waGroupId, waGroupName };
    }

    if (path === 'standalone') {
      return { name: 'StandaloneAccess' };
    }

    // /g/{pollId} — short link from WhatsApp bot (group quick access, name only)
    if (path.startsWith('g/')) {
      const pollIdFromPath = path.replace('g/', '').split('?')[0];
      return { name: 'StandaloneAccess', pollId: pollIdFromPath, waGroupId: 'whatsapp' };
    }

    if (path.startsWith('poll/')) {
      const pollIdFromPath = path.replace('poll/', '').split('?')[0];

      if (token) {
        return { name: 'AuthCallback', token, pollId: pollIdFromPath, waGroupId, waGroupName };
      }

      return { name: 'StandaloneAccess', pollId: pollIdFromPath, waGroupId, waGroupName };
    }

    return { name: 'StandaloneAccess' };
  } catch {
    return { name: 'StandaloneAccess' };
  }
};

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ name: 'Bootstrapping' });

  useEffect(() => {
    let mounted = true;

    const cleanUrl = () => {
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', '/');
      }
    };

    // Resolves with null after 3 s to prevent Linking from hanging the bootstrap.
    const getInitialUrlSafe = (): Promise<string | null> =>
      Promise.race([
        Linking.getInitialURL(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
      ]);

    const bootstrap = async () => {
      console.log('[bootstrap] start');

      const href = typeof window !== 'undefined' ? window.location.href : null;
      const initialUrl = href || (await getInitialUrlSafe());
      console.log('[bootstrap] initialUrl:', initialUrl);

      const urlState = getStateFromUrl(initialUrl);
      console.log('[bootstrap] urlState:', urlState.name);

      // If the URL carries an auth token, honour it — don't restore the session.
      if (urlState.name === 'AuthCallback' || urlState.name === 'EmailVerified') {
        if (mounted) setScreen(urlState);
        cleanUrl();
        return;
      }

      // Try to restore a previously saved session.
      const savedToken = loadToken();
      if (savedToken) {
        try {
          console.log('[bootstrap] restoring session…');
          const { data: user } = await api.getMe(savedToken);
          if (mounted) {
            // If the URL pointed to a specific poll, go directly there.
            const pollIdFromUrl =
              urlState.name === 'StandaloneAccess' ? urlState.pollId : undefined;

            if (pollIdFromUrl) {
              setScreen({
                name: 'Poll',
                token: savedToken,
                pollId: pollIdFromUrl,
                userName: user.name,
                avatarColor: user.avatarColor,
                avatarImage: user.avatarImage
              });
            } else {
              setScreen({
                name: 'GroupList',
                token: savedToken,
                userName: user.name,
                avatarColor: user.avatarColor,
                avatarImage: user.avatarImage
              });
            }
          }
          cleanUrl();
          return;
        } catch (err) {
          console.warn('[bootstrap] session restore failed:', err);
          clearToken();
        }
      }

      cleanUrl();
      console.log('[bootstrap] done →', urlState.name);
      if (mounted) setScreen(urlState);
    };

    bootstrap().catch((err) => {
      console.error('[bootstrap] fatal error:', err);
      if (mounted) setScreen({ name: 'StandaloneAccess' });
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      setScreen(getStateFromUrl(url));
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {screen.name === 'Bootstrapping' ? (
        <View style={styles.bootstrapping}>
          <ActivityIndicator size="large" color="#4f6cff" />
        </View>
      ) : null}

      {screen.name === 'StandaloneAccess' ? (
        <StandaloneAccessScreen
          pollId={screen.pollId}
          waGroupId={screen.waGroupId}
          waGroupName={screen.waGroupName}
          onAuthenticated={(params) => {
            saveToken(params.token);
            if (params.pollId) {
              setScreen({ name: 'Poll', token: params.token, pollId: params.pollId, userName: params.userName, avatarColor: params.avatarColor, avatarImage: params.avatarImage });
            } else {
              setScreen({ name: 'GroupList', token: params.token, userName: params.userName, avatarColor: params.avatarColor, avatarImage: params.avatarImage });
            }
          }}
        />
      ) : null}

      {screen.name === 'GroupList' ? (
        <GroupListScreen
          token={screen.token}
          userName={screen.userName}
          avatarColor={screen.avatarColor}
          avatarImage={screen.avatarImage}
          onGroupLobby={(params) => setScreen({ name: 'GroupLobby', ...params })}
          onPoll={(params) => setScreen({ name: 'Poll', ...params })}
          onProfile={() =>
            setScreen({
              name: 'Profile',
              token: screen.token,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage,
              returnTo: 'GroupList'
            })
          }
        />
      ) : null}

      {screen.name === 'GroupLobby' ? (
        <GroupLobbyScreen
          token={screen.token}
          userName={screen.userName}
          avatarColor={screen.avatarColor}
          avatarImage={screen.avatarImage}
          initialGroup={screen.initialGroup}
          onPoll={(params) => setScreen({ name: 'Poll', ...params })}
          onBack={() =>
            setScreen({
              name: 'GroupList',
              token: screen.token,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage
            })
          }
          onProfile={() =>
            setScreen({
              name: 'Profile',
              token: screen.token,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage,
              returnTo: 'GroupLobby',
              poll: undefined
            })
          }
        />
      ) : null}

      {screen.name === 'AuthCallback' ? (
        <AuthCallbackScreen
          token={screen.token}
          pollId={screen.pollId}
          waGroupId={screen.waGroupId}
          waGroupName={screen.waGroupName}
          onStandaloneFallback={() => setScreen({ name: 'StandaloneAccess' })}
          onOnboarding={(params) => setScreen({ name: 'Onboarding', ...params })}
          onGroupList={(params) => {
            saveToken(params.token);
            setScreen({ name: 'GroupList', ...params });
          }}
        />
      ) : null}

      {screen.name === 'EmailVerified' ? (
        <EmailVerifiedScreen
          token={screen.token}
          email={screen.email}
          onFallback={() => setScreen({ name: 'StandaloneAccess' })}
          onContinue={() =>
            setScreen({
              name: 'AuthCallback',
              token: screen.token,
              pollId: screen.pollId,
              waGroupId: screen.waGroupId,
              waGroupName: screen.waGroupName,
            })
          }
        />
      ) : null}

      {screen.name === 'Onboarding' ? (
        <OnboardingScreen
          token={screen.token}
          pollId={screen.pollId}
          identityLabel={screen.identityLabel}
          onGroupList={(params) => {
            saveToken(params.token);
            setScreen({ name: 'GroupList', ...params });
          }}
        />
      ) : null}

      {screen.name === 'Poll' ? (
        <PollScreen
          token={screen.token}
          pollId={screen.pollId}
          userName={screen.userName}
          avatarColor={screen.avatarColor}
          avatarImage={screen.avatarImage}
          onGroupList={() =>
            setScreen({
              name: 'GroupList',
              token: screen.token,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage
            })
          }
          onResults={(poll) =>
            setScreen({
              name: 'Results',
              token: screen.token,
              poll,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage
            })
          }
          onProfile={() =>
            setScreen({
              name: 'Profile',
              token: screen.token,
              pollId: screen.pollId,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage,
              returnTo: 'Poll'
            })
          }
        />
      ) : null}

      {screen.name === 'Results' ? (
        <ResultsScreen
          poll={screen.poll}
          userName={screen.userName}
          avatarColor={screen.avatarColor}
          avatarImage={screen.avatarImage}
          onBack={() =>
            setScreen({
              name: 'GroupList',
              token: screen.token,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage
            })
          }
          onProfile={() =>
            setScreen({
              name: 'Profile',
              token: screen.token,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage,
              returnTo: 'Results',
              pollId: screen.poll.id,
              poll: screen.poll
            })
          }
        />
      ) : null}

      {screen.name === 'Profile' ? (
        <ProfileScreen
          token={screen.token}
          initialName={screen.userName}
          initialAvatarColor={screen.avatarColor}
          initialAvatarImage={screen.avatarImage}
          onBack={() => {
            if (screen.returnTo === 'GroupList') {
              setScreen({
                name: 'GroupList',
                token: screen.token,
                userName: screen.userName,
                avatarColor: screen.avatarColor,
                avatarImage: screen.avatarImage
              });
              return;
            }

            if (screen.returnTo === 'GroupLobby') {
              setScreen({
                name: 'GroupLobby',
                token: screen.token,
                userName: screen.userName,
                avatarColor: screen.avatarColor,
                avatarImage: screen.avatarImage
              });
              return;
            }

            if (screen.returnTo === 'Results' && screen.poll) {
              setScreen({
                name: 'Results',
                token: screen.token,
                poll: screen.poll,
                userName: screen.userName,
                avatarColor: screen.avatarColor,
                avatarImage: screen.avatarImage
              });
              return;
            }

            setScreen({
              name: 'Poll',
              token: screen.token,
              pollId: screen.pollId || '',
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage
            });
          }}
          onSaved={(params) => {
            if (screen.returnTo === 'GroupList') {
              setScreen({
                name: 'GroupList',
                token: screen.token,
                userName: params.userName,
                avatarColor: params.avatarColor,
                avatarImage: params.avatarImage
              });
              return;
            }

            if (screen.returnTo === 'GroupLobby') {
              setScreen({
                name: 'GroupLobby',
                token: screen.token,
                userName: params.userName,
                avatarColor: params.avatarColor,
                avatarImage: params.avatarImage
              });
              return;
            }

            if (screen.returnTo === 'Results' && screen.poll) {
              setScreen({
                name: 'Results',
                token: screen.token,
                poll: screen.poll,
                userName: params.userName,
                avatarColor: params.avatarColor,
                avatarImage: params.avatarImage
              });
              return;
            }

            setScreen({
              name: 'Poll',
              token: screen.token,
              pollId: screen.pollId || '',
              userName: params.userName,
              avatarColor: params.avatarColor,
              avatarImage: params.avatarImage
            });
          }}
        />
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  bootstrapping: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  }
});
