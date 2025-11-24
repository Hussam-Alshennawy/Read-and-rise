
import React from 'react';
import { AppTab, Language, AppSettings } from '../types';
import { ArrowLeft, ArrowRight, Sparkles, GraduationCap, Trophy, BookOpen } from 'lucide-react';

interface HeroProps {
  onNavigate: (tab: AppTab) => void;
  language: Language;
  settings?: AppSettings;
}

const Hero: React.FC<HeroProps> = ({ onNavigate, language, settings }) => {
  const isAr = language === 'ar';

  const t = {
    schoolName: isAr ? (settings?.schoolNameAr || 'مدرسة صلالة الخاصة') : (settings?.schoolNameEn || 'Salalah Private School'),
    tagline: isAr ? 'منهج متكامل لتطوير مهارات القراءة' : 'Comprehensive curriculum for reading skills',
    mainHeading: isAr ? 'تدرج في العلم.. واصعد القمم' : 'Ascend in Knowledge.. Reach the Peaks',
    description: isAr 
      ? '12 مستوى متدرجاً من النصوص والأسئلة الذكية. اختبر مستواك، وحقق درجة 85% لتنتقل للمرحلة التالية. اختبارات متجددة لا تنتهي.'
      : '12 progressive levels of smart texts and questions. Test your level, score 85% to advance. Endless renewable exams.',
    startBtn: isAr ? 'ابدأ التحدي الآن' : 'Start Challenge Now',
    askBtn: isAr ? 'اسأل المعلم' : 'Ask the Tutor',
    feat1Title: isAr ? '12 مستوى متدرج' : '12 Progressive Levels',
    feat1Desc: isAr ? 'من المبتدئ إلى المتمكن. نصوص تزداد صعوبة وعمقاً مع كل مستوى تجتازه.' : 'From beginner to master. Texts get harder and deeper with every passed level.',
    feat2Title: isAr ? 'نظام نجاح صارم' : 'Strict Success System',
    feat2Desc: isAr ? 'لن تمر للمستوى التالي إلا بتحقيق 85% على الأقل. تأكد من فهمك الكامل للنص.' : 'Pass only with 85% score. Ensure complete understanding of the text.',
    feat3Title: isAr ? 'اختبارات متجددة' : 'Renewable Exams',
    feat3Desc: isAr ? 'كل اختبار مختلف عن الآخر. إذا رسبت، ستحصل على نص جديد وأسئلة جديدة تماماً.' : 'Every exam is unique. Fail? Get a brand new text and questions instantly.',
  };

  const bgStyle = settings?.heroBgUrl ? {
    backgroundImage: `linear-gradient(to bottom right, rgba(5, 46, 22, 0.9), rgba(5, 46, 22, 0.8)), url(${settings.heroBgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      {/* Hero Banner */}
      <div 
        className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white py-16 md:py-24 overflow-hidden rounded-b-[3rem] shadow-xl"
        style={bgStyle}
      >
        {/* Abstract Islamic Pattern Background (CSS Shapes) - Only show if no custom BG */}
        {!settings?.heroBgUrl && (
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern)" />
            </svg>
            </div>
        )}

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          
          <div className="mb-6 w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-3xl p-4 border border-white/10 shadow-2xl backdrop-blur-sm animate-in zoom-in duration-500 flex items-center justify-center overflow-hidden">
             {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="School Logo" className="w-full h-full object-contain drop-shadow-md" />
             ) : (
                <BookOpen className="w-20 h-20 md:w-24 md:h-24 text-gold-400" strokeWidth={1.5} />
             )}
          </div>

          <h1 className={`text-2xl md:text-3xl font-bold text-white mb-6 tracking-wide ${isAr ? 'font-serif' : 'font-sans'}`}>
            {t.schoolName}
          </h1>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-800/50 border border-primary-600 text-primary-200 text-sm mb-6 backdrop-blur-sm">
            <Sparkles size={14} className="text-gold-400" />
            <span>{t.tagline}</span>
          </div>
          
          <h2 className={`text-4xl md:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-md ${isAr ? 'font-serif' : 'font-sans'}`}>
            {t.mainHeading}
          </h2>
          
          <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            {t.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => onNavigate(AppTab.LEVELS)}
              className="w-full sm:w-auto px-8 py-4 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl shadow-lg hover:shadow-gold-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <GraduationCap className="group-hover:scale-110 transition-transform" />
              {t.startBtn}
            </button>
            
            <button
              onClick={() => onNavigate(AppTab.CHAT)}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all flex items-center justify-center gap-2"
            >
              {t.askBtn}
              {isAr ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:border-primary-200 transition-colors group">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.feat1Title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t.feat1Desc}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:border-primary-200 transition-colors group">
            <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center text-gold-600 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.feat2Title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t.feat2Desc}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 hover:border-primary-200 transition-colors group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t.feat3Title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t.feat3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
