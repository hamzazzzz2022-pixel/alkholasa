'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // الاستماع لحالة المصادقة والتأكد من التقاط الرمز القادم من البريد
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSessionReady(true);
      }
    });

    // التحقق الفوري لو الجلسة موجودة مسبقاً
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setErrorMessage('حدث خطأ أثناء تحديث كلمة المرور: ' + error.message);
      setLoading(false);
    } else {
      setMessage('تم تحديث كلمة المرور بنجاح! جاري تحويلك لصفحة تسجيل الدخول...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 dir-rtl transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500">تحديث كلمة المرور 🔐</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">الرجاء إدخال كلمة المرور الجديدة لحسابك</p>
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

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs p-3 rounded-xl text-center font-medium leading-relaxed">
            💡 <strong>تنبيه هام:</strong> يُرجى أخذ لقطة شاشة (Screenshot) لكلمة المرور الجديدة وحفظها في مكان آمن.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'جاري التحديث...' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>

      </div>
    </div>
  );
}
