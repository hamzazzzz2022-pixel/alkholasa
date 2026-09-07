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

        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .order('id', { ascending: true });

        if (!coursesError && coursesData) {
          setCourses(coursesData);
        }

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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm font-medium animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-lg font-bold text-blue-600 dark:text-blue-500">منصة الخلاصة🎓</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مرحباً بك، {user?.email}</p>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            <div className="bg-slate-100 dark:bg-slate-800/85 border border-orange-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-xl animate-bounce">🔥</span>
              <div>
                <div className="text-[9px] text-slate-400 font-medium leading-none">سلسلة الحماس</div>
                <div className="text-xs font-extrabold text-orange-500 mt-0.5">
                  {streak} {streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}
                </div>
              </div>
            </div>

            <ThemeToggle /> 

            {user?.email === "hamzazzzz2022@gmail.com" && (
              <Link href="/admin" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition">
                لوحة الإدارة 🛠️
              </Link>
            )}

            <Link href="/profile" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition">
              الملف الشخصي 👤
            </Link>

            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer">
              تسجيل الخروج
            </button>
          </div>
        </div>

        {user && <StudentStats userId={user.id} />}

        {/* Courses Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">الدورات التعليمية المتاحة 📚</h2>
          {courses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-sm">
              لا توجد كورسات متاحة حالياً. انتظر المشرف ليضيف كورسات جديدة!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div 
                  key={course.id}
                  className="relative p-[3px] rounded-3xl hover:scale-[1.02] transition-all duration-300 shadow-xl overflow-hidden"
                >
                  {/* عنصر خلفية متحركة للـ RGB */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-90"
                    style={{
                      background: 'linear-gradient(60deg, #ff0055, #ffcc00, #00ff66, #00ffff, #0066ff, #cc00ff, #ff0055)',
                      backgroundSize: '400% 400%',
                      animation: 'rgb-move 4s ease infinite',
                      zIndex: 0
                    }}
                  />

                  {/* محتوى الكارت */}
                  <div className="relative bg-[#0f1428] rounded-[22px] p-6 flex flex-col justify-between min-h-[220px] text-slate-100 h-full z-10">
                    <div className="space-y-2">
                      <span className="text-[10px] bg-cyan-500/15 text-cyan-400 px-2.5 py-1 rounded-full font-semibold inline-block">
                        {course.category}
                      </span>
                      <h3 className="text-lg font-bold text-white">{course.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2">{course.description}</p>
                    </div>
                    
                    <Link 
                      href={`/course?id=${course.id}`} 
                      className="block text-center w-full py-2.5 mt-4 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-90 text-slate-950 font-bold rounded-xl text-xs transition-all duration-300"
                    >
                      دخول الكورس ➔
                    </Link>
                  </div>

                  {/* تعريف الـ Animation مباشرة */}
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
