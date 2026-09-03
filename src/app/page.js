import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white dir-rtl flex flex-col justify-between">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-blue-500">ذاكرلي أونلاين</h1>
        <div className="flex gap-4 items-center">
          <Link 
            href="/login" 
            className="text-slate-300 hover:text-white text-sm font-semibold transition"
          >
            تسجيل الدخول
          </Link>
          <Link 
            href="/signup" 
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20"
          >
            حساب جديد
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="text-center space-y-6 px-4 max-w-3xl mx-auto my-auto py-12">
        <h2 className="text-4xl md:text-6xl font-black leading-tight">
          طريقك للقمة يبدأ من <span className="text-blue-500">هنا</span>
        </h2>
        <p className="text-slate-400 text-base md:text-lg">
          منصة تعليمية متكاملة توفر لك أفضل الشروحات والمتابعة الدقيقة لمستواك الدراسي أولاً بأول.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link 
            href="/course" 
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-600/20"
          >
            ابدأ التعلم الآن
          </Link>
          <Link 
            href="/course" 
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-6 py-3 rounded-xl font-bold transition"
          >
            استكشف الكورسات
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-slate-600 text-sm border-t border-slate-900">
        جميع الحقوق محفوظة © ذاكرلي أونلاين
      </footer>
    </div>
  );
}