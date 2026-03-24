import mongoose from 'mongoose';
import User from '../lib/server/models/User.js';
import Course from '../lib/server/models/Course.js';
import Purchase from '../lib/server/models/Purchase.js';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || undefined;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Run with: node --env-file=.env.local scripts/seed.mjs');
  process.exit(1);
}

const usersSeed = [
  {
    key: 'admin',
    name: 'Platform Admin',
    email: 'admin@lms.com',
    password: 'Admin@123456',
    role: 'admin',
    bio: 'System administrator account',
  },
  {
    key: 'instructor',
    name: 'Sarah Instructor',
    email: 'instructor@lms.com',
    password: 'Instructor@123',
    role: 'instructor',
    bio: 'Teaches web development and AI tools.',
  },
  {
    key: 'student',
    name: 'Ali Student',
    email: 'student@lms.com',
    password: 'Student@123',
    role: 'student',
    bio: 'Demo student account.',
  },
];

const courseSeed = [
  {
    title: 'Next.js 16 From Zero to Hero',
    description: 'Build production-ready apps with App Router, API routes, and performance best practices.',
    category: 'Development',
    price: 0,
    thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
    rating: 4.8,
    lessons: [
      { title: 'Intro to App Router', description: 'Project setup and folders', videoUrl: 'https://www.youtube.com/watch?v=wm5gMKuwSYk', duration: 900, order: 1, isPreview: true },
      { title: 'Server vs Client Components', description: 'When to use each', videoUrl: 'https://www.youtube.com/watch?v=QYp0mukbV2I', duration: 1100, order: 2, isPreview: false },
      { title: 'Route Handlers', description: 'Build backend with /app/api', videoUrl: 'https://www.youtube.com/watch?v=0nB5-Iq8u0w', duration: 1200, order: 3, isPreview: false },
    ],
  },
  {
    title: 'MongoDB for Full-Stack Apps',
    description: 'Modeling, indexing, and practical querying for LMS and e-commerce systems.',
    category: 'IT & Software',
    price: 29,
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
    rating: 4.7,
    lessons: [
      { title: 'Data Modeling', description: 'Schemas and references', videoUrl: 'https://www.youtube.com/watch?v=Www6cTUymCY', duration: 800, order: 1, isPreview: true },
      { title: 'Indexes & Performance', description: 'Speeding up reads', videoUrl: 'https://www.youtube.com/watch?v=b4D45eizLW4', duration: 1000, order: 2, isPreview: false },
    ],
  },
  {
    title: 'TypeScript for React Developers',
    description: 'Master typing components, APIs, hooks, and complex app states.',
    category: 'Development',
    price: 19,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    rating: 4.9,
    lessons: [
      { title: 'Type Fundamentals', description: 'Union, interface, generics', videoUrl: 'https://www.youtube.com/watch?v=30LWjhZzg50', duration: 1000, order: 1, isPreview: true },
      { title: 'Typing React Components', description: 'Props and state patterns', videoUrl: 'https://www.youtube.com/watch?v=lRA5H4N8Wv8', duration: 950, order: 2, isPreview: false },
    ],
  },
  {
    title: 'UI Design Principles for Developers',
    description: 'Color, spacing, typography and layout systems that improve product UX.',
    category: 'Design',
    price: 15,
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    rating: 4.6,
    lessons: [
      { title: 'Visual Hierarchy', description: 'Guiding user attention', videoUrl: 'https://www.youtube.com/watch?v=QJX4N2N5b7A', duration: 700, order: 1, isPreview: true },
      { title: 'Practical Layouts', description: 'Real-world examples', videoUrl: 'https://www.youtube.com/watch?v=68w2VwalD5w', duration: 900, order: 2, isPreview: false },
    ],
  },
  {
    title: 'Digital Marketing Fundamentals',
    description: 'Learn SEO, content strategy, and paid campaign basics.',
    category: 'Marketing',
    price: 12,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    rating: 4.5,
    lessons: [
      { title: 'SEO Basics', description: 'Search-first content', videoUrl: 'https://www.youtube.com/watch?v=xsVTqzratPs', duration: 850, order: 1, isPreview: true },
      { title: 'Ads Strategy', description: 'Simple conversion funnel', videoUrl: 'https://www.youtube.com/watch?v=0f_kg8m8e6A', duration: 900, order: 2, isPreview: false },
    ],
  },
];

async function upsertUser(seedUser) {
  const existing = await User.findOne({ email: seedUser.email }).select('+password');

  if (!existing) {
    const created = await User.create(seedUser);
    return created;
  }

  existing.name = seedUser.name;
  existing.role = seedUser.role;
  existing.bio = seedUser.bio;
  existing.password = seedUser.password;
  await existing.save();
  return existing;
}

async function run() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });

  // Cleanup legacy indexes from old schema versions
  try {
    await User.collection.dropIndex('username_1');
  } catch (err) {
    // ignore if index does not exist
  }

  const users = {};
  for (const user of usersSeed) {
    users[user.key] = await upsertUser(user);
  }

  const instructorId = users.instructor._id;
  const studentId = users.student._id;

  const createdCourses = [];
  for (const c of courseSeed) {
    let course = await Course.findOne({ title: c.title, instructor: instructorId });
    if (!course) {
      course = await Course.create({ ...c, instructor: instructorId, isPublished: true });
    } else {
      course.description = c.description;
      course.category = c.category;
      course.price = c.price;
      course.thumbnail = c.thumbnail;
      course.rating = c.rating;
      course.lessons = c.lessons;
      course.isPublished = true;
      await course.save();
    }
    createdCourses.push(course);
  }

  // Ensure student has enrollments for first 2 courses
  const student = await User.findById(studentId);
  for (let i = 0; i < Math.min(2, createdCourses.length); i += 1) {
    const course = createdCourses[i];
    const already = student.purchasedCourses.some((pc) => pc.courseId.toString() === course._id.toString());
    if (!already) {
      student.purchasedCourses.push({
        courseId: course._id,
        progress: i === 0 ? 100 : 35,
        completed: i === 0,
        enrolledAt: new Date(),
      });
      await Purchase.create({
        userId: student._id,
        courseId: course._id,
        amount: course.price,
        paymentMethod: 'seed',
        paymentStatus: 'completed',
      });
    }
  }
  await student.save();

  // Keep totalStudents in sync
  for (const course of createdCourses) {
    const count = await User.countDocuments({ 'purchasedCourses.courseId': course._id });
    course.totalStudents = count;
    await course.save();
  }

  console.log('✅ Seed complete');
  console.log('Admin:', users.admin.email, '/ Admin@123456');
  console.log('Instructor:', users.instructor.email, '/ Instructor@123');
  console.log('Student:', users.student.email, '/ Student@123');

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Seed failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
