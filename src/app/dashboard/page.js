'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import Link from 'next/link';

export default function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // الكود الخاص بفحص وتحديث الـ Streak تلقائياً عند فتح اللوحة
  useEffect(() => {
    async function checkAndUpdateStreak() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;
        const today = new Date().toISOString().split('T')[0]; // تاريخ اليوم YYYY-MM-DD

        // جلب بيانات الـ streak الحالية للمستخدم
        let { data: streakData } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!streakData) {
          // لو أول مرة يفتح المنصة
          await supabase.from('user_streaks').insert([
            { user_id: userId, current_streak: 1, last_activity_date: today }
          ]);
          setStreak(1);
          return;
        }

        const lastDate = streakData.last_activity_date;
        
        // حساب الفرق بالأيام بين اليوم وآخر زيارة
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
            .eq('user_id', userId);
          setStreak(newStreak);
        } else {
          // انقطعت السلسلة (فات يوم أو أكثر)
          await supabase
            .from('user_streaks')
            .update({ current_streak: 1, last_activity_date: today, updated_at: new Date() })
            .eq('user_id', userId);
          setStreak(1);
        }
      } catch (err) {
        console.error('خطأ في تحديث الـ Streak:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAndUpdateStreak();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-10" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* هيدر الصفحة مع ويدجت الـ Streak المشتعل 🔥 */}
        <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-gray-800 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold">مرحباً بك في لوحة التحكم 🚀</h1>
            <p className="text-gray-400 text-sm mt-1">تابع كورساتك واستمر في التعلم يومياً</p>
          </div>

          {/* ويدجت الـ Streak */}
          <div className="bg-[#0f172a] border border-orange-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-inner">
            <span className="text-2xl animate-bounce">🔥</span>
            <div>
              <div className="text-[10px] text-gray-400 font-medium">سلسلة الحماس</div>
              <div className="text-base font-extrabold text-orange-400">
                {loading ? '...' : `${streak} ${streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}`}
              </div>
            </div>
          </div>
        </div>

        {/* باقي الكورسات أو الأقسام الخاصة بك */}
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">كورساتك المتاحة</h3>
          {/* ضع هنا كود عرض الكورسات القديم الخاص بك */}
        </div>

      </div>
    </div>
  );
}
