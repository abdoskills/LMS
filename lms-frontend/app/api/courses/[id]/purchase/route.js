import { purchaseCourse } from '@/lib/server/controllers/courseController';

export const runtime = 'nodejs';

export async function POST(request, context) {
  return purchaseCourse(request, { id: context.params.id });
}
