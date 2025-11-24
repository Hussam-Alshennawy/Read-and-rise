
import React from 'react';
import { Language, AppSettings } from '../types';

interface FooterProps {
  language?: Language;
  settings?: AppSettings;
}

const Footer: React.FC<FooterProps> = ({ language = 'ar', settings }) => {
  const t = {
    schoolName: language === 'ar' ? (settings?.schoolNameAr || 'مدرسة صلالة الخاصة') : (settings?.schoolNameEn || 'Salalah Private School'),
    rights: language === 'ar' ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'
  };

  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-8 text-center hidden md:block">
      <div className="max-w-4xl mx-auto px-4">
        <p className="text-slate-700 text-base font-bold mb-1">
          {t.schoolName}
        </p>
        <p className="text-slate-400 text-sm">
          {t.rights} Hussam Alshennawy &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
