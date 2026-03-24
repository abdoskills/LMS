import { getMe } from '@/lib/server/controllers/authController';

export const runtime = 'nodejs';

export async function GET(request) {
  return getMe(request);
}
