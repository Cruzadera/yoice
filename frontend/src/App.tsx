import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Linking } from 'react-native';
import AuthCallbackScreen from './screens/AuthCallbackScreen';
import GroupLobbyScreen from './screens/GroupLobbyScreen';
import HomeScreen from './screens/HomeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PollScreen from './screens/PollScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResultsScreen from './screens/ResultsScreen';
import StandaloneAccessScreen from './screens/StandaloneAccessScreen';
import { PollResponse } from './services/api';

type ScreenState =
  | { name: 'Home' }
  | { name: 'StandaloneAccess' }
  | { name: 'GroupLobby'; token: string; userName?: string | null; avatarColor?: string | null; avatarImage?: string | null }
  | { name: 'AuthCallback'; token?: string; pollId?: string }
  | { name: 'Onboarding'; token: string; pollId: string; identityLabel: string }
  | { name: 'Poll'; token: string; pollId: string; userName?: string | null; avatarColor?: string | null; avatarImage?: string | null }
  | { name: 'Results'; token: string; poll: PollResponse; userName?: string | null; avatarColor?: string | null; avatarImage?: string | null }
  | {
      name: 'Profile';
      token: string;
      userName?: string | null;
      avatarColor?: string | null;
      avatarImage?: string | null;
      returnTo: 'GroupLobby' | 'Poll' | 'Results';
      pollId?: string;
      poll?: PollResponse;
    };

const getStateFromUrl = (rawUrl?: string | null): ScreenState => {
  if (!rawUrl) {
    return { name: 'Home' };
  }

  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname.replace(/^\/+/, '');
    const token = parsed.searchParams.get('token') || undefined;
    const pollId = parsed.searchParams.get('pollId') || undefined;

    if (path === 'auth/whatsapp' || rawUrl.includes('auth/whatsapp')) {
      return { name: 'AuthCallback', token, pollId };
    }

    if (path === 'standalone') {
      return { name: 'StandaloneAccess' };
    }

    if (path.startsWith('poll/') && token) {
      return { name: 'Poll', token, pollId: path.replace('poll/', '') };
    }

    return { name: 'Home' };
  } catch {
    return { name: 'Home' };
  }
};

export default function App() {
  const [screen, setScreen] = useState<ScreenState>(() =>
    getStateFromUrl(typeof window !== 'undefined' ? window.location.href : null)
  );

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const initialUrl = await Linking.getInitialURL();

      if (mounted && initialUrl) {
        setScreen(getStateFromUrl(initialUrl));
      }
    };

    bootstrap();

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
      {screen.name === 'Home' ? (
        <HomeScreen onStandaloneAccess={() => setScreen({ name: 'StandaloneAccess' })} />
      ) : null}

      {screen.name === 'StandaloneAccess' ? (
        <StandaloneAccessScreen
          onHome={() => setScreen({ name: 'Home' })}
          onGroupLobby={(params) => setScreen({ name: 'GroupLobby', ...params })}
        />
      ) : null}

      {screen.name === 'GroupLobby' ? (
        <GroupLobbyScreen
          token={screen.token}
          userName={screen.userName}
          avatarColor={screen.avatarColor}
          avatarImage={screen.avatarImage}
          onPoll={(params) => setScreen({ name: 'Poll', ...params })}
          onProfile={() =>
            setScreen({
              name: 'Profile',
              token: screen.token,
              userName: screen.userName,
              avatarColor: screen.avatarColor,
              avatarImage: screen.avatarImage,
              returnTo: 'GroupLobby'
            })
          }
        />
      ) : null}

      {screen.name === 'AuthCallback' ? (
        <AuthCallbackScreen
          token={screen.token}
          pollId={screen.pollId}
          onStandaloneFallback={() => setScreen({ name: 'StandaloneAccess' })}
          onOnboarding={(params) => setScreen({ name: 'Onboarding', ...params })}
          onPoll={(params) => setScreen({ name: 'Poll', ...params })}
        />
      ) : null}

      {screen.name === 'Onboarding' ? (
        <OnboardingScreen
          token={screen.token}
          pollId={screen.pollId}
          identityLabel={screen.identityLabel}
          onPoll={(params) => setScreen({ name: 'Poll', ...params })}
        />
      ) : null}

      {screen.name === 'Poll' ? (
        <PollScreen
          token={screen.token}
          pollId={screen.pollId}
          userName={screen.userName}
          avatarColor={screen.avatarColor}
          avatarImage={screen.avatarImage}
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
              name: 'Poll',
              token: screen.token,
              pollId: screen.poll.id,
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
