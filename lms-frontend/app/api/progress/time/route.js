import { updateTimeSpent } from '@/lib/server/controllers/progressController';

export const runtime = 'nodejs';

export async function PUT(request) {
  return updateTimeSpent(request);
}
