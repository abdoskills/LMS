import { getProgress, updateProgress } from '@/lib/server/controllers/progressController';

export const runtime = 'nodejs';

export async function GET(request) {
  return getProgress(request);
}

export async function PUT(request) {
  return updateProgress(request);
}
