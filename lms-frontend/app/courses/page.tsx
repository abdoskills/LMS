import { headers } from 'next/headers';
import CourseCard from '@/components/CourseCard';
import { Course } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type CoursesPageProps = {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
};

const categories = [
  'All',
  'Development',
  'Business',
  'Design',
  'Marketing',
  'IT & Software',
  'Personal Development',
];

const CoursesPage = async ({ searchParams }: CoursesPageProps) => {
  const params = await searchParams;
  const searchTerm = params.search || '';
  const selectedCategory = params.category || '';

  let filteredCourses: Course[] = [];

  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    const proto = h.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${proto}://${host}` : '';

    if (baseUrl) {
      const query = new URLSearchParams({ page: '1', limit: '120' });
      if (searchTerm) query.set('search', searchTerm);
      if (selectedCategory) query.set('category', selectedCategory);

      const response = await fetch(`${baseUrl}/api/courses?${query.toString()}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const payload = await response.json();
        filteredCourses = (payload?.data || []) as Course[];
      }
    }
  } catch (error) {
    console.error('Failed to load courses list:', error);
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
          <p className="mt-2 text-gray-600">Discover and enroll in courses to enhance your skills</p>
        </div>

        {/* Filters */}
        <form className="mb-8 bg-white rounded-lg shadow p-6" method="GET">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Courses
              </label>
              <input
                type="text"
                name="search"
                defaultValue={searchTerm}
                placeholder="Search by title or description..."
                className="w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                defaultValue={selectedCategory}
                className="w-full px-3 py-2 border text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category === 'All' ? '' : category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="md:col-span-2 w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply filters
            </button>
          </div>
        </form>

        {/* Course Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: Course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory
                ? 'Try adjusting your search or filter criteria.'
                : 'No courses are currently available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
