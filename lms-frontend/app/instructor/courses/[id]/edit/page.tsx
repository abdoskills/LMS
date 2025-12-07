'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { Course } from '@/types';

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch course data
  const { data: courseResponse, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await apiClient.get(`/courses/${id}`);
      return response;
    },
    enabled: !!id,
  });

  const course = courseResponse?.data?.data;

  const [isInitialized, setIsInitialized] = useState(false);

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: 0,
    category: 'Development',
    thumbnail: '',
    promotionalVideo: '',
    whatYouWillLearn: [''],
    lessons: [{ title: '', description: '', videoUrl: '', duration: 0, order: 1, isPreview: false }],
    isPublished: false,
  });

  // Update courseData when course is loaded
  useEffect(() => {
    if (course && !isInitialized) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setCourseData({
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        category: course.category || 'Development',
        thumbnail: course.thumbnail || '',
        promotionalVideo: course.promotionalVideo || '',
        whatYouWillLearn: course.whatYouWillLearn?.length > 0 ? course.whatYouWillLearn : [''],
        lessons: course.lessons?.length > 0 ? course.lessons : [{ title: '', description: '', videoUrl: '', duration: 0, order: 1, isPreview: false }],
        isPublished: course.isPublished || false,
      });
      setIsInitialized(true);
    }
  }, [course, isInitialized]);

  // Update course mutation
  const updateCourse = useMutation({
    mutationFn: async (courseData: Omit<Course, '_id' | 'instructor' | 'rating' | 'totalStudents' | 'totalDuration' | 'isPurchased' | 'userProgress' | 'createdAt' | 'updatedAt'>) => {
      return apiClient.put<{ success: boolean; data: Course }>(
        `/courses/${id}`,
        courseData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      router.push('/instructor');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourse.mutate(courseData);
  };

  const addWhatYouWillLearn = () => {
    setCourseData({ ...courseData, whatYouWillLearn: [...courseData.whatYouWillLearn, ''] });
  };

  const updateWhatYouWillLearn = (index: number, value: string) => {
    const updated = [...courseData.whatYouWillLearn];
    updated[index] = value;
    setCourseData({ ...courseData, whatYouWillLearn: updated });
  };

  const removeWhatYouWillLearn = (index: number) => {
    const updated = courseData.whatYouWillLearn.filter((_: string, i: number) => i !== index);
    setCourseData({ ...courseData, whatYouWillLearn: updated });
  };

  const addLesson = () => {
    const newOrder = courseData.lessons.length + 1;
    setCourseData({
      ...courseData,
      lessons: [...courseData.lessons, { title: '', description: '', videoUrl: '', duration: 0, order: newOrder, isPreview: false }]
    });
  };

  const updateLesson = (index: number, field: keyof typeof courseData.lessons[0], value: string | number | boolean) => {
    const updated = [...courseData.lessons];
    updated[index] = { ...updated[index], [field]: value };
    setCourseData({ ...courseData, lessons: updated });
  };

  const removeLesson = (index: number) => {
    const updated = courseData.lessons.filter((_: typeof courseData.lessons[0], i: number) => i !== index);
    // Reorder the remaining lessons
    updated.forEach((lesson: typeof courseData.lessons[0], i: number) => lesson.order = i + 1);
    setCourseData({ ...courseData, lessons: updated });
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['instructor', 'admin']}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading course...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute allowedRoles={['instructor', 'admin']}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg text-red-600">Course not found</div>
        </div>
      </ProtectedRoute>
    );
  }

  // Check if user is the instructor or admin
  if (course.instructor._id !== user?._id && user?.role !== 'admin') {
    return (
      <ProtectedRoute allowedRoles={['instructor', 'admin']}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg text-red-600">You don&apos;t have permission to edit this course</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <div className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
                <p className="mt-2 text-gray-600">Update your course information and content</p>
              </div>
              <Link
                href="/instructor"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={courseData.title}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={courseData.price}
                    onChange={(e) => setCourseData({ ...courseData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={courseData.category}
                    onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="Development">Development</option>
                    <option value="Business">Business</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="IT & Software">IT & Software</option>
                    <option value="Personal Development">Personal Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={courseData.thumbnail}
                    onChange={(e) => setCourseData({ ...courseData, thumbnail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>
              </div>

              {/* What You Will Learn Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What You Will Learn
                </label>
                {courseData.whatYouWillLearn.map((item: string, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateWhatYouWillLearn(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Enter learning objective..."
                    />
                    {courseData.whatYouWillLearn.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWhatYouWillLearn(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addWhatYouWillLearn}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                >
                  + Add Learning Objective
                </button>
              </div>

              {/* Course Content - Lessons Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Content
                </label>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {courseData.lessons.map((lesson, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Lesson {lesson.order}</h4>
                        {courseData.lessons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLesson(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => updateLesson(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="Lesson title..."
                          required
                        />

                        <textarea
                          value={lesson.description}
                          onChange={(e) => updateLesson(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          rows={2}
                          placeholder="Lesson description..."
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Video URL or Upload
                            </label>
                            <input
                              type="url"
                              value={lesson.videoUrl}
                              onChange={(e) => updateLesson(index, 'videoUrl', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                              placeholder="https://..."
                            />
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                // Handle file upload here - for now just set a placeholder
                                if (e.target.files?.[0]) {
                                  updateLesson(index, 'videoUrl', `uploaded-${e.target.files[0].name}`);
                                }
                              }}
                              className="w-full mt-1 text-sm text-gray-900"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Duration (minutes)
                            </label>
                            <input
                              type="number"
                              value={lesson.duration}
                              onChange={(e) => updateLesson(index, 'duration', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                              min="0"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`preview-${index}`}
                            checked={lesson.isPreview}
                            onChange={(e) => updateLesson(index, 'isPreview', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`preview-${index}`} className="ml-2 block text-sm text-gray-900">
                            Preview lesson (free)
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addLesson}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  + Add Lesson
                </button>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={courseData.isPublished}
                  onChange={(e) => setCourseData({ ...courseData, isPublished: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                  Publish course
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={updateCourse.isPending}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {updateCourse.isPending ? 'Updating...' : 'Update Course'}
                </button>
                <Link
                  href="/instructor"
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
