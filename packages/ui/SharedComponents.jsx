// packages/ui/SharedComponents.jsx
import React, { useEffect, useState, useRef } from 'react';
import { THEME } from './theme';
import { ChevronRight, Coffee, Gift,
  Share, X, PlusSquare, Share2, UploadCloud,
  Menu, PlusCircle, MoreHorizontal, MoreVertical
  } from 'lucide-react';

// --- 1. AppHeader ---
export const AppHeader = ({ title, logoChar = { main: '甯', sub: '博' } }) => {
  const apps = [
    { name: '八字', url: 'https://bazi.mrkfengshui.com', id: 'bazi' },
    { name: '紫微', url: 'https://zhiwei.mrkfengshui.com', id: 'zhiwei' },
    { name: '風水', url: 'https://compass.mrkfengshui.com', id: 'compass' },
    { name: '奇門', url: 'https://qimen.mrkfengshui.com', id: 'qimen' },
    { name: '萬年曆', url: 'https://calendar.mrkfengshui.com', id: 'calendar' },
  ];

  // 👇 新增：強制鎖定 Viewport 禁止縮放
  useEffect(() => {
    // 1. 嘗試尋找現有的 viewport meta tag
    let meta = document.querySelector('meta[name="viewport"]');
    
    // 2. 如果沒有，創建一個新的
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    // 3. 設定關鍵屬性：user-scalable=no, maximum-scale=1.0
    // width=device-width, initial-scale=1.0 是基本 RWD 設定
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

    // 4. 防止 iOS Safari 雙擊縮放 (額外防護)
    const preventDoubleTap = (e) => {
      // 這裡不需要做任何事，只是為了讓某些舊版瀏覽器知道我們有處理 touch
    };
    document.addEventListener('touchstart', preventDoubleTap, { passive: false });

    // 5. 防止 iOS Safari 雙指縮放 (額外防護 - 攔截 gesturestart)
    const preventGesture = (e) => {
      e.preventDefault();
    };
    document.addEventListener('gesturestart', preventGesture);

    // 自動刷新邏輯 (Auto Reload on Return)
    const checkAutoReload = () => {
      const STORAGE_KEY = 'app_last_active_timestamp';
      // 設定過期時間：24 小時 (單位毫秒)
      // 測試時可以改成 10000 (10秒) 來試試看效果
      const THRESHOLD = 24 * 60 * 60 * 1000; 
      
      const now = Date.now();
      const lastActive = localStorage.getItem(STORAGE_KEY);

      // 如果有上次紀錄，且時間差超過設定值
      if (lastActive && (now - parseInt(lastActive, 10) > THRESHOLD)) {
        console.log('App has been in background for too long. Reloading...');
        // 更新時間戳記，避免無線迴圈 (雖然後面會 reload，但以防萬一)
        localStorage.setItem(STORAGE_KEY, now.toString());
        // 強制刷新頁面以獲取最新版本
        window.location.reload();
      } else {
        // 沒過期，單純更新時間
        localStorage.setItem(STORAGE_KEY, now.toString());
      }
    };

    const handleVisibilityChange = () => {
      // 當頁面變為「可見」時 (使用者打開 App)
      if (document.visibilityState === 'visible') {
        checkAutoReload();
      } else {
        // 當頁面變為「隱藏」時 (使用者跳出/鎖屏)，記錄當下時間
        localStorage.setItem('app_last_active_timestamp', Date.now().toString());
      }
    };

    // 監聽可見度變化
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 初始化：剛打開 App 時也記錄一次時間
    localStorage.setItem('app_last_active_timestamp', Date.now().toString());

    return () => {
      document.removeEventListener('touchstart', preventDoubleTap);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('visibilitychange', handleVisibilityChange); // 清除監聽
    };
  }, []);

  return (
    <header style={{ 
      backgroundColor: THEME.white, 
      minHeight: '48px', 
      paddingTop: 'max(env(safe-area-inset-top), 2px)', 
      paddingLeft: '12px',
      paddingRight: '12px',
      borderBottom: `1px solid ${THEME.border}`, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* 注入全域 CSS，控制所有 App 的旋轉與顯示行為 */}
      <style>{`
        /* 0. 強制鎖定為亮色模式 (關鍵修改) */
        :root {
          color-scheme: light; /* 告訴瀏覽器此網站不支援深色模式 */
        }

        /* 1. 基礎設定 */
        body {
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          height: -webkit-fill-available;
          overflow-x: hidden; 
          position: fixed;
          top: 0;
          left: 0; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          
          /* 強制文字顏色，防止系統反轉 */
          color: #262626; 
          -webkit-font-smoothing: antialiased;
          -webkit-user-select: none; /* Safari 專用 */
          -moz-user-select: none;    /* Firefox */
          -ms-user-select: none;     /* IE */
          user-select: none;         /* 標準屬性 */
          -webkit-touch-callout: none; /* 關鍵！禁止 iOS 長按彈出放大鏡/選單 */
        }
        #root {
          width: 100%;
          height: 100%;
          height: 100dvh;
          overflow: hidden; /* 防止 root 本身出現捲軸 */
          display: flex;
          flex-direction: column;
        }

        /* 1.1 強制表單元件顏色 (解決輸入框變黑、文字變白問題) */
        input, select, textarea {
        　font-size: 16px !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #e8e8e8; /* 確保邊框顏色正常 */
          
          /* iOS 特有屬性：強制填色 */
          -webkit-text-fill-color: #8c8c8c !important; 
          -webkit-opacity: 1 !important;
          -webkit-user-select: text !important;
          user-select: text !important;
          -webkit-touch-callout: default !important; /* 恢復輸入框的長按貼上功能 */
        }

        /* 修正 placeholder (提示文字) 在某些夜間模式下變太淡的問題 */
        ::placeholder {
          color: #999999 !important;
          opacity: 1;
        }

        /* 2. 針對「橫屏手機」的遮罩提示 (原本的邏輯) */
        @media screen and (orientation: landscape) and (max-width: 1024px) {
          #root { display: none !important; }
          body {
            background-color: #000 !important;
            width: 100vw !important;
            height: 100vh !important;
            overflow: hidden !important;
            position: fixed !important;
            top: 0; left: 0; z-index: 99999;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            color: #fff !important; /* 橫屏提示必須是白色 */
          }
          body::after {
            content: "為了最佳體驗，請將螢幕轉為直向 📱";
            color: #fff;
            font-size: 16px;
            font-weight: 500;
            letter-spacing: 1px;
            text-align: center;
            white-space: pre-wrap;
            pointer-events: none;
            opacity: 0.9;
          }
        }
      `}</style>

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
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 30px)' 
  }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', height: '75px', alignItems: 'center' }}>
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
      minHeight: '50px', 
      backgroundColor: '#f9f9f9', 
      overflow: 'hidden',
      display: 'flex',            // 新增：確保內容垂直置中
      alignItems: 'center',       // 新增：確保內容垂直置中
      justifyContent: 'center'    // 新增：確保內容水平置中
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
          [廣告開發] ID: 5586624662
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
export const BuyMeCoffee = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
      <h3 style={{ fontSize: '14px', color: '#888', margin: '0 0 4px 4px' }}>支持開發者</h3>
      
      {/* 1. Buy Me a Coffee */}
      <a href="https://buymeacoffee.com/kanekyosan" target="_blank" rel="noreferrer" 
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
          width: 'auto', padding: '14px',
          backgroundColor: '#FFDD00', color: '#000000', 
          borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', 
          boxShadow: '0 4px 10px rgba(255, 221, 0, 0.3)',
          transition: 'transform 0.1s'
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Coffee size={20} />
        <span>請我飲杯咖啡</span>
      </a>

      {/* 2. Adsterra SmartLink */}
      <a href="https://www.effectivegatecpm.com/h7md4wmxk?key=ef72536b8dd24291d5af1d01d858e1b4" target="_blank" rel="noreferrer" 
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
          width: 'auto', padding: '14px',
          backgroundColor: '#ffffff', color: '#555555', 
          border: '1px solid #e0e0e0',
          borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', 
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          transition: 'transform 0.1s'
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Gift size={20} />
        <span>免費贊助 (點擊觀看廣告)</span>
      </a>
    </div>
  );
};

const COMMON_INFO = {
  agreement: "本程式提供的資訊僅供參考，使用者應自行判斷吉凶。\n開發者不對因使用本程式而產生的任何直接或間接後果負責。",
  contactEmail: "mail@mrkfengshui.com",
};

// --- 5. 應用程式資訊卡 (關於、條款、聯絡) ---
export const AppInfoCard = ({ info }) => {
  const finalInfo = { 
    ...COMMON_INFO, 
    ...info,
    emailSubject: info.emailSubject || `關於 ${info.appName || '應用程式'} 的建議`
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
    </div>
  );
};

// --- 6. 安裝引導提示 (Update: iOS & Samsung) ---
export const InstallGuide = () => {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSamsung, setIsSamsung] = useState(false);
  
  // 1. 建立 ref 來引用提示視窗的 DOM 元素
  const guideRef = useRef(null);

  useEffect(() => {
    // 檢查 Standalone 與 localStorage (保持不變)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const hasClosed = localStorage.getItem('installGuideClosed');

    if (!isStandalone && !hasClosed) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      const isSamsungBrowser = /samsungbrowser/.test(userAgent);

      setIsIOS(isIosDevice);
      setIsSamsung(isSamsungBrowser);
      
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  // 2. 自動消失計時器 (10秒)
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 10000); 
      return () => clearTimeout(timer);
    }
  }, [show]);

  // 3. 點擊畫面其他地方自動關閉 (Click Outside)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 如果提示顯示中，且點擊的目標不在 guideRef (提示視窗) 內
      if (show && guideRef.current && !guideRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    // 同時監聽滑鼠與觸控事件
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [show]);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem('installGuideClosed', 'true');
  };

  if (!show) return null;

  return (
    // 4. 綁定 ref 到最外層 div
    <div ref={guideRef} style={{
      position: 'fixed', bottom: '20px', left: '16px', right: '16px',
      backgroundColor: 'rgba(30, 30, 30, 0.95)', color: '#fff',
      padding: '20px', borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      zIndex: 1000, backdropFilter: 'blur(10px)',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <button onClick={handleClose} style={{ 
        position: 'absolute', top: '20px', right: '10px', 
        background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' 
      }}>
        <X size={40} />
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📲 為獲得最佳體驗，在智能電話上使用此應用程式</span>
        </div>
        
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#ddd' }}>
          並加入主畫面，即可<strong>全螢幕使用</strong>並隱藏網址列。
        </p>

        {isIOS ? (
          // iOS 專用教學 (已更新：分享圖示 或 橫向三點)
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span>1. 點擊瀏覽器下方的分享圖示</span>
              <Share size={16} style={{ color: '#fff' }} />
              <span>或</span>
              <MoreHorizontal size={16} style={{ color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>2. 選擇共享</span>
              <PlusSquare size={16} />
              <span style={{ fontWeight: 'bold', color: '#fff' }}>加至主畫面</span>
            </div>
          </div>
        ) : isSamsung ? (
          // Samsung 專用教學 (新增)
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>1. 右下角三條線</span>
              <Menu size={16} style={{ color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>2. 點擊「加入至」</span>
              <PlusCircle size={16} style={{ color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>3. 選擇「主螢幕」</span>
            </div>
          </div>
        ) : (
          // Generic Android / Chrome
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span>點擊瀏覽器右上角或右下角的</span>
                <MoreVertical size={16} style={{ color: '#fff' }} />
                <span>或</span>
                <MoreHorizontal size={16} style={{ color: '#fff' }} />
                <span>或</span>
                <Menu size={16} style={{ color: '#fff' }} />
            </div>
            <div>
                選擇 <strong>加至主畫面</strong> 或 <strong>安裝應用程式</strong>。
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// --- 7. WebBackupManager (支援雲端備份) ---
export const WebBackupManager = ({ data, onRestore, prefix = 'APP_BACKUP' }) => {
  
  // 產生檔案並觸發備份 (分享或下載)
  const handleBackup = async () => {
    if (!data || data.length === 0) return alert('目前沒有資料可供備份');

    const fileName = `${prefix}_${new Date().toISOString().slice(0, 10)}.json`;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });

    // 檢測是否支援原生分享 (手機通常支援)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: '備份資料',
          text: `這是您的 ${prefix} 備份檔案，請選擇儲存至 iCloud、Google Drive 或其他雲端硬碟。`,
          files: [file],
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('分享失敗:', error);
          downloadFile(blob, fileName);
        }
      }
    } else {
      // 電腦版或不支援分享的瀏覽器 -> 直接下載
      downloadFile(blob, fileName);
    }
  };

  // 輔助：傳統下載方式
  const downloadFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 處理檔案匯入
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed)) {
          const confirmRestore = window.confirm(
            `檢測到備份檔案包含 ${parsed.length} 筆資料。\n\n確定要匯入嗎？\n(這將會覆蓋/合併您現有的資料)`
          );
          if (confirmRestore) {
            onRestore(parsed);
          }
        } else {
          alert('檔案格式錯誤：這似乎不是有效的備份檔。');
        }
      } catch (error) {
        console.error(error);
        alert('讀取失敗：檔案可能已損壞。');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>資料備份與還原</h3>
      
      <div style={{ backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '16px' }}>
        <p style={{ fontSize: '13px', color: THEME.gray, margin: '0 0 16px 0', lineHeight: '1.5' }}>
          您可以將資料備份至 <strong>iCloud / Google Drive</strong>，或下載到本機。
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* 備份按鈕 (主藍色) */}
          <button 
            onClick={handleBackup}
            style={{ 
              flex: 1, 
              padding: '14px 16px',
              borderRadius: '30px', 
              border: 'none', 
              // 改用 THEME.blue
              backgroundColor: THEME.blue, 
              color: 'white', 
              fontWeight: 'bold',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
          >
            <Share2 size={18} />
            <span>備份 / 匯出</span>
          </button>

          {/* 還原按鈕 (淺藍色) */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileImport}
              style={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                opacity: 0, cursor: 'pointer', zIndex: 2 
              }} 
            />
            <button 
              style={{ 
                width: '100%', 
                height: '100%', 
                padding: '14px 16px', 
                borderRadius: '8px', 
                border: 'none', // 移除邊框，讓背景色更純粹
                // 改用 THEME.bgBlue 和 THEME.blue
                backgroundColor: THEME.bgBlue, 
                color: THEME.blue, 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px'
              }}
            >
              <UploadCloud size={18} />
              <span>還原 / 匯入</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 8. 廣告條 Adsterra (300x250)
export const Adsterra = () => {
  const bannerRef = useRef(null);

  useEffect(() => {
    const container = bannerRef.current;
    if (!container) return;

    // 清空容器，避免重複渲染
    container.innerHTML = '';

    // 建立一個 iframe
    const iframe = document.createElement('iframe');
    
    // ★ 關鍵：設定 Sandbox 屬性
    // allow-scripts: 允許執行廣告的 JS
    // allow-same-origin: 允許資源載入
    // ❌ 不加 allow-top-navigation: 這就是禁止廣告強制轉址的關鍵！
    // ❌ 不加 allow-popups: 禁止自動彈出新視窗 (視需求，若廣告商要求點擊要開新窗，可能需加這項，但先不加最安全)
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups'); 
    
    iframe.style.width = '300px';
    iframe.style.height = '250px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    
    container.appendChild(iframe);

    // 廣告配置 (請確認您的 key 是否正確對應 300x250 Banner)
    const adScript = `
      <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }</style>
      <script type="text/javascript">
        atOptions = {
          'key' : '621f5e8b755596d4912f3d558fa25f54', 
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      </script>
      <script type="text/javascript" src="https://www.highperformanceformat.com/621f5e8b755596d4912f3d558fa25f54/invoke.js"></script>
    `;

    // 將廣告代碼寫入 iframe 內部
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(adScript);
    doc.close();

  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', width: '100%' }}>
      {/* 外部容器 */}
      <div 
        ref={bannerRef} 
        style={{ 
          width: '300px', 
          height: '250px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      ></div>
    </div>
  );
};

// 9. 廣告條 AdsterraNarrow (320x50)
export const AdsterraNarrow = () => {
  const bannerRef = useRef(null);

  useEffect(() => {
    const container = bannerRef.current;
    if (!container) return;

    // 清空容器，避免重複渲染
    container.innerHTML = '';

    // 建立一個 iframe
    const iframe = document.createElement('iframe');
    
    // ★ 關鍵：設定 Sandbox 屬性
    // allow-scripts: 允許執行廣告的 JS
    // allow-same-origin: 允許資源載入
    // ❌ 不加 allow-top-navigation: 這就是禁止廣告強制轉址的關鍵！
    // ❌ 不加 allow-popups: 禁止自動彈出新視窗 (視需求，若廣告商要求點擊要開新窗，可能需加這項，但先不加最安全)
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups'); 
    
    iframe.style.width = '320px';
    iframe.style.height = '50px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    
    container.appendChild(iframe);

    // 廣告配置 (請確認您的 key 是否正確對應 320x50 Banner)
    const adScript = `
      <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }</style>
      <script type="text/javascript">
        atOptions = {
          'key' : '17db7e5eb0c309e6639a663dd7fb235b', 
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      </script>
      <script type="text/javascript" src="https://www.highperformanceformat.com/17db7e5eb0c309e6639a663dd7fb235b/invoke.js"></script>
    `;

    // 將廣告代碼寫入 iframe 內部
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(adScript);
    doc.close();

  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', width: '100%' }}>
      {/* 外部容器 */}
      <div 
        ref={bannerRef} 
        style={{ 
          width: '320px', 
          height: '50px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      ></div>
    </div>
  );
};