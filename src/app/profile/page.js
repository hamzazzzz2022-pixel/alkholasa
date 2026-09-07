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
  
  // حالة المعاينة قبل الرفع
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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

  // خطوة اختيار الصورة وعمل Preview لها
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // دالة قص وتعديل مبدئي للصورة (تجهيزها لتصبح مربعة 1:1) ورفعها
  const handleUploadCroppedImage = async () => {
    if (!selectedImage) return;

    try {
      setUploading(true);
      setMessage('');

      // استخدام Canvas لقص الصورة وجعلها مربعة تلقائياً
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = imagePreview;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const size = Math.min(img.width, img.height);
      canvas.width = 300;
      canvas.height = 300;

      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;

      ctx.drawImage(img, startX, startY, size, size, 0, 0, 300, 300);

      canvas.toBlob(async (blob) => {
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatar')
          .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatar')
          .getPublicUrl(filePath);

        setAvatarUrl(publicUrl);

        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            avatar_url: publicUrl,
            full_name: fullName,
            updated_at: new Date(),
          });

        if (updateError) throw updateError;

        setMessage('تم قص الصورة ورفعها بنجاح! ✨');
        setSelectedImage(null);
        setImagePreview('');
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('خطأ الرفع:', error);
      setMessage(`خطأ في الرفع: ${error.message || 'تأكد من إعدادات الـ Storage'}`);
    } finally {
      setUploading(false);
    }
  };

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
      console.error('خطأ الحفظ:', error);
      setMessage(`خطأ في الحفظ: ${error.message}`);
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
        
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg transition-colors duration-500">
          <h1 className="text-lg font-bold text-blue-600 dark:text-blue-500">الملف الشخصي 👤</h1>
          <Link href="/dashboard" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition">
            العودة للرئيسية ➔
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-6 transition-colors duration-500">
          
          {/* Avatar Container */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-inner bg-slate-800 flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="معاينة الصورة" className="w-full h-full object-cover" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="صورة الملف الشخصي" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-slate-400">👤</span>
              )}
            </div>

            <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-semibold">
              <span>تغيير الصورة</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect} 
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

          {/* زر تأكيد الرفع لو اختار صورة جديدة */}
          {selectedImage && (
            <div className="w-full bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl space-y-3">
              <p className="text-xs text-blue-400 font-semibold">تم اختيار صورة جديدة، سيتم ضبطها وقصها بشكل مربع تلقائياً:</p>
              <div className="flex gap-2">
                <button 
                  onClick={handleUploadCroppedImage}
                  disabled={uploading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {uploading ? 'جاري المعالجة والرفع...' : 'تأكيد ورفع الصورة المربعة ✅'}
                </button>
                <button 
                  onClick={() => { setSelectedImage(null); setImagePreview(''); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
                >
                  إلغاء
                </button>
              </div>
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
              اختر صورة جديدة من جهازك 🖼️
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect} 
                className="hidden" 
              />
            </label>
            <p className="text-[11px] text-slate-500">تدعم صيغ الصور (PNG, JPG, JPEG) ويتم قصها تلقائياً لتناسب دائرية الملف الشخصي</p>
          </div>

        </div>

      </div>
    </div>
  );
}
