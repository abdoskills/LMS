import { changePassword } from '@/lib/server/controllers/userController';

export const runtime = 'nodejs';

export async function PUT(request) {
  return changePassword(request);
}
