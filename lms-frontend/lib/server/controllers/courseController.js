import mongoose from 'mongoose';
import Course from '@/lib/server/models/Course';
import User from '@/lib/server/models/User';
import Purchase from '@/lib/server/models/Purchase';
import { connectDB } from '@/lib/server/db';
import { getAuthUser, ensureRole } from '@/lib/server/middleware/auth';
import { ok, fail, handleError } from '@/lib/server/utils/response';

export async function getCourses(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sort = searchParams.get('sort') || '-createdAt';

    const query = {};
    const instructor = searchParams.get('instructor');

    if (instructor) {
      query.instructor = instructor;

      // Instructor/admin can see both drafts and published courses for instructor dashboard.
      // Public/unauthenticated requests are restricted to published only.
      const authUser = await getAuthUser(request, { required: false }).catch(() => null);
      const canViewAllInstructorCourses =
        authUser && (authUser.role === 'admin' || authUser._id.toString() === instructor);

      if (!canViewAllInstructorCourses) {
        query.isPublished = true;
      }
    } else {
      query.isPublished = true;
    }

    const category = searchParams.get('category');
    if (category) query.category = category;

    const search = searchParams.get('search');
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
      .limit(limit);

    const pagination = {};
    if (page * limit < total) pagination.next = { page: page + 1, limit };
    if (page > 1) pagination.prev = { page: page - 1, limit };

    return ok(courses, 200, { count: courses.length, pagination });
  } catch (error) {
    return handleError(error);
  }
}

export async function getCourse(request, { id }) {
  try {
    await connectDB();
    const course = await Course.findById(id).populate('instructor', 'name email');
    if (!course) return fail('Course not found', 404);

    let isPurchased = false;
    let userProgress = null;

    try {
      const user = await getAuthUser(request, { required: false });
      if (user) {
        const fullUser = await User.findById(user._id);
        const purchasedCourse = fullUser.purchasedCourses.find((pc) => pc.courseId.toString() === id);
        if (purchasedCourse) {
          isPurchased = true;
          userProgress = {
            progress: purchasedCourse.progress,
            completed: purchasedCourse.completed,
            lastWatched: purchasedCourse.lastWatched,
            timeSpent: purchasedCourse.timeSpent,
          };
        }
      }
    } catch {
      // unauthenticated request is acceptable
    }

    return ok({ ...course.toObject(), isPurchased, userProgress });
  } catch (error) {
    return handleError(error);
  }
}

export async function createCourse(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    ensureRole(user, 'instructor', 'admin');

    const body = await request.json();
    const course = await Course.create({ ...body, instructor: user._id });
    return ok(course, 201);
  } catch (error) {
    const status = error.message?.includes('authorized') || error.message?.includes('Not authorized') ? 403 : 500;
    return fail(error.message || 'Server error', status);
  }
}

export async function updateCourse(request, { id }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    ensureRole(user, 'instructor', 'admin');

    const existing = await Course.findById(id);
    if (!existing) return fail('Course not found', 404);

    if (existing.instructor.toString() !== user._id.toString() && user.role !== 'admin') {
      return fail('Not authorized to update this course', 403);
    }

    const body = await request.json();
    const updated = await Course.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCourse(request, { id }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    ensureRole(user, 'instructor', 'admin');

    const course = await Course.findById(id);
    if (!course) return fail('Course not found', 404);

    if (course.instructor.toString() !== user._id.toString() && user.role !== 'admin') {
      return fail('Not authorized to delete this course', 403);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await course.deleteOne({ session });
      await User.updateMany(
        { 'purchasedCourses.courseId': id },
        { $pull: { purchasedCourses: { courseId: id } } },
        { session }
      );
      await Purchase.deleteMany({ courseId: id }, { session });
      await session.commitTransaction();
      session.endSession();
      return ok({}, 200, { message: 'Course and related data deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function purchaseCourse(request, { id }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);

    const course = await Course.findById(id);
    if (!course) return fail('Course not found', 404);

    if (course.isDeleted) return fail('This course is no longer available', 400);

    const fullUser = await User.findById(user._id);
    const alreadyPurchased = fullUser.purchasedCourses.some((pc) => pc.courseId.toString() === id);

    if (alreadyPurchased) {
      return ok({}, 200, { message: 'Course already purchased' });
    }

    fullUser.purchasedCourses.push({
      courseId: course._id,
      progress: 0,
      completed: false,
      enrolledAt: new Date(),
    });

    await fullUser.save();

    const purchase = await Purchase.create({
      userId: user._id,
      courseId: course._id,
      amount: course.price,
      paymentMethod: (await request.json().catch(() => ({}))).paymentMethod || 'stripe',
      paymentStatus: 'completed',
      purchasedAt: new Date(),
    });

    course.totalStudents += 1;
    await course.save();

    const updatedUser = await User.findById(user._id).select('-password');

    return ok(purchase, 200, { user: updatedUser });
  } catch (error) {
    return handleError(error);
  }
}
