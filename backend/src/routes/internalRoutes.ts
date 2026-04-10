import { Router, Request, Response } from 'express';
import prisma from '../services/db';
import { createAutologinToken, deriveAuthKey } from '../utils/token';
import { resolveDailyPollForGroupBySource } from '../services/pollFactory';

const router = Router();

const botInternalSecret = process.env.BOT_INTERNAL_SECRET;
const frontendUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:8081';

const createInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const createUniqueInviteCode = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = createInviteCode();
    const exists = await prisma.group.findUnique({ where: { inviteCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error('No se pudo generar un código de invitación único');
};

const requireBotSecret = (req: Request, res: Response, next: () => void) => {
  const secret = req.header('x-bot-internal-secret')?.trim();
  if (botInternalSecret && secret !== botInternalSecret) {
    res.status(401).json({ error: 'No autorizado.' });
    return;
  }
  next();
};

/**
 * POST /internal/bot/access-link
 * Called by the WhatsApp bot to generate a full autologin URL for a group poll.
 *
 * Body: { waUserId, waGroupId, waGroupName?, pollId? }
 * Returns: { token, url }
 */
router.post('/bot/access-link', requireBotSecret, async (req: Request, res: Response) => {
  const waUserId = typeof req.body?.waUserId === 'string' ? req.body.waUserId.trim() : '';
  const waGroupId = typeof req.body?.waGroupId === 'string' ? req.body.waGroupId.trim() : '';
  const waGroupName = typeof req.body?.waGroupName === 'string' ? req.body.waGroupName.trim() : '';
  const pollId = typeof req.body?.pollId === 'string' ? req.body.pollId.trim() : '';

  if (!waGroupId) {
    return res.status(400).json({ error: 'waGroupId es obligatorio.' });
  }

  try {
    // Ensure group exists
    const existing = await prisma.group.findUnique({
      where: { whatsappGroupId: waGroupId },
      select: { id: true, name: true }
    });

    if (existing && waGroupName && existing.name !== waGroupName) {
      await prisma.group.update({
        where: { id: existing.id },
        data: { name: waGroupName }
      });
    }

    const groupId = existing
      ? existing.id
      : (
          await prisma.group.create({
            data: {
              name: waGroupName || 'Grupo de WhatsApp',
              inviteCode: await createUniqueInviteCode(),
              whatsappGroupId: waGroupId
            },
            select: { id: true }
          })
        ).id;

    const resolvedPoll = pollId
      ? { id: pollId }
      : await resolveDailyPollForGroupBySource(groupId, 'whatsapp');
    const resolvedPollId = resolvedPoll?.id;

    if (!resolvedPollId) {
      return res.status(500).json({ error: 'No se pudo generar la encuesta del grupo.' });
    }

    // Build the shared poll URL using hash fragment to keep URL clean for WhatsApp
    const baseUrl = `${frontendUrl}/poll/${resolvedPollId}`;
    const hashParams = new URLSearchParams();
    hashParams.set('waGroupId', waGroupId);
    if (waGroupName) hashParams.set('waGroupName', waGroupName);

    return res.json({
      groupId,
      pollId: resolvedPollId,
      url: `${baseUrl}#${hashParams.toString()}`
    });
  } catch (error) {
    console.error('Error creating bot access link', error);
    return res.status(500).json({ error: 'No se pudo generar el enlace.' });
  }
});

export default router;
