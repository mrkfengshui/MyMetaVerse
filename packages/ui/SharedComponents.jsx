// packages/ui/SharedComponents.jsx
import React, { useEffect } from 'react';
import { THEME } from './theme';
import { ChevronRight, Coffee } from 'lucide-react';

// --- 1. AppHeader ---
export const AppHeader = ({ title, logoChar = { main: '甯', sub: '博' } }) => {
  const apps = [
    { name: '八字', url: 'https://bazi.mrkfengshui.com', id: 'bazi' },
    { name: '紫微', url: 'https://zhiwei.mrkfengshui.com', id: 'zhiwei' },
    { name: '風水', url: 'https://compass.mrkfengshui.com', id: 'compass' },
    { name: '萬年曆', url: 'https://calendar.mrkfengshui.com', id: 'calendar' },
  ];

  return (
    <header style={{ 
      backgroundColor: THEME.white, 
      height: THEME.layout.headerHeight, 
      padding: '0 12px',
      borderBottom: `1px solid ${THEME.border}`, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      paddingTop: 'max(env(safe-area-inset-top), 4px)',
      flexShrink: 0,
      zIndex: 100
    }}>
      {/* 左邊：Logo 與 標題 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> 
        <div style={{ 
            width: '38px', height: '38px',
            backgroundColor: THEME.vermillion, borderRadius: '50%', 
            position: 'relative', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
            <span style={{ fontFamily: THEME.fonts.heading, position: 'absolute', color: 'white', fontSize: '14px', lineHeight: 1, bottom: '26%', right: '8%', pointerEvents: 'none' }}>{logoChar.sub}</span>
            <span style={{ fontFamily: THEME.fonts.heading, position: 'absolute', color: 'black', fontSize: '26px', lineHeight: 1, top: '12%', left: '2%', pointerEvents: 'none' }}>{logoChar.main}</span>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#262626' }}>{title}</span>
      </div>

      {/* 右邊：導航連結 */}
      <nav style={{ display: 'flex', gap: '12px' }}>
        {apps.map((app) => (
          <a 
            key={app.id} 
            href={app.url} 
            style={{
              textDecoration: 'none',
              color: title.includes(app.name) ? THEME.vermillion : '#999',
              fontFamily: THEME.fonts.heading,
              fontSize: '13px',
              fontWeight: title.includes(app.name) ? 'bold' : 'normal',
              whiteSpace: 'nowrap'
            }}
          >
            {app.name}
          </a>
        ))}
      </nav>
    </header>
  );
};

// --- 2. 底部導航 (Navigator) ---
export const BottomTabBar = ({ tabs, currentTab, onTabChange }) => (
  <div style={{ 
      position: 'relative', width: '100%', zIndex: 50, flexShrink: 0, 
      backgroundColor: THEME.white, borderTop: `1px solid ${THEME.border}`,
      paddingBottom: 'env(safe-area-inset-bottom)' 
  }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', height: '56px', alignItems: 'center' }}>
          {tabs.map(tab => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{ background: 'none', border: 'none', color: isActive ? THEME.blue : THEME.gray, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', flex: 1, padding: '4px' }}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span style={{ fontSize: '10px', fontWeight: isActive ? 'bold' : 'normal' }}>{tab.label}</span>
                </button>
              );
          })}
      </div>
  </div>
);

// --- 3. 廣告條 (已整合 Google AdSense) ---
export const AdBanner = () => {
  useEffect(() => {
    // 當組件載入後，通知 Google 顯示廣告
    try {
      // 確保 window.adsbygoogle 存在才執行
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div style={{ 
      margin: '16px 0', 
      textAlign: 'center', 
      minHeight: '100px', 
      backgroundColor: '#f9f9f9', // 預設背景色，避免廣告載入前是一片白
      overflow: 'hidden'
    }}>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-7726414602786917"
           data-ad-slot="5586624662"
           data-ad-format="auto"
           data-full-width-responsive="true">
      </ins>

      {/* 開發模式提示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ padding: '10px', fontSize: '12px', color: '#999' }}>
          [廣告開發模式] ID: 5586624662 (上線後會顯示真廣告)
        </div>
      )}
    </div>
  );
};

// --- 4. 設定頁組件群 ---

// 設定選項連結
export const SettingLink = ({ label, subLabel, icon: Icon, onClick }) => (
    <div onClick={onClick} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: THEME.white, borderBottom: `1px solid ${THEME.bg}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {Icon && <Icon size={20} color={THEME.blue} />}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: THEME.black }}>{label}</span>
            {subLabel && <span style={{ fontSize: '11px', color: THEME.gray, marginTop: '2px' }}>{subLabel}</span>}
          </div>
        </div>
        <ChevronRight size={18} color={THEME.lightGray} />
    </div>
);

// 請我飲杯咖啡
export const BuyMeCoffee = () => (
    <a href="https://buymeacoffee.com/kanekyosan" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', backgroundColor: '#FFDD00', color: '#000000', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', marginTop: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <Coffee size={20} />
        <span>請我飲杯咖啡</span>
    </a>
);

const COMMON_INFO = {
  agreement: "本程式提供的資訊僅供參考，使用者應自行判斷吉凶。\n開發者不對因使用本程式而產生的任何直接或間接後果負責。",
  contactEmail: "mail@mrkfengshui.com",
};

// --- 5. 應用程式資訊卡 (關於、條款、聯絡) ---
export const AppInfoCard = ({ info }) => {
  const finalInfo = { 
    ...COMMON_INFO, 
    ...info,
    emailSubject: info.emailSubject || `關於 ${info.appName || '元星應用程式'} 的建議`
  };  

const handleContactClick = () => { 
    if (finalInfo.contactEmail) {
        window.location.href = `mailto:${finalInfo.contactEmail}?subject=${encodeURIComponent(finalInfo.emailSubject)}`; 
    }
  };

  const InfoRow = ({ label, content, isLast, onClick, showArrow }) => (
    <div onClick={onClick} style={{ 
        padding: '16px', 
        borderBottom: isLast ? 'none' : `1px solid ${THEME.bg}`, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: onClick ? THEME.white : 'transparent',
        transition: 'background-color 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>{label}</div>
        {showArrow && <ChevronRight size={18} color={THEME.gray} />}
      </div>
      {content && <div style={{ fontSize: '14px', color: THEME.gray, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{content}</div>}
    </div>
  );

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>關於與支援</h3>
      <div style={{ backgroundColor: THEME.white, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
        
        {/* 關於 (來自 App 傳入) */}
        <InfoRow label="關於" content={finalInfo.about} />
        
        {/* 服務協議 (來自共用預設值) */}
        <InfoRow label="服務協議" content={finalInfo.agreement} />
        
        {/* 版本資訊 (來自 App 傳入) */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${THEME.bg}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>版本資訊</span>
            <span style={{ fontSize: '14px', color: THEME.gray }}>{finalInfo.version}</span>
        </div>

        {/* 聯絡我們 (點擊使用共用 Email) */}
        <div onClick={handleContactClick} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: THEME.white, transition: '0.2s' }}
             onMouseDown={e => e.currentTarget.style.backgroundColor = THEME.bgGray}
             onMouseUp={e => e.currentTarget.style.backgroundColor = THEME.white}
        >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.blue }}>聯絡我們</span>
              <span style={{ fontSize: '12px', color: THEME.gray, marginTop: '2px' }}>回報問題或提供建議</span>
            </div>
            <ChevronRight size={20} color={THEME.gray} />
        </div>
      </div>
      
      <div style={{ marginTop: '10px', textAlign: 'center', color: THEME.lightGray, fontSize: '11px', paddingBottom: '10px' }}>
          System Build: {finalInfo.version}
      </div>
    </div>
  );
};