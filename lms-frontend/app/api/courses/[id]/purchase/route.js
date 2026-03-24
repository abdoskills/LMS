import { purchaseCourse } from '@/lib/server/controllers/courseController';

export const runtime = 'nodejs';

export async function POST(request, context) {
  const { id } = await context.params;
  return purchaseCourse(request, { id });
}
