'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 text-xs">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500">الملف الشخصي 👤</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">إعدادات الحساب وبيانات المستخدم</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <strong>البريد الإلكتروني:</strong> {user?.email}
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-md"
        >
          العودة لوحة التحكم ➔
        </button>

      </div>
    </div>
  );
}
