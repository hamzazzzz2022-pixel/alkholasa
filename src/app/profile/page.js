'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/supabase';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      const currentUser = session.user;
      setUser(currentUser);
      setFullName(currentUser.user_metadata?.full_name || '');
      setAvatarUrl(currentUser.user_metadata?.avatar_url || '');
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;
      setMessage({ text: 'تم تحديث بياناتك بنجاح! 🎉', type: 'success' });
    } catch (error) {
      setMessage({ text: 'حدث خطأ أثناء التحديث: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center dir-rtl">
        <p className="text-lg font-medium">جاري تحميل بيانات الملف الشخصي...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white dir-rtl flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 group transition-transform duration-300 ease-in-out hover:scale-105"
        >
          <div className="relative w-10 h-10 overflow-hidden rounded-full border border-slate-300 dark:border-slate-700/50 group-hover:border-blue-500 transition-colors duration-300">
            <img 
              src="/logo.png" 
              alt="ذاكرلي أونلاين" 
              className="w-full h-full object-cover group-hover:rotate-6 transition-transform duration-300"
            />
          </div>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-500 group-hover:text-blue-500 transition-colors duration-300">
            ذاكرلي أونلاين
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-4 py-2 rounded-xl"
          >
            العودة للوحة التحكم ➔
          </Link>
        </div>
      </header>

      {/* Profile Main Section */}
      <main className="max-w-2xl w-full mx-auto p-6 space-y-6 flex-1 my-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/30 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="الصورة الشخصية" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {fullName ? fullName[0].toUpperCase() : user?.email[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{fullName || 'طالب ذاكرلي'}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium ${
              message.type === 'success' 
                ? 'bg-green-100 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 text-green-700 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك كما تحب أن يظهر"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl p-3 text-slate-900 dark:text-white text-sm outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">رابط الصورة الشخصية (Avatar URL)</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-blue-500 rounded-xl p-3 text-slate-900 dark:text-white text-sm outline-none transition text-left dir-ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 block">البريد الإلكتروني (غير قابل للتعديل)</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 rounded-xl p-3 text-slate-400 dark:text-slate-500 text-sm cursor-not-allowed text-left dir-ltr"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغيرات'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}