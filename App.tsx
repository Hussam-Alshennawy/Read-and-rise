import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ReadingLevels from './components/ReadingLevels';
import ChatFeature from './components/ChatFeature';
import AdminDashboard from './components/AdminDashboard';
import NewsFeed from './components/NewsFeed'; 
import Footer from './components/Footer';
import { AppTab, Language, AppSettings, NewsItem, CloudConfig } from './types';
import { initFirebase, listenToNews, listenToSettings, isFirebaseConnected } from './services/firebaseService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [language, setLanguage] = useState<Language>('ar');

  // -- State for Settings & News --
  const [settings, setSettings] = useState<AppSettings>({
    schoolNameAr: 'مدرسة صلالة الخاصة',
    schoolNameEn: 'Salalah Private School',
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isCloudActive, setIsCloudActive] = useState(false);

  // -- Load Local Data on Mount --
  useEffect(() => {
    const savedSettings = localStorage.getItem('iqra_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const savedNews = localStorage.getItem('iqra_news');
    if (savedNews) setNews(JSON.parse(savedNews));

    // Try Initial Cloud Connection
    connectToCloud();
  }, []);

  // -- Function to Initialize/Re-initialize Cloud --
  const connectToCloud = useCallback(async () => {
    const savedCloudConfig = localStorage.getItem('iqra_cloud_config');
    let unsubscribeNews = () => {};
    let unsubscribeSettings = () => {};

    if (savedCloudConfig) {
      try {
        const config: CloudConfig = JSON.parse(savedCloudConfig);
        
        // Await the initialization explicitly
        const connected = await initFirebase(config);
        setIsCloudActive(connected);
        
        if (connected) {
          console.log("Cloud Connection Established");
          // Subscribe to Realtime Updates
          unsubscribeNews = listenToNews((cloudNews) => {
            if (cloudNews) {
              setNews(cloudNews);
              localStorage.setItem('iqra_news', JSON.stringify(cloudNews));
            }
          });

          unsubscribeSettings = listenToSettings((cloudSettings) => {
            if (cloudSettings) {
              setSettings(cloudSettings);
              localStorage.setItem('iqra_settings', JSON.stringify(cloudSettings));
            }
          });
        }
      } catch (e) {
        console.error("Failed to parse cloud config or connect", e);
        setIsCloudActive(false);
      }
    } else {
      setIsCloudActive(false);
    }

    // Cleanup listeners when this effect/callback is re-run or component unmounts
    // Note: Since we are in a top-level component, we mostly rely on overwrite behavior or manual disconnect logic
    return () => {
      unsubscribeNews();
      unsubscribeSettings();
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.HOME:
        return <Hero onNavigate={setActiveTab} language={language} settings={settings} />;
      case AppTab.LEVELS:
        return <ReadingLevels language={language} />;
      case AppTab.CHAT:
        return <ChatFeature />; 
      case AppTab.NEWS:
        return <NewsFeed news={news} language={language} />;
      case AppTab.ADMIN:
        return (
          <AdminDashboard 
            settings={settings} 
            setSettings={setSettings} 
            news={news} 
            setNews={setNews}
            onCloudConnect={connectToCloud} // Pass connection trigger
            isCloudConnectedProp={isCloudActive}
          />
        );
      default:
        return <Hero onNavigate={setActiveTab} language={language} settings={settings} />;
    }
  };

  return (
    <div 
      className={`min-h-screen flex flex-col bg-slate-50 font-sans ${language === 'en' ? 'font-sans' : 'font-sans'}`} 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        language={language}
        setLanguage={setLanguage}
        settings={settings}
        isCloudConnected={isCloudActive}
      />
      
      <main className="flex-1">
        {renderContent()}
      </main>

      {activeTab === AppTab.HOME && <Footer language={language} settings={settings} />}
    </div>
  );
};

export default App;