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
  const [completedLessons, setCompletedLessons] = useState([]);
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

  const toggleComplete = (lessonId) => {
    if (completedLessons.includes(lessonId)) {
      setCompletedLessons(completedLessons.filter(id => id !== lessonId));
    } else {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

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

  const progressPercentage = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-10" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* رأس الصفحة وشريط التقدم */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-[#1e293b] p-6 rounded-2xl border border-gray-800 shadow-lg">
          <div>
            <Link href="/dashboard" className="text-blue-400 hover:underline mb-2 inline-block text-sm">
              ← العودة للرئيسية
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{course.title}</h1>
          </div>
          <div className="w-full md:w-64 bg-gray-700 rounded-full h-4 overflow-hidden">
            <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            <span className="text-xs text-gray-300 block text-center mt-1">نسبة الإنجاز: {progressPercentage}%</span>
          </div>
        </div>

        {/* تخطيط الصفحة: محتوى الدرس على اليسار/الأعلى وقائمة الدروس على اليمين */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* محتوى الدرس الرئيسي */}
          <div className="lg:col-span-2 space-y-6">
            {activeLesson ? (
              <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-gray-800">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">{activeLesson.title}</h2>
                
                {activeLesson.video_url && (
                  <div className="mb-6 aspect-video">
                    <iframe 
                      src={activeLesson.video_url} 
                      className="w-full h-full rounded-xl border border-gray-700"
                      allowFullScreen
                      title={activeLesson.title}
                    ></iframe>
                  </div>
                )}
                
                <p className="text-gray-300 leading-relaxed mb-6">{activeLesson.content || 'محتوى الدرس غير متوفر حالياً.'}</p>
                
                <button 
                  onClick={() => toggleComplete(activeLesson.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ${completedLessons.includes(activeLesson.id) ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                >
                  {completedLessons.includes(activeLesson.id) ? '✓ تم إكمال الدرس' : 'تحديد كـ مكتمل'}
                </button>
              </div>
            ) : (
              <div className="bg-[#1e293b] p-10 rounded-2xl text-center text-gray-400 border border-gray-800">
                اختر درساً من القائمة لبدء العرض.
              </div>
            )}
          </div>

          {/* قائمة الدروس الجانبية المنظمة */}
          <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-gray-800 h-fit">
            <h3 className="text-xl font-semibold mb-4 text-white border-b border-gray-700 pb-3">قائمة الدروس</h3>
            <div className="space-y-3">
              {lessons.length > 0 ? (
                lessons.map((lesson) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isActive = activeLesson?.id === lesson.id;
                  
                  return (
                    <div 
                      key={lesson.id} 
                      onClick={() => setActiveLesson(lesson)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${isActive ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0f172a] hover:bg-[#273548] border-gray-800 text-gray-200'}`}
                    >
                      <span className="font-medium text-sm truncate max-w-[180px]">{lesson.title}</span>
                      <span className="text-xs px-2 py-1 rounded bg-black/30">
                        {isCompleted ? '✓ مكتمل' : 'مشاهدة'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-400 py-4 text-sm">
                  لا توجد دروس مضافة.
                </div>
              )}
            </div>
          </div>

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
