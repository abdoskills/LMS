'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PurchasePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;

      if (!user?._id) {
        router.replace(`/login?next=${encodeURIComponent(`/purchase/${id}`)}`);
        return;
      }

      try {
        const { data } = await apiClient.get(`/courses/${id}`);
        setCourse(data.data);
        if (data?.data?.isPurchased) {
          router.replace(`/courses/${id}`);
          return;
        }
      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', message: 'Failed to load course details. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?._id, authLoading, router]);

  const handlePurchase = async () => {
    setFeedback(null);
    setProcessing(true);
    try {
      await apiClient.post(`/courses/${id}/purchase`, { paymentMethod: 'manual' });
      // Refresh user so dashboard reflects the newly purchased course
      try {
        const me = await apiClient.get('/auth/me');
        if (me?.data?.data) {
          updateUser(me.data.data);
          // Invalidate purchased-courses cache so dashboard refetches
          try {
            queryClient.invalidateQueries({ queryKey: ['purchased-courses'] });
          } catch (e) {
            // ignore if react-query not available
          }
        }
      } catch (e) {
        console.warn('Failed to refresh user after purchase', e);
      }

      // Redirect to the course page after purchase
      router.push(`/courses/${id}`);
    } catch (err) {
      console.error('Purchase failed', err);
      const message = (err as any)?.response?.data?.message || 'Checkout failed. Please try again.';
      setFeedback({ type: 'error', message });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">Loading checkout...</div>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">Course not found.</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">Purchase: {course.title}</h1>
        <p className="text-blue-600 mb-6">Proceed to purchase this course. Payment integration will be added later.</p>

        <div className="bg-white p-6 rounded shadow border border-gray-100">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600">Order summary</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-gray-800">Course price</span>
              <span className="text-xl font-bold text-gray-900">${course.price}</span>
            </div>
          </div>

          {feedback && (
            <div className="mb-4 rounded-md px-4 py-3 text-sm bg-red-50 text-red-800 border border-red-200">
              {feedback.message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/courses/${id}`)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={handlePurchase}
              disabled={processing}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-yellow-400 hover:text-gray-900 transition-colors disabled:opacity-60"
            >
              {processing ? 'Processing...' : `Complete Enrollment`}
            </button>
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
