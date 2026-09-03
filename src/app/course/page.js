'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';

function CourseContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // اترك باقي كود الدالة القديمة كما هو هنا بدون تغيير...
}

export default function CoursePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">جاري التحميل...</div>}>
      <CourseContent />
    </Suspense>
  );
}
