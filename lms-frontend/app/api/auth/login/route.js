import { login } from '@/lib/server/controllers/authController';

export const runtime = 'nodejs';

export async function POST(request) {
  return login(request);
}
