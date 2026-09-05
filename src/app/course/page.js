'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
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
  const [userId, setUserId] = useState(null);

  // حالات الكويز
  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // حالات قسم الملاحظات الشخصية
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState('');

  useEffect(() => {
    async function fetchCourseData() {
      if (!courseId) return;
      
      try {
        setLoading(true);
        
        // جلب المستخدم الحالي
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('خطأ في جلسة المستخدم:', sessionError.message);
        }

        if (session) {
          setUserId(session.user.id);
          
          // جلب الدروس المكتملة
          const { data: progressData, error: progError } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', session.user.id);
            
          if (!progError && progressData) {
            setCompletedLessons(progressData.map(p => p.lesson_id));
          }
        }

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
          .eq('course_id', courseId)
          .order('id', { ascending: true });

        if (!lessonsError && lessonsData.length > 0) {
          setLessons(lessonsData);
          setActiveLesson(lessonsData[0]);
        }
      } catch (err) {
        console.error('خطأ عام في جلب بيانات الكورس:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId]);

  // جلب الكويز والملاحظة الخاصة بالدرس النشط كلما تغير الدرس
  useEffect(() => {
    async function fetchLessonDetails() {
      if (!activeLesson) return;
      
      // تصفير الحالات عند الانتقال لدرس جديد
      setQuiz(null);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setNoteContent('');
      setNoteMessage('');

      // 1. جلب الكويز
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', activeLesson.id)
        .maybeSingle();

      if (quizData) {
        setQuiz(quizData);
      }

      // 2. جلب ملاحظة الطالب لهذا الدرس إن وجدت
      if (userId) {
        const { data: noteData } = await supabase
          .from('notes')
          .select('content')
          .eq('user_id', userId)
          .eq('lesson_id', activeLesson.id)
          .maybeSingle();

        if (noteData) {
          setNoteContent(noteData.content);
        }
      }
    }

    fetchLessonDetails();
  }, [activeLesson, userId]);

  // حفظ أو تحديث الملاحظة في قاعدة البيانات
  const handleSaveNote = async () => {
    if (!userId) {
      alert('يجب تسجيل الدخول لحفظ ملاحظاتك!');
      router.push('/login');
      return;
    }

    setSavingNote(true);
    setNoteMessage('');

    const { error } = await supabase
      .from('notes')
      .upsert([
        { 
          user_id: userId, 
          lesson_id: activeLesson.id, 
          content: noteContent,
          updated_at: new Date()
        }
      ], { onConflict: 'user_id, lesson_id' });

    setSavingNote(false);

    if (error) {
      console.error('خطأ في حفظ الملاحظة:', error.message);
      setNoteMessage('حدث خطأ أثناء حفظ الملاحظة ❌');
    } else {
      setNoteMessage('تم حفظ الملاحظة بنجاح! ✓');
      setTimeout(() => setNoteMessage(''), 3000);
    }
  };

  // تحديث حالة إتمام الدرس
  const toggleComplete = async (lessonId) => {
    if (!userId) {
      alert('يجب تسجيل الدخول لحفظ تقدمك!');
      router.push('/login');
      return;
    }

    const isAlreadyCompleted = completedLessons.includes(lessonId);

    if (isAlreadyCompleted) {
      setCompletedLessons(prev => prev.filter(id => id !== lessonId));
      await supabase.from('user_progress').delete().eq('user_id', userId).eq('lesson_id', lessonId);
    } else {
      setCompletedLessons(prev => [...prev, lessonId]);
      await supabase.from('user_progress').upsert([
        { user_id: userId, lesson_id: lessonId, is_completed: true }
      ], { onConflict: 'user_id, lesson_id' });
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
        <div className="text-red-400 text-xl mb-4">عذراً، هذا الكورس غير موجود.</div>
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
        
        {/* رأس الكورس وشريط التقدم */}
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

        {/* قائمة الدروس */}
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
                {isCurrentCompleted ? '✓ اكتملت المشاهدة' : 'اضغط اكتملت المشاهدة'}
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

            {/* قسم الملاحظات الشخصية الجديد */}
            <div className="bg-[#0f172a] p-5 rounded-xl border border-gray-800 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <span>📝 ملاحظاتي الشخصية لهذا الدرس</span>
                </h4>
                {noteMessage && <span className="text-xs text-green-400 font-medium">{noteMessage}</span>}
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="اكتب أفكارك، أكواد برمجية، أو نقاط مهمة استنتجتها من هذا الدرس لتراجعها لاحقاً..."
                rows="4"
                className="w-full bg-[#1e293b] text-white p-3 rounded-xl border border-gray-700 focus:outline-none focus:border-amber-500 text-sm leading-relaxed"
              ></textarea>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  {savingNote ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
                </button>
              </div>
            </div>

            {/* قسم الكويز والاختبار */}
            {quiz && (
              <div className="bg-[#0f172a] p-6 rounded-xl border border-blue-900/50 space-y-4">
                <h4 className="text-base font-bold text-green-400">📝 اختبار قصير للدرس:</h4>
                <p className="text-sm font-medium text-white">{quiz.question}</p>

                <div className="space-y-2">
                  {quiz.options && quiz.options.map((option, idx) => {
                    let btnStyle = "bg-[#1e293b] hover:bg-slate-800 text-gray-200 border-gray-700";
                    if (isAnswerSubmitted) {
                      if (idx === quiz.correct_option_index) {
                        btnStyle = "bg-green-600/30 border-green-500 text-green-300";
                      } else if (idx === selectedOption) {
                        btnStyle = "bg-red-600/30 border-red-500 text-red-300";
                      }
                    } else if (selectedOption === idx) {
                      btnStyle = "bg-blue-600/30 border-blue-500 text-blue-300";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full text-right p-3 rounded-xl border text-sm transition ${btnStyle}`}
                      >
                        <span className="font-bold ml-2">{idx + 1}.</span> {option}
                      </button>
                    );
                  })}
                </div>

                {!isAnswerSubmitted ? (
                  <button
                    disabled={selectedOption === null}
                    onClick={() => setIsAnswerSubmitted(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition"
                  >
                    تأكيد الإجابة
                  </button>
                ) : (
                  <div className="text-center p-3 rounded-xl text-sm font-bold">
                    {selectedOption === quiz.correct_option_index ? (
                      <p className="text-green-400">إجابة صحيحة أحسنت! 🎉</p>
                    ) : (
                      <p className="text-red-400">إجابة خاطئة، الإجابة الصحيحة هي الخيار رقم ({quiz.correct_option_index + 1}) ❌</p>
                    )}
                  </div>
                )}
              </div>
            )}
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
