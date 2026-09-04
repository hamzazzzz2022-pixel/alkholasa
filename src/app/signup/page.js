'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/supabase';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert('خطأ في إنشاء الحساب: ' + error.message);
      setLoading(false);
    } else {
      alert('تم إنشاء الحساب بنجاح!');
     router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 dir-rtl">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl w-full max-w-md">
        <Link 
  href="/" 
  className="flex items-center gap-3 group transition-transform duration-300 ease-in-out hover:scale-105"
>
  <div className="relative w-10 h-10 overflow-hidden rounded-full border border-slate-700/50 group-hover:border-blue-500 transition-colors duration-300">
    <img 
      src="/logo.png" 
      alt="الخلاصة" 
      className="w-full h-full object-cover group-hover:rotate-6 transition-transform duration-300"
    />
  </div>
  
  <span className="text-xl font-bold text-blue-500 group-hover:text-blue-400 transition-colors duration-300">
    ذاكرلي أونلاين
  </span>
</Link>
        <p className="text-center text-slate-400 text-sm mb-6">إنشاء حساب جديد للوصول لدروسك</p>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">كلمة السر</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              placeholder="******"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg transition"
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
