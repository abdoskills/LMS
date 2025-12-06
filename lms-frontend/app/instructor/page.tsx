'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { Course } from '@/types';

export default function InstructorPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    price: 0,
    category: 'Development',
    thumbnail: '',
    whatYouWillLearn: [''],
    lessons: [{ title: '', description: '', videoUrl: '', duration: 0, order: 1, isPreview: false }],
    isPublished: false,
  });

  // Fetch instructor's courses
  const { data: coursesResponse, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const response = await apiClient.get(
        '/courses?instructor=' + user?._id,
        localStorage.getItem('token') || ''
      );
      return response;
    },
    enabled: !!user,
  });

  const courses = coursesResponse?.data?.data || [];

  // Create course mutation
  const createCourse = useMutation({
    mutationFn: async (courseData: Omit<Course, '_id' | 'instructor' | 'rating' | 'totalStudents' | 'totalDuration' | 'isPurchased' | 'userProgress' | 'createdAt' | 'updatedAt'>) => {
      return apiClient.post<{ success: boolean; data: Course }>(
        '/courses',
        courseData,
        localStorage.getItem('token') || ''
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      setNewCourse({
        title: '',
        description: '',
        price: 0,
        category: 'Development',
        thumbnail: '',
        whatYouWillLearn: [''],
        lessons: [{ title: '', description: '', videoUrl: '', duration: 0, order: 1, isPreview: false }],
        isPublished: false,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCourse.mutate(newCourse);
  };

  const addWhatYouWillLearn = () => {
    setNewCourse({ ...newCourse, whatYouWillLearn: [...newCourse.whatYouWillLearn, ''] });
  };

  const updateWhatYouWillLearn = (index: number, value: string) => {
    const updated = [...newCourse.whatYouWillLearn];
    updated[index] = value;
    setNewCourse({ ...newCourse, whatYouWillLearn: updated });
  };

  const removeWhatYouWillLearn = (index: number) => {
    const updated = newCourse.whatYouWillLearn.filter((_, i) => i !== index);
    setNewCourse({ ...newCourse, whatYouWillLearn: updated });
  };

  const addLesson = () => {
    const newOrder = newCourse.lessons.length + 1;
    setNewCourse({
      ...newCourse,
      lessons: [...newCourse.lessons, { title: '', description: '', videoUrl: '', duration: 0, order: newOrder, isPreview: false }]
    });
  };

  const updateLesson = (index: number, field: keyof typeof newCourse.lessons[0], value: string | number | boolean) => {
    const updated = [...newCourse.lessons];
    updated[index] = { ...updated[index], [field]: value };
    setNewCourse({ ...newCourse, lessons: updated });
  };

  const removeLesson = (index: number) => {
    const updated = newCourse.lessons.filter((_, i) => i !== index);
    // Reorder the remaining lessons
    updated.forEach((lesson, i) => lesson.order = i + 1);
    setNewCourse({ ...newCourse, lessons: updated });
  };

  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your courses and students</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats */}
            <div className="lg:col-span-2">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Total Courses</h3>
                      <p className="text-2xl font-bold text-gray-900">{courses?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Total Students</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {courses?.reduce((acc, course) => acc + (course.totalStudents || 0), 0) || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        $
                        {courses?.reduce((acc, course) => acc + (course.price * (course.totalStudents || 0)), 0) || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course List */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Your Courses</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {isLoading ? (
                    <div className="p-6 text-center">Loading...</div>
                  ) : courses?.length > 0 ? (
                    courses.map((course) => (
                      <div key={course._id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="h-16 w-24 object-cover rounded"
                            />
                            <div className="ml-4">
                              <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                              <p className="text-sm text-gray-600">{course.description.substring(0, 100)}...</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <span className="text-sm text-gray-500">{course.category}</span>
                                <span className="text-sm text-gray-500">${course.price}</span>
                                <span className="text-sm text-gray-500">{course.totalStudents} students</span>
                                <span className={`px-2 py-1 text-xs rounded ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {course.isPublished ? 'Published' : 'Draft'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              href={`/instructor/courses/${course._id}/edit`}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/courses/${course._id}`}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No courses yet. Create your first course!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Create Course Form */}
            <div className="lg:col-span-1">
              <div className="bg-white text-gray-700 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Course</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course Title
                    </label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={newCourse.thumbnail}
                      onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>

                  {/* What You Will Learn Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What You Will Learn
                    </label>
                    {newCourse.whatYouWillLearn.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateWhatYouWillLearn(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter learning objective..."
                        />
                        {newCourse.whatYouWillLearn.length > 1 && (
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
                      {newCourse.lessons.map((lesson, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-900">Lesson {lesson.order}</h4>
                            {newCourse.lessons.length > 1 && (
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Lesson title..."
                              required
                            />

                            <textarea
                              value={lesson.description}
                              onChange={(e) => updateLesson(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                                  className="w-full mt-1 text-sm"
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      checked={newCourse.isPublished}
                      onChange={(e) => setNewCourse({ ...newCourse, isPublished: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                      Publish course immediately
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={createCourse.isPending}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {createCourse.isPending ? 'Creating...' : 'Create Course'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}