'use client';

import { useState } from 'react';
import { supabase } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage({ initialAvatarUrl }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const handleDeleteAvatar = async () => {
    setLoading(true);
    setMessage('');

    try {
      // 1. الحصول على بيانات المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      // 2. تحديث جدول المستخدمين وجعل حقل الصورة فارغاً (null)
      const { error: updateError } = await supabase
        .from('profiles') // أو جدول المستخدمين الخاص بك
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(null);
      setMessage('تم حذف الصورة الشخصية بنجاح!');
      router.refresh();
    } catch (error) {
      setMessage('حدث خطأ أثناء حذف الصورة: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs p-3 rounded-xl text-center font-medium">
          {message}
        </div>
      )}

      {avatarUrl && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">الصورة الشخصية الحالية</span>
          <button
            onClick={handleDeleteAvatar}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
          >
            {loading ? 'جاري الحذف...' : 'حذف الصورة الشخصية 🗑️'}
          </button>
        </div>
      )}
    </div>
  );
}
