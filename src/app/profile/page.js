'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleDeleteAvatar = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('يجب تسجيل الدخول أولاً');
        setLoading(false);
        return;
      }

      // محاولة تحديث جدول الـ profiles بحذف الصورة
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) {
        setMessage('حدث خطأ أثناء حذف الصورة: ' + error.message);
      } else {
        setMessage('تم حذف الصورة الشخصية بنجاح! 🗑️');
      }
    } catch (err) {
      setMessage('حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500">الملف الشخصي 👤</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">إدارة إعدادات الحساب والصورة الشخصية</p>
        </div>

        {message && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs p-3 rounded-xl text-center font-medium">
            {message}
          </div>
        )}

        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">الصورة الشخصية</span>
          <button
            onClick={handleDeleteAvatar}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? 'جاري الحذف...' : 'حذف الصورة الشخصية 🗑️'}
          </button>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-3 rounded-xl transition"
        >
          العودة لوحة التحكم ➔
        </button>

      </div>
    </div>
  );
}
