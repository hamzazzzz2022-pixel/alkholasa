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
    setCompletedLessons(prev => {
      if (prev.includes(lessonId)) {
        return prev.filter(id => id !== lessonId);
      } else {
        return [...prev, lessonId];
      }
    });
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

  const isCurrentCompleted = activeLesson ? completedLessons.includes(activeLesson.id) : false;
  const progressPercentage = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-10" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-blue-400 hover:underline mb-2 inline-block text-sm">
              ← العودة للرئيسية
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{course.title}</h1>
            <p className="text-gray-300 mt-1 text-sm">{course.description}</p>
          </div>
          <div className="w-full md:w-48 bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            <span className="text-xs text-gray-300 block text-center mt-1">النسبة: {progressPercentage}% ({completedLessons.length}/{lessons.length})</span>
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800 shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-200">قائمة دروس الكورس</h3>
          <div className="flex flex-wrap gap-2">
            {lessons.length > 0 ? (
              lessons.map((lesson) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isActive = activeLesson?.id === lesson.id;
                
                return (
                  <button 
                    key={lesson.id} 
                    onClick={() => setActiveLesson(lesson)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition border flex items-center gap-2 ${
                      isActive 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                        : 'bg-[#0f172a] hover:bg-[#273548] border-gray-700 text-gray-300'
                    }`}
                  >
                    <span>{lesson.title}</span>
                    {isCompleted && <span className="text-green-400 text-xs">✓</span>}
                  </button>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">لا توجد دروس مضافة.</p>
            )}
          </div>
        </div>

        {activeLesson ? (
          <div className="bg-[#1e293b] p-6 md:p-8 rounded-2xl shadow-xl border border-gray-800 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-700 pb-4">
              <h2 className="text-2xl font-bold text-blue-400">{activeLesson.title}</h2>
              
              <button 
                onClick={() => toggleComplete(activeLesson.id)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
                  isCurrentCompleted 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                {isCurrentCompleted ? '✓ اكتملت المشاهدة' : 'تحديد كـ اكتملت المشاهدة'}
              </button>
            </div>
            
            {activeLesson.video_url && (
              <div className="aspect-video w-full">
                <iframe 
                  src={activeLesson.video_url} 
                  className="w-full h-full rounded-xl border border-gray-700"
                  allowFullScreen
                  title={activeLesson.title}
                ></iframe>
              </div>
            )}
            
            <div className="text-gray-300 leading-relaxed bg-[#0f172a] p-4 rounded-xl border border-gray-800">
              <h4 className="font-semibold text-white mb-2">محتوى الدرس:</h4>
              <p>{activeLesson.content || 'لا يوجد وصف نصي إضافي لهذا الدرس.'}</p>
            </div>
          </div>
        ) : (
          <div className="bg-[#1e293b] p-10 rounded-2xl text-center text-gray-400 border border-gray-800">
            اختر درساً من القائمة بالأعلى لعرض المحتوى.
          </div>
        )}

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
