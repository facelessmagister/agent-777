import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/app/(auth)/auth';

type Session = {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    type?: 'guest' | 'regular';
  };
};

/**
 * getServerSession
 * Unified session accessor for API routes. Wraps NextAuth's auth() so routes
 * can keep calling this helper without worrying about cookies/headers.
 *
 * Note: Signature remains compatible with previous usage (req, res) but these
 * args are ignored. Session is derived from NextAuth cookies.
 */
export const getServerSession = async (_req?: NextApiRequest, _res?: NextApiResponse): Promise<Session | null> => {
  const session = await auth();
  return (session as unknown as Session) ?? null;
};

/**
 * DEPRECATED: In-memory session helpers were for early development only.
 * They now return no-ops to avoid accidental usage.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createSession = (_userId: string, _userData: { email?: string; name?: string } = {}) => {
  return { sessionId: null as unknown as string, session: null as unknown as Session };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const deleteSession = (_sessionId: string) => {
  return false;
};

// Internal mock config (not exported)
const authOptionsInternal = {};
