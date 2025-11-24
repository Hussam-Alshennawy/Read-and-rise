
import React from 'react';
import { BookOpen, Atom, Lightbulb } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-16 h-16", showText = false }) => {
  return (
    <div className={`relative flex items-center gap-3 ${className}`}>
      {/* The Graphical Logo */}
      <div className="relative w-full h-full aspect-square">
        <svg viewBox="0 0 200 180" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Left Page (Orange Outline) */}
          <path
            d="M 20 20 L 80 20 C 85 20 90 25 90 30 L 90 140 C 90 145 85 150 80 150 L 30 150 Q 10 150 10 120 L 10 30 C 10 25 15 20 20 20 Z"
            stroke="#ea580c" 
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="white"
          />
          
          {/* Internal Lines (Left Page) */}
          <line x1="30" y1="50" x2="70" y2="50" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
          <line x1="30" y1="80" x2="70" y2="80" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
          <line x1="30" y1="110" x2="70" y2="110" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />

          {/* Right Page (Blue Outline) */}
          <path
            d="M 110 30 C 110 25 115 20 120 20 L 180 20 C 185 20 190 25 190 30 L 190 120 Q 190 150 170 150 L 120 150 C 115 150 110 145 110 140 L 110 30 Z"
            stroke="#1e3a8a" 
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="white"
          />

          {/* Circles Backgrounds for Icons (Right Page) */}
          <circle cx="150" cy="50" r="18" fill="#ea580c" />
          <circle cx="150" cy="90" r="18" fill="#ea580c" />
          <circle cx="150" cy="130" r="18" fill="#ea580c" />
        </svg>

        {/* Overlay Icons (Absolute Positioning to match the circles) */}
        {/* Top: Book */}
        <div className="absolute top-[22%] right-[20%] text-white transform -translate-x-[2px]">
           <BookOpen size="16%" strokeWidth={2.5} className="w-full h-full" />
        </div>
        {/* Middle: Atom */}
        <div className="absolute top-[44%] right-[20%] text-white transform -translate-x-[2px]">
           <Atom size="16%" strokeWidth={2.5} className="w-full h-full" />
        </div>
        {/* Bottom: Lightbulb */}
        <div className="absolute top-[67%] right-[20%] text-white transform -translate-x-[2px]">
           <Lightbulb size="16%" strokeWidth={2.5} className="w-full h-full" />
        </div>
      </div>

      {/* Optional Text (if needed inline) */}
      {showText && (
        <div className="hidden md:block">
           <h1 className="text-xl font-bold text-slate-800 leading-none font-serif">اقرأ وارتق</h1>
           <span className="text-xs text-primary-600 font-medium">منصة القراءة المتدرجة</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
