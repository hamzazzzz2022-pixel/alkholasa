'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

export default function StudentStats({ userId }) {
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedLessons: 0,
    progressPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;

      try {
        // 1. جلب عدد الكورسات
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id');

        // 2. جلب عدد الدروس الكلي
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id');

        // 3. جلب الدروس المكتملة للمستخدم
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('id')
          .eq('user_id', userId)
          .eq('is_completed', true);

        const totalCourses = coursesData ? coursesData.length : 0;
        const totalLessons = lessonsData ? lessonsData.length : 0;
        const completedLessons = progressData ? progressData.length : 0;

        const percentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0;

        setStats({
          totalCourses,
          completedLessons,
          progressPercentage: percentage,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl h-24 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. الكورسات المتاحة */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs text-slate-400 font-medium">الكورسات المتاحة</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{stats.totalCourses}</p>
        </div>
        <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center text-lg">
          📚
        </div>
      </div>

      {/* 2. الدروس المكتملة */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs text-slate-400 font-medium">الدروس المكتملة</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{stats.completedLessons}</p>
        </div>
        <div className="w-10 h-10 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center text-lg">
          ✅
        </div>
      </div>

      {/* 3. نسبة الإنجاز الكلية */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs text-slate-400 font-medium">نسبة الإنجاز الكلية</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.progressPercentage}%</p>
        </div>
        <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center text-lg">
          📊
        </div>
      </div>
    </div>
  );
}