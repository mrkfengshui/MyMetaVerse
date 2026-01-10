import React, { useState, useEffect } from 'react';
import { 
  Compass, Grid, Calendar, Sparkles, Mail, ChevronRight, X, 
  BookOpen, ArrowRight, Facebook, Instagram, Youtube, PlayCircle, List 
} from 'lucide-react';
import { AdBanner } from '@my-meta/ui';

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
  { id: 'fwawNW1_FVc', title: '【點算自己支命系列】我係咪二奶命？' },
  { id: '2WX5VFLQEck', title: '【風水睇樓團@許甯博】煥然懿居坐西向東風水好唔好?' },
  { id: 'BJXqWMmS7Pw', title: 'Ep1 骰子都可以做手信?' },
  { id: 'lwl8Mz_0bL0', title: 'Ep2 獅、獅子!? 琉球有獅子?' },
  { id: 'XyKd83FreAQ', title: '【點算家居風水系列】屋企風水自己睇(上)' },
  { id: 'R8J1Jqee4yo', title: '【點算家居風水系列】屋企風水自己睇(下)' }
];

// --- 2. 文章資料庫 ---
const ARTICLES = [
  {
    id: 1,
    title: '想拍拖可以點做?',
    date: '2026-01-10',
    summary: '一般人對自己生活中會感到困惑的不外乎金錢、健康、人際關係幾大面向',
    content: `
一般人對自己生活中會感到困惑的不外乎金錢、健康、人際關係幾大面向。想拍拖、結婚、愛情、感情等區域更加是人際關係裡的一大板塊。

如果未拍拖想拍拖，可以在流年一白位置，即今年的中間位或明年的西北位放一樽上窄下闊的水瓶，裡面放1枚10元硬幣及10枚1元硬幣（港幣），水盛八分滿，勤換水。水瓶旁邊放陶泥製公仔（男求女，放女性；女求男，放男性）。當然，如你想將來對象長得可愛就放可愛的公仔，想大隻就放大隻仔，你想點樣就點樣😆

就算朋友嚟到屋企都睇唔出你擺咗風水，
一D都唔老土㗎❗️mm7😏

如果以上略嫌繁複，可以只放水瓶、盛水及放紅花，但紅花要不能帶刺，必需要鮮花及常換。實際運作上可能會比放公仔更花時間。 
    `
  },
  {
    id: 2,
    title: '吉日點擇：烏兔太陽太陰日',
    date: '2025-3-17',
    summary: '史小翠自創了一門金烏刀法，專門用來克制雪山派白自在的雪山劍法，每一招每一式都跟雪山劍法針鋒相對',
    content: `
烏即是太陽，兔即是太陰！金庸著作《俠客行》中的史小翠自創了一門金烏刀法，專門用來克制雪山派白自在的雪山劍法，每一招每一式都跟雪山劍法針鋒相對。

擇日用事選擇烏兔太陽吉日吉時，可以化解三煞五黃及一切諸般凶神惡煞均於此時迴避。不怕犯太歲、三煞、陰府、空亡、退氣、金神、年剋等絕大部份凶煞，無論修造、作灶、安葬、開張等事，用太陽值日值時均大吉大利。是遇凶煞，揀無可揀時的殺手鐧！惟此法若逢五黃會力士、三煞會五黃仍不可用。

烏兔太陽太陰日的計法複雜，不是此刻純文字可以解析明瞭，在此不贅。也不是所有擇日軟件能夠免費包含計算，加上每月最多只有三至四天太陽日且極難碰到實際用事的日子，尤其是香港人最重視的星期六星期日，如能碰巧遇到真的是大大的吉日！

如2021年4月打算搬屋，牽涉到農曆二月及三月。經一輪計算後得整個4月只有4月3日、4月19日及4月28日是太陽日，其中只有4月3日是星期六。此日辛巳滿日，農曆二月廿二，「天空、往亡日，不宜動土。但修造，百事俱吉，若在乾巽二宮起造皆吉，出行、開張、婚姻、入宅，內有黃羅、紫檀、田塘、庫貯，諸星蓋照，主年內家生貴子，田蠶興旺，永代吉昌。」

咦咦？此日既是太陽日，又諸星蓋照永代吉昌，可以用作搬屋啊！恭喜恭喜！

但結婚呢？可惜每逢廿二是三娘煞，此日不宜用作嫁娶矣。

註：太陽日宜用太陽時，太陰日宜用太陰時。一般婚嫁用太陰日比太陽日佳。

以上即擇日師傅之重要性。 
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
    name: '八字',
    desc: '精準計算大運流年流月',
    url: 'https://bazi.mrkfengshui.com',
    icon: <Grid size={40} color="#1890ff" />,
    color: '#e6f7ff'
  },
  {
    id: 'compass',
    name: '風水',
    desc: '結合羅庚與各式風水砂法水法理論。',
    url: 'https://compass.mrkfengshui.com',
    icon: <Compass size={40} color="#fa8c16" />,
    color: '#fff7e6'
  },
  {
    id: 'zhiwei',
    name: '紫微斗數',
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
            <Sparkles size={20} color="#fa8c16" /> 工具開發
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

      {/* 6. 廣告條 */}
      <div style={containerStyle}>
         <AdBanner />
      </div>

      {/* 7. Footer */}
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