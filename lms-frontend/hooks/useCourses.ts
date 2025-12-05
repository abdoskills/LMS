import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Course } from '../types';

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      progress,
      completed,
    }: {
      courseId: string;
      progress: number;
      completed: boolean;
    }) => {
      const { data } = await api.put(`/progress/${courseId}`, {
        progress,
        completed,
      });
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch course data
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['purchased-courses'] });
    },
  });
}

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await api.get('/courses');
      return data.data;
    },
  });
}

export function usePurchasedCourses() {
  return useQuery({
    queryKey: ['purchased-courses'],
    queryFn: async () => {
      const { data } = await api.get('/progress');
      return data.data;
    },
  });
}
