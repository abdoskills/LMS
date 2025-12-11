"use client";
import Link from 'next/link';
import { Course } from '../types';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const { updateUser, user } = useAuth();
  const router = useRouter();

  const isEnrolled =
    Boolean(course.isPurchased) ||
    Boolean(
      user?.purchasedCourses?.some(
        (pc: any) => (pc.courseId && String(pc.courseId) === String(course._id)) || pc.courseId === course._id
      )
    );

  const handleEnroll = async () => {
    try {
      // Avoid duplicate purchase requests when already enrolled
      if (isEnrolled) {
        router.push(`/courses/${course._id}`);
        return;
      }
      // Double-check server-side purchase status to avoid 400 when client state is stale
      try {
        const res = await apiClient.get(`/courses/${course._id}`);
        const serverCourse = res?.data?.data;
        if (serverCourse?.isPurchased) {
          // refresh user and navigate
          try {
            const me = await apiClient.get('/auth/me');
            if (me?.data?.data) updateUser(me.data.data);
          } catch (e) {
            console.warn('Failed to refresh user after server says purchased', e);
          }
          router.push(`/courses/${course._id}`);
          return;
        }
      } catch (verifyErr: any) {
        // If verification fails due to auth, redirect to login; otherwise continue and attempt purchase
        if (verifyErr?.response?.status === 401) {
          router.push('/login');
          return;
        }
        console.warn('Could not verify purchase status, proceeding to purchase', verifyErr?.response?.data || verifyErr);
      }
      // For free courses, call purchase endpoint with free paymentMethod
      await apiClient.post(`/courses/${course._id}/purchase`, {
        paymentMethod: 'free',
      });

      // Refresh user data
      const me = await apiClient.get('/auth/me');
      if (me?.data?.data) updateUser(me.data.data);

      // Navigate directly to the course page for free enrolls
      router.push(`/courses/${course._id}`);
    } catch (err: any) {
      // Log full response for debugging
      console.error('Enroll failed', err, err?.response?.data);
      // Axios error handling
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message;

      // If already purchased, refresh user and navigate to dashboard
      if (status === 400 && typeof message === 'string' && message.toLowerCase().includes('already purchased')) {
        try {
          const me = await apiClient.get('/auth/me');
          if (me?.data?.data) updateUser(me.data.data);
        } catch (e) {
          console.warn('Failed to refresh user after already-purchased', e);
        }
        router.push('/dashboard');
        return;
      }

      if (status === 401) {
        // Not authenticated
        router.push('/login');
        return;
      }

      // Generic error: show message to user
      alert(message || 'Enroll failed. Please try again.');
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          {course.category}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {course.description}
        </p>

        <div className="flex items-center mb-3">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="ml-1 text-sm text-gray-600">
              {course.rating} ({course.totalStudents} students)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            ${course.price}
          </div>
          {isEnrolled ? (
            <Link
              href={`/courses/${course._id}`}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded">Enrolled</span>
              Open
            </Link>
          ) : course.price === 0 ? (
            <button
              onClick={handleEnroll}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Join Free
            </button>
          ) : (
            <Link
              href={`/purchase/${course._id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enroll
            </Link>
          )}
        </div>

        <div className="mt-3 text-sm text-gray-500">
          By {
            typeof course.instructor === 'string'
              ? course.instructor
              : course.instructor?.name ?? 'Unknown Instructor'
          }
        </div>
      </div>
    </div>
  );
}
