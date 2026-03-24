import { logout } from '@/lib/server/controllers/authController';

export const runtime = 'nodejs';

export async function POST() {
  return logout();
}
