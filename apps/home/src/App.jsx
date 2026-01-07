import React, { useState } from 'react';
import { Compass, Grid, Calendar, Sparkles, Mail, Shield, ChevronRight, X } from 'lucide-react';

// --- 設定與資料 ---
const APPS = [
  {
    id: 'bazi',
    name: '元星八字',
    desc: '專業四柱八字排盤，精準計算大運流年，支援早晚子時與真太陽時。',
    url: 'https://bazi.mrkfengshui.com',
    icon: <Grid size={40} color="#1890ff" />,
    color: '#e6f7ff'
  },
  {
    id: 'compass',
    name: '元星風水',
    desc: '結合電子羅庚與玄空飛星排盤，即時方位吉凶分析與商戰佈局。',
    url: 'https://compass.mrkfengshui.com',
    icon: <Compass size={40} color="#fa8c16" />,
    color: '#fff7e6'
  },
  {
    id: 'zhiwei',
    name: '元星紫微',
    desc: '紫微斗數命盤解析，自定義安星法則，深入探討命主與身主運勢。',
    url: 'https://zhiwei.mrkfengshui.com',
    icon: <Sparkles size={40} color="#722ed1" />,
    color: '#f9f0ff'
  },
  {
    id: 'calendar',
    name: '進氣萬年曆',
    desc: '專業萬年曆查詢，結合農曆、節氣與干支對照，擇日必備工具。',
    url: 'https://calendar.mrkfengshui.com',
    icon: <Calendar size={40} color="#52c41a" />,
    color: '#f6ffed'
  }
];

// --- 隱私權政策彈窗 (AdSense 必備) ---
const PrivacyModal = ({ onClose }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
  }} onClick={onClose}>
    <div style={{
      background: 'white', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
      borderRadius: '12px', padding: '30px', position: 'relative'
    }} onClick={e => e.stopPropagation()}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
      <h2 style={{ marginTop: 0 }}>隱私權政策 (Privacy Policy)</h2>
      <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#555' }}>
        <p><strong>生效日期：2026年1月1日</strong></p>
        <p>許甯博風水命理館 (Master K Fengshui Centre) 非常重視您的隱私。本隱私權政策說明我們如何收集、使用及保護您的資訊。</p>
        
        <h4>1. 資訊收集</h4>
        <p>當您使用我們的應用程式（八字、風水、紫微、萬年曆）時，我們僅會在您的裝置本機端進行運算。除非您主動使用「雲端備份」功能，否則我們不會將您的個人命理資料上傳至伺服器。</p>
        
        <h4>2. Cookie 與廣告</h4>
        <p>我們使用 Google AdSense 服務來顯示廣告。Google 可能會使用 Cookie 來根據您先前對本網站或其他網站的造訪紀錄來放送廣告。您可以前往 Google 的廣告設定頁面，停用個人化廣告。</p>
        
        <h4>3. 資料安全</h4>
        <p>我們會採取適當的安全措施來保護您的資料，防止未經授權的存取或洩漏。</p>
        
        <h4>4. 聯絡我們</h4>
        <p>如果您對本隱私權政策有任何疑問，請透過 Email 聯絡我們：mail@mrkfengshui.com</p>
      </div>
    </div>
  </div>
);

// --- 主頁面組件 ---
export default function LandingPage() {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#333', background: '#fcfcfc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ fontWeight: '900', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#000', color: 'white', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>K</div>
          <span>許甯博風水命理館</span>
        </div>
        <a href="mailto:mail@mrkfengshui.com" style={{ textDecoration: 'none', color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mail size={16} /> 聯絡我們
        </a>
      </header>

      {/* 2. Hero Section */}
      <section style={{ padding: '80px 20px', textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #f5f5f5 100%)' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-1px' }}>
          結合傳統命理與現代科技
        </h1>
        <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
          打造最專業、流暢且精準的線上命理工具。無論是八字排盤、紫微斗數還是風水堪輿，許甯博風水命理館都是您最可靠的幫手。
        </p>
      </section>

      {/* 3. App Grid */}
      <section style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {APPS.map(app => (
            <a key={app.id} href={app.url} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ 
                background: 'white', borderRadius: '16px', padding: '30px', 
                border: '1px solid #eee', transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%', display: 'flex', flexDirection: 'column',
                cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
              }} 
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)'; }}
              >
                <div style={{ background: app.color, width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  {app.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{app.name}</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', flex: 1 }}>{app.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', color: '#007aff', fontWeight: 'bold', fontSize: '14px', marginTop: '16px' }}>
                  立即使用 <ChevronRight size={16} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 4. Footer */}
      <footer style={{ borderTop: '1px solid #eaeaea', padding: '40px 20px', marginTop: '40px', background: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setShowPrivacy(true)}>隱私權政策 (Privacy Policy)</span>
            <span>•</span>
            <a href="mailto:mail@mrkfengshui.com" style={{ textDecoration: 'none', color: '#666' }}>mail@mrkfengshui.com</a>
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            © {new Date().getFullYear()} 許甯博風水命理館 (Master K Fengshui Centre). All rights reserved.
          </div>
        </div>
      </footer>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}