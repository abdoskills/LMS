'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useCourse, useUpdateProgress } from '@/hooks/useCourses';
import { Lesson } from '@/types';

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const { data, isLoading } = useCourse(id as string);
  const updateProgress = useUpdateProgress();
  
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);

  const course = data?.data;

  useEffect(() => {
    if (course?.lessons?.length > 0 && !currentLesson) {
      setCurrentLesson(course.lessons[0]);
    }
  }, [course, currentLesson]);

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleVideoEnded = async () => {
    if (currentLesson) {
      // Mark lesson as completed
      setCompletedLessons(prev => new Set([...prev, currentLesson._id || '']));
      
      // Calculate progress
      const completedCount = completedLessons.size + 1;
      const totalLessons = course?.lessons.length || 1;
      const progress = Math.round((completedCount / totalLessons) * 100);
      const completed = progress === 100;
      
      // Update progress on backend
      try {
        await updateProgress.mutateAsync({
          courseId: id as string,
          progress,
          completed,
        });
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  };

  const handleNextLesson = () => {
    if (!course?.lessons || !currentLesson) return;
    
    const currentIndex = course.lessons.findIndex(l => l._id === currentLesson._id);
    if (currentIndex < course.lessons.length - 1) {
      setCurrentLesson(course.lessons[currentIndex + 1]);
    }
  };

  const handlePreviousLesson = () => {
    if (!course?.lessons || !currentLesson) return;
    
    const currentIndex = course.lessons.findIndex(l => l._id === currentLesson._id);
    if (currentIndex > 0) {
      setCurrentLesson(course.lessons[currentIndex - 1]);
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

  if (!course || !course.isPurchased) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not accessible</h2>
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900">
        <div className="flex h-screen">
          {/* Video Player */}
          <div className="flex-1 flex flex-col">
            {/* Video Container */}
            <div className="flex-1 bg-black">
              {currentLesson ? (
                <div className="h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    controls
                    className="max-w-full max-h-full"
                    onEnded={handleVideoEnded}
                  >
                    <source src={currentLesson.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-white">
                  Select a lesson to start learning
                </div>
              )}
            </div>

            {/* Lesson Info and Navigation */}
            <div className="bg-gray-800 text-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{currentLesson?.title}</h2>
                  <p className="text-gray-300">{currentLesson?.description}</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handlePreviousLesson}
                    disabled={course.lessons.findIndex(l => l._id === currentLesson?._id) === 0}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextLesson}
                    disabled={course.lessons.findIndex(l => l._id === currentLesson?._id) === course.lessons.length - 1}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next Lesson
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons Sidebar */}
          <div className="w-80 bg-gray-800 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-4">Course Content</h3>
              
              <div className="space-y-2">
                {course.lessons.map((lesson: Lesson, index: number) => (
                  <button
                    key={lesson._id || index}
                    onClick={() => handleLessonSelect(lesson)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentLesson?._id === lesson._id
                        ? 'bg-blue-600 text-white'
                        : completedLessons.has(lesson._id || '')
                        ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          completedLessons.has(lesson._id || '')
                            ? 'bg-green-500'
                            : currentLesson?._id === lesson._id
                            ? 'bg-blue-500'
                            : 'bg-gray-600'
                        }`}>
                          {completedLessons.has(lesson._id || '') ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-sm">{index + 1}</span>
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

              {/* Progress Bar */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Your Progress</span>
                  <span>{course.userProgress?.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.userProgress?.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}