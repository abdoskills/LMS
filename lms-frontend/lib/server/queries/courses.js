import Course from '@/lib/server/models/Course';
import { connectDB } from '@/lib/server/db';

export async function getPublishedCourses({
  page = 1,
  limit = 10,
  search = '',
  category = '',
  sort = '-createdAt',
} = {}) {
  await connectDB();

  const query = { isPublished: true };

  if (category) query.category = category;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Course.countDocuments(query);

  const courses = await Course.find(query)
    .populate('instructor', 'name email')
    .sort(sort.split(',').join(' '))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    total,
    courses: JSON.parse(JSON.stringify(courses)),
  };
}
