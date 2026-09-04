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

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourseData() {
      if (!courseId) return;
      
      try {
        setLoading(true);
        // جلب تفاصيل الكورس بناء على الـ ID
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // جلب الدروس الخاصة بهذا الكورس
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId);

        if (!lessonsError) {
          setLessons(lessonsData || []);
        }
      } catch (err) {
        console.error('خطأ في جلب بيانات الكورس:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId]);

  if (loading) {
    return <div className="p-10 text-center text-white">جاري تحميل تفاصيل الكورس...</div>;
  }

  if (!course) {
    return <div className="p-10 text-center text-red-500">عذراً، هذا الكورس غير موجود أو تم حذفه.</div>;
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
      <p className="mb-6 text-gray-300">{course.description}</p>
      
      <h2 className="text-xl font-semibold mb-3">قائمة الدروس:</h2>
      <div className="space-y-2">
        {lessons.length > 0 ? (
          lessons.map((lesson) => (
            <div key={lesson.id} className="p-4 bg-gray-800 rounded-lg">
              {lesson.title}
            </div>
          ))
        ) : (
          <p className="text-gray-400">لا توجد دروس مضافة لهذا الكورس حتى الآن.</p>
        )}
      </div>
    </div>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white">جاري التحميل...</div>}>
      <CourseContent />
    </Suspense>
  );
}
