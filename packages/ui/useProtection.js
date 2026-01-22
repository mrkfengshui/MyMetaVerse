import { useEffect, useState } from 'react';

export const useProtection = (allowedDomains = []) => {
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    // --- 1. 網域鎖 ---
    const currentDomain = window.location.hostname;
    const isLocal = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
    // 如果 allowedDomains 有值才檢查
    const isAllowed = allowedDomains.length === 0 || allowedDomains.some(d => currentDomain.includes(d));

    if (!isLocal && !isAllowed) {
      setIsAuthorized(false);
      document.body.innerHTML = '<h1 style="text-align:center; margin-top:50px;">Access Denied: Invalid Domain</h1>';
      return;
    }

    // --- 2. 定義共用阻擋函式 ---
    const preventEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // --- 3. 鍵盤阻擋 (F12, 開發者工具快捷鍵) ---
    const handleKey = (e) => {
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // --- 4. 注入 CSS (防選取 + 手機強制直屏遮罩) ---
    const style = document.createElement('style');
    style.innerHTML = `
      /* 防選取 */
      body {
        -webkit-user-select: none; /* Chrome/Safari */
        -moz-user-select: none;    /* Firefox */
        -ms-user-select: none;     /* IE10+ */
        user-select: none;         /* Standard */
        -webkit-touch-callout: none; /* 禁用 iOS 長按選單 */
      }

      /* 手機橫屏遮罩 (Landscape Block) */
      #orientation-lock-overlay {
        display: none;
      }
      
      @media screen and (orientation: landscape) and (max-width: 900px) {
        #orientation-lock-overlay {
          display: flex;
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: #000;
          color: #fff;
          z-index: 99999;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
        }
        /* 隱藏主內容 */
        #root { display: none; }
      }
    `;
    document.head.appendChild(style);

    // 建立橫屏提示元素
    const lockDiv = document.createElement('div');
    lockDiv.id = 'orientation-lock-overlay';
    lockDiv.innerHTML = `
      <div style="font-size: 40px; margin-bottom: 20px;">📱</div>
      <h3>為了最佳體驗<br/>請將手機轉為直向</h3>
    `;
    document.body.appendChild(lockDiv);

    // --- 5. 綁定事件 ---
    document.addEventListener('contextmenu', preventEvent); // 禁右鍵
    document.addEventListener('keydown', handleKey);        // 禁快捷鍵
    document.addEventListener('copy', preventEvent);        // 禁複製
    document.addEventListener('cut', preventEvent);         // 禁剪下
    document.addEventListener('selectstart', preventEvent); // 禁選取
    document.addEventListener('dragstart', preventEvent);   // 禁拖曳圖片

    // 清理函式
    return () => {
      document.removeEventListener('contextmenu', preventEvent);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('copy', preventEvent);
      document.removeEventListener('cut', preventEvent);
      document.removeEventListener('selectstart', preventEvent);
      document.removeEventListener('dragstart', preventEvent);
      
      if (document.head.contains(style)) document.head.removeChild(style);
      if (document.body.contains(lockDiv)) document.body.removeChild(lockDiv);
    };
  }, [allowedDomains]);

  return isAuthorized;
};