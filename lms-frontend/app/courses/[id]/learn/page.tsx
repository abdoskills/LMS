"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useCourse } from "@/hooks/useCourses";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export default function CourseLearnPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data, isLoading } = useCourse(id as string);
  const course = data?.data;

  const [timeSpent, setTimeSpent] = useState(0);
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

  useEffect(() => {
    // Start timer when component mounts
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimeSpent(elapsed);
      }
    }, 1000);

    // Cleanup function to stop timer and send time spent when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Course
          </button>
          <h1 className="text-2xl font-bold mb-2">{course?.title || 'Course'}</h1>
          <p className="text-sm text-gray-400 mb-4">{course?.subtitle || course?.description || 'Course description'}</p>
          <div className="text-sm text-gray-300 mb-4">Lessons: {course?.lessons?.length ?? 0}</div>
          <div className="text-sm text-gray-300">Time spent on this page: {formatTime(timeSpent)}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
