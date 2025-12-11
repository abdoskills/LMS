"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useCourse } from "@/hooks/useCourses";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export default function CourseLearnPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading } = useCourse(id as string);
  const course = data?.data;

  const [timeSpent, setTimeSpent] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rating, setRating] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const updateTimeSpentMutation = useMutation({
    mutationFn: async (timeSpent: number) => {
      const response = await apiClient.put('/progress/time', {
        courseId: id,
        timeSpent,
      });
      return response.data;
    },
  });

  const queryClient = useQueryClient();

  // Mutation to update progress percent (0-100) and completed flag
  const updateProgressMutation = useMutation({
    mutationFn: async ({ progress, completed, rating }: { progress: number; completed: boolean; rating?: number }) => {
      const response = await apiClient.put('/progress', {
        courseId: id,
        progress,
        completed,
        rating,
      });
      return response.data;
    },
    onSuccess: () => {
      // invalidate purchased-courses so dashboard refreshes
      queryClient.invalidateQueries({ queryKey: ['purchased-courses'] });
    },
  });

  useEffect(() => {
    // Start timer when component mounts
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimeSpent(elapsed);
      }
    }, 1000);

    // Progress updater: compute percent and send every 10 seconds
    const progressInterval = setInterval(() => {
      if (!course) return;
      // totalDuration is stored on course.lessons reduce; assume same unit as lesson.duration
      const total = course.totalDuration || 1;
      const percent = Math.min(100, Math.round(( (startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0) / total) * 100));
      const completed = percent >= 100;
      // Only send if meaningful change
      if (!Number.isNaN(percent)) {
        updateProgressMutation.mutate({ progress: percent, completed, rating });
      }
    }, 10000);

    // Cleanup function to stop timer and send time spent when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(progressInterval);
      if (startTimeRef.current) {
        const finalTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (finalTimeSpent > 0) {
          updateTimeSpentMutation.mutate(finalTimeSpent);
        }
      }
    };
  }, [id, updateTimeSpentMutation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">Loading...</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white/5 border border-gray-700 rounded-xl p-8 shadow-lg">
          <button
            onClick={() => {
              // Prefer history.back when available; if no history, navigate to the course page directly
              if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
                router.back();
              } else {
                router.push(`/courses/${id}`);
              }
            }}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Course
          </button>
          <h1 className="text-2xl font-bold mb-2">{course?.title || 'Course'}</h1>
          <p className="text-sm text-gray-400 mb-4">{course?.subtitle || course?.description || 'Course description'}</p>
          <div className="text-sm text-gray-300 mb-4">Lessons: {course?.lessons?.length ?? 0}</div>
          {course?.lessons && course.lessons.length > 0 && (
            <div className="mb-4">
              <div className="text-lg font-medium">{course.lessons[currentLesson].title}</div>
              <p className="text-sm text-gray-400">{course.lessons[currentLesson].description}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-300">Time spent on this page: {formatTime(timeSpent)}</div>
            <div>
              <button
                onClick={() => {
                  // If not last lesson, go to next
                  if (!course?.lessons) return;
                  if (currentLesson < course.lessons.length - 1) {
                    setCurrentLesson((s) => s + 1);
                  } else {
                    // last lesson -> show complete modal
                    setShowCompleteModal(true);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentLesson < (course?.lessons?.length ?? 0) - 1 ? 'Next Lesson' : 'Finish Course'}
              </button>
            </div>
          </div>

          {/* Completion / Rating Modal */}
          {showCompleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-2">Rate this course</h2>
                <p className="text-sm text-gray-600 mb-4">Tell us what you think and mark the course as completed.</p>
                <div className="flex items-center gap-2 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      className={`text-2xl ${s <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      aria-label={`Rate ${s}`}
                    >
                      ★
                    </button>
                  ))}

                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // mark completed with 100% progress and include rating
                      updateProgressMutation.mutate(
                        { progress: 100, completed: true, rating },
                        {
                          onSuccess: () => {
                            setShowCompleteModal(false);
                            // navigate to dashboard to reflect completion
                            router.push('/dashboard');
                          },
                        }
                      );
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Mark Course Completed
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
