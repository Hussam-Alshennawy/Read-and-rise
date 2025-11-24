
import React from 'react';
import { NewsItem, Language } from '../types';
import { Calendar, Newspaper, ImageOff } from 'lucide-react';

interface NewsFeedProps {
  news: NewsItem[];
  language: Language;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ news, language }) => {
  const isAr = language === 'ar';

  const t = {
    title: isAr ? 'أخبار المدرسة' : 'School News',
    subtitle: isAr ? 'تابع آخر المستجدات والفعاليات' : 'Latest updates and events',
    noNews: isAr ? 'لا توجد أخبار حالياً' : 'No news available at the moment',
    readMore: isAr ? 'اقرأ المزيد' : 'Read More',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-[80vh] animate-fade-in">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
          <Newspaper size={32} />
        </div>
        <h2 className={`text-3xl md:text-4xl font-bold text-primary-950 mb-3 ${isAr ? 'font-serif' : 'font-sans'}`}>
          {t.title}
        </h2>
        <p className="text-slate-500 text-lg">{t.subtitle}</p>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-400 font-medium">{t.noNews}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <article 
              key={item.id} 
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all duration-300 flex flex-col h-full"
            >
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {/* Fallback if no image or error */}
                <div className={`w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 ${item.imageUrl ? 'hidden' : ''}`}>
                   <ImageOff size={32} />
                </div>
                
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-primary-800 shadow-sm flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(item.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1 line-clamp-4">
                  {item.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
