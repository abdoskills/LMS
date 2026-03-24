import { uploadAvatar } from '@/lib/server/controllers/userController';

export const runtime = 'nodejs';

export async function POST(request) {
  return uploadAvatar(request);
}
