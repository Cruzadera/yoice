import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const envApiUrl = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  ?.EXPO_PUBLIC_API_URL;

const getExpoHost = () => {
  const constantsAny = Constants as any;
  const candidates = [
    constantsAny.expoConfig?.hostUri,
    constantsAny.manifest2?.extra?.expoGo?.debuggerHost,
    constantsAny.manifest?.debuggerHost,
    constantsAny.expoGoConfig?.debuggerHost
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate.split(':')[0];
    }
  }

  return null;
};

const detectedHost = getExpoHost();
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const apiBaseUrl = envApiUrl || `http://${detectedHost || fallbackHost}:3001/api`;

console.log('[api] baseURL', apiBaseUrl);

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000
});

const authHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

export type PollResponse = {
  id: string;
  question: string;
  questionMeta: {
    id: string;
    category: string;
    selectionType: string;
    nsfw: boolean;
    active: boolean;
  };
  options: Array<{
    id: string;
    userId: string;
    label: string;
    user: {
      id: string;
      name: string | null;
      phone: string | null;
      avatarColor: string | null;
      avatarImage: string | null;
    };
  }>;
  expiresAt: string | null;
  createdAt: string;
  expired: boolean;
  userVote: {
    id: string;
    optionId: string;
    createdAt: string;
  } | null;
  results: Array<{
    optionId: string;
    label: string;
    userId: string;
    avatarColor: string | null;
    avatarImage: string | null;
    votes: number;
    voters: Array<{
      id: string;
      name: string;
      avatarColor: string | null;
      avatarImage: string | null;
    }>;
  }>;
};

export type AccessResponse = {
  nextStep: 'groupList' | 'onboarding';
  token: string;
  user: {
    id: string;
    authKey: string | null;
    name: string | null;
    avatarColor: string | null;
    avatarImage: string | null;
    createdAt: string;
  };
  groups: Array<{
    id: string;
    name: string;
    inviteCode: string;
    whatsappGroupId: string | null;
  }>;
  pollId: string | null;
};

export type StandaloneAccessResponse = {
  nextStep: 'groupLobby';
  token: string;
  user: {
    id: string;
    authKey: string | null;
    name: string | null;
    avatarColor: string | null;
    avatarImage: string | null;
    createdAt: string;
  };
};

export type EmailLoginStartResponse = {
  ok: boolean;
  message: string;
  debugLoginUrl?: string;
};

export type UserProfileResponse = {
  id: string;
  authKey: string | null;
  name: string | null;
  avatarColor: string | null;
  avatarImage: string | null;
  createdAt: string;
};

export type GroupAccessResponse = {
  group: {
    id: string;
    name: string;
    inviteCode: string;
  };
  poll: {
    id: string;
  } | null;
  memberCount: number;
  pollReady: boolean;
};

export type GroupSummary = {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  pollReady: boolean;
  poll: {
    id: string;
  } | null;
};

export type GroupListResponse = {
  groups: GroupSummary[];
};

export default {
  authenticateWhatsapp: (token: string, pollId: string, waGroupId?: string, waGroupName?: string) =>
    api.get<AccessResponse>('/auth/whatsapp', {
      params: { token, pollId, waGroupId, waGroupName }
    }),
  startEmailLogin: (payload: { email: string; pollId?: string; waGroupId?: string; waGroupName?: string }) =>
    api.post<EmailLoginStartResponse>('/auth/email/start', payload),
  loginStandalone: (payload: { name: string }) =>
    api.post<StandaloneAccessResponse>('/auth/standalone', payload),
  getMe: (token: string) => api.get<UserProfileResponse>('/user/me', authHeaders(token)),
  saveUserName: (token: string, name: string) =>
    api.post('/user/name', { name }, authHeaders(token)),
  saveUserProfile: (token: string, payload: { name: string; avatarColor: string; avatarImage?: string | null }) =>
    api.post<UserProfileResponse>('/user/profile', payload, authHeaders(token)),
  createGroup: (token: string, name: string) =>
    api.post<GroupAccessResponse>('/groups', { name }, authHeaders(token)),
  listGroups: (token: string) => api.get<GroupListResponse>('/groups', authHeaders(token)),
  joinGroup: (token: string, inviteCode: string) =>
    api.post<GroupAccessResponse>('/groups/join', { inviteCode }, authHeaders(token)),
  getPoll: (token: string, pollId: string) =>
    api.get<PollResponse>(`/polls/${pollId}`, authHeaders(token)),
  submitVote: (token: string, pollId: string, optionId: string) =>
    api.post('/votes', { pollId, optionId }, authHeaders(token))
};
