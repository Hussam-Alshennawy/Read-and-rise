
import React, { useState, useEffect, useRef } from 'react';
import { ExamResult, AppSettings, NewsItem, CloudConfig } from '../types';
import { Search, FileText, CheckCircle, XCircle, Trash2, Lock, Key, ClipboardList, BarChart3, Settings, Newspaper, Plus, Save, Image, Upload, Download, RefreshCw, AlertTriangle, Database, Cloud, Wifi, WifiOff, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import { initFirebase, isFirebaseConnected, syncNewsToCloud, syncSettingsToCloud, syncHistoryToCloud, listenToHistory, getFirebaseError } from '../services/firebaseService';

interface AdminDashboardProps {
  settings?: AppSettings;
  setSettings?: (s: AppSettings) => void;
  news?: NewsItem[];
  setNews?: (n: NewsItem[]) => void;
  onCloudConnect?: () => Promise<any>;
  isCloudConnectedProp?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ settings, setSettings, news, setNews, onCloudConnect, isCloudConnectedProp }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Tabs
  const [adminTab, setAdminTab] = useState<'RESULTS' | 'NEWS' | 'SETTINGS' | 'BACKUP' | 'CLOUD'>('RESULTS');

  // Results State
  const [results, setResults] = useState<ExamResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  // Settings State
  const [tempSettings, setTempSettings] = useState<AppSettings>({
    schoolNameAr: '',
    schoolNameEn: '',
    logoUrl: '',
    heroBgUrl: ''
  });

  // News State
  const [newsForm, setNewsForm] = useState<{ title: string; content: string; imageUrl: string }>({
    title: '',
    content: '',
    imageUrl: ''
  });

  // Cloud State
  const [cloudConfigJson, setCloudConfigJson] = useState('');
  const [connectionErrorMsg, setConnectionErrorMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Use prop if available, otherwise fallback to service check
  const isCloudConnected = isCloudConnectedProp ?? isFirebaseConnected();

  // File Input Ref for Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = `{
  "apiKey": "...",
  "authDomain": "...",
  "databaseURL": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}`;

  useEffect(() => {
    if (isLoggedIn) {
      // Load results from LocalStorage initially
      const savedResults = localStorage.getItem('iqra_exam_history');
      if (savedResults) {
        setResults(JSON.parse(savedResults).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      
      // Initialize temp settings form
      if (settings) {
        setTempSettings(settings);
      }

      // Check Cloud Config existence for UI state
      const savedConfig = localStorage.getItem('iqra_cloud_config');
      if (savedConfig) {
        setCloudConfigJson(savedConfig);
        // If connected, sync history
        if (isCloudConnected) {
           listenToHistory((cloudHistory) => {
             if (cloudHistory) {
               setResults(cloudHistory);
               localStorage.setItem('iqra_exam_history', JSON.stringify(cloudHistory));
             }
           });
        }
      } else {
        // Set default placeholder if empty to help user
        setCloudConfigJson(defaultPlaceholder);
      }
    }
  }, [isLoggedIn, settings, isCloudConnected]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Hussam' && password === 'alshennawy') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  // --- HELPER: IMAGE COMPRESSION ---
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
             reject("Canvas error");
             return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with specified quality (0.0 to 1.0)
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void, isBackground: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            // Backgrounds need slightly more width (1200px), Logos less (400px)
            const maxWidth = isBackground ? 1200 : 500;
            const quality = isBackground ? 0.6 : 0.8;
            
            const compressedBase64 = await compressImage(file, maxWidth, quality);
            callback(compressedBase64);
        } catch (error) {
            alert('حدث خطأ أثناء معالجة الصورة. يرجى المحاولة مرة أخرى.');
            console.error(error);
        }
    }
  };

  // --- RESULT ACTIONS ---
  const clearHistory = () => {
    if (confirm('هل أنت متأكد من حذف جميع سجلات الطلاب؟ لا يمكن التراجع عن هذا الإجراء.')) {
      localStorage.removeItem('iqra_exam_history');
      setResults([]);
      if (isCloudConnected) syncHistoryToCloud([]); // Sync empty array to cloud
    }
  };

  const handleDeleteResult = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه النتيجة؟')) {
      const updated = results.filter(r => r.id !== id);
      setResults(updated);
      localStorage.setItem('iqra_exam_history', JSON.stringify(updated));
      if (isCloudConnected) syncHistoryToCloud(updated); // Sync to cloud
      if (selectedResult?.id === id) setSelectedResult(null);
    }
  };

  // --- SETTINGS ACTIONS ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (setSettings) {
      setSettings(tempSettings);
      localStorage.setItem('iqra_settings', JSON.stringify(tempSettings));
      if (isCloudConnected) syncSettingsToCloud(tempSettings); // Sync to cloud
      alert('تم حفظ الإعدادات بنجاح');
    }
  };

  // --- NEWS ACTIONS ---
  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) return;

    const newItem: NewsItem = {
      id: Date.now().toString(),
      title: newsForm.title,
      content: newsForm.content,
      imageUrl: newsForm.imageUrl,
      date: new Date().toISOString()
    };

    const updatedNews = [newItem, ...(news || [])];
    if (setNews) {
      setNews(updatedNews);
      localStorage.setItem('iqra_news', JSON.stringify(updatedNews));
      if (isCloudConnected) syncNewsToCloud(updatedNews); // Sync to cloud
    }
    setNewsForm({ title: '', content: '', imageUrl: '' });
  };

  const handleDeleteNews = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
      const updatedNews = (news || []).filter(item => item.id !== id);
      if (setNews) {
        setNews(updatedNews);
        localStorage.setItem('iqra_news', JSON.stringify(updatedNews));
        if (isCloudConnected) syncNewsToCloud(updatedNews); // Sync to cloud
      }
    }
  };

  // --- CLOUD CONFIG ACTIONS ---
  const handleConnectCloud = async () => {
    setConnectionErrorMsg('');
    setIsConnecting(true);
    try {
      // Validate JSON
      let config: CloudConfig;
      try {
          config = JSON.parse(cloudConfigJson);
      } catch(e) {
          throw new Error("صيغة الكود غير صحيحة. تأكد من نسخه كاملاً.");
      }

      if (!config.apiKey || !config.databaseURL) throw new Error("البيانات ناقصة (API Key or DatabaseURL missing).");
      if (config.apiKey.includes('...')) throw new Error("يرجى استبدال النقاط (...) بالبيانات الحقيقية من Firebase.");

      // Save to local storage FIRST
      localStorage.setItem('iqra_cloud_config', cloudConfigJson);
      
      // Force a reconnect attempt using the provided prop (from App.tsx)
      if (onCloudConnect) {
        await onCloudConnect();
      } else {
        await initFirebase(config);
      }
      
      // Check result after await
      if (!isFirebaseConnected()) {
          setConnectionErrorMsg(getFirebaseError());
      } else {
          // Initial Sync Push on successful connect
          if (news && news.length > 0) syncNewsToCloud(news);
          if (settings) syncSettingsToCloud(settings);
          if (results.length > 0) syncHistoryToCloud(results);
      }

    } catch (e: any) {
      setConnectionErrorMsg(e.message || "خطأ في الاتصال.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectCloud = () => {
     if (confirm("هل تريد قطع الاتصال بالسحابة؟ سيتوقف التطبيق عن المزامنة.")) {
       localStorage.removeItem('iqra_cloud_config');
       setCloudConfigJson(defaultPlaceholder);
       setConnectionErrorMsg('');
       // Trigger reconnect logic (which effectively disconnects since config is gone)
       if (onCloudConnect) onCloudConnect();
     }
  };

  // --- BACKUP & RESTORE ACTIONS ---
  const handleExportData = () => {
    const data = {
      settings: localStorage.getItem('iqra_settings'),
      news: localStorage.getItem('iqra_news'),
      history: localStorage.getItem('iqra_exam_history'),
      progressAr: localStorage.getItem('iqra_progress_ar'),
      progressEn: localStorage.getItem('iqra_progress_en'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iqra_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);

        if (confirm('سيتم استبدال البيانات الحالية بالبيانات الموجودة في الملف. هل أنت متأكد؟')) {
           if (data.settings) {
             localStorage.setItem('iqra_settings', data.settings);
             if (setSettings) setSettings(JSON.parse(data.settings));
             if (isCloudConnected) syncSettingsToCloud(JSON.parse(data.settings));
           }
           if (data.news) {
             localStorage.setItem('iqra_news', data.news);
             if (setNews) setNews(JSON.parse(data.news));
             if (isCloudConnected) syncNewsToCloud(JSON.parse(data.news));
           }
           if (data.history) {
             localStorage.setItem('iqra_exam_history', data.history);
             setResults(JSON.parse(data.history));
             if (isCloudConnected) syncHistoryToCloud(JSON.parse(data.history));
           }
           if (data.progressAr) localStorage.setItem('iqra_progress_ar', data.progressAr);
           if (data.progressEn) localStorage.setItem('iqra_progress_en', data.progressEn);

           alert('تم استعادة البيانات بنجاح!');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const filteredResults = results.filter(r => 
    r.studentName.includes(searchTerm) || 
    r.level.toString().includes(searchTerm)
  );

  const getSummaryData = (result: ExamResult) => {
    const correct = result.details.filter(d => d.isCorrect).length;
    const wrong = result.totalQuestions - correct;
    const levelProgress = Math.round((result.level / 12) * 100);
    const rating = result.score >= 85 ? 'ممتاز' : result.score >= 70 ? 'جيد' : 'يحتاج للتركيز';
    return { correct, wrong, levelProgress, rating };
  };

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 p-4 animate-fade-in">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-gold-500 to-primary-500"></div>
          
          <div className="w-24 h-24 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
             <Lock size={48} />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-primary-950 mb-2">لوحة المعلم</h2>
          <p className="text-center text-slate-500 mb-8 text-sm">أهلاً بك، يرجى تسجيل الدخول للمتابعة</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المستخدم</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-300 outline-none focus:border-primary-500 transition-all"
                placeholder="Username"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-300 outline-none focus:border-primary-500 transition-all"
                placeholder="Password"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-bold text-center border border-red-100">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-primary-700 hover:bg-primary-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-700/20"
            >
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 hidden md:flex items-center justify-center bg-primary-50 rounded-xl text-primary-600">
            <ClipboardList size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary-950 font-serif">لوحة تحكم المعلم</h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span>إدارة الطلاب والمحتوى</span>
                {isCloudConnected ? (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold border border-green-100 animate-pulse">
                        <Wifi size={12} /> متصل بالسحابة (Online)
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-bold border border-slate-200">
                        <WifiOff size={12} /> وضع محلي (Offline)
                    </span>
                )}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsLoggedIn(false)}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold text-sm shadow-lg shadow-slate-800/20"
        >
          خروج
        </button>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto md:mx-0">
        <button onClick={() => setAdminTab('RESULTS')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${adminTab === 'RESULTS' ? 'bg-white text-primary-900 shadow-md' : 'text-slate-500'}`}>نتائج الطلاب</button>
        <button onClick={() => setAdminTab('NEWS')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${adminTab === 'NEWS' ? 'bg-white text-primary-900 shadow-md' : 'text-slate-500'}`}><Newspaper size={16} /> الأخبار</button>
        <button onClick={() => setAdminTab('SETTINGS')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${adminTab === 'SETTINGS' ? 'bg-white text-primary-900 shadow-md' : 'text-slate-500'}`}><Settings size={16} /> الإعدادات</button>
        <button onClick={() => setAdminTab('BACKUP')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${adminTab === 'BACKUP' ? 'bg-white text-primary-900 shadow-md' : 'text-slate-500'}`}><Database size={16} /> النسخ الاحتياطي</button>
        <button onClick={() => setAdminTab('CLOUD')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${adminTab === 'CLOUD' ? 'bg-white text-blue-700 shadow-md ring-2 ring-blue-100' : 'text-slate-500'}`}><Cloud size={16} /> الربط السحابي</button>
      </div>

      {/* ==================== TAB: RESULTS ==================== */}
      {adminTab === 'RESULTS' && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Sidebar / List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-2">
              <Search className="text-slate-400" />
              <input type="text" placeholder="بحث باسم الطالب..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white text-slate-900 outline-none font-medium" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-h-[600px] overflow-y-auto">
              {filteredResults.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">لا توجد نتائج</div> : filteredResults.map((result) => (
                  <div key={result.id} onClick={() => setSelectedResult(result)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${selectedResult?.id === result.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}>
                    <div className="flex justify-between items-start mb-1"><h4 className="font-bold text-slate-800">{result.studentName}</h4><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.score >= 85 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{result.score}%</span></div>
                    <div className="flex justify-between text-xs text-slate-400"><span>المستوى {result.level}</span><span>{new Date(result.date).toLocaleDateString('ar-EG')}</span></div>
                  </div>
              ))}
            </div>
            <button onClick={clearHistory} className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"><Trash2 size={16} /> مسح جميع السجلات</button>
          </div>

          {/* Details View */}
          <div className="lg:col-span-2">
            {selectedResult ? (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-primary-900 text-white p-6 flex justify-between items-start">
                  <div><h2 className="text-2xl font-bold mb-1">{selectedResult.studentName}</h2><p className="text-primary-200 text-sm flex gap-2 items-center"><ClipboardList size={14} /> المستوى {selectedResult.level} | {selectedResult.language === 'ar' ? 'لغة عربية' : 'لغة إنجليزية'}</p></div>
                  <div className="text-center"><span className={`block text-3xl font-black ${selectedResult.score >= 85 ? 'text-green-400' : 'text-gold-400'}`}>{selectedResult.score}%</span></div>
                </div>
                <div className="p-6">
                  <div className="flex gap-4 mb-8">
                     <div className="flex-1 bg-green-50 p-4 rounded-xl text-center border border-green-100"><span className="block text-green-700 font-bold text-xl">{getSummaryData(selectedResult).correct}</span><span className="text-xs text-green-600">صحيحة</span></div>
                     <div className="flex-1 bg-red-50 p-4 rounded-xl text-center border border-red-100"><span className="block text-red-700 font-bold text-xl">{getSummaryData(selectedResult).wrong}</span><span className="text-xs text-red-600">خاطئة</span></div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-gold-500" /> تفاصيل الإجابات</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">{selectedResult.details.map((detail, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${detail.isCorrect ? 'bg-white border-slate-200' : 'bg-red-50/50 border-red-100'}`}>
                        <div className="flex gap-3 mb-2"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${detail.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{idx + 1}</span><p className="font-medium text-slate-800 text-sm leading-relaxed">{detail.questionText}</p></div>
                        <div className="mr-9 text-xs space-y-1"><div className="flex items-center gap-2"><span className="text-slate-400">إجابتك:</span><span className={`font-bold ${detail.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{detail.userAnswer}</span></div>{!detail.isCorrect && <div className="flex items-center gap-2"><span className="text-slate-400">الصحيحة:</span><span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{detail.correctAnswer}</span></div>}</div>
                      </div>
                    ))}</div>
                  <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end"><button onClick={() => handleDeleteResult(selectedResult.id)} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1"><Trash2 size={14} /> حذف هذه النتيجة</button></div>
                </div>
              </div>
            ) : <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200"><BarChart3 size={48} className="mb-4 opacity-50" /><p>اختر طالباً للعرض</p></div>}
          </div>
        </div>
      )}

      {/* ==================== TAB: NEWS ==================== */}
      {adminTab === 'NEWS' && (
        <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-4">
                <h3 className="font-bold text-primary-950 mb-4 flex items-center gap-2"><Plus size={18} className="text-gold-500" /> إضافة خبر</h3>
                <form onSubmit={handleAddNews} className="space-y-4">
                  <input type="text" required value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-900" placeholder="عنوان الخبر" />
                  <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 overflow-hidden relative">
                       {newsForm.imageUrl ? <img src={newsForm.imageUrl} className="w-full h-full object-cover" /> : <div className="text-center text-slate-400"><Image size={24} className="mx-auto" /><span className="text-xs">صورة الخبر</span></div>}
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (base64) => setNewsForm({...newsForm, imageUrl: base64}))} />
                  </label>
                  {newsForm.imageUrl && <button type="button" onClick={() => setNewsForm({...newsForm, imageUrl: ''})} className="text-xs text-red-500 block">إزالة الصورة</button>}
                  <textarea required rows={4} value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm resize-none bg-white text-slate-900" placeholder="التفاصيل..." />
                  <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 flex items-center justify-center gap-2"><Save size={16} /> نشر</button>
                </form>
             </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
             <h3 className="font-bold text-slate-700">الأخبار ({news?.length || 0})</h3>
             {(!news || news.length === 0) ? <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed text-slate-400">لا توجد أخبار</div> : news.map(item => (
                 <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4">
                    {item.imageUrl && <div className="w-24 h-24 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden"><img src={item.imageUrl} className="w-full h-full object-cover" /></div>}
                    <div className="flex-1">
                       <div className="flex justify-between items-start"><h4 className="font-bold text-slate-800 mb-1">{item.title}</h4><button onClick={() => handleDeleteNews(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></div>
                       <p className="text-sm text-slate-500 line-clamp-2 mb-2">{item.content}</p>
                       <span className="text-xs text-slate-300">{new Date(item.date).toLocaleDateString('ar-EG')}</span>
                    </div>
                 </div>
             ))}
          </div>
        </div>
      )}

      {/* ==================== TAB: SETTINGS ==================== */}
      {adminTab === 'SETTINGS' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-fade-in">
           <h3 className="font-bold text-primary-950 mb-6 flex items-center gap-2"><Settings size={20} className="text-gold-500" /> إعدادات المدرسة</h3>
           <form onSubmit={handleSaveSettings} className="space-y-6">
             <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم المدرسة (عربي)</label><input type="text" required value={tempSettings.schoolNameAr} onChange={e => setTempSettings({...tempSettings, schoolNameAr: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900" /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">School Name (En)</label><input type="text" required value={tempSettings.schoolNameEn} onChange={e => setTempSettings({...tempSettings, schoolNameEn: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-left bg-white text-slate-900" dir="ltr" /></div>
             </div>
             <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">شعار المدرسة (Logo)</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                        {tempSettings.logoUrl ? <img src={tempSettings.logoUrl} className="h-full object-contain" /> : <div className="text-center text-slate-400"><Upload size={24} className="mx-auto mb-1"/><span className="text-xs">رفع شعار</span></div>}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (base64) => setTempSettings({...tempSettings, logoUrl: base64}))} />
                    </label>
                    {tempSettings.logoUrl && <button type="button" onClick={() => setTempSettings({...tempSettings, logoUrl: undefined})} className="text-red-500 text-xs mt-1">حذف الشعار</button>}
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">خلفية الواجهة</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 overflow-hidden">
                        {tempSettings.heroBgUrl ? <img src={tempSettings.heroBgUrl} className="w-full h-full object-cover" /> : <div className="text-center text-slate-400"><Image size={24} className="mx-auto mb-1"/><span className="text-xs">رفع خلفية</span></div>}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (base64) => setTempSettings({...tempSettings, heroBgUrl: base64}), true)} />
                    </label>
                    {tempSettings.heroBgUrl && <button type="button" onClick={() => setTempSettings({...tempSettings, heroBgUrl: undefined})} className="text-red-500 text-xs mt-1">حذف الخلفية</button>}
                </div>
             </div>
             <button type="submit" className="w-full py-3 bg-primary-700 text-white rounded-xl font-bold hover:bg-primary-800 shadow-lg shadow-primary-700/20">حفظ التغييرات</button>
           </form>
        </div>
      )}

      {/* ==================== TAB: BACKUP ==================== */}
      {adminTab === 'BACKUP' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Download size={20} className="text-blue-500" /> تصدير البيانات</h3>
              <p className="text-slate-500 text-sm mb-4">قم بتحميل ملف نسخة احتياطية يحتوي على جميع بيانات الطلاب والإعدادات.</p>
              <button onClick={handleExportData} className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 w-full">تحميل النسخة الاحتياطية</button>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Upload size={20} className="text-gold-500" /> استعادة البيانات</h3>
              <p className="text-slate-500 text-sm mb-4">استرجع البيانات من ملف نسخة احتياطية سابق (JSON).</p>
              <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImportData} />
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-gold-50 text-gold-600 rounded-xl font-bold hover:bg-gold-100 w-full">اختيار ملف للاستعادة</button>
           </div>
        </div>
      )}

      {/* ==================== TAB: CLOUD (FIREBASE) ==================== */}
      {adminTab === 'CLOUD' && (
        <div className="max-w-3xl mx-auto animate-fade-in">
           <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-6">
              <div className="flex items-start gap-4">
                 <div className="p-3 bg-white rounded-full shadow-sm text-blue-600"><Cloud size={24} /></div>
                 <div>
                    <h3 className="font-bold text-blue-900 text-lg mb-1">الربط السحابي (Cloud Sync)</h3>
                    <p className="text-blue-800/80 text-sm leading-relaxed">
                       هذه الميزة تتيح لك مشاركة الأخبار والنتائج بين جهاز المعلم وأجهزة الطلاب تلقائياً.
                       تحتاج لإنشاء مشروع مجاني على Google Firebase ولصق الإعدادات هنا.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                       <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 inline-flex items-center gap-1">
                          خطوة 1: اذهب إلى Firebase Console
                       </a>
                       <span className="text-xs bg-white/50 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-100">
                          خطوة 2: انسخ كود "web app" وضعه في الأسفل
                       </span>
                    </div>
                    <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200 flex items-center gap-2">
                        <AlertTriangle size={12} />
                        <strong>تنبيه هام:</strong> يجب وضع نفس الكود تماماً في جميع الأجهزة (جهاز المعلم وأجهزة الطلاب) لكي يتم الربط بنجاح.
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden">
              {isCloudConnected && <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>}
              
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Settings size={18} className="text-slate-400" /> 
                    إعدادات الاتصال
                 </h3>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isCloudConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {isCloudConnected ? <><Wifi size={14} /> متصل</> : <><WifiOff size={14} /> غير متصل</>}
                 </div>
              </div>

              <div className="mb-4 relative">
                 <label className="block text-sm font-bold text-slate-700 mb-2">كود الربط (Firebase Configuration):</label>
                 <div className="relative">
                    <textarea 
                        value={cloudConfigJson}
                        onChange={(e) => setCloudConfigJson(e.target.value)}
                        dir="ltr"
                        spellCheck={false}
                        className="w-full h-48 bg-white text-slate-900 font-mono text-xs p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-inner"
                        placeholder={defaultPlaceholder}
                    />
                    <div className="absolute top-2 right-2">
                       <button 
                         onClick={() => setCloudConfigJson(defaultPlaceholder)} 
                         className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded hover:bg-slate-200"
                         title="استعادة القالب الافتراضي"
                       >
                         Reset Template
                       </button>
                    </div>
                 </div>
                 <p className="text-xs text-slate-400 mt-2">تأكد من نسخ الكائن (Object) كاملاً بما في ذلك الأقواس &#123; &#125;.</p>
              </div>

              {connectionErrorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-sm">
                   <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                   <p>{connectionErrorMsg}</p>
                </div>
              )}

              <div className="flex gap-3">
                 {!isCloudConnected ? (
                    <button 
                      onClick={handleConnectCloud} 
                      disabled={isConnecting}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      اتصال وحفظ
                    </button>
                 ) : (
                    <button 
                      onClick={handleDisconnectCloud} 
                      className="flex-1 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 flex items-center justify-center gap-2"
                    >
                      <WifiOff size={18} />
                      قطع الاتصال
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
