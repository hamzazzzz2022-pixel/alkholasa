'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';
import StudentStats from '@/components/StudentStats';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  // حالات الملخص الأسبوعي الحقيقية
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(0);
  const [weeklyCompletedLessons, setWeeklyCompletedLessons] = useState(0);

  // حالات مؤقت التركيز (Pomodoro)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('work'); // 'work' or 'break'

  useEffect(() => {
    let timer;
    if (isTimerRunning && pomodoroTime > 0) {
      timer = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      if (timerMode === 'work') {
        alert('انتهت جلسة المذاكرة! خذ استراحة قصيرة 5 دقائق ☕');
        setPomodoroTime(5 * 60);
        setTimerMode('break');
      } else {
        alert('انتهت الاستراحة! عودة للمذاكرة 🚀');
        setPomodoroTime(25 * 60);
        setTimerMode('work');
      }
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, pomodoroTime, timerMode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setPomodoroTime(timerMode === 'work' ? 25 * 60 : 5 * 60);
  };

  useEffect(() => {
    const fetchUserDataAndCourses = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        
        const currentUser = session.user;
        setUser(currentUser);

        // جلب الملف الشخصي
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        }

        // جلب الكورسات
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .order('id', { ascending: true });

        if (!coursesError && coursesData) {
          setCourses(coursesData);
        }

        // جلب إحصائيات الملخص الأسبوعي الحقيقية
        const todayDate = new Date();
        const startOfWeek = new Date();
        startOfWeek.setDate(todayDate.getDate() - 7);
        const startOfWeekISO = startOfWeek.toISOString();

        const { data: progressData, error: progressError } = await supabase
          .from('student_progress')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('is_completed', true)
          .gte('completed_at', startOfWeekISO);

        if (!progressError && progressData) {
          setWeeklyCompletedLessons(progressData.length);
          // افترضنا كل درس بيأخد تقريباً 30 دقيقة (0.5 ساعة) كمثال لحساب الساعات
          const totalHours = (progressData.length * 0.5).toFixed(1);
          setWeeklyStudyHours(totalHours);
        }

        // حساب الـ Streak (سلسلة الحماس)
        const today = new Date().toISOString().split('T')[0];
        let { data: streakData } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (!streakData) {
          await supabase.from('user_streaks').insert([
            { user_id: currentUser.id, current_streak: 1, last_activity_date: today }
          ]);
          setStreak(1);
        } else {
          const lastDate = streakData.last_activity_date;
          const diffTime = new Date(today) - new Date(lastDate);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            setStreak(streakData.current_streak);
          } else if (diffDays === 1) {
            const newStreak = streakData.current_streak + 1;
            await supabase
              .from('user_streaks')
              .update({ current_streak: newStreak, last_activity_date: today, updated_at: new Date() })
              .eq('user_id', currentUser.id);
            setStreak(newStreak);
          } else {
            await supabase
              .from('user_streaks')
              .update({ current_streak: 1, last_activity_date: today, updated_at: new Date() })
              .eq('user_id', currentUser.id);
            setStreak(1);
          }
        }
      } catch (err) {
        console.error('خطأ:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndCourses();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center transition-colors duration-500">
        <p className="text-sm font-medium animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex flex-col items-center transition-colors duration-500 ease-in-out">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 ease-in-out">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/40 bg-slate-800 flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 hover:scale-105">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="صورة البروفايل" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-slate-400">👤</span>
              )}
            </div>
            <div>
              <span className="text-[10px] bg-blue-500/15 text-blue-500 font-semibold px-2 py-0.5 rounded-md">منصة الخلاصة التعليمية</span>
              <h1 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                أهلاً بك، <span className="text-blue-600 dark:text-blue-400">{profile?.full_name || user?.email}</span> 👋
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">تابع تقدمك الدراسي واستمر في إنجاز دوراتك اليومية</p>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap justify-center gap-2.5">
            <div className="bg-slate-100 dark:bg-slate-800/85 border border-orange-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 hover:border-orange-500/60 transition-colors duration-300">
              <span className="text-lg animate-bounce">🔥</span>
              <div>
                <div className="text-[9px] text-slate-400 font-medium leading-none">سلسلة الحماس</div>
                <div className="text-xs font-extrabold text-orange-500 mt-0.5">
                  {streak} {streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}
                </div>
              </div>
            </div>

            <ThemeToggle /> 

            {user?.email === "hamzazzzz2022@gmail.com" && (
              <Link href="/admin" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 whitespace-nowrap">
                لوحة الإدارة 🛠️
              </Link>
            )}

            <Link href="/profile" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-300 whitespace-nowrap">
              الملف الشخصي 👤
            </Link>

            <button onClick={handleLogout} className="bg-red-600/90 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer whitespace-nowrap">
              تسجيل خروج
            </button>
          </div>
        </div>

        {/* Quick Details Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 cursor-default">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl text-lg transition-transform duration-300 hover:scale-110">📚</div>
            <div>
              <p className="text-[11px] text-slate-500">إجمالي الدورات</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{courses.length} دورات متاحة</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 cursor-default">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-lg transition-transform duration-300 hover:scale-110">✨</div>
            <div>
              <p className="text-[11px] text-slate-500">حالة الحساب</p>
              <p className="text-sm font-bold text-emerald-500">نشط ومفعل كلياً</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 cursor-default">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl text-lg transition-transform duration-300 hover:scale-110">🎯</div>
            <div>
              <p className="text-[11px] text-slate-500">الهدف اليومي</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">مستمر بلا توقف</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 cursor-default">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl text-lg transition-transform duration-300 hover:scale-110">🚀</div>
            <div>
              <p className="text-[11px] text-slate-500">مستوى النشاط</p>
              <p className="text-sm font-bold text-amber-500">ممتاز ومحفز</p>
            </div>
          </div>
        </div>

        {/* مؤقت التركيز + الملخص الأسبوعي (بالبيانات الحقيقية) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">مؤقت التركيز ⏱️</h3>
                <p className="text-[11px] text-slate-500">
                  {timerMode === 'work' ? 'وقت المذاكرة والتركيز العميق' : 'وقت الراحة والاسترخاء'}
                </p>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${timerMode === 'work' ? 'bg-blue-500/15 text-blue-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                {timerMode === 'work' ? 'جلسة عمل' : 'استراحة'}
              </span>
            </div>

            <div className="text-center my-4">
              <span className="text-4xl font-extrabold tracking-wider text-slate-900 dark:text-white font-mono">
                {formatTime(pomodoroTime)}
              </span>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={toggleTimer}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isTimerRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {isTimerRunning ? 'إيقاف مؤقت ⏸️' : 'ابدأ التركيز ▶️'}
              </button>
              <button 
                onClick={resetTimer}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                إعادة ضبط 🔄
              </button>
            </div>
          </div>

          {/* الملخص الأسبوعي بالبيانات الحقيقية */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">ملخص الإنجاز الأسبوعي 📈</h3>
              <span className="text-[10px] bg-purple-500/15 text-purple-500 px-2.5 py-1 rounded-full font-semibold">آخر 7 أيام</span>
            </div>

            <div className="space-y-3 my-2">
              <div className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                <span className="text-slate-500">ساعات المذاكرة المقدرة</span>
                <span className="font-bold text-slate-800 dark:text-white">{weeklyStudyHours} ساعة</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                <span className="text-slate-500">الدروس المكتملة</span>
                <span className="font-bold text-emerald-500">{weeklyCompletedLessons} دروس</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-2">
              هذه البيانات محسوبة بناءً على نشاطك الفعلي هذا الأسبوع ✨
            </p>
          </div>

        </div>

        {user && <StudentStats userId={user.id} />}

        {/* Courses Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 transition-colors duration-500">الدورات التعليمية المتاحة 📚</h2>
            <span className="text-xs text-slate-500">اختر دورتك وابدأ التعلم الآن</span>
          </div>

          {courses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-sm transition-colors duration-500">
              لا توجد كورسات متاحة حالياً. انتظر المشرف ليضيف كورسات جديدة!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div 
                  key={course.id}
                  className="relative p-[3px] rounded-3xl hover:scale-[1.03] hover:-translate-y-1.5 transition-all duration-300 shadow-xl overflow-hidden group"
                >
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-90"
                    style={{
                      background: 'linear-gradient(60deg, #ff0055, #ffcc00, #00ff66, #00ffff, #0066ff, #cc00ff, #ff0055)',
                      backgroundSize: '400% 400%',
                      animation: 'rgb-move 4s ease infinite',
                      zIndex: 0
                    }}
                  />

                  <div className="relative bg-[#0f1428] rounded-[22px] p-6 flex flex-col justify-between min-h-[220px] text-slate-100 h-full z-10 group-hover:bg-[#131b36] transition-colors duration-300">
                    <div className="space-y-2">
                      <span className="text-[10px] bg-cyan-500/15 text-cyan-400 px-2.5 py-1 rounded-full font-semibold inline-block">
                        {course.category}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">{course.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2">{course.description}</p>
                    </div>
                    
                    <Link 
                      href={`/course?id=${course.id}`} 
                      className="block text-center w-full py-2.5 mt-4 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300 shadow-md hover:shadow-cyan-500/30"
                    >
                      دخول الكورس ➔
                    </Link>
                  </div>

                  <style jsx global>{`
                    @keyframes rgb-move {
                      0% { background-position: 0% 50%; }
                      50% { background-position: 100% 50%; }
                      100% { background-position: 0% 50%; }
                    }
                  `}</style>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
