'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMessage('خطأ في إنشاء الحساب: ' + error.message);
      setLoading(false);
    } else {
      setSuccessMessage('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني أو تسجيل الدخول.');
      setLoading(false);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 dir-rtl transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500">إنشاء حساب جديد 🚀</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">انضم إلى منصة الخلاصة وابدأ رحلتك التعليمية</p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl text-center font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs p-3 rounded-xl text-center font-medium">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1 font-semibold">كلمة المرور</label>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pl-10 text-xs focus:outline-none focus:border-blue-500 transition"
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm transition focus:outline-none"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          {/* تنبيه أخذ لقطة شاشة */}
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs p-3 rounded-xl text-center font-medium leading-relaxed">
            💡 <strong>تنبيه هام:</strong> يُرجى أخذ لقطة شاشة (Screenshot) لكلمة المرور وحفظها في مكان آمن قبل إنشاء الحساب لضمان عدم نسيانها.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب ➔'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </div>

      </div>
    </div>
  );
}
