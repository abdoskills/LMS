import User from '@/lib/server/models/User';
import { connectDB } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/middleware/auth';
import { ok, fail, handleError } from '@/lib/server/utils/response';

export async function updateProgress(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    const { courseId, progress, completed, lastWatched, rating } = await request.json();

    if (progress < 0 || progress > 100) return fail('Progress must be between 0 and 100', 400);

    const dbUser = await User.findById(user._id);
    const courseIndex = dbUser.purchasedCourses.findIndex((pc) => pc.courseId.toString() === courseId);
    if (courseIndex === -1) return fail('Course not found in user purchases', 404);

    dbUser.purchasedCourses[courseIndex].progress = progress;
    dbUser.purchasedCourses[courseIndex].completed = completed || false;
    dbUser.purchasedCourses[courseIndex].lastWatched = lastWatched || new Date();

    if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
      dbUser.purchasedCourses[courseIndex].rating = rating;
    }

    if (completed) dbUser.purchasedCourses[courseIndex].completedAt = new Date();

    await dbUser.save();

    return ok({
      progress,
      completed: dbUser.purchasedCourses[courseIndex].completed,
      lastWatched: dbUser.purchasedCourses[courseIndex].lastWatched,
    });
  } catch (error) {
    const status = error.message?.includes('Not authorized') ? 401 : 500;
    return fail(error.message || 'Server error', status);
  }
}

export async function updateTimeSpent(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    const { courseId, timeSpent } = await request.json();

    if (timeSpent < 0) return fail('Time spent must be non-negative', 400);

    const dbUser = await User.findById(user._id);
    const courseIndex = dbUser.purchasedCourses.findIndex((pc) => pc.courseId.toString() === courseId);
    if (courseIndex === -1) return fail('Course not found in user purchases', 404);

    dbUser.purchasedCourses[courseIndex].timeSpent += timeSpent;
    await dbUser.save();

    return ok({ timeSpent: dbUser.purchasedCourses[courseIndex].timeSpent });
  } catch (error) {
    return handleError(error);
  }
}

export async function getProgress(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    const dbUser = await User.findById(user._id).populate({
      path: 'purchasedCourses.courseId',
      select: 'title thumbnail category totalDuration description instructor price rating totalStudents isPublished createdAt updatedAt',
    });

    const progressData = dbUser.purchasedCourses
      .filter((pc) => pc.courseId)
      .map((pc) => ({
        ...pc.courseId.toObject(),
        _id: pc.courseId._id,
        courseId: pc.courseId._id,
        progress: pc.progress,
        completed: pc.completed,
        lastWatched: pc.lastWatched,
        enrolledAt: pc.enrolledAt,
        timeSpent: pc.timeSpent,
        isPurchased: true,
        userProgress: {
          progress: pc.progress,
          completed: pc.completed,
          lastWatched: pc.lastWatched,
        },
      }));

    return ok(progressData, 200, { count: progressData.length });
  } catch (error) {
    const status = error.message?.includes('Not authorized') ? 401 : 500;
    return fail(error.message || 'Server error', status);
  }
}
