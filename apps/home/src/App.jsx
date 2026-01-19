import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { db } from './firebase'; 
import { collection, getDocs, addDoc, orderBy, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  BookOpen, PlayCircle, Grid, Compass, Sparkles, Calendar, List, Plus, Lock,
  Facebook, Instagram, Youtube, X, Mail, ChevronRight, Menu,
  Edit, Trash2, RefreshCw
} from 'lucide-react';
import { AdBanner } from '@my-meta/ui';

// --- 0. 社群媒體連結 ---
const SOCIAL_LINKS = [
  { id: 'fb', name: 'Facebook', url: 'https://www.facebook.com/mrfungshui', icon: <Facebook size={24} />, color: '#1877F2' },
  { id: 'ig', name: 'Instagram', url: 'https://www.instagram.com/kanekyosan', icon: <Instagram size={24} />, color: '#E4405F' },
  { id: 'yt', name: 'YouTube', url: 'https://www.youtube.com/@scientificfungshui2942', icon: <Youtube size={24} />, color: '#FF0000' }
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

// --- 2. Apps 資料 ---
const APPS = [
  { id: 'bazi', name: '八字', desc: '精準計算大運流年流月', url: 'https://bazi.mrkfengshui.com', icon: <Grid size={40} color="#1890ff" />, color: '#e6f7ff' },
  { id: 'compass', name: '風水', desc: '結合羅庚與各式風水砂法水法理論', url: 'https://compass.mrkfengshui.com', icon: <Compass size={40} color="#fa8c16" />, color: '#fff7e6' },
  { id: 'zhiwei', name: '紫微斗數', desc: '紫微斗數命盤解析', url: 'https://zhiwei.mrkfengshui.com', icon: <Sparkles size={40} color="#722ed1" />, color: '#f9f0ff' },
  { id: 'calendar', name: '年月進氣萬年曆', desc: '非一般的萬年曆', url: 'https://calendar.mrkfengshui.com', icon: <Calendar size={40} color="#52c41a" />, color: '#f6ffed' }
];

// --- 3. 預設文章 ---
const DEFAULT_ARTICLES = [
  {
    id: 'default-1',
    title: '系統罷工了',
    date: '2026-01-01',
    content: '喔噢! 系統罷工了工程師正在安撫中'
  }
];

// --- 隱私權彈窗 ---
const PrivacyModal = ({ onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="modal-close"><X /></button>
      <h2>隱私權政策</h2>
      <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#555' }}>
        <p><strong>生效日期：2026年1月1日</strong></p>
        <p>許甯博風水命理館非常重視您的隱私。</p>
        <p>我們僅在您的裝置本機端進行運算，不會上傳您的命理資料。</p>
        <p>Email：mail@mrkfengshui.com</p>
      </div>
    </div>
  </div>
);

// --- 頁面 1：後台 (Admin Page - 發布後留在此頁) ---
function AdminPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 文章列表管理狀態
  const [articles, setArticles] = useState([]);
  const [editingId, setEditingId] = useState(null); 

  // 移除了 navigate，發布後不再跳轉
  // const navigate = useNavigate(); 

  // 登入驗證
  const handleLogin = () => {
    if (password === 'mrk888') { // ⚠️ 請自行修改密碼
      setIsLoggedIn(true);
      fetchArticles(); // 登入後讀取文章列表
    } else {
      alert('密碼錯誤');
    }
  };

  // 讀取文章列表
  const fetchArticles = async () => {
    try {
      const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArticles(data);
    } catch (error) {
      console.error("讀取失敗", error);
    }
  };

  // 處理表單送出 (新增 或 修改)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // 鎖定按鈕，顯示處理中

    try {
      if (editingId) {
        // --- 修改模式 ---
        const articleRef = doc(db, "articles", editingId);
        await updateDoc(articleRef, {
          title: title,
          content: content,
          updatedAt: new Date()
        });
        alert('文章修改成功！'); // 提示成功
        setEditingId(null); // 退出修改模式，變回新增模式
      } else {
        // --- 新增模式 ---
        await addDoc(collection(db, "articles"), {
          title: title,
          content: content,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date()
        });
        alert('新文章已發布！您可以繼續新增下一篇。'); // 提示成功
      }
      
      // 1. 清空表單 (讓用戶可以馬上打下一篇)
      setTitle('');
      setContent('');
      
      // 2. 重新讀取下方列表 (立刻看到剛剛新增的文章)
      fetchArticles();
      
      // 3. 注意：這裡不再執行 navigate('/')，所以會停留在後台

    } catch (error) {
      console.error("操作失敗: ", error);
      alert('操作失敗，請檢查網路或 Firebase 設定');
    } finally {
      // 4. 無論成功或失敗，最後一定會解除按鈕鎖定，不會卡住
      setLoading(false); 
    }
  };

  // 點擊「修改」按鈕
  const handleEditClick = (article) => {
    setTitle(article.title);
    setContent(article.content);
    setEditingId(article.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 捲動到上方填寫區
  };

  // 點擊「取消修改」
  const handleCancelEdit = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  // 點擊「刪除」按鈕
  const handleDeleteClick = async (id) => {
    if (window.confirm('確定要永久刪除這篇文章嗎？此動作無法復原。')) {
      try {
        await deleteDoc(doc(db, "articles", id));
        fetchArticles(); // 刪除後重新整理列表
      } catch (error) {
        alert('刪除失敗');
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
        <h2>管理員登入</h2>
        <input 
            type="password" placeholder="輸入密碼" 
            value={password} onChange={e => setPassword(e.target.value)} 
            style={{ padding: '12px', margin: '10px 0', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ccc' }} 
        />
        <button onClick={handleLogin} style={{ width: '100%', padding: '12px', background: '#722ed1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>登入</button>
        <div style={{marginTop: '20px'}}><Link to="/">返回首頁</Link></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>
          {editingId ? <><Edit size={24} style={{verticalAlign:'middle'}}/> 修改文章</> : <><Plus size={24} style={{verticalAlign:'middle'}}/> 新增文章</>}
        </h2>
        <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>回首頁觀看效果</Link>
      </div>

      {/* --- 表單區 --- */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <input 
          type="text" 
          placeholder="文章標題" 
          value={title} 
          onChange={e => setTitle(e.target.value)}
          required
          style={{ padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <textarea 
          placeholder="文章內容 (支援換行)" 
          value={content} 
          onChange={e => setContent(e.target.value)}
          required
          style={{ padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '200px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: '15px', background: editingId ? '#fa8c16' : '#722ed1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '處理中...' : (editingId ? '確認修改' : '發布文章')}
          </button>
          
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ padding: '15px 20px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              取消
            </button>
          )}
        </div>
      </form>

      {/* --- 文章管理列表區 --- */}
      <div style={{ marginTop: '50px' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={20} /> 文章管理列表
          <button onClick={fetchArticles} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#007aff', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={14} /> 重新整理
          </button>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {articles.map(article => (
            <div key={article.id} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #eee' 
            }}>
              <div style={{flex: 1, paddingRight: '10px'}}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{article.title}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>{article.date}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleEditClick(article)}
                  style={{ padding: '8px', background: '#e6f7ff', color: '#1890ff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  title="修改"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteClick(article.id)}
                  style={{ padding: '8px', background: '#fff1f0', color: '#ff4d4f', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  title="刪除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {articles.length === 0 && <div style={{textAlign:'center', color:'#999', padding:'20px'}}>目前沒有文章</div>}
        </div>
      </div>
    </div>
  );
}

// --- 頁面 2：首頁 (Home Page) ---
function HomePage() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [articles, setArticles] = useState(DEFAULT_ARTICLES);
  const [activeArticleId, setActiveArticleId] = useState(null);

  useEffect(() => {
    // 1. 隨機影片
    if (VIDEOS.length > 0) {
      setFeaturedVideo(VIDEOS[Math.floor(Math.random() * VIDEOS.length)]);
    }

    // 2. 從 Firebase 讀取文章
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (data.length > 0) {
          setArticles(data);
          setActiveArticleId(data[0].id);
        } else {
            setArticles([{
                id: 'fallback-1', 
                title: '歡迎來到許甯博風水命理館', 
                date: new Date().toISOString().split('T')[0], 
                content: '目前尚未有新文章，請登入後台新增。\n\n風水是空間能量的運用。運用得當則風水好，運用不當則風水差。' 
            }]);
            setActiveArticleId('fallback-1');
        }
      } catch (error) {
        console.error("Firebase讀取錯誤:", error);
      }
    };
    fetchArticles();
  }, []);

  const activeArticle = articles.find(a => a.id === activeArticleId) || articles[0];

  return (
    <div className="app-container">
      {/* --- CSS 樣式 (重點修改區域) --- */}
      <style>{`
        /* 全域設定 */
        .app-container {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #333;
          background: #fcfcfc;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* 1. 容器寬度：從原本窄版改為 1280px，適應大螢幕 */
        .container {
          max-width: 1280px; 
          margin: 0 auto;
          width: 100%;
          padding: 0 24px;
          box-sizing: border-box;
        }

        /* 2. 電腦版 Grid：左邊閱讀區大(3fr)，右邊列表區小(1fr) */
        .article-grid {
          display: grid;
          grid-template-columns: 3fr 1fr; 
          gap: 32px;
          align-items: start;
        }
        
        .article-reader {
          background: white;
          border-radius: 16px;
          padding: 40px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 4px 24px rgba(0,0,0,0.04);
          min-height: 600px;
          height: auto;
        }
        
        .article-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 800px;
          overflow-y: auto;
          padding-right: 5px;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .app-grid {
          display: grid; 
          grid-template-columns: repeat(4, 1fr); /* 電腦版一行4個 */
          gap: 24px;
        }

        /* --- 手機版適配 (Mobile Responsive) --- */
        @media (max-width: 900px) {
           /* 平板轉折點：改為一行2個App */
           .app-grid {
             grid-template-columns: repeat(2, 1fr);
           }
        }

        @media (max-width: 768px) {
          /* 容器邊距縮小 */
          .container {
            padding: 0 16px;
          }

          /* 標題變小 */
          .hero-title {
            font-size: 32px;
          }

          /* 文章區塊：從左右排列變成上下堆疊 */
          .article-grid {
             grid-template-columns: 1fr; /* 單欄 */
             display: flex;
             flex-direction: column; 
          }

          /* 讓文章列表在手機上不佔太多空間 */
          .article-list {
            order: 2; /* 放在下方 */
            max-height: 300px;
            margin-top: 20px;
          }
          
          .article-reader {
            order: 1; /* 放在上方 */
            padding: 24px; /* 手機版內距縮小 */
            min-height: auto;
          }

          /* App 工具區：手機版一行一個 */
          .app-grid {
             grid-template-columns: 1fr;
          }
          
          /* 影片區高度調整 */
          .video-wrapper {
             margin-bottom: 20px;
          }
        }

        /* 捲軸美化 */
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f9f9f9; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
        
        /* Modal */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); z-index: 1000;
          display: flex; justify-content: center; align-items: center; padding: 20px;
        }
        .modal-content {
          background: white; max-width: 600px; width: 100%; max-height: 80vh;
          overflow-y: auto; border-radius: 12px; padding: 30px; position: relative;
        }
        .modal-close {
          position: absolute; top: 20px; right: 20px; border: none; background: none; cursor: pointer;
        }
      `}</style>

      {/* 1. Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: '900', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              <span style={{ fontSize: '18px' }}>許甯博風水命理館</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <a href="mailto:mail@mrkfengshui.com" style={{ textDecoration: 'none', color: '#666', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={18} /> <span style={{display: 'none', md: 'inline'}}>聯絡我們</span>
                </a>
                <Link to="/admin" style={{ color: '#eee' }} title="後台管理">
                    <Lock size={16} />
                </Link>
            </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section style={{ padding: '80px 0 60px', textAlign: 'center', background: 'linear-gradient(180deg, #fff 0%, #f9f9f9 100%)' }}>
        <div className="container">
            <h1 className="hero-title">
            玄學就是科學
            </h1>
            <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
            專為你提供最專業玄學服務，自研最流暢且精準的線上命理工具。
            </p>
        </div>
      </section>

      {/* 3. YouTube Section */}
      <section style={{ padding: '40px 0' }} className="container">
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlayCircle size={24} color="#FF0000" /> 精選影片
        </h3>
        {featuredVideo ? (
          <div className="video-wrapper" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
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
                <div style={{ padding: '20px 24px' }}>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{featuredVideo.title}</h4>
                </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* 4. Articles Section */}
      <section style={{ padding: '60px 0' }} className="container">
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="#722ed1" /> 命理專欄
        </h3>
        
        <div className="article-grid">
          {/* 閱讀區 */}
          <div className="article-reader">
            <span style={{ fontSize: '14px', color: '#999', marginBottom: '12px', display: 'block', fontWeight: 500 }}>
               {activeArticle?.date}
            </span>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '28px', color: '#111', fontWeight: 800, lineHeight: 1.3 }}>{activeArticle?.title}</h2>
            <div style={{ width: '60px', height: '4px', background: '#722ed1', marginBottom: '30px', borderRadius: '2px' }}></div>
            
            <div style={{ fontSize: '17px', lineHeight: '1.9', color: '#333', whiteSpace: 'pre-line' }}>
              {activeArticle?.content}
            </div>
          </div>

          {/* 列表區 */}
          <div className="article-list custom-scroll">
             <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                所有文章
             </div>
             {articles.map(article => {
               const isActive = article.id === activeArticleId;
               return (
                 <div 
                   key={article.id} 
                   onClick={() => setActiveArticleId(article.id)}
                   style={{ 
                      padding: '16px', borderRadius: '12px', 
                      background: isActive ? '#f9f0ff' : 'white', 
                      border: isActive ? '1px solid #d3adf7' : '1px solid #eee',
                      cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                      boxShadow: isActive ? '0 2px 8px rgba(114, 46, 209, 0.1)' : 'none'
                   }}
                 >
                    <div style={{ fontSize: '13px', color: '#999', marginBottom: '6px' }}>{article.date}</div>
                    <div style={{ fontSize: '16px', fontWeight: isActive ? 'bold' : '500', color: isActive ? '#722ed1' : '#333', lineHeight: 1.4 }}>
                      {article.title}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      </section>

      {/* 5. Apps Grid */}
      <section style={{ padding: '40px 0 80px' }} className="container">
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="#fa8c16" /> 自研工具開發
        </h3>
        <div className="app-grid">
          {APPS.map(app => (
            <a key={app.id} href={app.url} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ 
                background: 'white', borderRadius: '20px', padding: '32px', 
                border: '1px solid #eee', height: '100%', display: 'flex', flexDirection: 'column',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', boxSizing: 'border-box',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ background: app.color, width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  {app.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0' }}>{app.name}</h3>
                <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.6', flex: 1 }}>{app.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', color: '#007aff', fontWeight: 'bold', fontSize: '15px', marginTop: '20px' }}>
                  立即使用 <ChevronRight size={18} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 6. AdBanner (若無套件請註解掉) */}
      <div className="container" style={{ marginBottom: '40px' }}>
         <AdBanner />
      </div>

      {/* 7. Footer */}
      <footer style={{ borderTop: '1px solid #eaeaea', padding: '60px 0', background: 'white' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {SOCIAL_LINKS.map(social => (
              <a key={social.id} href={social.url} target="_blank" rel="noreferrer" style={{ color: '#888', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = social.color} onMouseOut={e => e.currentTarget.style.color = '#888'}>
                {social.icon}
              </a>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: '#999', textAlign: 'center' }}>
            <span style={{ cursor: 'pointer', marginRight: '15px', textDecoration: 'underline' }} onClick={() => setShowPrivacy(true)}>隱私權政策</span>
            © {new Date().getFullYear()} 許甯博風水命理館
          </div>
        </div>
      </footer>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}

// --- 3. 主程式入口 (Router) ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}