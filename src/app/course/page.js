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
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourseData() {
      if (!courseId) return;
      
      try {
        setLoading(true);
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId);

        if (!lessonsError && lessonsData.length > 0) {
          setLessons(lessonsData);
          setActiveLesson(lessonsData[0]);
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
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-xl animate-pulse">جاري تحميل تفاصيل الكورس...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6">
        <div className="text-red-400 text-xl mb-4">عذراً، هذا الكورس غير موجود أو تم حذفه.</div>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition">
          العودة لوحة التحكم
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard" className="text-blue-400 hover:underline mb-6 inline-block">
          ← العودة للرئيسية
        </Link>
        
        <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-gray-800 mb-8">
          <h1 className="text-3xl font-bold mb-3 text-white">{course.title}</h1>
          <p className="text-gray-300 text-lg leading-relaxed">{course.description}</p>
        </div>

        {activeLesson && (
          <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">{activeLesson.title}</h2>
            {activeLesson.video_url && (
              <div className="mb-4">
                <iframe 
                  src={activeLesson.video_url} 
                  className="w-full h-96 rounded-xl border border-gray-700"
                  allowFullScreen
                  title={activeLesson.title}
                ></iframe>
              </div>
            )}
            <p className="text-gray-300 leading-relaxed">{activeLesson.content || 'اختر الدرس لبدء المشاهدة والقراءة.'}</p>
          </div>
        )}
        
        <h2 className="text-2xl font-semibold mb-4 text-white">قائمة الدروس</h2>
        <div className="space-y-3">
          {lessons.length > 0 ? (
            lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                onClick={() => setActiveLesson(lesson)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${activeLesson?.id === lesson.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1e293b] hover:bg-[#273548] border-gray-800 text-gray-200'}`}
              >
                <span className="font-medium">{lesson.title}</span>
                <span className="text-sm opacity-80">عرض الدرس ←</span>
              </div>
            ))
          ) : (
            <div className="p-6 bg-[#1e293b] rounded-xl text-center text-gray-400 border border-gray-800">
              لا توجد دروس مضافة لهذا الكورس حتى الآن.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-xl animate-pulse">جاري التحميل...</div>
      </div>
    }>
      <CourseContent />
    </Suspense>
  );
}
