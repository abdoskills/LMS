import { deleteCourse, getCourse, updateCourse } from '@/lib/server/controllers/courseController';

export const runtime = 'nodejs';

export async function GET(request, context) {
  return getCourse(request, { id: context.params.id });
}

export async function PUT(request, context) {
  return updateCourse(request, { id: context.params.id });
}

export async function DELETE(request, context) {
  return deleteCourse(request, { id: context.params.id });
}
