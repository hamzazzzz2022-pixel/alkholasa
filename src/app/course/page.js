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

  // حالات الملاحظات المتعددة
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // تحميل مكتبة الكونفيتي تلقائياً عبر CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // 🔊 دالة تشغيل مؤثر الصوت التحفيزي للإنجاز
  const playSuccessSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked by browser policy:", e));
    } catch (err) {
      console.log("Error playing sound:", err);
    }
  };

  const triggerCelebration = () => {
    if (window.confetti) {
      window.confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
    playSuccessSound();
  };

  useEffect(() => {
    async function fetchCourseData() {
      if (!courseId) return;
      
      try {
        setLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error(sessionError.message);

        if (session) {
          setUserId(session.user.id);
          
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', session.user.id);
            
          if (progressData) {
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
        console.error('خطأ عام:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    async function fetchLessonData() {
      if (!activeLesson) return;
      
      setQuiz(null);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setNewNoteText('');
      setNotes([]);

      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', activeLesson.id)
        .maybeSingle();

      if (quizData) setQuiz(quizData);

      if (userId) {
        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .eq('lesson_id', activeLesson.id)
          .order('created_at', { ascending: false });

        if (notesData) setNotes(notesData);
      }
    }

    fetchLessonData();
  }, [activeLesson, userId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    if (!userId) {
      alert('يجب تسجيل الدخول لإضافة ملاحظات!');
      router.push('/login');
      return;
    }

    setAddingNote(true);

    const { data, error } = await supabase
      .from('notes')
      .insert([
        { 
          user_id: userId, 
          lesson_id: activeLesson.id, 
          content: newNoteText.trim() 
        }
      ])
      .select();

    setAddingNote(false);

    if (!error && data && data.length > 0) {
      setNotes(prev => [data[0], ...prev]);
      setNewNoteText('');
    }
  };

  const handleDeleteNote = async (noteId) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (!error) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };

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
      
      triggerCelebration();
    }
  };

  const handleSubmitQuizAnswer = () => {
    setIsAnswerSubmitted(true);
    if (selectedOption === quiz.correct_option_index) {
      triggerCelebration();
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
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-10 transition-colors duration-200" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* رأس الكورس */}
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
                    {isCompleted && <span className="text-green-400 text-xs font-bold">✓</span>}
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
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                {isCurrentCompleted ? '✓ اكتملت المشاهدة (تم إنجازها)' : 'اضغط اكتملت المشاهدة 🎯'}
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

            {/* الملاحظات */}
            <div className="bg-[#0f172a] p-5 rounded-xl border border-gray-800 space-y-4">
              <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                <span>📝 ملاحظاتي الشخصية</span>
              </h4>

              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="اكتب ملاحظة جديدة أو فكرة استنتجتها من الدرس..."
                  rows="2"
                  className="w-full bg-[#1e293b] text-white p-3 rounded-xl border border-gray-700 focus:outline-none focus:border-amber-500 text-sm leading-relaxed"
                ></textarea>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingNote || !newNoteText.trim()}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow"
                  >
                    {addingNote ? 'جاري الإضافة...' : '+ إضافة ملاحظة'}
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2 border-t border-gray-800">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="bg-[#1e293b] p-3 rounded-xl border border-gray-800 flex justify-between items-start gap-3">
                      <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed flex-1">{note.content}</p>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 transition"
                        title="حذف الملاحظة"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-xs text-center py-2">لا توجد ملاحظات مضافة لهذا الدرس حتى الآن.</p>
                )}
              </div>
            </div>

            {/* الكويز */}
            {quiz && (
              <div className="bg-[#0f172a] p-6 rounded-xl border border-blue-900/50 space-y-4">
                <h4 className="text-base font-bold text-green-400">📝 اختبار قصير للدرس:</h4>
                <p className="text-sm font-medium text-white">{quiz.question}</p>

                <div className="space-y-2">
                  {quiz.options && quiz.options.map((option, idx) => {
                    let btnStyle = "bg-[#1e293b] hover:bg-slate-800 text-gray-200 border-gray-700";
                    if (isAnswerSubmitted) {
                      if (idx === quiz.correct_option_index) {
                        btnStyle = "bg-green-600/35 border-green-500 text-green-300 font-bold";
                      } else if (idx === selectedOption) {
                        btnStyle = "bg-red-600/35 border-red-500 text-red-300";
                      }
                    } else if (selectedOption === idx) {
                      btnStyle = "bg-blue-600/35 border-blue-500 text-blue-300 font-bold";
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
                    onClick={handleSubmitQuizAnswer}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition shadow"
                  >
                    تأكيد الإجابة
                  </button>
                ) : (
                  <div className="text-center p-3 rounded-xl text-sm font-bold">
                    {selectedOption === quiz.correct_option_index ? (
                      <p className="text-green-400">إجابة صحيحة أحسنت! 🎉 (تم إطلاق الاحتفال والصوت)</p>
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
