import { getUserStats } from '@/lib/server/controllers/userController';

export const runtime = 'nodejs';

export async function GET(request) {
  return getUserStats(request);
}
