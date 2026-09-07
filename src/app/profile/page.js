'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // جلب بيانات الملف الشخصي من جدول profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profileData) {
          setAvatarUrl(profileData.avatar_url || '');
          setFullName(profileData.full_name || '');
        }
      } catch (err) {
        console.error('خطأ في جلب البيانات:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  // دالة رفع الصورة
  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      setMessage('');
      const file = e.target.files[0];
      if (!file) {
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // رفع الصورة لـ Supabase Storage (Bucket: avatars)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // الحصول على الرابط العام للصورة
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // حفظ الرابط فوراً في جدول profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          full_name: fullName,
          updated_at: new Date(),
        });

      if (updateError) throw updateError;

      setMessage('تم تحديث الصورة بنجاح! ✨');
    } catch (error) {
      console.error('تفاصيل خطأ الرفع:', error);
      setMessage(`خطأ في الرفع: ${error.message || JSON.stringify(error)}`);
    } finally {
      setUploading(false);
    }
  };

  // دالة حفظ الاسم الجديد
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date(),
        });

      if (error) throw error;

      setMessage('تم حفظ الاسم بنجاح! 🚀');
    } catch (error) {
      console.error('خطأ الحفظ:', error.message);
      setMessage('حدث خطأ أثناء حفظ الاسم.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm font-medium animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex flex-col items-center transition-colors duration-500">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Header Navigation */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg transition-colors duration-500">
          <h1 className="text-lg font-bold text-blue-600 dark:text-blue-500">الملف الشخصي 👤</h1>
          <Link href="/dashboard" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition">
            العودة للرئيسية ➔
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-6 transition-colors duration-500">
          
          {/* Avatar Container */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-inner bg-slate-800 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="صورة الملف الشخصي" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-slate-400">👤</span>
              )}
            </div>

            {/* Upload Overlay Button */}
            <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-semibold">
              <span>{uploading ? 'جاري الرفع...' : 'تغيير الصورة'}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                disabled={uploading}
                className="hidden" 
              />
            </label>
          </div>

          <div className="space-y-1 w-full">
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>

          {message && (
            <div className={`text-xs px-4 py-2 rounded-xl font-medium w-full break-words ${message.includes('نجاح') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {message}
            </div>
          )}

          {/* Form لتعديل الاسم */}
          <form onSubmit={handleSaveProfile} className="w-full space-y-4 text-right">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">اسم المستخدم (الاسم الظاهر):</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اكتب اسمك هنا..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الاسم 💾'}
            </button>
          </form>

          {/* Direct Upload Button */}
          <div className="w-full pt-4 border-t border-slate-800 flex flex-col gap-3">
            <label className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer text-center block">
              {uploading ? 'جاري الرفع...' : 'اختر صورة جديدة من جهازك 🖼️'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                disabled={uploading}
                className="hidden" 
              />
            </label>
            <p className="text-[11px] text-slate-500">تدعم صيغ الصور (PNG, JPG, JPEG)</p>
          </div>

        </div>

      </div>
    </div>
  );
}
