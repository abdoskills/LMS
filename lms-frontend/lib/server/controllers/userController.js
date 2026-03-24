import User from '@/lib/server/models/User';
import { connectDB } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/middleware/auth';
import { ok, fail, handleError } from '@/lib/server/utils/response';

export async function getProfile(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);

    const user = await User.findById(authUser._id)
      .select('-password')
      .populate({ path: 'purchasedCourses.courseId', select: 'title thumbnail category description totalDuration' });

    if (!user) return fail('User not found', 404);

    const enrolledCourses = user.purchasedCourses.length;
    const completedCourses = user.purchasedCourses.filter((pc) => pc.completed).length;
    const totalLearningTime = user.purchasedCourses.reduce((total, pc) => {
      return total + (pc.progress * (pc.courseId?.totalDuration || 0)) / 100;
    }, 0);

    const courses = user.purchasedCourses.map((pc) => ({
      _id: pc.courseId?._id,
      title: pc.courseId?.title || 'Course not found',
      category: pc.courseId?.category || 'Unknown',
      progress: pc.progress,
      lastAccessed: pc.lastWatched || pc.enrolledAt,
      thumbnail: pc.courseId?.thumbnail,
    }));

    return ok({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks,
      role: user.role,
      enrolledCourses,
      completedCourses,
      totalLearningTime: Math.round(totalLearningTime),
      skills: user.skills || [],
      createdAt: user.createdAt,
      courses,
    });
  } catch (error) {
    const status = error.message?.includes('Not authorized') ? 401 : 500;
    return fail(error.message || 'Server error', status);
  }
}

export async function updateProfile(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    const body = await request.json();

    const fieldsToUpdate = {
      name: body.name,
      bio: body.bio,
      location: body.location,
      website: body.website,
      skills: body.skills,
      socialLinks: body.socialLinks,
    };

    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] === undefined) delete fieldsToUpdate[key];
    });

    const user = await User.findByIdAndUpdate(authUser._id, fieldsToUpdate, { new: true, runValidators: true }).select(
      '-password'
    );

    if (!user) return fail('User not found', 404);
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadAvatar(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    const { avatar } = await request.json();

    const user = await User.findByIdAndUpdate(authUser._id, { avatar }, { new: true }).select('-password');
    if (!user) return fail('User not found', 404);

    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function getCertificates(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    const user = await User.findById(authUser._id).populate({ path: 'purchasedCourses.courseId', select: 'title' });

    const certificates = user.purchasedCourses
      .filter((pc) => pc.completed)
      .map((pc, index) => ({
        _id: pc._id,
        courseId: pc.courseId?._id,
        courseTitle: pc.courseId?.title || 'Course not found',
        issueDate: pc.completedAt || pc.enrolledAt,
        certificateId: `CERT-${user._id.toString().slice(-6).toUpperCase()}-${(index + 1)
          .toString()
          .padStart(3, '0')}`,
        downloadUrl: '#',
      }));

    return ok(certificates);
  } catch (error) {
    return handleError(error);
  }
}

export async function getUserStats(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    const user = await User.findById(authUser._id).populate({ path: 'purchasedCourses.courseId', select: 'totalDuration' });

    const enrolledCourses = user.purchasedCourses.length;
    const completedCourses = user.purchasedCourses.filter((pc) => pc.completed).length;
    const totalLearningTime = user.purchasedCourses.reduce((total, pc) => {
      return total + (pc.progress * (pc.courseId?.totalDuration || 0)) / 100;
    }, 0);

    return ok({
      enrolledCourses,
      completedCourses,
      totalLearningTime: Math.round(totalLearningTime),
      averageRating: 4.8,
      completionRate: enrolledCourses > 0 ? Math.round((completedCourses / enrolledCourses) * 100) : 0,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function changePassword(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    const { currentPassword, newPassword } = await request.json();

    const user = await User.findById(authUser._id).select('+password');
    if (!user) return fail('User not found', 404);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return fail('Current password is incorrect', 400);

    user.password = newPassword;
    await user.save();

    return ok({}, 200, { message: 'Password changed successfully' });
  } catch (error) {
    return handleError(error);
  }
}

export async function changeEmail(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    const { newEmail, password } = await request.json();

    const user = await User.findById(authUser._id).select('+password');
    if (!user) return fail('User not found', 404);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return fail('Password is incorrect', 400);

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== authUser._id.toString()) {
      return fail('Email is already in use', 400);
    }

    user.email = newEmail;
    await user.save();

    return ok({}, 200, { message: 'Email changed successfully' });
  } catch (error) {
    return handleError(error);
  }
}
