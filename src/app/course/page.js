'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';

export default function CoursePage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const router = useRouter();
  // ... باقي الكود عادي جداً

  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة الكويز
  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isPassed, setIsPassed] = useState(false);
  const [quizError, setQuizError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      if (!courseId) return;

      // 1. جلب بيانات الكورس
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      setCourse(courseData);

      // 2. جلب الدروس
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('id', { ascending: true });
      
      if (lessonsData) {
        setLessons(lessonsData);
        if (lessonsData.length > 0) {
          setActiveLesson(lessonsData[0]);
        }
      }

      // 3. جلب التقدم المكتمل
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', session.user.id)
        .eq('is_completed', true);

      if (progressData) {
        setCompletedLessons(progressData.map((p) => Number(p.lesson_id)));
      }

      setLoading(false);
    };

    fetchData();
  }, [courseId, router]);

  // عند تغيير الدرس النشط، جلب الاختبار الخاص به
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!activeLesson) return;

      setSelectedOption(null);
      setIsPassed(false);
      setQuizError('');

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', activeLesson.id)
        .single();

      if (!error && data) {
        setQuiz(data);
      } else {
        setQuiz(null); // لا يوجد كويز لهذا الدرس
      }
    };

    fetchQuiz();
  }, [activeLesson]);

  // دالة التحقق من إجابة الكويز
  const handleAnswerSubmit = (index) => {
    setSelectedOption(index);
    if (quiz && index === quiz.correct_option_index) {
      setIsPassed(true);
      setQuizError('');
    } else {
      setIsPassed(false);
      setQuizError('إجابة خاطئة! حاول مرة أخرى لتتمكن من إنهاء الدرس.');
    }
  };

  // دالة تعليم الدرس كمكتمل
  const toggleLessonComplete = async (lessonId) => {
    if (!user) return;

    const currentLessonId = Number(lessonId);
    const isCompleted = completedLessons.includes(currentLessonId);

    if (isCompleted) {
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('lesson_id', currentLessonId);

      if (!error) {
        setCompletedLessons(completedLessons.filter((id) => id !== currentLessonId));
      } else {
        alert('حدث خطأ أثناء الإلغاء: ' + error.message);
      }
    } else {
      // اشترط اجتياز الاختبار إذا كان يوجد اختبار للدرس
      if (quiz && !isPassed) {
        alert('يجب الإجابة على سؤال الدرس بشكل صحيح أولاً!');
        return;
      }

      const { error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: user.id,
            lesson_id: currentLessonId,
            is_completed: true,
          },
          { onConflict: 'user_id,lesson_id' }
        );

      if (!error) {
        setCompletedLessons([...completedLessons, currentLessonId]);
      } else {
        alert('حدث خطأ أثناء حفظ التقدم: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center dir-rtl">
        <p className="text-sm font-medium">جاري تحميل المحتوى...</p>
      </div>
    );
  }

  const isCurrentCompleted = completedLessons.includes(Number(activeLesson?.id));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex flex-col items-center transition-colors duration-200">
      <div className="max-w-5xl w-full space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500">{course?.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{course?.description}</p>
          </div>
          <Link href="/dashboard" className="text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition">
            العودة للوحة التحكم ➔
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeLesson ? (
              <>
                {/* Video Container */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={activeLesson.video_url}
                      title={activeLesson.title}
                      className="w-full h-full border-0"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeLesson.title}</h2>
                    
                    <button
                      onClick={() => toggleLessonComplete(activeLesson.id)}
                      disabled={quiz && !isPassed && !isCurrentCompleted}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer ${
                        isCurrentCompleted
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : quiz && !isPassed
                          ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isCurrentCompleted ? 'تم إكمال الدرس ✅' : 'تعليم كمكتمل ⚪'}
                    </button>
                  </div>
                </div>

                {/* Quiz Section */}
                {quiz && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-lg">📝</span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">اختبار سريع للدرس</h3>
                    </div>

                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{quiz.question}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quiz.options.map((option, idx) => {
                        let btnStyle = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-500';
                        
                        if (selectedOption === idx) {
                          if (idx === quiz.correct_option_index) {
                            btnStyle = 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400 font-bold';
                          } else {
                            btnStyle = 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-400 font-bold';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswerSubmit(idx)}
                            className={`p-3 text-right rounded-xl border text-xs transition-all ${btnStyle}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {isPassed && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-500/10 p-2.5 rounded-xl text-center">
                        🎉 إجابة صحيحة! يمكنك الآن الضغط على "تعليم كمكتمل" لحفظ إنجازك.
                      </p>
                    )}

                    {quizError && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-500/10 p-2.5 rounded-xl text-center">
                        {quizError}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-sm">
                لا يوجد دروس مضافة لهذا الكورس بعد.
              </div>
            )}
          </div>

          {/* Lessons List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 h-fit shadow-md">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              دروس الكورس ({lessons.length})
            </h3>
            <div className="space-y-2">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full text-right p-3 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    activeLesson?.id === lesson.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{index + 1}. {lesson.title}</span>
                  {completedLessons.includes(Number(lesson.id)) && <span>✅</span>}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}