import { deleteCourse, getCourse, updateCourse } from '@/lib/server/controllers/courseController';

export const runtime = 'nodejs';

export async function GET(request, context) {
  const { id } = await context.params;
  return getCourse(request, { id });
}

export async function PUT(request, context) {
  const { id } = await context.params;
  return updateCourse(request, { id });
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  return deleteCourse(request, { id });
}
