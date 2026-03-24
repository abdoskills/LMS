import User from '@/lib/server/models/User';
import { connectDB } from '@/lib/server/db';
import { verifyToken } from '@/lib/server/utils/jwt';

export async function getAuthUser(request, { required = true } = {}) {
  await connectDB();

  const cookieToken = request.cookies.get('token')?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    if (required) throw new Error('Not authorized to access this route');
    return null;
  }

  const decoded = verifyToken(token);
  const user = await User.findById(decoded.id).select('-password');

  if (!user && required) throw new Error('User not found');
  return user;
}

export function ensureRole(user, ...roles) {
  if (!roles.includes(user?.role)) {
    throw new Error(`User role ${user?.role} is not authorized to access this route`);
  }
}
