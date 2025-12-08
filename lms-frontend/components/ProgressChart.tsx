import { Course } from '../types';

type ProgressChartProps = {
  courses: Array<{
    courseId: Course;
    progress: number;
  }>;
};

export default function ProgressChart({ courses }: ProgressChartProps) {
  if (!courses || courses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>
        <p className="text-gray-600">No courses to display progress for.</p>
      </div>
    );
  }

  const totalProgress = courses.reduce((acc, course) => acc + course.progress, 0) / courses.length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.slice(0, 4).map((course: any) => (
            <div key={course.courseId._id} className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {course.courseId.title}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
