'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/hooks/useCourses';
import { Lesson } from '@/types';

export default function CoursePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = params;

  const { data, isLoading } = useCourse(id as string);

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const course = data?.data;

  useEffect(() => {
    if (course?.lessons?.length > 0 && !currentLesson) {
      // Set first preview lesson as default
      const previewLesson = course.lessons.find((lesson: Lesson) => lesson.isPreview) || course.lessons[0];
      setCurrentLesson(previewLesson);
    }
  }, [course?.lessons]); // Removed currentLesson from dependencies to avoid cascading renders

  const handleLessonSelect = (lesson: Lesson) => {
    // Only allow selecting preview lessons
    if (lesson.isPreview) {
      setCurrentLesson(lesson);
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  };

  const handleNextLesson = () => {
    if (!course?.lessons || !currentLesson) return;

    const currentIndex = course.lessons.findIndex((l: Lesson) => l._id === currentLesson._id);
    // Find next preview lesson
    for (let i = currentIndex + 1; i < course.lessons.length; i++) {
      if (course.lessons[i].isPreview) {
        setCurrentLesson(course.lessons[i]);
        return;
      }
    }
  };

  const handlePreviousLesson = () => {
    if (!course?.lessons || !currentLesson) return;

    const currentIndex = course.lessons.findIndex((l: Lesson) => l._id === currentLesson._id);
    // Find previous preview lesson
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (course.lessons[i].isPreview) {
        setCurrentLesson(course.lessons[i]);
        return;
      }
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
            <button
              onClick={() => router.push('/courses')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to courses
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Check if user can preview (instructor or has preview access)
  const isInstructor = user?._id === (typeof course.instructor === 'string' ? course.instructor : course.instructor._id);
  const hasPreviewAccess = isInstructor || course.lessons.some((lesson: Lesson) => lesson.isPreview);

  if (!hasPreviewAccess) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview not available</h2>
            <p className="text-gray-600 mb-4">This course doesn&apos;t have preview content available.</p>
            <button
              onClick={() => router.push(`/courses/${id}`)}
              className="text-blue-600 hover:text-blue-800"
            >
              Go to course page
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const previewLessons = course.lessons.filter((lesson: Lesson) => lesson.isPreview);
  const hasNextPreview = previewLessons.findIndex((l: Lesson) => l._id === currentLesson?._id) < previewLessons.length - 1;
  const hasPrevPreview = previewLessons.findIndex((l: Lesson) => l._id === currentLesson?._id) > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900">
        <div className="flex h-screen">
          {/* Video Player */}
          <div className="flex-1 flex flex-col">
            {/* Video Container */}
            <div className="flex-1 bg-black relative">
              {currentLesson ? (
                <div className="h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    controls
                    className="max-w-full max-h-full"
                  >
                    <source src={currentLesson.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-white">
                  Select a preview lesson to start watching
                </div>
              )}

              {/* Preview Overlay */}
              <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                <span className="text-sm font-medium">Course Preview</span>
              </div>
            </div>

            {/* Lesson Info and Navigation */}
            <div className="bg-gray-800 text-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{currentLesson?.title}</h2>
                  <p className="text-gray-300">{currentLesson?.description}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-black">
                      Preview Available
                    </span>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handlePreviousLesson}
                    disabled={!hasPrevPreview}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextLesson}
                    disabled={!hasNextPreview}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next Preview
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons Sidebar */}
          <div className="w-80 bg-gray-800 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-4">Course Preview</h3>
              <p className="text-gray-300 text-sm mb-4">
                Preview available lessons from this course
              </p>

              <div className="space-y-2">
                {course.lessons.map((lesson: Lesson, index: number) => (
                  <button
                    key={lesson._id || index}
                    onClick={() => handleLessonSelect(lesson)}
                    disabled={!lesson.isPreview}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      !lesson.isPreview
                        ? 'bg-gray-900/50 text-gray-500 cursor-not-allowed opacity-50'
                        : currentLesson?._id === lesson._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          !lesson.isPreview
                            ? 'bg-gray-600'
                            : currentLesson?._id === lesson._id
                            ? 'bg-blue-500'
                            : 'bg-gray-600'
                        }`}>
                          {lesson.isPreview ? (
                            <span className="text-sm">{index + 1}</span>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{lesson.title}</div>
                          <div className="text-xs opacity-75">
                            {Math.floor(lesson.duration / 60)}:
                            {(lesson.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                      {lesson.isPreview && (
                        <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Enroll CTA */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <h4 className="text-white font-medium mb-2">Like what you see?</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    Enroll now to access all {course.lessons.length} lessons
                  </p>
                  <button
                    onClick={() => router.push(`/courses/${id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Enroll in Course - ${course.price}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
