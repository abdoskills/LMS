import { NextResponse } from 'next/server';

export function ok(data, status = 200, extra = {}) {
  return NextResponse.json({ success: true, data, ...extra }, { status });
}

export function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

export function handleError(error) {
  const message = error?.message || 'Server error';
  if (error?.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((e) => e.message);
    return fail('Validation failed', 400, { errors });
  }
  if (error?.code === 11000) {
    return fail('Duplicate field value entered', 400);
  }
  return fail(message, 500);
}
