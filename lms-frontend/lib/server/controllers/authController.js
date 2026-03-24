import User from '@/lib/server/models/User';
import { connectDB } from '@/lib/server/db';
import { signToken } from '@/lib/server/utils/jwt';
import { getAuthUser } from '@/lib/server/middleware/auth';
import { ok, fail, handleError } from '@/lib/server/utils/response';

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function appendAuthCookie(response, token) {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function register(request) {
  try {
    await connectDB();
    const body = await parseJsonBody(request);
    if (!body) return fail('Invalid JSON body', 400);

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = typeof body.role === 'string' ? body.role : 'student';

    if (!name || !email || !password) return fail('Please provide name, email, and password', 400);
    if (!['student', 'instructor', 'admin'].includes(role)) return fail('Invalid role', 400);

    const userExists = await User.findOne({ email });
    if (userExists) return fail('User already exists', 400);

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id);

    const response = ok(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      201,
      { token }
    );

    appendAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleError(error);
  }
}

export async function login(request) {
  try {
    await connectDB();
    const body = await parseJsonBody(request);
    if (!body) return fail('Invalid JSON body', 400);

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) return fail('Please provide email and password', 400);

    const user = await User.findOne({ email }).select('+password');
    if (!user) return fail('Invalid credentials', 401);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return fail('Invalid credentials', 401);

    const token = signToken(user._id);

    const response = ok(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      200,
      { token }
    );

    appendAuthCookie(response, token);
    return response;
  } catch (error) {
    return handleError(error);
  }
}

export async function logout() {
  const response = ok({}, 200, { message: 'Logged out successfully' });
  response.cookies.set('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/',
  });
  return response;
}

export async function getMe(request) {
  try {
    const user = await getAuthUser(request);

    const fullUser = await User.findById(user._id).populate({
      path: 'purchasedCourses.courseId',
      select: 'title thumbnail description',
    });

    return ok(fullUser);
  } catch (error) {
    return fail(error.message || 'Not authorized to access this route', 401);
  }
}
