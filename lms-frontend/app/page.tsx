'use client';

import Link from 'next/link';
import CourseCard from '../components/CourseCard';
import Footer from '@/components/Footer';
import { useCourses } from '@/hooks/useCourses';
import { Course } from '@/types';

export default function HomePage() {
  const { data: coursesResponse, isLoading } = useCourses();
  const courses = coursesResponse?.filter((course: Course) => course.isPublished) || [];
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Learn Without Limits
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Start, switch, or advance your career with thousands of courses
              from top instructors and institutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courses"
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Courses
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                Join for Free
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Stats / Trust section (replaces the long 'Why Choose' features) */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <h3 className="text-3xl font-bold text-blue-600">5,000+</h3>
              <p className="text-gray-600">Active learners</p>
            </div>
            <div className="p-6">
              <h3 className="text-3xl font-bold text-blue-600">1,200+</h3>
              <p className="text-gray-600">Expert courses</p>
            </div>
            <div className="p-6">
              <h3 className="text-3xl font-bold text-blue-600">98%</h3>
              <p className="text-gray-600">Learner satisfaction</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-600 max-w-2xl mx-auto">Trusted by professionals worldwide — learn at your pace with practical projects and certificates.</p>
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Courses</h2>
              <p className="text-gray-600 mt-2">Handpicked courses to get you started</p>
            </div>
            <Link
              href="/courses"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View all courses →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 20 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : courses.length > 0 ? (
              courses.slice(0, 6).map((course: Course) => (
                <CourseCard key={course._id} course={course} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No courses available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of students who have transformed their careers with our courses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/courses"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div> */}
      {/* </div> */}
      </main>
      {/* Footer */}
      <Footer />
    </div>
  );
}