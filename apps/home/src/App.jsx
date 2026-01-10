import React, { useState, useEffect } from 'react';
import { 
  Compass, Grid, Calendar, Sparkles, Mail, ChevronRight, X, 
  BookOpen, ArrowRight, Facebook, Instagram, Youtube, PlayCircle, List 
} from 'lucide-react';

// --- 0. 社群媒體連結 ---
const SOCIAL_LINKS = [
  { 
    id: 'fb', 
    name: 'Facebook', 
    url: 'https://www.facebook.com/mrfungshui', 
    icon: <Facebook size={24} />,
    color: '#1877F2' 
  },
  { 
    id: 'ig', 
    name: 'Instagram', 
    url: 'https://www.instagram.com/kanekyosan', 
    icon: <Instagram size={24} />,
    color: '#E4405F' 
  },
  { 
    id: 'yt', 
    name: 'YouTube', 
    url: 'https://www.youtube.com/@scientificfungshui2942',   
    icon: <Youtube size={24} />,
    color: '#FF0000' 
  }
];

// --- 1. YouTube 影片列表 ---
const VIDEOS = [
  { id: 'https://youtu.be/fwawNW1_FVc?si=oqmR5hHBP9oACr_k', title: '【點算自己支命系列】我係咪二奶命？' },
  { id: 'https://youtu.be/2WX5VFLQEck?si=6iuZQNcXkv6EWhq3', title: '【風水睇樓團@許甯博】煥然懿居坐西向東風水好唔好?' },
  { id: 'https://youtu.be/BJXqWMmS7Pw?si=CoNOKkeDw_8jXwAU', title: 'Ep1 骰子都可以做手信?' },
  { id: 'https://youtu.be/lwl8Mz_0bL0?si=J1IxolLyODSv9UFw', title: 'Ep2 獅、獅子!? 琉球有獅子?' },
  { id: 'https://youtu.be/XyKd83FreAQ?si=lsbdyXp2e4trDbQ-', title: '【點算家居風水系列】屋企風水自己睇(上)' },
  { id: 'https://youtu.be/R8J1Jqee4yo?si=wks5FmTC8ogRky4x', title: '【點算家居風水系列】屋企風水自己睇(下)' }
];

// --- 2. 文章資料庫 ---
const ARTICLES = [
  {
    id: 1,
    title: '美國八字與經濟關係',
    date: '2021-07-22',
    summary: '美國八字印比相生，喜金水為用。現行庚午運本已不利局勢穩定，流年多次減息目的其實在於穩定市況，通過操作息率去刺激經濟週期。',
    content: `
美國以1776年7月4日於費城大陸會議中宣布獨立宣言，從大英帝國及喬治三世國王的殖民統治脫離獨立的日子起八字。

時日月年
癸己甲丙
酉丑午申

近百年美國從1925年開始入己卯運，1935年戊寅運，1945年丁丑運，1955年丙子運，1965年乙亥運，1975年甲戌運，1985年癸酉運，1995年壬申運，2005年辛未運，2015年庚午運，2025年己巳運。

現在美國在行2015年庚午大運，此七年間已經歷多次聯儲局議息來救市。每次都會影響到股市走勢，或前後因果，總之就是互有關係。

如2015乙未年，16丙申年，17丁酉年，19己亥年三次，20庚子年兩次。

美國八字印比相生，喜金水為用。現行庚午運本已不利局勢穩定，流年多次減息目的其實在於穩定市況，通過操作息率去刺激經濟週期。可見到幾乎每次都在利用金水年份去救市，那麼今年辛丑，下年壬寅，23年癸卯、24年甲辰又如何呢？大家可自行思考。 
    `
  },
  {
    id: 2,
    title: '八字點算：我可以移民嗎？',
    date: '2021-3-17',
    summary: '八字不只是算命，更是一份人生的預報',
    content: `
甯博近來接到最多客人的問題就係可以移民嗎，通常社會動蕩、治安惡化時市民先會大量興起移民的念頭。縱觀香港史，1945年香港重光後；1967年六七暴動後；1984年簽訂《中英聯合聲明》後；1989年六四事件後；1997年香港主權移交前；2014年雨傘運動後；2019年反送中運動及2020年人大訂立《香港國安法》後都比較多市民移民海外。

但係，移民還移民，移民後能否順利歸化、適應他國的生活，講白點係搵唔搵到食，才是移民的真正目的。於1994年至2006年間，每年都有大量移民回流香港。所以負責任的命師除咗算可否移民外，亦應推算能否順利歸化，不再回流。從八字上點算移民命呢？

移民離開出生地，一定需要地支多動，動能越大越好，充足的動能為一象。其次要看本命原局有否驛馬的因，即是有否移民的基因，物理學的位能，位能轉換變為動能，為象二。本命加上大運流年有合之情誼，為象三。如此才能構成移民的移，但最後要看能否歸化為民，即搵唔搵到食，要看命局中食祿財養是否夠力，成為支撐移民後的生活所需，為象四。此四隻象俱備，才能批斷命主能順利移民。否則半路折返，命師錢進了袋，客戶損失的金錢、時間、機遇卻無法彌補，愧疚矣！

例：

時日月年運年
＊＊＊＊＊庚
巳申未亥酉子

此命原局亥巳沖，驛馬在時支。大運酉與巳三合，流年子與申三合。四象中三。可移！可惜最為關鍵的一象，財星亥水不是用神，無力成為支撐外地生活的財祿。即使勉強移民亦未能在當地安居樂業，不久後必會回流原居地。最終斷定未能真正的移民。
    `
  },
  {
    id: 3,
    title: '風水其實是什麼？',
    date: '2026-01-01',
    summary: '風水是空間能量的運用。運用得當則風水好，運用不當則風水差',
    content: `
文皺皺的古文就不引述了，隨便Google一下都成萬篇幅。閱，又不等於會。

經常聽人論及，明堂要深要闊、水要過堂而聚，關懷有情、微風輕拂。前雀後玄左龍右虎。說白點，其實是空間能量的運用。運用得當則風水好，運用不當則風水差。

風水是操作聲能、光能和熱能去催旺生氣，達至趨吉避凶的效果。

香港山多地少，人口稠密。不論商住，望出窗永遠都是樓，睇10次風水8次都係滿目探頭砂。間格永遠都是門、廳、（廚、廁）、窗，穿堂煞的固定格局，香港地本身物價指數又高，又怎能不易破財漏財呢？

.

一般師傅會叫你放銅錢、放水杯、放乜放物。甯博的風水是改善氣場，重新引導能量。將漏財變為不亂花錢，將破財變成破得有價值甚至增值！將擺風水變美觀，營造沒有擺風水感的風水。 
    `
  }
];

// --- 3. 設定與資料 (Apps) ---
const APPS = [
  {
    id: 'bazi',
    name: '甯博八字',
    desc: '精準計算大運流年流月',
    url: 'https://bazi.mrkfengshui.com',
    icon: <Grid size={40} color="#1890ff" />,
    color: '#e6f7ff'
  },
  {
    id: 'compass',
    name: '甯博風水',
    desc: '結合羅庚與各式風水砂法水法理論。',
    url: 'https://compass.mrkfengshui.com',
    icon: <Compass size={40} color="#fa8c16" />,
    color: '#fff7e6'
  },
  {
    id: 'zhiwei',
    name: '甯博紫微斗數',
    desc: '紫微斗數命盤解析，依據明朝全書。',
    url: 'https://zhiwei.mrkfengshui.com',
    icon: <Sparkles size={40} color="#722ed1" />,
    color: '#f9f0ff'
  },
  {
    id: 'calendar',
    name: '進氣萬年曆',
    desc: '非一般的萬年曆。',
    url: 'https://calendar.mrkfengshui.com',
    icon: <Calendar size={40} color="#52c41a" />,
    color: '#f6ffed'
  }
];

// --- 隱私權政策彈窗 ---
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
        <p>許甯博風水命理館 (Master K Fengshui Centre) 非常重視您的隱私。</p>
        <h4>1. 資訊收集</h4>
        <p>我們僅在您的裝置本機端進行運算，不會上傳您的命理資料至伺服器。</p>
        <h4>2. Cookie 與廣告</h4>
        <p>我們使用 Google AdSense 服務來顯示廣告。Google 可能會使用 Cookie。</p>
        <h4>3. 聯絡我們</h4>
        <p>Email：mail@mrkfengshui.com</p>
      </div>
    </div>
  </div>
);

// --- 主頁面組件 ---
export default function LandingPage() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [activeArticleId, setActiveArticleId] = useState(ARTICLES[0].id);
  
  const activeArticle = ARTICLES.find(a => a.id === activeArticleId) || ARTICLES[0];

  useEffect(() => {
    if (VIDEOS.length > 0) {
      const randomIndex = Math.floor(Math.random() * VIDEOS.length);
      setFeaturedVideo(VIDEOS[randomIndex]);
    }
  }, []);

  const containerStyle = {
    maxWidth: '1400px', 
    margin: '0 auto', 
    width: '100%',
    paddingLeft: '20px',
    paddingRight: '20px',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#333', background: '#fcfcfc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 注入 CSS */}
      <style>{`
        .article-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .article-grid {
            grid-template-columns: 2fr 1fr;
          }
        }
        .article-list-item:hover {
          background-color: #f0f7ff;
          border-color: #1890ff;
        }
        /* 自定義捲軸樣式 */
        .article-content-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .article-content-scroll::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 4px;
        }
        .article-content-scroll::-webkit-scrollbar-thumb {
          background: #ccc; 
          border-radius: 4px;
        }
        .article-content-scroll::-webkit-scrollbar-thumb:hover {
          background: #999; 
        }
      `}</style>

      {/* 1. Header (文字常駐顯示) */}
      <header style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ ...containerStyle, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: '900', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ width: '45px', height: '45px', objectFit: 'contain' }}
              />
              <span style={{ color: '#222', fontSize: '18px', sm: { fontSize: '22px' } }}>許甯博風水命理館 since 2021</span>
            </div>
            
            <a href="mailto:mail@mrkfengshui.com" style={{ textDecoration: 'none', color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={16} /> <span style={{display:'none', sm:{display:'inline'}}}>聯絡我們</span>
            </a>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{ padding: '80px 0', textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #f5f5f5 100%)' }}>
        <div style={containerStyle}>
            <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-1px' }}>
            玄學就是科學
            </h1>
            <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            專為你提供最專業玄學服務，自研最流暢且精準的線上命理工具。
            </p>
        </div>
      </section>

      {/* 3. YouTube Video Section */}
      <section style={{ padding: '20px 0', ...containerStyle }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlayCircle size={20} color="#FF0000" /> 精選影片
        </h3>
        
        {featuredVideo ? (
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{ 
                background: 'white', borderRadius: '12px', overflow: 'hidden',
                border: '1px solid #eee', display: 'flex', flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
                  <iframe 
                    src={`https://www.youtube.com/embed/${featuredVideo.id}`} 
                    title={featuredVideo.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', lineHeight: '1.4' }}>{featuredVideo.title}</h4>
                </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>載入影片中...</div>
        )}
      </section>

      {/* 4. Articles Section (左右固定高度) */}
      <section style={{ padding: '40px 0', ...containerStyle }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#722ed1" /> 命理專欄
        </h3>
        
        <div className="article-grid">
          {/* 左側閱讀區：移除 display:flex，改為 block，確保寬度佔滿 */}
          <div 
            className="article-content-scroll"
            style={{ 
              display: 'block', // 關鍵修正：確保區塊是 Block 元素，會自動填滿寬度
              background: 'white', borderRadius: '16px', padding: '30px', 
              border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              height: '500px',      // 固定高度
              width: '750px',
              overflowY: 'auto'     // 內容捲動
          }}>
            <span style={{ fontSize: '13px', color: '#999', marginBottom: '8px', display: 'block' }}>
               正在閱讀 | {activeArticle.date}
            </span>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '28px', color: '#222' }}>{activeArticle.title}</h2>
            <div style={{ width: '50px', height: '4px', background: '#722ed1', marginBottom: '20px', borderRadius: '2px' }}></div>
            
            {/* 內容區：確保寬度 100% */}
            <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#444', whiteSpace: 'pre-line', width: '100%' }}>
              {activeArticle.content}
            </div>
          </div>

          {/* 右側列表區：固定高度 + 內部捲動 */}
          <div 
             className="article-content-scroll"
             style={{ 
               display: 'flex', 
               flexDirection: 'column', 
               gap: '12px',
               height: '500px',  // 固定高度
               overflowY: 'auto', 
               paddingRight: '4px' 
          }}>
             <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexShrink: 0 }}>
                <List size={16} /> 更多文章
             </div>
             {ARTICLES.map(article => {
               const isActive = article.id === activeArticleId;
               return (
                 <div 
                   key={article.id} 
                   onClick={() => setActiveArticleId(article.id)}
                   className="article-list-item"
                   style={{ 
                      padding: '16px', borderRadius: '10px', 
                      background: isActive ? '#f9f0ff' : 'white', 
                      border: isActive ? '1px solid #722ed1' : '1px solid #eee',
                      cursor: 'pointer', transition: 'all 0.2s',
                      position: 'relative',
                      flexShrink: 0 
                   }}
                 >
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{article.date}</div>
                    <div style={{ fontSize: '15px', fontWeight: isActive ? 'bold' : '500', color: isActive ? '#722ed1' : '#333' }}>
                      {article.title}
                    </div>
                    {isActive && <ChevronRight size={16} color="#722ed1" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />}
                 </div>
               );
             })}
          </div>
        </div>
      </section>

      {/* 5. App Grid */}
      <section style={{ padding: '40px 0', ...containerStyle }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#fa8c16" /> 線上工具
        </h3>
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '24px',
            width: '100%'
        }}>
          {APPS.map(app => (
            <a key={app.id} href={app.url} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
              <div style={{ 
                background: 'white', borderRadius: '16px', padding: '30px', 
                border: '1px solid #eee', transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%', display: 'flex', flexDirection: 'column',
                cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                boxSizing: 'border-box'
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

      {/* 6. Footer */}
      <footer style={{ borderTop: '1px solid #eaeaea', padding: '40px 0', marginTop: '40px', background: 'white' }}>
        <div style={{ ...containerStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            {SOCIAL_LINKS.map(social => (
              <a 
                key={social.id} 
                href={social.url} 
                target="_blank" 
                rel="noreferrer" 
                title={social.name}
                style={{ 
                  color: '#888', 
                  transition: 'color 0.3s, transform 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = social.color; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {social.icon}
              </a>
            ))}
          </div>

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