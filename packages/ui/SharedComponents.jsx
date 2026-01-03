// src/components/SharedComponents.jsx
import React from 'react';
import { THEME } from './theme';
import { ChevronRight, Check } from 'lucide-react';

// --- 1. Logo 與 Header ---
export const AppHeader = ({ title, isPro, logoChar = { main: '易', sub: '經' } }) => (
  <div style={{ backgroundColor: THEME.white, padding: '10px 16px', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0, paddingTop: 'max(env(safe-area-inset-top), 10px)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> 
        {/* Logo 圓圈 */}
        <div style={{ width: '36px', height: '36px', backgroundColor: THEME.vermillion, borderRadius: '50%', position: 'relative', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <span style={{ fontFamily: "serif", position: 'absolute', color: 'white', fontSize: '12px', lineHeight: 1, bottom: '26%', right: '8%', pointerEvents: 'none' }}>{logoChar.sub}</span>
            <span style={{ fontFamily: "serif", position: 'absolute', color: 'black', fontSize: '30px', lineHeight: 1, top: '12%', left: '2%', pointerEvents: 'none' }}>{logoChar.main}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: '17px', fontWeight: 'normal', color: '#262626', marginLeft: '4px' }}>{title}</span>
          {isPro && ( <span style={{ fontSize: '10px', color: THEME.orange, border: `1px solid ${THEME.orange}`, borderRadius: '4px', padding: '1px 4px', marginLeft: '6px', fontWeight: 'bold', transform: 'translateY(-2px)' }}>專業版</span> )}
        </div>
      </div>
    </div>
  </div>
);

// --- 2. 底部導航 (Navigator) ---
export const BottomTabBar = ({ tabs, currentTab, onTabChange }) => (
  <div style={{ position: 'relative', width: '100%', zIndex: 50, flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ backgroundColor: THEME.white, borderTop: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px 0' }}>
          {tabs.map(tab => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{ background: 'none', border: 'none', color: isActive ? THEME.blue : THEME.gray, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 }}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    <span style={{ fontSize: '10px', fontWeight: isActive ? 'bold' : 'normal' }}>{tab.label}</span>
                </button>
              );
          })}
      </div>
  </div>
);

// --- 3. 廣告條 ---
export const AdBanner = ({ onRemoveAds }) => (
  <div style={{ height: '60px', backgroundColor: '#f0f0f0', borderTop: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
      <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '3px', padding: '1px 3px', fontSize: '9px', color: '#999' }}>Ad</div>
      <div style={{ fontSize: '12px', color: '#555', display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}><span style={{ fontWeight: 'bold' }}>贊助商廣告</span><span style={{ fontSize: '10px' }}>點擊查看優惠...</span></div>
   </div>
    <button onClick={(e) => { e.stopPropagation(); onRemoveAds(); }} style={{ fontSize: '11px', color: THEME.white, backgroundColor: THEME.black, border: 'none', borderRadius: '12px', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' }}>移除廣告</button>
  </div>
);

// --- 4. 設定頁組件 (會員狀態、按鈕) ---
export const ProStatusCard = ({ isPro, onPurchase }) => (
    <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>會員狀態</h3>
        <div style={{ backgroundColor: THEME.white, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${THEME.border}`, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: isPro ? THEME.orange : THEME.black }}>{isPro ? '專業版' : '免費廣告版'}</div>
              <div style={{ fontSize: '12px', color: THEME.gray, marginTop: '4px' }}>{isPro ? '已啟用無限功能' : '升級以移除所有廣告'}</div>
            </div>
            {!isPro ? ( 
              <button onClick={onPurchase} style={{ backgroundColor: THEME.blue, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>升級</button> 
            ) : ( 
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: THEME.orange, fontWeight: 'bold', fontSize: '13px' }}><Check size={16} /> 已啟用</div> 
            )}
        </div>
    </div>
);

export const SettingLink = ({ label, subLabel, onClick }) => (
    <div onClick={onClick} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: THEME.white, borderBottom: `1px solid ${THEME.border}` }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>{label}</span>
          {subLabel && <span style={{ fontSize: '12px', color: THEME.gray, marginTop: '2px' }}>{subLabel}</span>}
        </div>
        <ChevronRight size={20} color={THEME.gray} />
    </div>
);