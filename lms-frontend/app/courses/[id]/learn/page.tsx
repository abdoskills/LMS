"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useCourse } from "@/hooks/useCourses";
import { useParams } from "next/navigation";

export default function CourseLearnPage() {
  const { id } = useParams();
  const { data, isLoading } = useCourse(id as string);
  const course = data?.data;

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
          <h1 className="text-2xl font-bold mb-2">{course?.title || 'Course'}</h1>
          <p className="text-sm text-gray-400 mb-4">{course?.subtitle || course?.description || 'Course description'}</p>
          <div className="text-sm text-gray-300">Lessons: {course?.lessons?.length ?? 0}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
