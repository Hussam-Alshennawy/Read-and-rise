
import React, { useState, useEffect, useRef } from 'react';
import { generateReadingExam } from '../services/geminiService';
import { ExamData, LoadingState, UserProgress, ExamResult, ExamMode, Language } from '../types';
import { syncHistoryToCloud, isFirebaseConnected } from '../services/firebaseService';
import { Loader2, CheckCircle2, ArrowRight, Lock, Unlock, Star, AlertCircle, RotateCcw, Home, Clock, User, Check, X, TimerOff, GraduationCap, Languages, BookOpen } from 'lucide-react';

const PASSING_SCORE = 85;
const TOTAL_LEVELS = 12;

interface ReadingLevelsProps {
  language: Language; // Global UI Language
}

// Separate type for the Exam Subject (Content Language)
type ExamSubject = 'ar' | 'en';

const ReadingLevels: React.FC<ReadingLevelsProps> = ({ language }) => {
  const isArUI = language === 'ar'; // Used for UI labels (Buttons, Titles)

  // State for the selected subject (Tab)
  const [examSubject, setExamSubject] = useState<ExamSubject>('ar');

  // State for progress - Dependent on Exam Subject
  const [progress, setProgress] = useState<UserProgress>({ currentLevel: 1, maxUnlockedLevel: 1 });

  // State for active exam flow
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [examMode, setExamMode] = useState<ExamMode>('TIMED');
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false); 
  
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  
  // State for taking the exam
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // Load progress whenever the Exam Subject changes (Subject A vs Subject B)
  useEffect(() => {
    // Reset active exam state when switching tabs
    setActiveLevel(null);
    setExamData(null);
    setIsSetupComplete(false);
    setIsSubmitted(false);
    setUserAnswers({});

    // Load specific progress for this subject
    const saved = localStorage.getItem(`iqra_progress_${examSubject}`);
    setProgress(saved ? JSON.parse(saved) : { currentLevel: 1, maxUnlockedLevel: 1 });
  }, [examSubject]);

  // Save progress
  useEffect(() => {
    localStorage.setItem(`iqra_progress_${examSubject}`, JSON.stringify(progress));
  }, [progress, examSubject]);

  // Timer Logic
  useEffect(() => {
    if (activeLevel && examData && !isSubmitted && examMode === 'TIMED' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            submitExam(); // Auto submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeLevel, examData, isSubmitted, timeLeft, examMode]); 

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLevelSelect = (level: number) => {
    if (level > progress.maxUnlockedLevel) return;
    setActiveLevel(level);
    setIsSetupComplete(false);
    setStudentName('');
    setExamMode('TIMED');
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim().length < 2) return;
    setIsSetupComplete(true);
    startExam(activeLevel!);
  };

  const startExam = async (level: number) => {
    setExamData(null);
    setUserAnswers({});
    setIsSubmitted(false);
    setStatus(LoadingState.LOADING);

    try {
      // Pass the examSubject ('ar' or 'en') to the API, distinct from UI language
      const data = await generateReadingExam(level, examSubject);
      setExamData(data);
      if (examMode === 'TIMED') {
        setTimeLeft(data.timeLimit || 300);
      }
      setStatus(LoadingState.SUCCESS);
    } catch (error) {
      setStatus(LoadingState.ERROR);
    }
  };

  const handleAnswer = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const saveToHistory = (data: ExamData, calculatedScore: number) => {
    const allQuestions = data.sections.flatMap(s => s.questions);

    const historyItem: ExamResult = {
      id: Date.now().toString(),
      studentName: studentName,
      level: data.level,
      score: calculatedScore,
      totalQuestions: allQuestions.length,
      date: new Date().toISOString(),
      mode: examMode,
      language: examSubject, // Track which subject was taken
      details: allQuestions.map(q => ({
        questionText: q.text,
        userAnswer: q.options[userAnswers[q.id]] || (isArUI ? "لم يجب" : "No Answer"),
        correctAnswer: q.options[q.correctIndex],
        isCorrect: userAnswers[q.id] === q.correctIndex
      }))
    };

    const existingHistory = JSON.parse(localStorage.getItem('iqra_exam_history') || '[]');
    const updatedHistory = [...existingHistory, historyItem];
    
    // Save to LocalStorage
    localStorage.setItem('iqra_exam_history', JSON.stringify(updatedHistory));
    
    // Sync to Cloud if connected
    if (isFirebaseConnected()) {
      syncHistoryToCloud(updatedHistory);
    }
  };

  const submitExam = () => {
    if (!examData) return; 
    
    if (timerRef.current) clearInterval(timerRef.current);

    const allQuestions = examData.sections.flatMap(s => s.questions);
    let correctCount = 0;
    allQuestions.forEach(q => {
          if (userAnswers[q.id] === q.correctIndex) {
            correctCount++;
        }
    });
    
    const finalScore = Math.round((correctCount / allQuestions.length) * 100);
    setScore(finalScore);
    
    saveToHistory(examData, finalScore);
    
    setIsSubmitted(true);
    
    if (finalScore >= PASSING_SCORE) {
         if (activeLevel === progress.maxUnlockedLevel && activeLevel! < TOTAL_LEVELS) {
          setProgress(prev => ({
            ...prev,
            maxUnlockedLevel: prev.maxUnlockedLevel + 1
          }));
        }
    }
  };

  const exitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveLevel(null);
    setExamData(null);
    setIsSetupComplete(false);
    setStatus(LoadingState.IDLE);
  };

  const retryExam = () => {
    if (activeLevel) {
      startExam(activeLevel);
    }
  };

  const goToNextLevel = () => {
    if (activeLevel && activeLevel < TOTAL_LEVELS) {
      setActiveLevel(activeLevel + 1);
      startExam(activeLevel + 1);
    }
  };

  // Translations for UI (Buttons, Labels) - Based on `language` prop
  const t = {
    loadingTitle: isArUI ? `مرحباً ${studentName}، جارٍ إعداد الاختبار...` : `Hello ${studentName}, preparing your exam...`,
    loadingDesc: isArUI
      ? `يقوم المعلم الذكي الآن بتأليف نصوص القراءة والأسئلة للمستوى ${activeLevel}.`
      : `The AI Tutor is now generating reading texts and questions for Level ${activeLevel}.`,
    errorTitle: isArUI ? 'عذراً، حدث خطأ' : 'Sorry, an error occurred',
    errorDesc: isArUI ? 'لم نتمكن من توليد الاختبار. يرجى التحقق من الاتصال والمحاولة مرة أخرى.' : 'Could not generate exam. Please check connection and try again.',
    backToList: isArUI ? 'العودة للقائمة' : 'Back to Menu',
    setupTitle: isArUI ? 'إعداد الاختبار' : 'Exam Setup',
    levelLabel: isArUI ? 'مستوى' : 'Level',
    namePlaceholder: isArUI ? 'اسم الطالب' : 'Student Name',
    modeTimed: isArUI ? 'بوقت محدد' : 'Timed',
    modeUntimed: isArUI ? 'مفتوح الوقت' : 'Untimed',
    cancel: isArUI ? 'إلغاء' : 'Cancel',
    start: isArUI ? 'بدء الاختبار' : 'Start Exam',
    exit: isArUI ? 'خروج' : 'Exit',
    passScore: isArUI ? 'النجاح' : 'Pass',
    unlimitedTime: isArUI ? 'وقت مفتوح' : 'Unlimited Time',
    submitBtn: isArUI ? 'اعتماد الإجابة وعرض النتيجة' : 'Submit & Show Results',
    finalScore: isArUI ? 'النتيجة النهائية' : 'Final Score',
    passedMsg: isArUI ? 'ممتاز! لقد اجتزت الاختبار' : 'Excellent! You passed.',
    failedMsg: isArUI ? 'لم تجتز الاختبار هذه المرة' : 'You did not pass this time.',
    nextLevelBtn: isArUI ? 'المستوى التالي' : 'Next Level',
    retryBtn: isArUI ? 'محاولة أخرى (نص جديد)' : 'Retry (New Text)',
    mainMenuBtn: isArUI ? 'القائمة الرئيسية' : 'Main Menu',
    mainTitle: isArUI ? 'اختر مادة الاختبار' : 'Choose Exam Subject',
    beginner: isArUI ? 'مبتدئ' : 'Beginner',
    intermediate: isArUI ? 'متوسط' : 'Interm.',
    advanced: isArUI ? 'متقدم' : 'Advanced',
    qMCQ: isArUI ? 'اختر الإجابة' : 'Multiple Choice',
    qTF: isArUI ? 'صواب أم خطأ' : 'True / False',
    qFill: isArUI ? 'أكمل الفراغ' : 'Fill Blank',
    tabAr: isArUI ? 'اللغة العربية' : 'Arabic Language',
    tabEn: isArUI ? 'اللغة الإنجليزية' : 'English Language',
    subject: isArUI ? 'المادة' : 'Subject'
  };

  // Determine direction for Exam Content (Questions/Passage) independent of UI
  const contentDir = examSubject === 'ar' ? 'rtl' : 'ltr';
  const contentFont = examSubject === 'ar' ? 'font-serif' : 'font-sans';
  const isContentAr = examSubject === 'ar';

  // RENDER: Loading
  if (status === LoadingState.LOADING) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gold-200 rounded-full animate-ping opacity-25"></div>
          <div className="bg-white p-4 rounded-full shadow-xl border border-gold-100 relative z-10">
            <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-primary-900 mb-2">{t.loadingTitle}</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          {t.loadingDesc}
        </p>
      </div>
    );
  }

  // RENDER: Error
  if (status === LoadingState.ERROR) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-4 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">{t.errorTitle}</h3>
        <p className="text-slate-500 mb-6">{t.errorDesc}</p>
        <button onClick={exitExam} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors">
          {t.backToList}
        </button>
      </div>
    );
  }

  // RENDER: Setup Screen (Name & Mode)
  if (activeLevel && !isSetupComplete) {
    return (
       <div className="max-w-md mx-auto px-4 py-20 animate-fade-in">
         <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary-600">
               <User size={32} />
            </div>
            <h2 className="text-2xl font-bold text-primary-950 mb-2">{t.setupTitle}</h2>
            <div className="flex justify-center gap-2 text-slate-500 mb-6 text-sm">
               <span className="bg-slate-100 px-3 py-1 rounded-full">{t.subject}: {examSubject === 'ar' ? t.tabAr : t.tabEn}</span>
               <span className="bg-gold-100 text-gold-700 font-bold px-3 py-1 rounded-full">{t.levelLabel} {activeLevel}</span>
            </div>
            
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <input 
                type="text" 
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full px-5 py-4 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-lg text-center transition-all bg-white text-slate-900 placeholder-slate-400"
              />

              <div className="bg-slate-50 p-2 rounded-xl flex">
                <button
                  type="button"
                  onClick={() => setExamMode('TIMED')}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    examMode === 'TIMED' 
                    ? 'bg-white text-primary-600 shadow-md border border-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Clock size={16} />
                  {t.modeTimed}
                </button>
                <button
                  type="button"
                  onClick={() => setExamMode('UNTIMED')}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    examMode === 'UNTIMED' 
                    ? 'bg-white text-blue-600 shadow-md border border-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <TimerOff size={16} />
                  {t.modeUntimed}
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => setActiveLevel(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
                   {t.cancel}
                 </button>
                 <button type="submit" disabled={!studentName.trim()} className="flex-[2] py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-gold-500/20 transition-all">
                   {t.start}
                 </button>
              </div>
            </form>
         </div>
       </div>
    );
  }

  // RENDER: Active Exam
  if (activeLevel && examData) {
    const isCriticalTime = examMode === 'TIMED' && timeLeft < 60 && !isSubmitted;
    const allQuestions = examData.sections.flatMap(s => s.questions);

    return (
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24 animate-fade-in">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-16 md:top-20 z-30">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
             <button onClick={exitExam} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors text-sm font-bold">
              {isArUI ? <ArrowRight size={18} /> : <ArrowRight size={18} className="rotate-180" />}
              <span className="hidden sm:inline">{t.exit}</span>
            </button>
            <div className="flex items-center gap-2">
               {/* Updated Badge to show Level clearly in the header as requested */}
               <div className="bg-primary-900 text-white px-3 py-1.5 rounded-lg font-bold text-xs md:text-sm shadow-sm flex items-center gap-2">
                  <span className="text-gold-400">{t.levelLabel}</span>
                  <span className="bg-white/20 px-1.5 rounded text-white">{activeLevel}</span>
               </div>
               
               <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold text-xs md:text-sm border border-slate-200 flex items-center gap-2">
                  <User size={14} />
                  <span>{studentName}</span>
               </div>
            </div>
          </div>
          
          {/* Timer Display */}
          {examMode === 'TIMED' ? (
            <div className={`flex items-center gap-2 px-6 py-2 rounded-full font-mono text-xl font-bold border-2 shadow-inner transition-colors ${
              isSubmitted 
                  ? 'bg-slate-100 text-slate-400 border-slate-200' 
                  : isCriticalTime
                      ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                      : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
               <Clock size={20} />
               <span>{formatTime(timeLeft)}</span>
            </div>
          ) : (
             <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-sm font-bold">
               <TimerOff size={16} />
               <span>{t.unlimitedTime}</span>
             </div>
          )}

           <div className="hidden md:block text-sm text-slate-400">
              {t.passScore}: <span className="font-bold text-slate-700">85%</span>
            </div>
        </div>

        {/* Content Area - Sections */}
        {/* IMPORTANT: Use contentDir for exam content, while UI remains in Global Language */}
        <div className="space-y-12" dir={contentDir}>
          {examData.sections.map((section, sIdx) => (
            <div key={section.id} className="grid lg:grid-cols-12 gap-8 border-b border-slate-200 pb-12 last:border-0 last:pb-0">
               {/* Section Title */}
               <div className="lg:col-span-12">
                  <h3 className={`text-xl font-bold text-primary-900 ${isContentAr ? 'border-r-4 pr-3' : 'border-l-4 pl-3'} border-gold-500`}>
                    {section.title}
                  </h3>
               </div>

               {/* Reading Text */}
               <div className="lg:col-span-7">
                 <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 h-full">
                    <div className={`prose prose-lg prose-slate max-w-none leading-loose text-lg md:text-xl text-slate-700 text-justify ${contentFont}`}>
                      {section.content.split('\n').map((paragraph, i) => (
                          <p key={i} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                 </div>
               </div>

               {/* Questions for this section */}
               <div className="lg:col-span-5 space-y-6">
                 {section.questions.map((q, idx) => {
                   const isCorrect = isSubmitted && userAnswers[q.id] === q.correctIndex;
                   const isWrong = isSubmitted && userAnswers[q.id] !== q.correctIndex && userAnswers[q.id] !== undefined;

                   return (
                    <div key={q.id} className={`bg-white p-5 rounded-2xl border-2 transition-all duration-300 ${
                      isSubmitted 
                        ? isCorrect ? 'border-green-400 bg-green-50/50' : isWrong ? 'border-red-200 bg-red-50/50' : 'border-slate-100 opacity-60'
                        : 'border-white shadow-md hover:border-primary-100'
                    }`}>
                      <div className="flex gap-3 mb-4">
                        <div className="flex-shrink-0">
                          <span className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm">
                             {q.id}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                            {q.type === 'TF' ? t.qTF : q.type === 'FILL_BLANK' ? t.qFill : t.qMCQ}
                          </span>
                          <p className={`font-bold text-slate-800 text-lg leading-relaxed ${isContentAr ? 'text-right' : 'text-left'}`}>{q.text}</p>
                        </div>
                      </div>
                      
                      <div className={`grid gap-2 ${q.type === 'TF' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswers[q.id] === optIdx;
                          let btnClass = "relative px-4 py-3 rounded-xl text-base transition-all border-2 ";
                          
                          if (q.type !== 'TF') btnClass += isContentAr ? " text-right " : " text-left ";
                          else btnClass += " text-center ";

                          if (isSubmitted) {
                            if (optIdx === q.correctIndex) {
                              btnClass += "bg-green-500 text-white border-green-600 font-bold shadow-md";
                            } else if (isSelected) {
                              btnClass += "bg-red-100 text-red-700 border-red-200 font-medium";
                            } else {
                              btnClass += "bg-white text-slate-400 border-transparent";
                            }
                          } else {
                            if (isSelected) {
                              btnClass += "bg-primary-50 text-primary-700 border-primary-500 font-bold shadow-sm";
                            } else {
                              btnClass += "bg-slate-50 text-slate-600 border-transparent hover:bg-white hover:border-slate-200";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleAnswer(q.id, optIdx)}
                              disabled={isSubmitted}
                              className={btnClass}
                            >
                              {q.type !== 'TF' && <span className="mx-2 inline-block opacity-50 text-sm uppercase">{String.fromCharCode(65 + optIdx)}.</span>}
                              {opt}
                              {q.type === 'TF' && (
                                 <div className="inline-block mx-2">
                                   {opt.toLowerCase().includes('true') || opt.includes('صواب') || opt.includes('صح') ? <Check size={16} className="inline" /> : <X size={16} className="inline"/>}
                                 </div>
                              )}
                              {isSubmitted && optIdx === q.correctIndex && (
                                <CheckCircle2 size={18} className={`absolute ${isContentAr ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
               </div>
            </div>
          ))}
        </div>

        {/* Footer Actions (UI Language) */}
        <div className="mt-12 pt-8 border-t border-slate-200" dir={isArUI ? 'rtl' : 'ltr'}>
           {!isSubmitted ? (
                <button
                  onClick={submitExam}
                  disabled={Object.keys(userAnswers).length !== allQuestions.length}
                  className="w-full md:w-1/2 mx-auto block py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl shadow-lg shadow-gold-500/20 transition-all transform hover:scale-[1.01]"
                >
                  {t.submitBtn}
                </button>
              ) : (
                <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-slate-100 animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <span className="inline-block px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-sm font-bold mb-2">{t.finalScore}</span>
                    <div className="flex items-center justify-center gap-2 text-5xl font-black">
                       <span className={score >= PASSING_SCORE ? 'text-green-600' : 'text-red-500'}>{score}%</span>
                    </div>
                    <p className={`mt-2 font-medium ${score >= PASSING_SCORE ? 'text-green-600' : 'text-red-500'}`}>
                      {score >= PASSING_SCORE ? t.passedMsg : t.failedMsg}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {score >= PASSING_SCORE && activeLevel < TOTAL_LEVELS ? (
                       <button onClick={goToNextLevel} className="col-span-2 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20">
                         <span>{t.nextLevelBtn}</span>
                         {isArUI ? <ArrowRight size={18} className="rotate-180" /> : <ArrowRight size={18} />}
                       </button>
                    ) : (
                       <button onClick={retryExam} className="col-span-2 py-3 bg-gold-500 text-white rounded-xl font-bold hover:bg-gold-600 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20">
                         <RotateCcw size={18} />
                         <span>{t.retryBtn}</span>
                       </button>
                    )}
                    <button onClick={exitExam} className="col-span-2 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center gap-2">
                      <Home size={18} />
                      <span>{t.mainMenuBtn}</span>
                    </button>
                  </div>
                </div>
              )}
        </div>
      </div>
    );
  }

  // RENDER: Level Selection (Main Menu)
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 pb-24">
      <div className="text-center mb-10">
        <h2 className={`text-3xl md:text-4xl font-bold text-primary-950 mb-4 ${isArUI ? 'font-serif' : 'font-sans'}`}>{t.mainTitle}</h2>
        
        {/* Subject Toggle Tabs */}
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl gap-1 shadow-inner border border-slate-200 mb-6">
           <button 
             onClick={() => setExamSubject('ar')}
             className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
               examSubject === 'ar' 
               ? 'bg-white text-primary-900 shadow-md transform scale-[1.02]' 
               : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
             }`}
           >
             <span className="font-serif text-lg">ض</span>
             {t.tabAr}
           </button>
           <button 
             onClick={() => setExamSubject('en')}
             className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
               examSubject === 'en' 
               ? 'bg-white text-primary-900 shadow-md transform scale-[1.02]' 
               : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
             }`}
           >
             <span className="font-sans text-lg">En</span>
             {t.tabEn}
           </button>
        </div>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((level) => {
          const isLocked = level > progress.maxUnlockedLevel;
          return (
            <button
              key={level}
              onClick={() => handleLevelSelect(level)}
              disabled={isLocked}
              className={`relative h-40 rounded-3xl p-6 flex flex-col items-center justify-between transition-all duration-300 group ${
                isLocked
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-white text-primary-900 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-primary-900/10 hover:-translate-y-1 border border-slate-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold mb-2 transition-colors ${
                isLocked ? 'bg-slate-200 text-slate-500' : 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white'
              }`}>
                {level}
              </div>
              
              <div className="text-center">
                 <span className={`text-sm font-bold block ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                    {t.levelLabel} {level}
                 </span>
                 <span className="text-[10px] text-slate-400 font-medium">
                    {level <= 4 ? t.beginner : level <= 8 ? t.intermediate : t.advanced}
                 </span>
              </div>

              {isLocked ? (
                <Lock size={18} className="text-slate-300 absolute top-4 right-4" />
              ) : (
                <div className="absolute top-4 right-4">
                   {level < progress.maxUnlockedLevel ? (
                      <div className="bg-green-100 text-green-600 p-1 rounded-full"><Check size={12} strokeWidth={3} /></div>
                   ) : (
                      <Unlock size={18} className="text-gold-400" />
                   )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReadingLevels;
