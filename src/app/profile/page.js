'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');

  // جلب بيانات المستخدم الحالية عند فتح الصفحة
  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email);

        // جلب البيانات من جدول profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || '');
          setAvatarUrl(profile.avatar_url || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [router]);

  // تحديث الاسم ورفع أو تغيير الصورة
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMessage('');

    try {
      let newAvatarUrl = avatarUrl;
      const fileInput = document.getElementById('avatar-file');
      const file = fileInput?.files?.[0];

      // إذا قام المستخدم باختيار صورة جديدة من الجهاز
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // رفع الصورة إلى Supabase Storage باستخدام اسم الـ bucket الموجود عندك 'avatar'
        const { error: uploadError } = await supabase.storage
          .from('avatar')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // الحصول على الرابط العام للصورة
        const { data: { publicUrl } } = supabase.storage
          .from('avatar')
          .getPublicUrl(filePath);

        newAvatarUrl = publicUrl;
      }

      // تحديث بيانات جدول profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          avatar_url: newAvatarUrl,
          updated_at: new Date(),
        });

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      setMessage('تم تحديث الملف الشخصي بنجاح! ✨');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setErrorMessage('حدث خطأ أثناء التحديث: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // زر حذف الصورة الشخصية
  const handleDeleteAvatar = async () => {
    if (!confirm('هل أنت متأكد من حذف صورتك الشخصية؟')) return;
    setSaving(true);
    setMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date() })
        .eq('id', userId);

      if (error) throw error;

      setAvatarUrl('');
      setMessage('تم حذف الصورة الشخصية بنجاح! 🗑️');
    } catch (error) {
      setErrorMessage('فشل حذف الصورة: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 text-xs">
        جاري تحميل الملف الشخصي...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500">الملف الشخصي 👤</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">تعديل الاسم، الصورة الشخصية، وإدارة الحساب</p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl text-center font-medium">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs p-3 rounded-xl text-center font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          
          {/* عرض الصورة الشخصية الحالية */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-blue-500 flex items-center justify-center shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-slate-400">👤</span>
              )}
            </div>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={saving}
                className="text-red-500 hover:text-red-700 text-xs font-semibold transition cursor-pointer"
              >
                حذف الصورة الشخصية 🗑️
              </button>
            )}
          </div>

          {/* رفع صورة جديدة من الجهاز */}
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">اختيار صورة جديدة من الجهاز</label>
            <input
              id="avatar-file"
              type="file"
              accept="image/*"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          {/* تعديل الاسم */}
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">الاسم الكامل</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="اكتب اسمك الكامل هنا"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* البريد الإلكتروني (للعرض فقط) */}
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">البريد الإلكتروني</label>
            <input
              type="email"
              disabled
              value={userEmail}
              className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* زر الحفظ */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ والتحديث...' : 'حفظ التعديلات 💾'}
          </button>
        </form>

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
