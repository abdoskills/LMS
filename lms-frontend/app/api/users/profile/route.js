import { getProfile, updateProfile } from '@/lib/server/controllers/userController';

export const runtime = 'nodejs';

export async function GET(request) {
  return getProfile(request);
}

export async function PUT(request) {
  return updateProfile(request);
}
