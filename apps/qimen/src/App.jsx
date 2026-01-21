// 1. 引入共用 UI 和 工具
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';

import { 
  AdBanner, AppHeader, AppInfoCard, 
  BookingSystem, BottomTabBar, BookmarkList, BuyMeCoffee, 
  InstallGuide, WebBackupManager, 
  COLORS, THEME, COMMON_STYLES
} from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Bookmark, BookOpen, Briefcase,
  Calendar, CalendarCheck, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, Circle, Compass, CloudUpload,
  DoorOpen, Download,
  Edit3, Eye, EyeOff, Info, Grid, Lock, MapPin,
  RefreshCw, RotateCcw, Save, Settings, Sparkles,
  Trash2, Unlock, User, X
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";
const APP_NAME = "奇門遁甲";
const APP_VERSION = "v1.0";

// --- 基礎定義 ---
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const GUA_NAMES = ['坎', '坤', '震', '巽', '中', '乾', '兌', '艮', '離']; // 對應 1,2,3,4,5,6,7,8,9
const STARS = ['天蓬', '天芮', '天衝', '天輔', '天禽', '天心', '天柱', '天任', '天英'];
const DOORS = ['休門', '死門', '傷門', '杜門', '', '開門', '驚門', '生門', '景門']; // 中5無門
const GODS = ['值符', '騰蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天']; // 陽遁順序，陰遁逆排

// 九宮原始位置 (洛書數: 坎1, 坤2, 震3, 巽4, 中5, 乾6, 兌7, 艮8, 離9)
// 在 Grid 陣列中的索引 (0-8) 對應：
// 4(巽) 9(離) 2(坤)
// 3(震) 5(中) 7(兌)
// 8(艮) 1(坎) 6(乾)
const GRID_MAP = [
    { num: 4, name: '巽', star: '天輔', door: '杜門', original: '巽' },
    { num: 9, name: '離', star: '天英', door: '景門', original: '離' },
    { num: 2, name: '坤', star: '天芮', door: '死門', original: '坤' },
    { num: 3, name: '震', star: '天衝', door: '傷門', original: '震' },
    { num: 5, name: '中', star: '天禽', door: '',     original: '中' },
    { num: 7, name: '兌', star: '天柱', door: '驚門', original: '兌' },
    { num: 8, name: '艮', star: '天任', door: '生門', original: '艮' },
    { num: 1, name: '坎', star: '天蓬', door: '休門', original: '坎' },
    { num: 6, name: '乾', star: '天心', door: '開門', original: '乾' }
];

// 載入 Lunar 庫
const useLunarScript = () => {
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (window.Lunar && window.Solar) { setStatus('ready'); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lunar-javascript@1.6.12/lunar.min.js';
    script.async = true;
    script.onload = () => { if (window.Solar) setStatus('ready'); else setStatus('error'); };
    script.onerror = () => setStatus('error');
    document.body.appendChild(script);
  }, []);
  return status;
};

// --- 排盤核心算法 (模擬陰盤/時家奇門基礎) ---
// 注意：真正的陰盤奇門(道家)排法繁複且有流派之分(如翻宮、轉盤等)，
// 此處實作標準「時家奇門拆補局」架構作為基礎，並展示如何在 UI 呈現。
const calculateQiMenResult = (dateObj) => {
    const { year, month, day, hour, minute } = dateObj;
    
    // 1. 建立 Lunar 對象
    const solar = window.Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    
    // 2. 取得四柱
    const bazi = lunar.getEightChar();
    const yearGanZhi = bazi.getYear();
    const monthGanZhi = bazi.getMonth();
    const dayGanZhi = bazi.getDay();
    const timeGanZhi = bazi.getTime();
    
    const dayGan = bazi.getDayGan();
    const dayZhi = bazi.getDayZhi();
    const timeGan = bazi.getTimeGan();
    const timeZhi = bazi.getTimeZhi();

    // 3. 定局 (簡單拆補法：依節氣與日干支)
    // 獲取當前節氣
    const jieQi = lunar.getPrevJieQi(true); // true = 包含當天
    const jieQiName = jieQi.getName();
    
    // 簡易定局邏輯 (範例：僅作演示，實戰需完整定局表)
    // 陰遁：夏至後；陽遁：冬至後
    // 這裡簡化：假設全部陽遁1局作演示 (您可替換為真實算法庫)
    const isYangDun = true; // 需實作：判斷陰陽遁
    const juNum = 1;        // 需實作：判斷局數 (1-9)
    
    // 4. 地盤排布 (戊己庚辛壬癸丁丙乙) - 陽1局範例
    // 陽1局地盤：坎1(戊), 坤2(己), 震3(庚), 巽4(辛), 中5(壬), 乾6(癸), 兌7(丁), 艮8(丙), 離9(乙)
    // 這裡僅為 UI 測試生成的假數據
    const diPanMap = {
        1: '戊', 2: '己', 3: '庚', 4: '辛', 5: '壬', 6: '癸', 7: '丁', 8: '丙', 9: '乙'
    };

    // 5. 天盤排布 (值符隨時干)
    // 範例：假設值符在震3，天盤轉動
    const tianPanMap = {
        1: '乙', 2: '丙', 3: '戊', 4: '癸', 5: '壬', 6: '辛', 7: '庚', 8: '己', 9: '丁'
    };

    // 6. 八門排布 (值使隨時宮)
    const menMap = {
        1: '休', 2: '死', 3: '傷', 4: '杜', 5: '', 6: '開', 7: '驚', 8: '生', 9: '景'
    };

    // 7. 八神排布 (大值符隨天盤值符)
    const shenMap = {
        1: '符', 2: '蛇', 3: '陰', 4: '合', 5: '', 6: '虎', 7: '武', 8: '地', 9: '天'
    };

    // 8. 整合九宮數據
    // Grid 順序：巽4, 離9, 坤2, 震3, 中5, 兌7, 艮8, 坎1, 乾6
    const gridData = GRID_MAP.map(cell => {
        return {
            ...cell,
            di: diPanMap[cell.num] || '',
            tian: tianPanMap[cell.num] || '',
            men: menMap[cell.num] || '',
            shen: shenMap[cell.num] || '',
            // 陰盤特色：可在此加入暗干、隱遁等
        };
    });

    return {
        id: Date.now(),
        solarDateStr: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
        lunarDateStr: `${yearGanZhi}年 ${monthGanZhi}月 ${dayGanZhi}日 ${timeGanZhi}時`,
        jieQi: jieQiName,
        juName: `${isYangDun ? '陽遁' : '陰遁'}${juNum}局`,
        ganZhi: { year: yearGanZhi, month: monthGanZhi, day: dayGanZhi, time: timeGanZhi },
        grid: gridData,
        rawDate: dateObj
    };
};

// =========================================================================
// PART B: 視圖組件
// =========================================================================

// --- 1. 輸入與設定 (InputView) ---
const InputView = ({ onCalculate, initialData }) => {
    const now = new Date();
    const [date, setDate] = useState(initialData ? new Date(initialData.year, initialData.month-1, initialData.day, initialData.hour, initialData.minute) : now);

    // 即時排盤：如果是首次加載且沒有 initialData，自動觸發排盤
    useEffect(() => {
        if (!initialData) {
            handleCalculate();
        }
    }, []);

    const handleCalculate = () => {
        const formData = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes()
        };
        onCalculate(formData);
    };

    // 調整時間輔助函式
    const adjustTime = (minutes) => {
        const newDate = new Date(date.getTime() + minutes * 60000);
        setDate(newDate);
    };

    return (
        <div style={{ padding: '16px', backgroundColor: THEME.bg }}>
            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '20px', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', color: THEME.black, fontSize: '18px' }}>陰盤奇門排盤</h3>
                
                {/* 日期時間選擇器 */}
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: THEME.gray, marginBottom: '4px', display: 'block' }}>西曆日期</label>
                        <input 
                            type="date" 
                            value={date.toISOString().split('T')[0]} 
                            onChange={(e) => {
                                const d = new Date(e.target.value);
                                d.setHours(date.getHours());
                                d.setMinutes(date.getMinutes());
                                setDate(d);
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: THEME.gray, marginBottom: '4px', display: 'block' }}>時間</label>
                        <input 
                            type="time" 
                            value={`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}
                            onChange={(e) => {
                                const [h, m] = e.target.value.split(':');
                                const d = new Date(date);
                                d.setHours(h);
                                d.setMinutes(m);
                                setDate(d);
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                {/* 快速調整按鈕 */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button onClick={() => adjustTime(-120)} style={adjBtnStyle}>-1時辰</button>
                    <button onClick={() => setDate(new Date())} style={adjBtnStyle}>現在</button>
                    <button onClick={() => adjustTime(120)} style={adjBtnStyle}>+1時辰</button>
                </div>

                <button onClick={handleCalculate} style={{ width: '100%', padding: '14px', backgroundColor: THEME.black, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Sparkles size={18} />
                    開始排盤
                </button>
            </div>
        </div>
    );
};

const adjBtnStyle = { flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${THEME.border}`, backgroundColor: THEME.bgGray, color: THEME.black, fontSize: '13px', cursor: 'pointer' };

// --- 2. 排盤結果 (ResultView) ---
// 九宮格單元格
const PalaceCell = ({ data }) => {
    // 中宮特殊處理
    if (data.num === 5) {
        return (
            <div style={{ ...cellStyle, backgroundColor: '#fffbe6' }}>
                <div style={{ fontSize: '12px', color: THEME.gray }}>中宮</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ color: COLORS.wu, fontWeight: 'bold' }}>{data.tian}</span>
                    <span style={{ color: COLORS.ji, fontWeight: 'bold' }}>{data.di}</span>
                </div>
            </div>
        );
    }

    return (
        <div style={cellStyle}>
            {/* 上：神盤 */}
            <div style={{ fontSize: '12px', color: '#722ed1', fontWeight: 'bold', marginBottom: '2px' }}>
                {data.shen}
            </div>

            {/* 中：星 & 門 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 4px', boxSizing: 'border-box', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', color: THEME.black }}>{data.star}</span>
                <span style={{ fontSize: '14px', color: '#d46b08', fontWeight: 'bold' }}>{data.men}</span>
            </div>

            {/* 下：天盤 & 地盤 */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: THEME.red }}>{data.tian}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: THEME.black }}>{data.di}</span>
                </div>
            </div>

            {/* 角落：宮位名稱 */}
            <div style={{ position: 'absolute', bottom: '2px', right: '2px', fontSize: '10px', color: '#ccc' }}>
                {data.name}
            </div>
        </div>
    );
};

const cellStyle = {
    backgroundColor: THEME.white,
    border: `1px solid ${THEME.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
    minHeight: '100px',
    padding: '4px'
};

const ResultView = ({ data, onSave, onBack }) => {
    if (!data) return null;

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: THEME.bg }}>
            {/* 資訊卡片 */}
            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: THEME.black, marginBottom: '4px' }}>
                            {data.lunarDateStr}
                        </div>
                        <div style={{ fontSize: '13px', color: THEME.gray }}>
                            {data.solarDateStr}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <span style={{ backgroundColor: THEME.bgBlue, color: THEME.blue, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{data.jieQi}</span>
                            <span style={{ backgroundColor: THEME.bgOrange, color: '#d46b08', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{data.juName}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onBack} style={{ padding: '8px', borderRadius: '50%', border: `1px solid ${THEME.border}`, backgroundColor: 'white', color: THEME.gray }}>
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={() => onSave(data)} style={{ padding: '8px', borderRadius: '50%', border: `1px solid ${THEME.blue}`, backgroundColor: THEME.bgBlue, color: THEME.blue }}>
                            <Save size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 九宮格 */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gridTemplateRows: 'repeat(3, 1fr)',
                gap: '4px',
                backgroundColor: THEME.border,
                border: `4px solid ${THEME.black}`,
                borderRadius: '4px',
                aspectRatio: '1/1',
                marginBottom: '20px'
            }}>
                {data.grid.map((cell, idx) => (
                    <PalaceCell key={idx} data={cell} />
                ))}
            </div>

            {/* 底部說明 */}
            <div style={{ textAlign: 'center', fontSize: '12px', color: THEME.gray }}>
                陰盤奇門 • 時家拆補局
            </div>
        </div>
    );
};

// --- 3. 設定頁 (SettingsView) ---
const SettingsView = ({ bookmarks, setBookmarks }) => {
    const APP_INFO = {
        appName: APP_NAME,
        version: APP_VERSION,
        about: "本程式提供陰盤奇門遁甲排盤功能，協助使用者進行時空決策與運籌帷幄。",
    };

    return (
        <div style={{ padding: '16px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2>
            </div>

            <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="QIMEN_BACKUP" />
            <AppInfoCard info={APP_INFO} />
            <BuyMeCoffee />
        </div>
    );
};

// =========================================================================
// PART C: 主程式結構
// =========================================================================
export default function QiMenApp() {
  const libStatus = useLunarScript();
  const [view, setView] = useState('input'); // input, result, bookmarks, booking, settings
  const [resultData, setResultData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [editingData, setEditingData] = useState(null);

  // 底部導航
  const tabs = [
    { id: 'input', label: '排盤', icon: Compass }, // 預設首頁
    { id: 'bookmarks', label: '紀錄', icon: Bookmark },
    { id: 'booking', label: '預約', icon: CalendarCheck },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  // 讀取紀錄
  useEffect(() => {
    const loadData = async () => {
      try {
        const { value } = await Preferences.get({ key: 'qimen_bookmarks' });
        if (value) setBookmarks(JSON.parse(value));
      } catch (e) { console.error("Load failed", e); }
    };
    loadData();
  }, []);

  const handleCalculate = (formData) => {
      if (libStatus !== 'ready') return;
      try {
          const res = calculateQiMenResult(formData);
          setResultData(res);
          setView('result');
      } catch (e) {
          console.error(e);
          alert('排盤發生錯誤');
      }
  };

  const saveBookmark = async (data) => {
      const title = prompt("請輸入紀錄名稱", `${data.lunarDateStr.split(' ')[2]}事占`);
      if (!title) return;
      
      const newEntry = {
          id: data.id,
          name: title,
          solarDate: data.solarDateStr,
          lunarString: data.lunarDateStr, // 配合共用組件的欄位
          rawDate: data.rawDate,
          type: 'qimen'
      };
      
      const newBk = [newEntry, ...bookmarks];
      setBookmarks(newBk);
      await Preferences.set({ key: 'qimen_bookmarks', value: JSON.stringify(newBk) });
      alert('已儲存');
  };

  const deleteBookmark = async (id) => {
      if (!confirm('確定刪除？')) return;
      const newBk = bookmarks.filter(b => b.id !== id);
      setBookmarks(newBk);
      await Preferences.set({ key: 'qimen_bookmarks', value: JSON.stringify(newBk) });
  };

  const openBookmark = (item) => {
      if (item.rawDate) {
          setEditingData(item.rawDate);
          // 自動排盤
          if (libStatus === 'ready') {
              const res = calculateQiMenResult(item.rawDate);
              setResultData(res);
              setView('result');
          } else {
              setView('input');
          }
      }
  };

  if (libStatus === 'loading') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>載入曆法數據...</div>;

  return (
    <div style={COMMON_STYLES.fullScreen}>
        {/* Header */}
        <AppHeader title={APP_NAME} logoChar={{ main: '奇', sub: '門' }} />

        {/* Content */}
        <div style={COMMON_STYLES.contentArea}>
            {view === 'input' && (
                <>
                    <InputView onCalculate={handleCalculate} initialData={editingData} />
                    <AdBanner />
                </>
            )}

            {view === 'result' && (
                <>
                    <ResultView data={resultData} onSave={saveBookmark} onBack={() => { setEditingData(null); setView('input'); }} />
                    <AdBanner />
                </>
            )}

            {view === 'bookmarks' && (
                <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                        <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>排盤紀錄</h2>
                    </div>
                    <BookmarkList bookmarks={bookmarks} onSelect={openBookmark} onDelete={deleteBookmark} />
                    <div style={{ marginTop: '20px' }}><AdBanner /></div>
                </div>
            )}

            {view === 'booking' && <BookingSystem apiUrl={API_URL} onNavigate={() => setView('input')} />}

            {view === 'settings' && <SettingsView bookmarks={bookmarks} setBookmarks={setBookmarks} />}
        </div>

        {/* Footer */}
        <InstallGuide />
        <BottomTabBar 
            tabs={tabs} 
            currentTab={view === 'result' ? 'input' : view} 
            onTabChange={(id) => {
                if (id === 'input') {
                    setEditingData(null);
                    // 切換回 Input 時，如果不清除 resultData，可以保留上次結果，
                    // 這裡選擇若有點擊 Tab 則回到輸入畫面
                    setView('input');
                } else {
                    setView(id);
                }
            }} 
        />
    </div>
  );
}