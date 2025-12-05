export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  purchasedCourses: PurchasedCourse[];
  createdAt: string;
}

export interface PurchasedCourse {
  courseId: string | Course;
  enrolledAt: string;
  progress: number;
  lastWatched?: string;
  completed: boolean;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: User | string;
  price: number;
  category: string;
  thumbnail: string;
  rating: number;
  totalStudents: number;
  lessons: Lesson[];
  totalDuration: number;
  isPublished: boolean;
  isPurchased?: boolean;
  userProgress?: UserProgress;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id?: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration: number;
  order: number;
  isPreview: boolean;
}

export interface UserProgress {
  progress: number;
  completed: boolean;
  lastWatched?: string;
}

export interface Purchase {
  _id: string;
  userId: string;
  courseId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  purchasedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  pagination: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
}