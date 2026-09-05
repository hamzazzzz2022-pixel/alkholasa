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
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // حالة سلسلة الحماس (Streak)
  const [streak, setStreak] = useState(0);

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

        // 1. جلب الدورات التعليمية
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .order('id', { ascending: true });

        if (!coursesError && coursesData) {
          setCourses(coursesData);
        }

        // 2. فحص وتحديث الـ Streak تلقائياً عند فتح اللوحة
        const today = new Date().toISOString().split('T')[0]; // تاريخ اليوم YYYY-MM-DD
        let { data: streakData } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (!streakData) {
          // لو أول مرة يفتح المنصة
          await supabase.from('user_streaks').insert([
            { user_id: currentUser.id, current_streak: 1, last_activity_date: today }
          ]);
          setStreak(1);
        } else {
          const lastDate = streakData.last_activity_date;
          const diffTime = new Date(today) - new Date(lastDate);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            // فتحها اليوم مسبقاً
            setStreak(streakData.current_streak);
          } else if (diffDays === 1) {
            // استمرت السلسلة (دخل أمس واليوم)
            const newStreak = streakData.current_streak + 1;
            await supabase
              .from('user_streaks')
              .update({ current_streak: newStreak, last_activity_date: today, updated_at: new Date() })
              .eq('user_id', currentUser.id);
            setStreak(newStreak);
          } else {
            // انقطعت السلسلة (فات يوم أو أكثر)
            await supabase
              .from('user_streaks')
              .update({ current_streak: 1, last_activity_date: today, updated_at: new Date() })
              .eq('user_id', currentUser.id);
            setStreak(1);
          }
        }

      } catch (err) {
        console.error('خطأ في جلب بيانات لوحة التحكم:', err);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center dir-rtl">
        <p className="text-sm font-medium animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex flex-col items-center transition-colors duration-200">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg transition-colors duration-200">
          <div>
            <h1 className="text-lg font-bold text-blue-600 dark:text-blue-500">منصة الخلاصة🎓</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مرحباً بك، {user?.email}</p>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            {/* ويدجت الـ Streak المشتعل 🔥 */}
            <div className="bg-slate-100 dark:bg-slate-800/80 border border-orange-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
              <span className="text-xl animate-bounce">🔥</span>
              <div>
                <div className="text-[9px] text-slate-400 dark:text-slate-400 font-medium leading-none">سلسلة الحماس</div>
                <div className="text-xs font-extrabold text-orange-500 dark:text-orange-400 mt-0.5">
                  {streak} {streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}
                </div>
              </div>
            </div>

            <ThemeToggle /> 

            {/* زر لوحة الإدارة للمشرف فقط */}
            {user?.email === "hamzazzzz2022@gmail.com" && (
              <Link 
                href="/admin" 
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-blue-600/25"
              >
                لوحة الإدارة 🛠️
              </Link>
            )}

            <Link 
              href="/profile" 
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              الملف الشخصي 👤
            </Link>

            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* Student Stats Component */}
        {user && <StudentStats userId={user.id} />}

        {/* Courses Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">الدورات التعليمية المتاحة 📚</h2>
          {courses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-sm">
              لا توجد كورسات متاحة حالياً. انتظر المشرف ليضيف كورسات جديدة!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-md flex flex-col justify-between transition-colors duration-200"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-semibold">
                      {course.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{course.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{course.description}</p>
                  </div>
                  <Link 
                    href={`/course?id=${course.id}`} 
                    className="block text-center w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition"
                  >
                    دخول الكورس ➔
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
