import { register } from '@/lib/server/controllers/authController';

export const runtime = 'nodejs';

export async function POST(request) {
  return register(request);
}
