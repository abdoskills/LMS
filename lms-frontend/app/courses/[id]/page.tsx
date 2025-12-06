'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse, useEnrollCourse } from '@/hooks/useCourses';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = params;

  const { data, isLoading } = useCourse(id as string);
  const enrollCourse = useEnrollCourse();

  const course = data?.data;

  const handleEnroll = async () => {
    try {
      await enrollCourse.mutateAsync(id as string);
      router.push(`/courses/${id}/learn`);
    } catch (error) {
      console.error('Failed to enroll:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
          <Link href="/courses" className="text-blue-600 hover:text-blue-800">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const isEnrolled = course.isPurchased;
  const isInstructor = user?._id === (typeof course.instructor === 'string' ? course.instructor : course.instructor._id);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-4">
                  <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {course.category}
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                  {course.title}
                </h1>
                <p className="text-xl mb-8 text-blue-100">
                  {course.description}
                </p>

                <div className="flex items-center mb-6">
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-2xl">★</span>
                    <span className="ml-2 text-lg">
                      {course.rating} ({course.totalStudents} students)
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-lg mb-8">
                  <span>Created by </span>
                  <span className="font-semibold ml-1">
                    {typeof course.instructor === 'string' ? course.instructor : course.instructor.name}
                  </span>
                </div>

                {!isInstructor && (
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold">${course.price}</span>
                    {isEnrolled ? (
                      <Link
                        href={`/courses/${course._id}/learn`}
                        className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Continue Learning
                      </Link>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        disabled={enrollCourse.isPending}
                        className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        {enrollCourse.isPending ? 'Enrolling...' : 'Enroll Now'}
                      </button>
                    )}
                  </div>
                )}

                {isInstructor && (
                  <div className="flex items-center space-x-4">
                    <Link
                      href={`/instructor/courses/${course._id}/edit`}
                      className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Edit Course
                    </Link>
                    <Link
                      href={`/courses/${course._id}/learn`}
                      className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Preview Course
                    </Link>
                  </div>
                )}
              </div>

              <div className="lg:pl-8">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                  <div className="aspect-video bg-gray-200">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* What You'll Learn */}
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.lessons.slice(0, 6).map((lesson: any, index: number) => (
                    <div key={lesson._id || index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="ml-3 text-gray-700">{lesson.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Content */}
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
                <div className="space-y-4">
                  {course.lessons.map((lesson: any, index: number) => (
                    <div key={lesson._id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                          <p className="text-sm text-gray-600">{lesson.description}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-500">
                              {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')} minutes
                            </span>
                            {lesson.isPreview && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Preview
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isEnrolled && (
                        <button
                          onClick={() => router.push(`/courses/${course._id}/learn`)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Watch
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Course Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Lessons</span>
                    <span className="font-medium text-gray-900">{course.lessons.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium text-gray-900">
                      {Math.floor(course.totalDuration / 3600)}h {Math.floor((course.totalDuration % 3600) / 60)}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students</span>
                    <span className="font-medium text-gray-900">{course.totalStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium text-gray-900">{course.rating}/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-medium text-gray-900">${course.price}</span>
                  </div>
                </div>

                {!isInstructor && !isEnrolled && (
                  <button
                    onClick={handleEnroll}
                    disabled={enrollCourse.isPending}
                    className="w-full mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {enrollCourse.isPending ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}

                {isEnrolled && (
                  <Link
                    href={`/courses/${course._id}/learn`}
                    className="w-full mt-6 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-center block"
                  >
                    Continue Learning
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
