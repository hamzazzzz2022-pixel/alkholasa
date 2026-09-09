'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import Link from 'next/link';
import * as tus from 'tus-js-client';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);

  // نموذج إضافة كورس
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  // نموذج إضافة درس
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // نسبة الرفع المئوية

  // نموذج إضافة سؤال / كويز
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [option0, setOption0] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [correctIndex, setCorrectIndex] = useState(0);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // حماية لوحة الإدارة للمشرف فقط
      if (!session || session.user.email !== 'hamzazzzz2022@gmail.com') {
        router.push('/dashboard');
        return;
      }

      // جلب الكورسات والدروس
      const { data: coursesData } = await supabase.from('courses').select('*').order('id', { ascending: true });
      const { data: lessonsData } = await supabase.from('lessons').select('*').order('id', { ascending: true });

      if (coursesData) setCourses(coursesData);
      if (lessonsData) {
        setLessons(lessonsData);
        if (lessonsData.length > 0) setSelectedLessonId(lessonsData[0].id);
      }
      if (coursesData && coursesData.length > 0) setSelectedCourseId(coursesData[0].id);

      setLoading(false);
    };

    checkAdminAndFetch();
  }, [router]);

  // دالة رفع الفيديو باستخدام بروتوكول Tus (الرفع المتقطع السريع والآمن)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      setUploadProgress(0);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('يجب تسجيل الدخول أولاً');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
      if (!projectId) throw new Error('رابط Supabase غير صحيح');

      const fileExt = file.name.split('.').pop() || 'mp4';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const bucketName = 'lesson-videos';

      await new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'true',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: bucketName,
            objectName: fileName,
            contentType: file.type || 'video/mp4',
            cacheControl: '3600',
          },
          chunkSize: 6 * 1024 * 1024, // تقطيع الملف لأجزاء 6 ميجابايت لتفادي أخطاء الشبكة
          onError: function (error) {
            reject(error);
          },
          onProgress: function (bytesUploaded, bytesTotal) {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
            setUploadProgress(percentage);
          },
          onSuccess: function () {
            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);
            
            setVideoUrl(publicUrlData.publicUrl);
            resolve(publicUrlData.publicUrl);
          },
        });

        upload.findPreviousUploads().then(function (previousUploads) {
          if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        });
      });

      alert('تم رفع الفيديو من الجهاز بنجاح! 🚀');
    } catch (err) {
      console.error('خطأ في الرفع:', err.message);
      alert('حدث خطأ أثناء رفع الفيديو: ' + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  // إضافة كورس جديد
  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle || !courseCategory) return alert('الرجاء إدخال اسم الكورس والقسم');

    const { data, error } = await supabase.from('courses').insert([
      { title: courseTitle, category: courseCategory, description: courseDescription }
    ]).select();

    if (!error && data) {
      setCourses([...courses, data[0]]);
      setCourseTitle('');
      setCourseCategory('');
      setCourseDescription('');
      alert('تم إضافة الكورس بنجاح! 🎉');
    } else {
      alert('حدث خطأ: ' + error.message);
    }
  };

  // إضافة درس جديد
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !lessonTitle || !videoUrl) return alert('الرجاء ملء جميع الحقول المطلوبة (عنوان الدرس ورابط أو ملف الفيديو)');

    const { data, error } = await supabase.from('lessons').insert([
      { course_id: selectedCourseId, title: lessonTitle, video_url: videoUrl }
    ]).select();

    if (!error && data) {
      setLessons([...lessons, data[0]]);
      setLessonTitle('');
      setVideoUrl('');
      alert('تم إضافة الدرس بنجاح! 🎬');
    } else {
      alert('حدث خطأ: ' + error.message);
    }
  };

  // إضافة اختبار/سؤال جديد للدرس
  const handleAddQuiz = async (e) => {
    e.preventDefault();
    if (!selectedLessonId || !quizQuestion || !option0 || !option1 || !option2 || !option3) {
      return alert('الرجاء إدخال السؤال وجميع الخيارات الأربعة');
    }

    const optionsArray = [option0, option1, option2, option3];

    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('lesson_id', selectedLessonId);

    if (deleteError) {
      console.error('خطأ عند حذف السؤال القديم:', deleteError.message);
    }

    const { error: insertError } = await supabase.from('quizzes').insert([
      {
        lesson_id: selectedLessonId,
        question: quizQuestion,
        options: optionsArray,
        correct_option_index: Number(correctIndex)
      }
    ]);

    if (!insertError) {
      setQuizQuestion('');
      setOption0('');
      setOption1('');
      setOption2('');
      setOption3('');
      alert('تم حفظ السؤال وتحديث اختبار الدرس بنجاح! 📝');
    } else {
      console.error('خطأ Supabase:', insertError);
      alert('حدث خطأ أثناء حفظ السؤال: ' + insertError.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center dir-rtl">
        <p className="text-sm font-medium">جاري تحميل لوحة الإدارة...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 dir-rtl flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500">لوحة إدارة المنصة 🛠️</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">إضافة الدورات، الدروس، والأسئلة التفاعلية</p>
          </div>
          <Link href="/dashboard" className="text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition">
            العودة للوحة التحكم ➔
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. إضافة كورس */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2">1. إضافة كورس جديد 📚</h2>
            <form onSubmit={handleAddCourse} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">عنوان الكورس</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="مثال: البلاغة والنقد"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">القسم</label>
                <input
                  type="text"
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  placeholder="مثال: اللغة العربية"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">وصف الكورس</label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="شرح بسيط لمحتوى الكورس..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 h-20"
                ></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition">
                حفظ الكورس ✨
              </button>
            </form>
          </div>

          {/* 2. إضافة درس */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
            <h2 className="text-base font-bold text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-2">2. إضافة درس لكورس 🎬</h2>
            <form onSubmit={handleAddLesson} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">اختر الكورس</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">عنوان الدرس</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="مثال: التشبيه والتضمين"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">رابط الفيديو (أو ارفعه من جهازك بالأسفل)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://... أو رابط الفيديو المرفوع تلقائياً"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* زر رفع الفيديو المتقطع */}
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">أو ارفع فيديو من جهازك:</label>
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileUpload}
                  disabled={uploadingVideo}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
                />
                {uploadingVideo && (
                  <p className="text-amber-500 text-xs mt-1 animate-pulse font-bold">
                    جاري رفع الفيديو: {uploadProgress}% ⏳ (يرجى الانتظار وعدم إغلاق الصفحة)
                  </p>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition">
                حفظ الدرس 🎥
              </button>
            </form>
          </div>

        </div>

        {/* 3. إضافة سؤال/اختبار للدرس */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
          <h2 className="text-base font-bold text-green-600 dark:text-green-400 border-b border-slate-100 dark:border-slate-800 pb-2">3. إضافة اختبار/سؤال للدرس 📝</h2>
          <form onSubmit={handleAddQuiz} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">اختر الدرس</label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">نص السؤال</label>
                <input
                  type="text"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="مثال: ما هو العُنصر الأساسي لـ..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الخيار الأول (Index 0)</label>
                <input
                  type="text"
                  value={option0}
                  onChange={(e) => setOption0(e.target.value)}
                  placeholder="الخيار رقم 1"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الخيار الثاني (Index 1)</label>
                <input
                  type="text"
                  value={option1}
                  onChange={(e) => setOption1(e.target.value)}
                  placeholder="الخيار رقم 2"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الخيار الثالث (Index 2)</label>
                <input
                  type="text"
                  value={option2}
                  onChange={(e) => setOption2(e.target.value)}
                  placeholder="الخيار رقم 3"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الخيار الرابع (Index 3)</label>
                <input
                  type="text"
                  value={option3}
                  onChange={(e) => setOption3(e.target.value)}
                  placeholder="الخيار رقم 4"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-1/2">
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الإجابة الصحيحة هي:</label>
                <select
                  value={correctIndex}
                  onChange={(e) => setCorrectIndex(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-green-600 dark:text-green-400"
                >
                  <option value={0}>الخيار الأول (Index 0)</option>
                  <option value={1}>الخيار الثاني (Index 1)</option>
                  <option value={2}>الخيار الثالث (Index 2)</option>
                  <option value={3}>الخيار الرابع (Index 3)</option>
                </select>
              </div>

              <div className="w-1/2 pt-5">
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer">
                  حفظ سؤال الاختبار 📝
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
