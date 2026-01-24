import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { db } from './firebase'; 
import { collection, getDocs, addDoc, orderBy, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  BookOpen, PlayCircle, Grid, Compass, Sparkles, Calendar, List, Plus, Lock,
  Facebook, Instagram, Youtube, X, Mail, ChevronRight, Edit, Trash2, RefreshCw,
  ChevronDown, ChevronUp, Home
} from 'lucide-react';
import { AdBanner, Adsterra } from '@my-meta/ui';
import { useProtection } from '@my-meta/ui';

// --- 0. 設定與常數 ---
const SOCIAL_LINKS = [
  { id: 'fb', name: 'Facebook', url: 'https://www.facebook.com/mrfungshui', icon: <Facebook size={20} />, color: '#1877F2' },
  { id: 'ig', name: 'Instagram', url: 'https://www.instagram.com/kanekyosan', icon: <Instagram size={20} />, color: '#E4405F' },
  { id: 'yt', name: 'YouTube', url: 'https://www.youtube.com/@scientificfungshui2942', icon: <Youtube size={20} />, color: '#FF0000' }
];

const CATEGORIES = [
  { id: 'bazi', label: '八字', color: '#1890ff', bg: '#e6f7ff' },
  { id: 'fengshui', label: '風水', color: '#fa8c16', bg: '#fff7e6' },
  { id: 'date', label: '擇日', color: '#52c41a', bg: '#f6ffed' },
  { id: 'other', label: '其他', color: '#722ed1', bg: '#f9f0ff' }
];

const VIDEOS = [
  { id: 'fwawNW1_FVc', title: '【點算自己支命系列】我係咪二奶命？' },
  { id: '2WX5VFLQEck', title: '【風水睇樓團@許甯博】煥然懿居坐西向東風水好唔好?' },
  { id: 'BJXqWMmS7Pw', title: 'Ep1 骰子都可以做手信?' },
  { id: 'lwl8Mz_0bL0', title: 'Ep2 獅、獅子!? 琉球有獅子?' },
  { id: 'XyKd83FreAQ', title: '【點算家居風水系列】屋企風水自己睇(上)' },
  { id: 'R8J1Jqee4yo', title: '【點算家居風水系列】屋企風水自己睇(下)' }
];

const APPS = [
  { id: 'bazi', name: '八字', desc: '精準計算大運流年流月', url: 'https://bazi.mrkfengshui.com', icon: <BookOpen size={40} color="#1890ff" />, color: '#e6f7ff' },
  { id: 'compass', name: '風水', desc: '結合羅庚與各式風水砂法水法理論', url: 'https://compass.mrkfengshui.com', icon: <Compass size={40} color="#fa8c16" />, color: '#fff7e6' },
  { id: 'zhiwei', name: '紫微斗數', desc: '明朝紫微斗數全書排盤', url: 'https://zhiwei.mrkfengshui.com', icon: <Sparkles size={40} color="#722ed1" />, color: '#f9f0ff' },
  { id: 'calendar', name: '年月進氣萬年曆', desc: '非一般的流年流月進退氣萬年曆', url: 'https://calendar.mrkfengshui.com', icon: <Calendar size={40} color="#52c41a" />, color: '#f6ffed' },
  { id: 'qimen', name: '奇門遁甲', desc: '道家陰盤奇門遁甲', url: 'https://qimen.mrkfengshui.com', icon: <Grid size={40} color="#13c2c2" />, color: '#e6f7ff' },
];

const DEFAULT_ARTICLES = [
  { id: 'default-1', title: '許甯博風水命理館', date: '2026-01-01', category: '其他', content: '系統努力載入中' }
];

const CategoryBadge = ({ label }) => {
  const cat = CATEGORIES.find(c => c.label === label) || CATEGORIES[3];
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: cat.bg, color: cat.color, fontWeight: 'bold', display: 'inline-block', marginRight: '6px' }}>
      {label || '其他'}
    </span>
  );
};

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

// --- Admin Page ---
function AdminPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('八字');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [editingId, setEditingId] = useState(null); 

  const handleLogin = () => { if (password === 'mrk888') { setIsLoggedIn(true); fetchArticles(); } else { alert('密碼錯誤'); } };

  const fetchArticles = async () => {
    try {
      const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      setArticles(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("讀取失敗", error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "articles", editingId), { title, content, category, updatedAt: new Date() });
        alert('文章修改成功！'); setEditingId(null);
      } else {
        await addDoc(collection(db, "articles"), { title, content, category, date: new Date().toISOString().split('T')[0], createdAt: new Date() });
        alert('新文章已發布！');
      }
      setTitle(''); setContent(''); setCategory('八字'); fetchArticles();
    } catch (error) { console.error(error); alert('操作失敗'); } finally { setLoading(false); }
  };

  const handleEditClick = (article) => { setTitle(article.title); setContent(article.content); setCategory(article.category || '其他'); setEditingId(article.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleDeleteClick = async (id) => { if (window.confirm('確定刪除？')) { try { await deleteDoc(doc(db, "articles", id)); fetchArticles(); } catch (error) { alert('刪除失敗'); } } };

  if (!isLoggedIn) return ( <div style={{ padding: '50px 20px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}><h2>管理員登入</h2><input type="password" placeholder="輸入密碼" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '12px', margin: '10px 0', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ccc' }} /><button onClick={handleLogin} style={{ width: '100%', padding: '12px', background: '#722ed1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>登入</button><div style={{marginTop: '20px'}}><Link to="/">返回首頁</Link></div></div> );

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>{editingId ? '修改文章' : '新增文章'}</h2>
        <Link to="/" style={{ color: '#888', textDecoration: 'none' }}>返回首頁</Link>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#888' }}>分類</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => ( <label key={cat.id} style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '20px', backgroundColor: category === cat.label ? cat.color : '#f0f0f0', color: category === cat.label ? 'white' : '#888', border: category === cat.label ? 'none' : '1px solid #ddd', fontSize: '14px' }}> <input type="radio" name="category" value={cat.label} checked={category === cat.label} onChange={e => setCategory(e.target.value)} style={{ display: 'none' }} /> {cat.label} </label> ))}
          </div>
        </div>
        <input type="text" placeholder="標題" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ddd' }} />
        <textarea placeholder="內容" value={content} onChange={e => setContent(e.target.value)} required style={{ padding: '15px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '200px' }} />
        <button type="submit" disabled={loading} style={{ padding: '15px', background: editingId ? '#fa8c16' : '#722ed1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>{loading ? '諾!' : (editingId ? '確認修改' : '發布')}</button>
      </form>
      <div style={{ marginTop: '50px' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><List size={20} /> 文章列表 <button onClick={fetchArticles} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#007aff', display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={14} /> 重新整理</button></h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {articles.map(article => ( <div key={article.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}> <div style={{flex: 1, paddingRight: '10px'}}> <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}> <CategoryBadge label={article.category} /> <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{article.title}</div> </div> <div style={{ fontSize: '12px', color: '#999' }}>{article.date}</div> </div> <div style={{ display: 'flex', gap: '10px' }}> <button onClick={() => handleEditClick(article)} style={{ padding: '8px', background: '#e6f7ff', color: '#1890ff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Edit size={18} /></button> <button onClick={() => handleDeleteClick(article.id)} style={{ padding: '8px', background: '#fff1f0', color: '#ff4d4f', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={18} /></button> </div> </div> ))}
        </div>
      </div>
    </div>
  );
}

// --- HomePage ---
function HomePage() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [articles, setArticles] = useState(DEFAULT_ARTICLES);
  const [activeArticleId, setActiveArticleId] = useState(null);
  const [displayArticles, setDisplayArticles] = useState([]);
  const [showAllArticles, setShowAllArticles] = useState(false);

  useEffect(() => {
    // 隨機影片
    if (VIDEOS.length > 0) setFeaturedVideo(VIDEOS[Math.floor(Math.random() * VIDEOS.length)]);

    // 讀取文章
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (data.length > 0) {
          setArticles(data);

          // ✨ 關鍵修改：主畫面預設顯示隨機一篇，而非第一篇
          const randomMainIndex = Math.floor(Math.random() * data.length);
          setActiveArticleId(data[randomMainIndex].id);

          // 列表也隨機洗牌
          const shuffled = [...data];
          for (let i = shuffled.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1)); 
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
          }
          setDisplayArticles(shuffled.slice(0, 5));

        } else {
            const fallback = [{ id: 'fallback-1', title: '許甯博風水命理館', date: new Date().toISOString().split('T')[0], category: '其他', content: '目前尚未有新文章' }];
            setArticles(fallback); setDisplayArticles(fallback); setActiveArticleId('fallback-1');
        }
      } catch (error) { console.error(error); }
    };
    fetchArticles();
  }, []);

  const listToRender = showAllArticles ? articles : displayArticles;
  const activeArticle = articles.find(a => a.id === activeArticleId) || articles[0];

  // Adsterra Social Bar
  useEffect(() => {
    const socialBarSrc = 'https://pl28554409.effectivegatecpm.com/6e/e1/c4/6ee1c40d38db850234636bf57069fbdf.js'; 
    const scriptId = 'adsterra-social-script'; // Unique ID for this script
    const storageKey = 'AD_SHOWN_SESSION'; // 用來記錄是否已經顯示過的 Key

    // 步驟 A: 檢查本次會話 (Session) 是否已經顯示過廣告
    // 如果 sessionStorage 裡有紀錄，代表使用者已經看過（或關過），直接 return 不載入
    if (sessionStorage.getItem(storageKey)) {
        // console.log('本次會話已顯示過廣告，不再彈出');
        return; 
    }

    // 步驟 B: 檢查 DOM 是否已存在 (雙重保險，防止 React 重複渲染)
    if (document.getElementById(scriptId)) {
        return;
    }

    // 步驟 C: 載入廣告腳本
    const script = document.createElement('script');
    script.id = scriptId; 
    script.src = socialBarSrc;
    script.async = true;
    script.type = 'text/javascript';
    
    script.onerror = () => {
      console.log('Adsterra Social Bar blocked');
    };

    // 步驟 D: 成功加入腳本後，立刻寫入 sessionStorage
    // 這樣下次（例如切換頁面回來，或重新整理）就不會再跑這段 code
    document.body.appendChild(script);
    sessionStorage.setItem(storageKey, 'true');

}, []);

  return (
    <div className="app-container">
      <style>{`
        body, html { position: static !important; overflow-y: auto !important; height: auto !important; }
        #root { overflow: visible !important; height: auto !important; }
        .app-container { min-height: 100vh; display: flex; flex-direction: column; height: auto; overflow: visible; }
        .container { max-width: 1280px; margin: 0 auto; width: 95%; padding: 0 24px; box-sizing: border-box; }
        .article-grid { display: grid; grid-template-columns: 3fr 1fr; gap: 32px; align-items: start; }
        .article-reader { background: white; border-radius: 16px; padding: 40px; border: 1px solid #f0f0f0; box-shadow: 0 4px 24px rgba(0,0,0,0.04); min-height: 600px; height: auto; }
        .article-list-container { display: flex; flex-direction: column; gap: 12px; }
        
        .hero-title { font-size: 42px; font-weight: 800; margin-bottom: 10px; letter-spacing: -1px; color: #111 !important; }
        
        .app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 900px) { .app-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .container { padding: 0 16px; }
          .hero-title { font-size: 32px; }
          .article-grid { grid-template-columns: 1fr; display: flex; flex-direction: column; }
          .article-list-container { order: 2; margin-top: 20px; width: 95%; }
          .article-reader { order: 1; padding: 24px; min-height: auto; }
          .app-grid { grid-template-columns: 1fr; }
        }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .modal-content { background: white; max-width: 600px; width: 95%; max-height: 80vh; overflow-y: auto; border-radius: 12px; padding: 30px; position: relative; }
        .modal-close { position: absolute; top: 20px; right: 20px; border: none; background: none; cursor: pointer; }
      `}</style>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100, height: '60px', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <div style={{ fontWeight: '900', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              <span style={{ fontSize: '18px', color: '#111', display: 'inline-block' }}>許甯博風水命理館</span>
              <span style={{ fontSize: '12px', color: '#888', display: 'inline-block' }}>since 2021</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link to="/admin" style={{ color: '#eee' }} title="後台管理"><Lock size={16} /></Link>
                <a href="mailto:mail@mrkfengshui.com" style={{ textDecoration: 'none', color: '#888', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={18} /> <span style={{display: 'none', md: 'inline'}}>聯絡我們</span>
                </a>
            </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '20px 0', textAlign: 'center', background: '#ffffff' }}>
        <div className="container">
            <h1 className="hero-title">玄學就是科學</h1>
            <p style={{ fontSize: '16px', color: '#888', maxWidth: '600px', margin: '0 auto 10px auto', lineHeight: '1.6' }}>
            為你提供專業玄學服務，自研最流暢且精準的線上命理工具
            </p>
        </div>
      </section>

      {/* Video */}
      <section style={{ padding: '40px 0' }} className="container">
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlayCircle size={24} color="#FF0000" /> 精選影片
        </h3>
        {featuredVideo ? (
          <div className="video-wrapper" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
                  <iframe src={`https://www.youtube.com/embed/${featuredVideo.id}`} title={featuredVideo.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy"></iframe>
                </div>
                <div style={{ padding: '16px 24px' }}>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{featuredVideo.title}</h4>
                </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Articles */}
      <section style={{ padding: '40px 0' }} className="container">
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="#722ed1" /> 命理專欄
        </h3>
        <div className="article-grid">
          <div className="article-reader">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', color: '#999', fontWeight: 500 }}>{activeArticle?.date}</span>
                <CategoryBadge label={activeArticle?.category} />
            </div>
            <h2 style={{ margin: '0 0 24px 0', fontFamily: 'arial', fontSize: '26px', color: '#111', fontWeight: 800, lineHeight: 1.3 }}>{activeArticle?.title}</h2>
            <div style={{ width: '60px', height: '4px', background: '#722ed1', marginBottom: '30px', borderRadius: '2px' }}></div>
            <div style={{ fontFamily: 'arial', fontSize: '16px', lineHeight: '1.8', color: '#333', whiteSpace: 'pre-line' }}>{activeArticle?.content}</div>
          </div>
          <div className="article-list-container">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                 <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>{showAllArticles ? '所有文章' : '精選文章'}</div>
             </div>
             {listToRender.map(article => {
               const isActive = article.id === activeArticleId;
               return (
                 <div key={article.id} onClick={() => setActiveArticleId(article.id)} style={{ padding: '16px', borderRadius: '12px', background: isActive ? '#f9f0ff' : 'white', border: isActive ? '1px solid #d3adf7' : '1px solid #eee', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', boxShadow: isActive ? '0 2px 8px rgba(114, 46, 209, 0.1)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '12px', color: '#999' }}>{article.date}</span><CategoryBadge label={article.category} /></div>
                    <div style={{ fontSize: '15px', fontWeight: isActive ? 'bold' : '500', color: isActive ? '#722ed1' : '#333', lineHeight: 1.4 }}>{article.title}</div>
                 </div>
               );
             })}
             <button onClick={() => setShowAllArticles(!showAllArticles)} style={{ padding: '10px', marginTop: '8px', width: '100%', backgroundColor: '#f5f5f5', border: 'none', borderRadius: '8px', color: '#888', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>{showAllArticles ? <><ChevronUp size={16}/> 收起</> : <><ChevronDown size={16}/> 查看所有</>}</button>
          </div>
        </div>
      </section>

      {/* Apps */}
      <section style={{ padding: '40px 0 60px' }} className="container">
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="#fa8c16" /> 自研工具開發
        </h3>
        <div className="app-grid">
          {APPS.map(app => (
            <a key={app.id} href={app.url} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #eee', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', boxSizing: 'border-box', transition: 'transform 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ background: app.color, width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>{app.icon}</div>
                <h3 style={{ fontSize: '18px', color: '#111', fontWeight: 'bold', margin: '0 0 8px 0' }}>{app.name}</h3>
                <p style={{ fontSize: '14px', color: '#888', lineHeight: '1.5', flex: 1 }}>{app.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', color: '#007aff', fontWeight: 'bold', fontSize: '14px', marginTop: '16px' }}>立即使用 <ChevronRight size={16} /></div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ✅ AdBanner: 限制高度，減少 margin */}
      <div style={{ marginTop: '20px' }}><Adsterra /></div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #eaeaea', padding: '20px 0', background: 'white' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            {SOCIAL_LINKS.map(social => ( <a key={social.id} href={social.url} target="_blank" rel="noreferrer" style={{ color: '#888', transition: 'color 0.2s' }}>{social.icon}</a> ))}
          </div>
          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
            <span style={{ cursor: 'pointer', marginRight: '15px', textDecoration: 'underline' }} onClick={() => setShowPrivacy(true)}>隱私權政策</span>
            © {new Date().getFullYear()} 許甯博風水命理館
          </div>
        </div>
      </footer>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}

export default function App() {
  // 全局啟用保護機制
  const isAuthorized = useProtection([]);
  if (!isAuthorized) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}