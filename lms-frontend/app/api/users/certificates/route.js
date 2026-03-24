import { getCertificates } from '@/lib/server/controllers/userController';

export const runtime = 'nodejs';

export async function GET(request) {
  return getCertificates(request);
}
