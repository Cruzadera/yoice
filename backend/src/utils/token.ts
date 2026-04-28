import crypto from 'crypto';

export type SessionTokenPayload = {
  sub: string;
  exp: number;
  userId?: string;
  email?: string;
  name?: string;
};

const getSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  return secret;
};

const sign = (encodedPayload: string) =>
  crypto.createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');

export const deriveAuthKey = (subject: string) =>
  crypto.createHmac('sha256', getSecret()).update(subject).digest('hex');

export const createAutologinToken = (
  subject: string,
  expiresInSeconds = 60 * 60 * 24 * 7,
  metadata?: {
    userId?: string;
    email?: string | null;
    name?: string | null;
  }
) => {
  const payload: SessionTokenPayload = {
    sub: subject,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    ...(metadata?.userId ? { userId: metadata.userId } : {}),
    ...(metadata?.email ? { email: metadata.email } : {}),
    ...(metadata?.name ? { name: metadata.name } : {})
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

export const verifyAutologinToken = (token: string): SessionTokenPayload => {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    throw new Error('Token inválido');
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    throw new Error('Firma inválida');
  }

  const isValidSignature = crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);

  if (!isValidSignature) {
    throw new Error('Firma inválida');
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<SessionTokenPayload>;

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Token sin subject');
  }

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado');
  }

  return {
    sub: payload.sub,
    exp: payload.exp,
    ...(payload.userId ? { userId: payload.userId } : {}),
    ...(payload.email ? { email: payload.email } : {}),
    ...(payload.name ? { name: payload.name } : {})
  };
};
