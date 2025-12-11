'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export default function PurchasePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get(`/courses/${id}`);
        setCourse(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      // For now, we simulate a completed purchase. Payment integration later.
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
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!course) return <div className="p-8">Course not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Purchase: {course.title}</h1>
      <p className="text-gray-700 mb-6">Price: ${course.price}</p>

      <div className="bg-white p-6 rounded shadow">
        <p className="mb-4">Proceed to purchase this course. Payment integration will be added later.</p>
        <button
          onClick={handlePurchase}
          disabled={processing}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {processing ? 'Processing...' : `Pay $${course.price}`}
        </button>
      </div>
    </div>
  );
}
