
import React from 'react';
import { AppTab, Language, AppSettings } from '../types';
import { GraduationCap, MessageCircle, Home, ClipboardList, BookOpen, Languages, Newspaper, Cloud, Wifi } from 'lucide-react';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  settings?: AppSettings;
  isCloudConnected?: boolean;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, language, setLanguage, settings, isCloudConnected }) => {
  
  const translations = {
    ar: {
      home: 'الرئيسية',
      levels: 'مستويات القراءة',
      chat: 'المعلم المساعد',
      news: 'أخبارنا',
      admin: 'لوحة المعلم',
      title: 'اقرأ وارتق',
      subtitle: 'علم.. فهم.. عمل'
    },
    en: {
      home: 'Home',
      levels: 'Reading Levels',
      chat: 'AI Tutor',
      news: 'Our News',
      admin: 'Teacher Panel',
      title: 'Read & Rise',
      subtitle: 'Learn.. Understand.. Act'
    }
  };

  const t = translations[language];

  const navItems = [
    { id: AppTab.HOME, label: t.home, icon: Home },
    { id: AppTab.LEVELS, label: t.levels, icon: GraduationCap },
    { id: AppTab.CHAT, label: t.chat, icon: MessageCircle },
    { id: AppTab.NEWS, label: t.news, icon: Newspaper },
    { id: AppTab.ADMIN, label: t.admin, icon: ClipboardList },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="bg-primary-950 text-white shadow-lg sticky top-0 z-50 border-b border-primary-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity" 
            onClick={() => setActiveTab(AppTab.HOME)}
          >
            <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center p-1 border border-white/10 overflow-hidden relative">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <BookOpen size={32} className="text-gold-400" />
              )}
            </div>
            <div>
              <h1 className={`text-2xl font-bold text-gold-400 leading-none tracking-wide flex items-center gap-2 ${language === 'ar' ? 'font-serif' : 'font-sans'}`}>
                {t.title}
                {/* Status Indicator Dot */}
                {isCloudConnected && (
                  <span className="relative flex h-3 w-3" title="متصل بالسحابة">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </h1>
              <span className="text-xs text-primary-300 font-light opacity-80">{t.subtitle}</span>
            </div>
          </div>

          {/* Desktop Navigation & Language Switch */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm ${
                      isActive 
                        ? 'bg-primary-800 text-white shadow-inner border border-primary-700' 
                        : 'text-primary-200 hover:bg-primary-900/50 hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="h-8 w-px bg-primary-800 mx-1"></div>

            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-900 hover:bg-primary-800 border border-primary-700 text-gold-400 text-sm font-bold transition-all"
            >
              <Languages size={16} />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          </div>
          
           {/* Mobile Language Switcher (Visible on mobile header) */}
           <div className="md:hidden flex items-center gap-2">
              {isCloudConnected && <Wifi size={16} className="text-green-500 animate-pulse" />}
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-900 border border-primary-700 text-gold-400 text-xs font-bold"
              >
                <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
              </button>
           </div>
        </div>
      </div>

      {/* Mobile Navigation Bar (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                  isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Header;