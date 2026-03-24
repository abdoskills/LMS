import { createCourse, getCourses } from '@/lib/server/controllers/courseController';

export const runtime = 'nodejs';

export async function GET(request) {
  return getCourses(request);
}

export async function POST(request) {
  return createCourse(request);
}
