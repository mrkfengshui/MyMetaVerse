// packages/ui/useProtection.js
import { useEffect, useState } from 'react';

export const useProtection = (allowedDomains = []) => {
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    // 1. 網域鎖 (Domain Lock)
    // 防止別人下載你的源碼後，掛在他們自己的網域
    const currentDomain = window.location.hostname;
    
    // 如果是 localhost (開發中) 永遠允許
    const isLocal = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');
    
    // 檢查是否在允許的網域清單內 (例如 your-app.vercel.app)
    // 如果 allowedDomains 為空，則不檢查 (預設允許)
    const isAllowed = allowedDomains.length === 0 || allowedDomains.some(d => currentDomain.includes(d));

    if (!isLocal && !isAllowed) {
      setIsAuthorized(false);
      // 強制跳轉或停止運作
      document.body.innerHTML = '<h1 style="text-align:center; margin-top:50px;">Access Denied: Invalid Domain</h1>';
      return;
    }

    // 2. 簡單的防右鍵/防檢查元素
    const handleContext = (e) => e.preventDefault(); // 禁用右鍵
    
    const handleKey = (e) => {
      // 禁用 F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
      }
    };

    const style = document.createElement('style');
    style.innerHTML = `
      body {
        -webkit-user-select: none; /* Chrome/Safari */
        -moz-user-select: none;    /* Firefox */
        -ms-user-select: none;     /* IE10+ */
        user-select: none;         /* Standard */
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('copy', preventDefault);        // 防 Ctrl+C
    document.addEventListener('cut', preventDefault);         // 防 Ctrl+X
    document.addEventListener('selectstart', preventDefault); // 防滑鼠選取

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      // 移除樣式 (如果需要的話，通常 body 防選取可以保留)
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [allowedDomains]);

  return isAuthorized;
};