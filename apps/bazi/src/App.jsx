// 1. 引入共用 UI 和 工具
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';
import { loadStripe } from '@stripe/stripe-js';

import { 
  AdBanner, Adsterra, AdsterraNarrow, AppHeader, AppInfoCard, 
  BookingSystem, BottomTabBar, BookmarkList, BuyMeCoffee, 
  InstallGuide, WebBackupManager, useProtection,
  COLORS, THEME, COMMON_STYLES
} from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Bookmark, BookOpen, Briefcase,
  Calendar, CalendarCheck, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, Circle, Compass,
  CloudUpload, DoorOpen, Download,
  Edit3, Eye, EyeOff, Info, Grid, Lock, MapPin,
  RefreshCw, RotateCcw, RotateCw, Save, Settings, Sparkles,
  Trash2, Unlock, User, X
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";
const APP_NAME = "甯博八字";
const APP_VERSION = "v2.1 命書系統更新";

// --- 核心數據定義 ---
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 地支藏干
const ZHI_HIDDEN = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'], 
  '辰': ['戊', '乙', '癸'], '巳': ['丙', '戊', '庚'], '午': ['丁', '己'], 
  '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'], '酉': ['辛'], 
  '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
};

const STEM_COLORS = {
  '甲': COLORS.jia, '乙': COLORS.yi, '丙': COLORS.bing, '丁': COLORS.ding, '戊': COLORS.wu,
  '己': COLORS.ji, '庚': COLORS.geng, '辛': COLORS.xin, '壬': COLORS.ren, '癸': COLORS.gui
};

const BRANCH_COLORS = {
  '子': COLORS.ren, '亥': COLORS.ren, '寅': COLORS.jia, '卯': COLORS.yi, 
  '巳': COLORS.bing, '午': COLORS.ding, '申': COLORS.geng, '酉': COLORS.xin, 
  '辰': COLORS.wu, '戌': COLORS.wu, '丑': COLORS.ji, '未': COLORS.ji 
};

const CN_NUMS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const getLunarMonthText = (m) => {
    if (m === 1) return '正月';
    if (m <= 10) return CN_NUMS[m] + '月';
    if (m === 11) return '十一月 (冬月) ';
    if (m === 12) return '十二月 (臘月) ';
    return m + '月';
};

const getLunarDayText = (d) => {
    if (d <= 10) return '初' + CN_NUMS[d];
    if (d < 20) return '十' + CN_NUMS[d % 10];
    if (d === 20) return '二十';
    if (d < 30) return '廿' + (d % 10 === 0 ? '十' : CN_NUMS[d % 10]);
    if (d === 30) return '三十';
    return String(d);
};

// 五行對照表
const WUXING_MAP = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火',
  '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
  '子': '水', '丑': '土'
};

// 計算空亡
const getKongWang = (gan, zhi) => {
    if (!gan || !zhi) return [];
    const ganIdx = TIANGAN.indexOf(gan);
    const zhiIdx = DIZHI.indexOf(zhi);
    if (ganIdx === -1 || zhiIdx === -1) return [];

    // 計算旬首偏移量
    const offset = (zhiIdx - ganIdx + 12) % 12;
    
    // 計算兩個空亡地支的索引
    const empty1Idx = (offset + 10) % 12;
    const empty2Idx = (offset + 11) % 12;

    return [DIZHI[empty1Idx], DIZHI[empty2Idx]];
};

const CN_MAP = {
  '惊': '驚', '蛰': '蟄', '种': '種', '长': '長', '涧': '澗', '蜡': '蠟', '杨': '楊', '雳': '靂', 
  '灯': '燈', '驿': '驛', '钗': '釵', '炉': '爐', '剑': '劍', '钟': '鐘', '岚': '嵐', '构': '構', 
  '莹': '瑩', '灵': '靈', '叶': '葉', '烂': '爛', '头': '頭', '满': '滿', '处': '處', '谷': '穀'
};

const toTraditional = (str) => {
  if (!str) return '';
  return str.split('').map(char => CN_MAP[char] || char).join('');
};

// 神煞解釋
const SHEN_SHA_INFO = {
    '貴人': '天乙貴人：最強吉星，主逢凶化吉，遇難呈祥，有貴人提拔，解災救難。',
    '驛馬': '驛馬：主奔波走動，出國，搬家，變動，職業變遷，心意不定。',
    '桃花': '桃花：主人緣佳，異性緣重，情感豐富，也有風流、多情之意。',
    '祿神': '祿神：主財祿豐足，食祿，福氣，性格剛毅，有爵祿之貴。',
    '羊刃': '羊刃：主性情剛烈，衝動，易有血光或手術，不利六親，武職可顯。',
    '文昌': '文昌：主聰明過人，氣質雅秀，利於升學考試，學術研究，才華洋溢。',
    '天德': '天德貴人：主化解災厄，心地善良，逢凶化吉，祖上有德。',
    '月德': '月德貴人：主福分深厚，逢凶化吉，女性主賢慧，人緣佳。',
    '龍德': '龍德：主貴人多助，轉禍為福，能化解凶煞，喜慶之事。',
    '金輿': '金輿：主財帛豐足，配偶條件佳，出入有車代步，富貴之象。',
    '華蓋': '華蓋：主孤獨清高，才華出眾，喜好宗教哲學藝術，易有靈性。',
    '孤辰': '孤辰：主孤獨，性格孤僻，六親無緣，不利男命婚姻。',
    '寡宿': '寡宿：主孤獨，性格孤僻，六親無緣，不利女命婚姻。',
    '學士': '學士：主才華，學識淵博，利於求學，聰明好學。',
    '天喜': '天喜：主喜慶之事，開心，人緣好，利結婚生子，心情愉快。',
    '紅鸞': '紅鸞：主婚姻喜慶，異性緣佳，早年利婚緣，人見人愛。',
    '將星': '將星：主有領導能力，掌權，有威望，事業成功，能文能武。',
};

// 統一處理：垂直文字、最多顯示 N 個、點擊事件、字體大小控制
const ShenShaVerticalList = ({ items, onClick, maxItems = 2, fontSize = '10px', cursor = 'pointer' }) => {
    // 1. 截斷邏輯
    const visibleItems = (items.length > maxItems) ? items.slice(0, maxItems) : items;

    // 2. 處理點擊 (傳回完整列表 items 給外層)
    const handleClick = (e) => {
        if (onClick) {
            e.stopPropagation();
            onClick(items); // 點擊時，把「完整列表」傳出去，讓 Modal 顯示全部
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'center' }}>
            {visibleItems.map((item, idx) => (
                <span 
                    key={idx} 
                    onClick={handleClick}
                    style={{ 
                        writingMode: 'vertical-rl', 
                        textOrientation: 'upright',
                        fontSize: fontSize, 
                        letterSpacing: '1px', 
                        lineHeight: '1.1', 
                        color: '#888', 
                        cursor: cursor
                    }}
                >
                    {item}
                </span>
            ))}
        </div>
    );
};



// 神煞詳情 Modal
const ShenShaModal = ({ config, onClose }) => {
    if (!config.isOpen) return null;
    
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(3px)', animation: 'fadeIn 0.2s'
        }} onClick={onClose}>
            <div style={{
                width: '85%', maxWidth: '340px', backgroundColor: '#fff', borderRadius: '16px',
                padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                maxHeight: '70vh', overflowY: 'auto', position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                
                {/* 標題列 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <div>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: THEME.black, marginRight: '8px' }}>{config.title}</span>
                        <span style={{ fontSize: '14px', color: THEME.gray }}>神煞詳情</span>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer' }}>
                        <X size={20} color={THEME.gray} />
                    </button>
                </div>

                {/* 列表內容 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {config.items.length > 0 ? config.items.map((item, idx) => (
                        <div key={idx} style={{ padding: '10px', backgroundColor: THEME.bgGray, borderRadius: '8px' }}>
                            <div style={{ fontWeight: 'bold', color: THEME.blue, fontSize: '16px', marginBottom: '4px' }}>
                                {item}
                            </div>
                            <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.5', textAlign: 'justify' }}>
                                {SHEN_SHA_INFO[item] || '暫無詳細說明'}
                            </div>
                        </div>
                    )) : <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>此柱無特殊神煞</div>}
                </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

// 輔助函式：顯示神煞說明
const showShenShaInfo = (name, e) => {
    e.stopPropagation(); // 防止觸發格子的點選事件
    const info = SHEN_SHA_INFO[name] || `【${name}】`;
    alert(info); // 簡單使用 alert 顯示，也可換成其他 Modal
};

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

const getShiShen = (dayGan, targetGan) => {
  if (!dayGan || !targetGan) return '';
  const dayIdx = TIANGAN.indexOf(dayGan);
  const targetIdx = TIANGAN.indexOf(targetGan);
  const dayEl = Math.floor(dayIdx / 2);
  const targetEl = Math.floor(targetIdx / 2);
  const samePol = (dayIdx % 2) === (targetIdx % 2);
  
  if (dayEl === targetEl) return samePol ? '比' : '劫'; 
  if ((dayEl + 1) % 5 === targetEl) return samePol ? '食' : '傷'; 
  if ((targetEl + 1) % 5 === dayEl) return samePol ? '卩' : '印'; 
  if ((dayEl + 2) % 5 === targetEl) return samePol ? '才' : '財'; 
  if ((targetEl + 2) % 5 === dayEl) return samePol ? '殺' : '官'; 
  return '';
};

const getShenSha = (gan, zhi, dayGan, dayZhi, yearZhi, monthZhi) => { // [注意] 新增 monthZhi 參數
    if (!zhi) return [];
    const list = [];
    
    // --- 輔助：地支三合/三會/對沖查詢 ---
    const isSanHe = (z, group) => group.includes(z);
    
    // 1. 天乙貴人 (日干)
    const tianYiMap = { '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'], '乙': ['子', '申'], '己': ['子', '申'], '丙': ['亥', '酉'], '丁': ['亥', '酉'], '壬': ['巳', '卯'], '癸': ['巳', '卯'], '辛': ['午', '寅'] };
    if (tianYiMap[dayGan]?.includes(zhi)) list.push('貴人');

    // 2. 驛馬 (年支/日支) - 申子辰馬在寅...
    const getYiMa = (base) => {
        if (['申', '子', '辰'].includes(base)) return '寅';
        if (['寅', '午', '戌'].includes(base)) return '申';
        if (['巳', '酉', '丑'].includes(base)) return '亥';
        if (['亥', '卯', '未'].includes(base)) return '巳';
        return null;
    };
    if (zhi === getYiMa(dayZhi) || zhi === getYiMa(yearZhi)) list.push('驛馬');

    // 3. 桃花 (咸池) (年支/日支)
    const getTaoHua = (base) => {
        if (['申', '子', '辰'].includes(base)) return '酉';
        if (['寅', '午', '戌'].includes(base)) return '卯';
        if (['巳', '酉', '丑'].includes(base)) return '午';
        if (['亥', '卯', '未'].includes(base)) return '子';
        return null;
    };
    if (zhi === getTaoHua(dayZhi) || zhi === getTaoHua(yearZhi)) list.push('桃花');

    // 4. 祿神 (日干)
    const luMap = {'甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子'};
    if (luMap[dayGan] === zhi) list.push('祿神');

    // 5. 羊刃 (日干)
    const yangRenMap = {'甲':'卯','乙':'辰','丙':'午','丁':'未','戊':'午','己':'未','庚':'酉','辛':'戌','壬':'子','癸':'丑'};
    if (yangRenMap[dayGan] === zhi) list.push('羊刃');

    // 6. 文昌 (日干)
    const wenChangMap = {'甲':'巳','乙':'午','丙':'申','丁':'酉','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯'};
    if (wenChangMap[dayGan] === zhi) list.push('文昌');

    // 7. 天德貴人 (月支) 
    // 正丁二坤(申)中, 三壬四辛同, 五亥六甲上, 七癸八寅逢, 九丙十居乙, 子巳丑庚中
    const tianDeMap = { 
        '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '亥', '未': '甲', 
        '申': '癸', '酉': '寅', '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚' 
    };
    const tdVal = tianDeMap[monthZhi];
    if (tdVal === gan || tdVal === zhi) list.push('天德');

    // 8. 月德貴人 (月支) 
    // 寅午戌月在丙, 申子辰月在壬, 亥卯未月在甲, 巳酉丑月在庚
    let ydGan = '';
    if (['寅','午','戌'].includes(monthZhi)) ydGan = '丙';
    else if (['申','子','辰'].includes(monthZhi)) ydGan = '壬';
    else if (['亥','卯','未'].includes(monthZhi)) ydGan = '甲';
    else if (['巳','酉','丑'].includes(monthZhi)) ydGan = '庚';
    if (gan === ydGan) list.push('月德');

    // 9. 龍德 (年支) 
    // 龍德在太歲後八位 (對沖前一位)
    const dzIdx = DIZHI.indexOf(zhi);
    const yzIdx = DIZHI.indexOf(yearZhi);
    if ((yzIdx + 8) % 12 === dzIdx) list.push('龍德');

    // 10. 金輿 (日干) 
    // 甲龍(辰)乙蛇(巳)丙戊馬(未), 丁己猴(申)歌, 庚犬(戌)辛豬(亥), 壬牛(丑)癸虎(寅)
    const jinYuMap = {'甲':'辰','乙':'巳','丙':'未','戊':'未','丁':'申','己':'申','庚':'戌','辛':'亥','壬':'丑','癸':'寅'};
    if (jinYuMap[dayGan] === zhi) list.push('金輿');

    // 11. 華蓋 (年支/日支) - 三合墓庫 
    const getHuaGai = (base) => {
        if (['寅','午','戌'].includes(base)) return '戌';
        if (['申','子','辰'].includes(base)) return '辰';
        if (['亥','卯','未'].includes(base)) return '未';
        if (['巳','酉','丑'].includes(base)) return '丑';
        return null;
    };
    if (zhi === getHuaGai(dayZhi) || zhi === getHuaGai(yearZhi)) list.push('華蓋');

    // 12. 孤辰、寡宿 (年支) 
    // 亥子丑(北): 孤寅寡戌; 寅卯辰(東): 孤巳寡丑; 巳午未(南): 孤申寡辰; 申酉戌(西): 孤亥寡未
    let gu = '', gua = '';
    if (['亥','子','丑'].includes(yearZhi)) { gu = '寅'; gua = '戌'; }
    else if (['寅','卯','辰'].includes(yearZhi)) { gu = '巳'; gua = '丑'; }
    else if (['巳','午','未'].includes(yearZhi)) { gu = '申'; gua = '辰'; }
    else if (['申','酉','戌'].includes(yearZhi)) { gu = '亥'; gua = '未'; }
    if (zhi === gu) list.push('孤辰');
    if (zhi === gua) list.push('寡宿');

    // 13. 學士 (日干) 
    // 甲子, 乙午, 丙申, 丁酉, 戊申, 己酉, 庚亥, 辛子, 壬寅, 癸卯
    const xueShiMap = {'甲':'子','乙':'午','丙':'申','丁':'酉','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯'};
    if (xueShiMap[dayGan] === zhi) list.push('學士');

    // 14. 天喜 (年支) 
    // 紅鸞對沖之支 (酉上起子逆數? No. 紅鸞: 子年見卯... 天喜是對宮)
    // 簡易算: 天喜 index = (酉(9) - 年支index + 12) % 12
    if ((9 - yzIdx + 12) % 12 === dzIdx) list.push('天喜');

    // 15. 紅鸞 (年支) 
    // 卯上起子逆數: 子年見卯, 丑年見寅... => Index = (3 - 年支 + 12) % 12
    if ((3 - yzIdx + 12) % 12 === dzIdx) list.push('紅鸞');

    // 16. 將星 (年支/日支) - 三合中神 
    const getJiangXing = (base) => {
        if (['寅','午','戌'].includes(base)) return '午';
        if (['申','子','辰'].includes(base)) return '子';
        if (['亥','卯','未'].includes(base)) return '卯';
        if (['巳','酉','丑'].includes(base)) return '酉';
        return null;
    };
    if (zhi === getJiangXing(dayZhi) || zhi === getJiangXing(yearZhi)) list.push('將星');

    return [...new Set(list)]; // 去除重複 (例如年日支查到同一個神煞)
};

// 核心計算函數
const calculateBaziResult = (formData, ziHourRule) => {
    if (formData.isManual && formData.manualInput) {
        const mp = formData.manualInput;
        const baziObj = {
            yearGan: mp.year.gan, yearZhi: mp.year.zhi,
            monthGan: mp.month.gan, monthZhi: mp.month.zhi,
            dayGan: mp.day.gan, dayZhi: mp.day.zhi,
            timeGan: mp.time.gan, timeZhi: mp.time.zhi,
        };

        const yearGanIdx = TIANGAN.indexOf(mp.year.gan);
        const monthGanIdx = TIANGAN.indexOf(mp.month.gan);
        const monthZhiIdx = DIZHI.indexOf(mp.month.zhi);
        const isYangYear = yearGanIdx % 2 === 0;
        const isMale = formData.gender === '1';
        let direction = (isMale && isYangYear) || (!isMale && !isYangYear) ? 1 : -1;

        const manualDaYuns = [];
        for (let i = 1; i <= 10; i++) {
            const nextGanIdx = (monthGanIdx + (direction * i) + 100) % 10;
            const nextZhiIdx = (monthZhiIdx + (direction * i) + 120) % 12;
            const nextGan = TIANGAN[nextGanIdx];
            const nextZhi = DIZHI[nextZhiIdx];

            manualDaYuns.push({ 
                seq: i, gan: nextGan, zhi: nextZhi,
                ganGod: getShiShen(mp.day.gan, nextGan),
                zhiHidden: ZHI_HIDDEN[nextZhi] || [],
                startAge: i, startYear: '', liuNians: [] 
            });
        }
        return {
            id: Date.now(), name: formData.name || '未命名', gender: formData.gender,
            genderText: formData.gender === '1' ? '元男' : '元女',
            rawDate: formData, isManual: true, solarDate: null, lunarDate: null,
            bazi: baziObj, naYin: { year: '', month: '', day: '', time: '' }, 
            yunInfo: null, daYuns: manualDaYuns
        };
    }

    const rawYear = parseInt(formData.year);
    const rawMonth = parseInt(formData.month);
    const rawDay = parseInt(formData.day);
    const rawHour = parseInt(formData.hour);
    const rawMinute = parseInt(formData.minute);

    let calcYear = rawYear, calcMonth = rawMonth, calcDay = rawDay, calcHour = rawHour;

    if (ziHourRule === 'ziShi' && rawHour >= 23) {
        const tempDate = new Date(rawYear, rawMonth - 1, rawDay);
        tempDate.setDate(tempDate.getDate() + 1); 
        calcYear = tempDate.getFullYear();
        calcMonth = tempDate.getMonth() + 1;
        calcDay = tempDate.getDate();
        calcHour = 0; 
    }

    const solar = window.Solar.fromYmdHms(calcYear, calcMonth, calcDay, calcHour, rawMinute, 0);    
    const lunar = solar.getLunar();
    const bazi = lunar.getEightChar();
    const genderNum = parseInt(formData.gender); 
    const yun = bazi.getYun(genderNum, 1);
    
    const startAge = yun.getStartYear();    
    const startMonth = yun.getStartMonth(); 
    const startSolar = yun.getStartSolar(); 
    
    const baziObj = {
        yearGan: bazi.getYearGan(), yearZhi: bazi.getYearZhi(),
        monthGan: bazi.getMonthGan(), monthZhi: bazi.getMonthZhi(),
        dayGan: bazi.getDayGan(), dayZhi: bazi.getDayZhi(),
        timeGan: bazi.getTimeGan(), timeZhi: bazi.getTimeZhi(),
    };

    const stdMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月 (冬月) ', '十二月 (臘月) '];
    const stdDays = [
        '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    const mVal = Math.abs(lunar.getMonth()); 
    const dVal = Math.abs(lunar.getDay());
    const rawString = lunar.toString(); 
    const isLeap = rawString.includes('闰') || rawString.includes('閏');
    const monthText = stdMonths[mVal - 1] || `${mVal}月`; 
    const dayText = stdDays[dVal - 1] || `${dVal}日`;
    const leapText = isLeap ? '閏' : ''; 

    const lunarString = `${bazi.getYearGan()}${bazi.getYearZhi()}年${leapText}${monthText}${dayText}${bazi.getTimeZhi()}時`;
    
    const calculateDaYun = (bz, gender, startYunYear, startYunAge) => {
        const yearGanIdx = TIANGAN.indexOf(bz.yearGan);
        const isYangYear = yearGanIdx % 2 === 0;
        const isMale = gender === '1';
        let direction = isMale ? (isYangYear ? 1 : -1) : (isYangYear ? -1 : 1);
        const monthGanIdx = TIANGAN.indexOf(bz.monthGan);
        const monthZhiIdx = DIZHI.indexOf(bz.monthZhi);
        const daYuns = [];

        for (let i = 1; i <= 10; i++) {
            const nextGanIdx = (monthGanIdx + (direction * i) + 100) % 10;
            const nextZhiIdx = (monthZhiIdx + (direction * i) + 120) % 12;
            const nextGan = TIANGAN[nextGanIdx];
            const currentYunYear = startYunYear + (i - 1) * 10;
            const currentYunAge = startYunAge + (i - 1) * 10;
            const liuNians = [];
            for (let j = 0; j < 10; j++) {
                const lnYear = currentYunYear + j;
                const lnAge = currentYunAge + j;
                const lnSolar = window.Solar.fromYmd(lnYear, 6, 15);
                const lnLunar = lnSolar.getLunar();
                const lnGanZhi = lnLunar.getYearInGanZhi(); 
                const lnGan = lnGanZhi.charAt(0);
                const lnZhi = lnGanZhi.charAt(1);
                liuNians.push({
                    year: lnYear, age: lnAge, ganZhi: lnGanZhi, gan: lnGan, zhi: lnZhi,
                    ganGod: getShiShen(bz.dayGan, lnGan), zhiHidden: ZHI_HIDDEN[lnZhi] || []
                });
            }
            daYuns.push({ 
                seq: i, gan: nextGan, zhi: DIZHI[nextZhiIdx],
                ganGod: getShiShen(bz.dayGan, nextGan),
                zhiHidden: ZHI_HIDDEN[DIZHI[nextZhiIdx]] || [],
                startYear: currentYunYear, startAge: currentYunAge, liuNians: liuNians
            });
        }
        return daYuns;
    };

    const daYuns = calculateDaYun(baziObj, formData.gender, startSolar.getYear(), startAge);
    const pad = (n) => String(n).padStart(2, '0');

    // 1. 計算日空亡 (以日柱查)
    const dayKongWang = getKongWang(baziObj.dayGan, baziObj.dayZhi);
    
    // 2. 計算年空亡 (以年柱查)
    const yearKongWang = getKongWang(baziObj.yearGan, baziObj.yearZhi);

    // 3. 計算節氣
    let jieQiSpan = '';
    try {
    if (typeof window.Lunar !== 'undefined' && lunar) {
        const prevJie = lunar.getPrevJieQi(false);
        const nextJie = lunar.getNextJieQi(false);

        if (prevJie && nextJie) {
            const pSolar = prevJie.getSolar();
            const nSolar = nextJie.getSolar();

            // 使用 julianDay 進行浮點數運算，確保毫秒級的精準
            const currentJD = solar.getJulianDay();
            const prevJD = pSolar.getJulianDay();
            const nextJD = nSolar.getJulianDay();

            // 天數差 = 當前時間減去節氣交換點
            const daysSince = Math.round(currentJD - prevJD);
            const daysLeft = Math.round(nextJD - currentJD);
            
            // 這樣顯示會最接近您月柱的判定邏輯
            if (daysSince === 0) {
                jieQiSpan = `${toTraditional(prevJie.getName())}當日`;
            } else {
                jieQiSpan = `${toTraditional(prevJie.getName())}後 ${daysSince} 天，距${toTraditional(nextJie.getName())}尚餘 ${daysLeft} 天`;
            }
        }
    }
    } catch (e) {
        console.error('節氣計算詳細錯誤:', e);
        jieQiSpan = '計算錯誤'; 
    }

    return {
        id: formData.id || Date.now(),
        name: formData.name || '未命名',
        gender: formData.gender,
        genderText: formData.gender === '1' ? '元男' : '元女',
        isManual: false, 
        rawDate: formData, 
        solarDate: `${rawYear}-${pad(rawMonth)}-${pad(rawDay)} ${pad(rawHour)}:${pad(rawMinute)}`,
        lunarDate: lunarString,
        jieQiSpan: jieQiSpan,           // 計算節氣天數
        bazi: baziObj,
        meta: {
            dayKongWang: dayKongWang,   // 日空亡
            yearKongWang: yearKongWang, // 年空亡
        },
        naYin: {
            year: toTraditional(bazi.getYearNaYin()), month: toTraditional(bazi.getMonthNaYin()),
            day: toTraditional(bazi.getDayNaYin()), time: toTraditional(bazi.getTimeNaYin())
        },
        yunInfo: {
            startAge: startAge, startMonth: startMonth, startDate: startSolar.toYmd(),
            detail: `出生後 ${startAge} 年 ${startMonth} 個月起運`
        },
        daYuns: daYuns
    };
};

// --- SettingsView ---
const SettingsView = ({ 
    ziHourRule, setZiHourRule,   // App 專屬設定
    colorTheme, setColorTheme,   // App 專屬設定
    bookmarks, setBookmarks      // 共用資料
}) => {
  // 定義這個 App 獨有的資訊
  const APP_INFO = {
    appName: APP_NAME,
    version: APP_VERSION,
    about: "本程式旨在提供專業子平八字排盤，精確至節氣日時，結合傳統命理與現代流暢 UI，輔助使用者進行深入的命理分析。",
  };

  const ToggleSelector = ({ options, currentValue, onChange }) => (
    <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '20px', padding: '2px' }}>
      {options.map((opt) => (
        <button key={opt.val} onClick={() => onChange(opt.val)} style={{ padding: '6px 14px', border: 'none', borderRadius: '18px', backgroundColor: currentValue === opt.val ? THEME.blue : 'transparent', color: currentValue === opt.val ? 'white' : THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{opt.label}</button>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
        <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2>
      </div>

      {/* 1. App 專屬設定區塊 */}
    <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>偏好設定</h3>
    <div style={{ backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', marginBottom: '12px' }}>
        
        {/* 子時設定 */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border}` }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>子時設定</div>
            <ToggleSelector options={[{val: 'ziZheng', label: '子正換日'}, {val: 'ziShi', label: '子時換日'}]} currentValue={ziHourRule} onChange={setZiHourRule} />
        </div>

        {/* 顯示配色設定 */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>顯示配色</div>
            <ToggleSelector 
                options={[
                    {val: 'elemental', label: '五行五色'}, 
                    {val: 'dark', label: '傳統深色'} 
                ]} 
                currentValue={colorTheme} 
                onChange={setColorTheme} 
            />
        </div>
    </div>

      {/* 2. 共用功能區塊 (直接使用 UI Library) */}
      <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="BAZI_BACKUP" />
      <AppInfoCard info={APP_INFO} />
      <BuyMeCoffee />

      <div style={{ marginTop: '24px' }}>
          <button onClick={() => { if(window.confirm('還原預設?')) { setZiHourRule('ziShi'); setColorTheme('elemental'); } }} style={{ width: '100%', padding: '12px', backgroundColor: THEME.bgGray, color: THEME.red, border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> 還原預設值
          </button>
      </div>
    </div>
  );
};

// --- 陰陽屬性判斷與彈窗選擇器 ---
const isYang = (index) => index % 2 === 0;

const GanZhiModalPicker = ({ title, isOpen, onClose, initialGan, initialZhi, onConfirm, colorTheme }) => {
  const [tempGan, setTempGan] = useState(initialGan);
  const [tempZhi, setTempZhi] = useState(initialZhi);
  useEffect(() => { if (isOpen) { setTempGan(initialGan); setTempZhi(initialZhi); } }, [isOpen, initialGan, initialZhi]);
  if (!isOpen) return null;
  const isZhiDisabled = (zhi) => {
    if (!tempGan) return false;
    const ganIdx = TIANGAN.indexOf(tempGan);
    const zhiIdx = DIZHI.indexOf(zhi);
    return isYang(ganIdx) !== isYang(zhiIdx);
  };
  const handleGanClick = (gan) => {
    setTempGan(gan);
    if (tempZhi) {
        const ganIdx = TIANGAN.indexOf(gan);
        const zhiIdx = DIZHI.indexOf(tempZhi);
        if (isYang(ganIdx) !== isYang(zhiIdx)) { setTempZhi(''); }
    }
  };
  const handleConfirm = () => {
    if (tempGan && tempZhi) { onConfirm(tempGan, tempZhi); onClose(); } else { alert("請完整選擇天干與地支"); }
  };
  const safeTheme = colorTheme || 'elemental';
  const getItemStyle = (item, isSelected, type, disabled) => {
    if (disabled) return { backgroundColor: '#f5f5f5', color: '#d9d9d9', border: '1px solid #eee', cursor: 'not-allowed', opacity: 0.6 };
    let itemColor = THEME.black;
    if (safeTheme === 'elemental') itemColor = type === 'gan' ? (STEM_COLORS[item] || THEME.black) : (BRANCH_COLORS[item] || THEME.black);
    if (isSelected) return { backgroundColor: THEME.blue, color: 'white', border: `1px solid ${THEME.blue}`, fontWeight: 'bold', boxShadow: '0 2px 6px rgba(24, 144, 255, 0.4)' };
    return { backgroundColor: THEME.white, color: itemColor, border: `1px solid ${THEME.border}`, fontWeight: 'normal' };
  };
  const btnBase = { flex: 1, padding: '12px 0', borderRadius: '8px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', minWidth: '40px', outline: 'none', userSelect: 'none' };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div style={{ width: '90%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'popIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{title} - 選擇干支</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px' }}><X size={24} color={THEME.gray}/></button>
        </div>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: THEME.gray, fontWeight: 'bold' }}>天干 (選陽鎖陰)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {TIANGAN.map(gan => ( <button key={gan} onClick={() => handleGanClick(gan)} style={{ ...btnBase, ...getItemStyle(gan, tempGan === gan, 'gan', false) }}>{gan}</button> ))}
        </div>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: THEME.gray, fontWeight: 'bold' }}>地支</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {DIZHI.map(zhi => { const disabled = isZhiDisabled(zhi); return ( <button key={zhi} onClick={() => !disabled && setTempZhi(zhi)} disabled={disabled} style={{ ...btnBase, ...getItemStyle(zhi, tempZhi === zhi, 'zhi', disabled) }}>{zhi}</button> ); })}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', color: THEME.gray }}>預覽：</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.blue, marginLeft: '8px' }}>{tempGan || '?'}{tempZhi || '?'}</span>
        </div>
        <button onClick={handleConfirm} style={{ width: '100%', padding: '14px', backgroundColor: THEME.black, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none' }}>確認選擇</button>
      </div>
      <style>{`@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

// --- BaziInput (八字輸入表單) ---
const BaziInput = ({ onCalculate, initialData, colorTheme }) => {
  const now = new Date();
  const [inputType, setInputType] = useState('solar');
  const [formData, setFormData] = useState(initialData || { name: '', gender: '1', year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: now.getHours(), minute: now.getMinutes() });
  const [lunarData, setLunarData] = useState(() => {
    // 嘗試從 window.Solar 獲取當前農曆 (如果 library 已載入)
    if (typeof window !== 'undefined' && window.Solar) {
       try {
           const solar = window.Solar.fromDate(now);
           const lunar = solar.getLunar();
           return {
               year: lunar.getYear(),
               month: Math.abs(lunar.getMonth()),
               day: lunar.getDay(),
               hour: now.getHours(),
               minute: now.getMinutes(),
               isLeap: lunar.getMonth() < 0
           };
       } catch (e) { console.error("Lunar init failed", e); }
    }
    // 如果 library 還沒好，就用西曆年做備案，或維持原有的 1月1日
    return { year: now.getFullYear(), month: 1, day: 1, hour: 0, minute: 0, isLeap: false };
  });

  const [manualPillars, setManualPillars] = useState({ year: { gan: '甲', zhi: '子' }, month: { gan: '丙', zhi: '寅' }, day: { gan: '戊', zhi: '辰' }, time: { gan: '庚', zhi: '申' } });
  const [modalConfig, setModalConfig] = useState({ isOpen: false, pillar: null }); 

  const years = useMemo(() => { const arr = []; for (let i = 1900; i <= 2100; i++) arr.push(i); return arr; }, []);
  const hours = useMemo(() => Array.from({length: 24}, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({length: 60}, (_, i) => i), []);
  const pad = (n) => String(n).padStart(2, '0');

  const handleSolarChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        if (field === 'year' || field === 'month') {
            const newYear = parseInt(field === 'year' ? value : formData.year);
            const newMonth = parseInt(field === 'month' ? value : formData.month);
            const maxDays = new Date(newYear, newMonth, 0).getDate();
            if (parseInt(newData.day) > maxDays) newData.day = maxDays;
        }
        setFormData(newData);
    };

    const solarDays = useMemo(() => {
        if (inputType !== 'solar') return [];
        const y = parseInt(formData.year); const m = parseInt(formData.month);
        return Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => i + 1);
    }, [formData.year, formData.month, inputType]);

  const getLunarMaxDays = (y, m, isLeap) => {
      if (!window.LunarYear) return 30; 
      try {
          const lunarYear = window.LunarYear.fromYear(parseInt(y));
          const months = lunarYear.getMonths();
          const target = months.find(lm => lm.getMonth() === parseInt(m) && lm.isLeap() === isLeap);
          return target ? target.getDayCount() : 30;
      } catch (e) { return 30; }
  };

  const handleLunarChange = (field, value) => {
      let newData = { ...lunarData, [field]: value };
      if (field === 'year' || field === 'month' || field === 'isLeap') {
          const maxDays = getLunarMaxDays(newData.year, newData.month, newData.isLeap);
          if (parseInt(newData.day) > maxDays) newData.day = maxDays;
      }
      setLunarData(newData);
  };

  const lunarDays = useMemo(() => {
      if (inputType !== 'lunar') return [];
      const max = getLunarMaxDays(lunarData.year, lunarData.month, lunarData.isLeap);
      return Array.from({ length: max }, (_, i) => i + 1);
  }, [lunarData.year, lunarData.month, lunarData.isLeap, inputType]);

  const openPicker = (pillarKey) => { setModalConfig({ isOpen: true, pillar: pillarKey }); };
  const handlePickerConfirm = (newGan, newZhi) => {
      setManualPillars(prev => ({ ...prev, [modalConfig.pillar]: { gan: newGan, zhi: newZhi } }));
      setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleStartCalculate = () => {    
    if (inputType === 'ganzhi') {
        const fakeDate = { ...formData, manualInput: manualPillars, isManual: true };
        onCalculate(fakeDate);
    } else {
        let finalSolarData = formData;
        if (inputType === 'lunar') {
             try {
                const y = parseInt(lunarData.year); const m = parseInt(lunarData.month); const d = parseInt(lunarData.day); const h = parseInt(lunarData.hour); 
                const monthVal = lunarData.isLeap ? -Math.abs(m) : Math.abs(m);
                const lunar = window.Lunar.fromYmdHms(y, monthVal, d, h, 0, 0);
                const solar = lunar.getSolar();
                finalSolarData = { ...formData, year: solar.getYear(), month: solar.getMonth(), day: solar.getDay(), hour: solar.getHour(), minute: solar.getMinute() };
            } catch(e) { alert("日期轉換失敗"); return; }
        }
        onCalculate(finalSolarData);
    }
  };

  const getTabBtnStyle = (isActive) => ({ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${isActive ? THEME.blue : THEME.border}`, backgroundColor: isActive ? THEME.bgBlue : THEME.white, color: isActive ? THEME.blue : THEME.black, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' });

  const renderPillarInput = (label, pillarKey) => {
      const pData = manualPillars[pillarKey];
      const ganColor = STEM_COLORS[pData.gan] || THEME.black;
      const zhiColor = BRANCH_COLORS[pData.zhi] || THEME.black;
      return (
          <div onClick={() => openPicker(pillarKey)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '10px 4px', backgroundColor: THEME.white, boxShadow: '0 2px 5px rgba(0,0,0,0.03)', transition: 'transform 0.1s', userSelect: 'none' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '12px', color: THEME.gray, marginBottom: '8px' }}>{label}</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: ganColor, lineHeight: 1.2 }}>{pData.gan}</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: zhiColor, lineHeight: 1.2 }}>{pData.zhi}</div>
          </div>
      );
  };

  return (
    <div style={{ padding: '20px', flex: 1, overflowY: 'auto', backgroundColor: THEME.bg }}>
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: `1px solid ${THEME.border}` }}>
          <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', color: THEME.black, fontSize: '18px', fontWeight: 'bold' }}>{initialData ? '修改出生資料' : '請輸入出生資料'}</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>姓名</label>
            <input type="text" value={formData.name} onChange={e => handleSolarChange('name', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} placeholder="輸入姓名" />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>性別</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => handleSolarChange('gender', '1')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${formData.gender === '1' ? THEME.blue : THEME.border}`, backgroundColor: formData.gender === '1' ? THEME.bgBlue : THEME.white, color: formData.gender === '1' ? THEME.blue : THEME.black, fontWeight: 'bold' }}>男 (乾造)</button>
                 <button onClick={() => handleSolarChange('gender', '0')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${formData.gender === '0' ? THEME.red : THEME.border}`, backgroundColor: formData.gender === '0' ? THEME.bgRed : THEME.white, color: formData.gender === '0' ? THEME.red : THEME.black, fontWeight: 'bold' }}>女 (坤造)</button>
              </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
             <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>輸入方式</label>
             <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setInputType('solar')} style={getTabBtnStyle(inputType === 'solar')}>西曆</button>
                <button onClick={() => setInputType('lunar')} style={getTabBtnStyle(inputType === 'lunar')}>農曆</button>
                <button onClick={() => setInputType('ganzhi')} style={getTabBtnStyle(inputType === 'ganzhi')}>干支四柱</button>
             </div>
          </div>

        {inputType === 'solar' && (
              <>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>西元年</label> <select value={formData.year} onChange={e => handleSolarChange('year', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select> </div>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>月</label> <select value={formData.month} onChange={e => handleSolarChange('month', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}</option>)}</select> </div>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>日</label> <select value={formData.day} onChange={e => handleSolarChange('day', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}> {solarDays.map(d => <option key={d} value={d}>{d}</option>)} </select> </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>出生時間</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}> <select value={formData.hour} onChange={e => handleSolarChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h =><option key={h} value={h}>{pad(h)}</option>)}</select> </div>
                    <span>:</span>
                    <div style={{ flex: 1 }}> <select value={formData.minute} onChange={e => handleSolarChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{pad(m)}</option>)}</select> </div>
                    </div>
                </div>
              </>
          )}

        {inputType === 'lunar' && (
              <>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>農曆年</label> <select value={lunarData.year} onChange={e => handleLunarChange('year', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select> </div>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>月</label> <select value={lunarData.month} onChange={e => handleLunarChange('month', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}> {Array.from({length:12},(_,i)=>i+1).map(m => ( <option key={m} value={m}>{getLunarMonthText(m)}</option> ))} </select> </div>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>日</label> <select value={lunarData.day} onChange={e => handleLunarChange('day', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}> {lunarDays.map(d => ( <option key={d} value={d}>{getLunarDayText(d)}</option> ))} </select> </div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" id="leapMonth" checked={lunarData.isLeap} onChange={e => handleLunarChange('isLeap', e.target.checked)} style={{ marginRight: '8px', width: '18px', height: '18px' }} />
                      <label htmlFor="leapMonth" style={{ fontSize: '13px', color: THEME.black }}>是閏月 (例如閏四月)</label>
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>出生時間</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}> <select value={lunarData.hour} onChange={e => handleLunarChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h => <option key={h} value={h}>{pad(h)}</option>)}</select> </div>
                    <span>:</span>
                    <div style={{ flex: 1 }}> <select value={lunarData.minute} onChange={e => handleLunarChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{pad(m)}</option>)}</select> </div>
                    </div>
                </div>
              </>
          )}

          {inputType === 'ganzhi' && (
              <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', color: THEME.gray, marginBottom: '10px' }}>點選下方修改四柱</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                      {renderPillarInput('時柱', 'time')} {renderPillarInput('日柱', 'day')} {renderPillarInput('月柱', 'month')} {renderPillarInput('年柱', 'year')}
                  </div>
              </div>
          )}

          <button onClick={handleStartCalculate} style={{ width: '100%', padding: '14px', backgroundColor: THEME.blue, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            <Sparkles size={20} />
            {initialData ? '重新排盤' : '開始排盤'}
          </button>
        </div>
        <GanZhiModalPicker 
            title={modalConfig.pillar ? { year: '年柱', month: '月柱', day: '日柱', time: '時柱' }[modalConfig.pillar] : ''}
            isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            initialGan={modalConfig.pillar ? manualPillars[modalConfig.pillar].gan : ''} initialZhi={modalConfig.pillar ? manualPillars[modalConfig.pillar].zhi : ''}
            onConfirm={handlePickerConfirm} colorTheme={colorTheme}
        />
      </div>
    );
};

// --- PillarCard (四柱卡片) ---
const PillarCard = ({ 
    title, gan, zhi, naYin, dayMaster, displayMode, 
    dayZhi, yearZhi, monthZhi, colorTheme, genderText, 
    onShenShaClick, kongWangStatus 
    }) => {

   const safeTheme = colorTheme || 'elemental';
   const ganColor = safeTheme === 'elemental' ? (STEM_COLORS[gan] || '#555555') : '#555555';
   const zhiColor = safeTheme === 'elemental' ? (BRANCH_COLORS[zhi] || '#555555') : '#555555';
   
   const ganGod = (title === '日柱') ? null : getShiShen(dayMaster, gan);
   const zhiGods = (ZHI_HIDDEN[zhi] || []).map(h => getShiShen(dayMaster, h));
   const hiddenStems = ZHI_HIDDEN[zhi] || [];
   const shenShas = getShenSha(gan, zhi, dayMaster, dayZhi, yearZhi, monthZhi);

   let displayTopRight = null;
   let displayBottomRight = [];

   if (displayMode === 'zangGan') {
       displayBottomRight = hiddenStems;
   } else if (displayMode === 'shenSha') {
       displayBottomRight = shenShas;
   } else {
       displayTopRight = ganGod;
       displayBottomRight = zhiGods;
   }

   return (
     <div style={{ 
         flex: 1, backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, 
         padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
         boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minHeight: '175px', justifyContent: 'space-between' 
     }}>
        <div style={{ fontSize: '12px', color: THEME.gray, marginBottom: '8px' }}>{title}</div>
        
        {/* 天干區塊 (改為 inline-flex 緊貼字體) */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: ganColor, lineHeight: 1 }}>{gan}</span>
            
            {displayMode === 'shiShen' && displayTopRight && (
                <div style={{ position: 'absolute', top: '-4px', left: '100%', marginLeft: '2px', fontSize: '14px', color: '#888', whiteSpace: 'nowrap' }}>
                    {displayTopRight}
                </div>
            )}
            
            {genderText && (
                <div style={{ position: 'absolute', top: '-2px', left: '100%', marginLeft: '4px', writingMode: 'vertical-rl', textOrientation: 'upright', fontSize: '14px', fontWeight: 'bold', color: THEME.gray, opacity: 0.8, letterSpacing: '2px', whiteSpace: 'nowrap' }}>
                    {genderText}
                </div>
            )}
        </div>
        
        {/* 地支區塊 (改為 inline-flex 緊貼字體) */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px' }}>
            
            {/* ★ 絕對穩定的空亡標記：向左外推 100% */}
            {kongWangStatus && (
                <div style={{ 
                    position: 'absolute', 
                    right: '100%',            // 對齊主字的左邊緣並向外推
                    bottom: '0px',            // 對齊主字的底部
                    marginRight: '6px',       // 與主字保持安全距離，絕對不會疊加
                    fontSize: '11px', 
                    color: '#ffffff',       
                    backgroundColor: '#a3a3a3', // 稍微調柔和一點的灰色
                    borderRadius: '4px',    
                    padding: '1px 4px',
                    lineHeight: '1.2',
                    fontWeight: 'bold',
                    zIndex: 10,
                    whiteSpace: 'nowrap'      // 防止變形
                }}>
                    空
                </div>
            )}

            {/* 主字體 */}
            <span style={{ fontSize: '28px', fontWeight: '800', color: zhiColor, lineHeight: 1 }}>{zhi}</span>
            
            {/* 右側資訊 (十神/藏干/神煞)：向右外推 100% */}
            <div style={{ position: 'absolute', top: '0px', left: '100%', marginLeft: '6px' }}>
                {displayMode === 'shenSha' ? (
                    <ShenShaVerticalList 
                        items={shenShas}
                        onClick={(fullList) => onShenShaClick && onShenShaClick(`${gan}${zhi} (${title})`, fullList)}
                        fontSize="11px"
                        maxItems={2}
                    />
                ) : (
                    displayBottomRight.length > 0 ? displayBottomRight.map((item, idx) => (
                        <span key={idx} style={{ writingMode: 'horizontal-tb', fontSize: '14px', lineHeight: '1.2', color: '#888', display: 'block', marginBottom: '2px', whiteSpace: 'nowrap' }}>
                            {item}
                        </span>
                    )) : null
                )}
            </div>
        </div>
        
        {/* 納音 */}
        <div style={{ fontSize: '10px', color: THEME.gray, marginTop: '12px', backgroundColor: THEME.bgGray, padding: '2px 6px', borderRadius: '4px', textAlign: 'center' }}>{naYin}</div>
     </div>
   );
};

const AiBaziAnalysis = ({ data }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

  // --- 內部知識庫：滴天髓古文佐證 ---
  const DI_TIAN_SUI = {
    '甲': '《滴天髓》云：「甲木參天，脫胎要火。春不容金，秋不容土。火熾乘龍，水宕騎虎。地潤天和，植立千古。」',
    '乙': '《滴天髓》云：「乙木雖柔，刲羊解牛。懷丁抱丙，跨鳳乘猴。虛濕之地，騎馬亦憂。藤蘿繫甲，可春可秋。」',
    '丙': '《滴天髓》云：「丙火猛烈，欺霜侮雪。能煆庚金，逢辛反怯。土眾成慈，水猖顯節。虎馬犬鄉，甲木若來，必當焚滅。」',
    '丁': '《滴天髓》云：「丁火柔中，內性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不窮。如有嫡母，可秋可冬。」',
    '戊': '《滴天髓》云：「戊土固重，既中且正。靜翕動闢，萬物司命。水潤物生，火燥物病。若在艮坤，怕沖宜靜。」',
    '己': '《滴天髓》云：「己土卑濕，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜幫。」',
    '庚': '《滴天髓》云：「庚金帶煞，剛健為最。得水而清，得火而銳。土潤則生，土乾則脆。能贏甲兄，輸於乙妹。」',
    '辛': '《滴天髓》云：「辛金軟弱，溫潤而清。畏土之疊，樂水之盈。能扶社稷，能救生靈。熱則喜母，寒則喜丁。」',
    '壬': '《滴天髓》云：「壬水通河，能洩金氣。剛中之德，周流不滯。通根透癸，沖天奔地。化則有情，從則相濟。」',
    '癸': '《滴天髓》云：「癸水至弱，達於天津。得龍而運，功化斯神。不愁火土，不論庚辛。合戊見火，化象斯真。」'
  };

  const getCounts = () => {
    const counts = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    const { bazi } = data;
    const chars = [bazi.yearGan, bazi.yearZhi, bazi.monthGan, bazi.monthZhi, bazi.dayGan, bazi.dayZhi, bazi.timeGan, bazi.timeZhi];
    chars.forEach(char => { if (WUXING_MAP[char]) counts[WUXING_MAP[char]]++; });
    return counts;
  };

  const getRelations = (dayWuxing) => {
    const cycle = ['木', '火', '土', '金', '水'];
    const idx = cycle.indexOf(dayWuxing);
    return {
      same: dayWuxing, produce: cycle[(idx + 1) % 5], control: cycle[(idx + 2) % 5],
      controlledBy: cycle[(idx + 3) % 5], producedBy: cycle[(idx + 4) % 5]
    };
  };

  // 生成千字深度報告
  const generateLongReport = () => {
    const { bazi, name, genderText } = data;
    const wx = getCounts();
    const dm = bazi.dayGan;
    const dmWuxing = WUXING_MAP[dm];
    const monthZhiWuxing = WUXING_MAP[bazi.monthZhi];
    const rel = getRelations(dmWuxing);
    
    const selfCount = wx[dmWuxing] + wx[rel.producedBy];
    const isStrong = selfCount >= 4 || (['same', 'producedBy'].includes(Object.keys(rel).find(k => rel[k] === monthZhiWuxing)) && selfCount >= 3);
    const favWuxing = isStrong ? [rel.control, rel.produce, rel.controlledBy] : [rel.producedBy, rel.same];

    // --- 提取原局所有的字 (包含天干與地支) ---
    const chartChars = [bazi.yearGan, bazi.yearZhi, bazi.monthGan, bazi.monthZhi, bazi.dayGan, bazi.dayZhi, bazi.timeGan, bazi.timeZhi];

    // 五行對應的精確干支字典
    const WUXING_CHARS = {
        '木': ['甲', '乙', '寅', '卯'],
        '火': ['丙', '丁', '巳', '午'],
        '土': ['戊', '己', '辰', '戌', '丑', '未'],
        '金': ['庚', '辛', '申', '酉'],
        '水': ['壬', '癸', '亥', '子']
    };

    // 嚴格區分用神與喜神
    let yongShenList = []; // 原局有的字 (用神)
    let xiShenList = [];   // 原局沒有的字 (喜神)

    favWuxing.forEach(wxElem => {
        const charsOfWx = WUXING_CHARS[wxElem];
        charsOfWx.forEach(char => {
            const fullName = `${char}${wxElem}`; // 組合成如 "甲木", "亥水"
            if (chartChars.includes(char)) {
                if (!yongShenList.includes(fullName)) yongShenList.push(fullName);
            } else {
                if (!xiShenList.includes(fullName)) xiShenList.push(fullName);
            }
        });
    });

    const primaryFav = favWuxing[0];

    const seasonMap = { '寅':'春', '卯':'春', '辰':'春', '巳':'夏', '午':'夏', '未':'夏', '申':'秋', '酉':'秋', '戌':'秋', '亥':'冬', '子':'冬', '丑':'冬' };
    const season = seasonMap[bazi.monthZhi];
    let qtbjQuote = '';
    if (season === '春') qtbjQuote = '《窮通寶鑑》尤重調候，您生於春季，萬物含苞、餘寒猶存。命局若能得火以溫暖，得水以潤澤，便能展現「木火通明」的勃勃生機。';
    else if (season === '夏') qtbjQuote = '《窮通寶鑑》尤重調候，您生於夏季，火炎土燥、氣候炎熱。此時命局最急需壬癸之水來調和，謂之「水火既濟」，有水潤澤方能成就大器。';
    else if (season === '秋') qtbjQuote = '《窮通寶鑑》尤重調候，您生於秋季，金水進氣、萬物肅殺。秋之氣場重在收斂與雕琢，需得當之五行（如火煆金）相配，方顯秋華。';
    else if (season === '冬') qtbjQuote = '《窮通寶鑑》尤重調候，您生於冬季，水冷金寒、萬物休囚。此時命局絕不可缺丙丁之火以暖局，有火則「冬陽解凍」，發福綿長。';

    // --- 神煞提取 ---
    const pillars = [ { g: bazi.yearGan, z: bazi.yearZhi }, { g: bazi.monthGan, z: bazi.monthZhi }, { g: bazi.dayGan, z: bazi.dayZhi }, { g: bazi.timeGan, z: bazi.timeZhi } ];
    const allShenSha = [...new Set(pillars.flatMap(p => getShenSha(p.g, p.z, bazi.dayGan, bazi.dayZhi, bazi.yearZhi, bazi.monthZhi)))];

    // --- 開始撰寫千字報告 ---
    let report = `### 一、 原局總論與古典格局剖析\n\n`;
    report += `命主 ${name} (${genderText})，日主為**【${dm}${dmWuxing}】**。\n\n`;
    
    report += `《子平真詮》開篇即云：「八字用神，專求月令，以日干配月令地支，而生剋不同，格局分焉。」您生於**【${bazi.monthZhi}月】**，此時氣候與天地的能量樞紐，完全由月令提綱所掌控。\n\n`;
    
    // 引入滴天髓古文
    report += `${DI_TIAN_SUI[dm]}\n\n`;
    report += `前人這段箴言，精準道出了您日主**【${dm}】**的核心本質。此外，從氣候溫濕的角度來看：\n\n`;
    report += `${qtbjQuote}\n\n`;
    
    // 導入「原局有之為用，無之為喜」的嚴謹判斷
    report += `從全局五行生剋來看，您的日元屬於**「${isStrong ? '身旺' : '身弱'}」**之局。依據「原局有之方能為用，原局無之最多為喜」的嚴謹命理法則，因您日元${isStrong ? '氣勢強旺，需引導宣洩或適當雕琢' : '根氣稍弱，急需生扶與滋補'}。\n\n`;
    
    if (yongShenList.length > 0) {
        report += `經過盤查，您原局中自帶的**「用神」為：【${yongShenList.join('、')}】**。這些是您命中與生俱來的救星與武器，也是您一生中最該依賴、最能發揮天賦的特質。\n\n`;
    } else {
        report += `經過盤查，您原局中暫無明顯透出的真用神，格局屬「有病方為貴，無傷不是奇」中尚待藥解的狀態。這代表您一生的成就多需仰賴後天大運的補足與自身極大的努力。\n\n`;
    }

    if (xiShenList.length > 0) {
        report += `此外，原局缺乏但能為您帶來好運的**「喜神」為：【${xiShenList.join('、')}】**。當流年或大運走到這些干支時，便是您借助外力、乘風破浪的黃金時刻。\n\n`;
    }

    report += `### 二、 天賦事業與六親祖業解析\n\n`;
    report += `八字四柱不僅看個人，也看六親宮位。您的年柱代表祖上與早年，月柱代表父母與青年，日柱為夫妻，時柱為子息與晚年。\n\n`;
    report += `在事業天賦上，`;
    let shenShaTraits = [];
    if (allShenSha.includes('將星') || allShenSha.includes('羊刃')) shenShaTraits.push(`命逢「將星 / 羊刃」，《三命通會》云：「將星文武兩相宜，祿重權高足可知」。這賦予您極強的威嚴、決斷力與開創疆土的魄力`);
    if (allShenSha.includes('文昌') || allShenSha.includes('學士') || allShenSha.includes('華蓋')) shenShaTraits.push(`命中高透「文昌 / 學士 / 華蓋」，古語云：「文昌入命，聰明過人」，您具備強大的領悟力、才華與深度的反思能力`);
    if (allShenSha.includes('驛馬')) shenShaTraits.push(`坐擁「驛馬」之星，註定您的人生多在走動中發跡，適合向外拓展、遠赴他鄉或跨界發展`);
    
    if (shenShaTraits.length > 0) {
      report += `${shenShaTraits.join('；同時，')}。\n\n`;
    } else {
      report += `您的原局平和，猶如大地藏金，不顯山露水。適合深耕專業，以德服人，步步為營，在中晚年迎來事業的高峰。\n\n`;
    }

    report += `針對您的喜用神【${primaryFav}】，現代精確行業建議如下：\n`;
    if (primaryFav === '木') report += `- **宜從事**：文化教育、出版傳播、農業園藝、醫療照護、社工諮商、設計美學、人資培訓、中醫草藥、木材傢俱、紡織服飾、宗教或心靈導師。木主仁，需要深耕、培育與具備生長性質的行業最能滋養您的命局。\n`;
    if (primaryFav === '火') report += `- **宜從事**：餐飲烘焙、互聯網軟體、人工智慧(AI)、光電能源、影視娛樂、演說傳播、美容美髮、心理治療、化工產業、政治與評論家。火主禮與明亮，站在人前發光發熱或推動無形事物轉化的產業是首選。\n`;
    if (primaryFav === '土') report += `- **宜從事**：房地產、建築工程、物業管理、傳統農牧、顧問諮詢、礦產開發、石材建材、倉儲業、古董字畫鑑定、生前契約或命理風水。土主信，凡是需要極高信任度、穩定不變與長期承載的實體事業，皆可大展鴻圖。\n`;
    if (primaryFav === '金') report += `- **宜從事**：金融保險、證券投資、會計審計、軍警法務、五金機械、科技硬體製造、汽車產業、珠寶鐘錶、外科醫生、牙醫或系統架構師。金主義與肅殺，需要極度精確、嚴謹紀律與決斷力的領域能讓您脫穎而出。\n`;
    if (primaryFav === '水') report += `- **宜從事**：國際貿易、物流船運、旅遊導遊、水產漁業、飲品酒類、電子商務、公關外交、大眾傳播、記者、數據分析師或偵探調查。水主智與流動，靈活應變、跨界整合或處理龐大資訊流的商業模式最符合您的財富軌跡。\n\n`;

    report += `### 三、 財運格局與投資風險評估\n\n`;
    const wealthCount = wx[rel.control];
    
    report += `《淵海子平》有云：「凡看命，以日干為主，取迎陽對之財。財乃養命之源，不可缺乏。」在您的命局中，代表財富的**【${rel.control}】**共有 ${wealthCount} 個。\n\n`;
    
    if (wealthCount >= 3 && !isStrong) {
      report += `您的格局為**「財多身弱」**。這表示您對商機極度敏感，身邊總有誘人的投資機會。但古籍有云：「財多反壓身」。您的**投資風險取向必須設定為極度保守**。不宜單打獨鬥或輕易涉足高槓桿操作。最好的生財之道是「合夥經營」或將資金投入房產、保險等不動產，藉由他人的力量或時間的複利來守住財富。\n\n`;
    } else if (wealthCount >= 2 && isStrong) {
      report += `您的格局屬於優質的**「身財兩停」**。具備強大的承載財富能力，不僅能賺錢，更能守財。您的**投資風險取向可適度積極**，適合創業、股權投資或開發新市場。您的生財之道在於「敢為天下先」，只要經過理性評估，勇於投入資源，必能開創出屬於自己的財富王國。\n\n`;
    } else {
      report += `您的原局財星較為隱退。這不代表貧窮，而是指您的財富多為「正印生身」或「食傷生財」的技術財。您的**投資風險取向應穩紮穩打**。生財之道在於「知識變現與專業升級」。專注於本業的深耕，考取證照或建立無可取代的專業地位，財富自然會不請自來。\n\n`;
    }

    report += `### 四、 感情婚姻與伴侶特質解析\n\n`;
    report += `您的日支（夫妻宮）坐落於**【${bazi.dayZhi}】**。在傳統八字中，日支就如同配偶的家，透過日支的地支屬性與暗藏的十神星曜，我們能精準描繪出您命中註定的另一半輪廓：\n\n`;
    
    // 1. 依據日支(四正、四馬、四庫)判斷配偶「外在氣質」
    if (['子', '午', '卯', '酉'].includes(bazi.dayZhi)) {
        report += `**【外在氣質：四正星（桃花之象）】**\n您的另一半多半外貌姣好、氣質出眾，或者具備某種獨特的迷人魅力。性格上較為直率、愛恨分明，注重生活品味，在人群中往往較為亮眼。\n\n`;
    } else if (['寅', '申', '巳', '亥'].includes(bazi.dayZhi)) {
        report += `**【外在氣質：四馬星（驛馬之象）】**\n您的另一半性格活潑外向、機智敏捷，具備極佳的溝通與適應能力。對方可能是個閒不下來的人，這段關係充滿動態與活力，另一半能為您帶來許多新鮮的觀點。\n\n`;
    } else if (['辰', '戌', '丑', '未'].includes(bazi.dayZhi)) {
        report += `**【外在氣質：四庫星（墓庫之象）】**\n您的另一半性格沉穩、踏實，非常有責任感與傳統家庭觀念。雖然外表可能不夠浪漫，行事作風樸實無華，但絕對是能在日常中給予您滿滿安全感的可靠伴侶。\n\n`;
    }

    // 2. 依據日支本氣十神判斷「內在性格與對待關係」
    const dayZhiMainGan = ZHI_HIDDEN[bazi.dayZhi][0]; // 取得夫妻宮主氣藏干
    const spouseTenGod = getShiShen(bazi.dayGan, dayZhiMainGan); // 計算十神
    
    let tenGodDesc = '';
    switch(spouseTenGod) {
        case '比':
            tenGodDesc = '夫妻宮坐比肩】\n您的伴侶性格獨立自主，與您就像好朋友、好兄弟（或閨蜜）一般，地位平等，凡事有商有量。但也因為雙方都很堅持自我，偶爾會有互不相讓的情況。';
            break;
        case '劫':
            tenGodDesc = '夫妻宮坐劫財】\n您的伴侶充滿行動力，甚至有些好勝心。對方能與您共患難，但在相處時容易產生競爭感或財務上的摩擦，需要多學習柔軟溝通。';
            break;
        case '食':
            tenGodDesc = '夫妻宮坐食神】\n您的伴侶性格溫和寬厚，懂得享受生活，多半對美食、藝術有獨到見解。對方脾氣佳，能給予您身心上的放鬆，體態多屬豐滿有福氣之相。';
            break;
        case '傷':
            tenGodDesc = '夫妻宮坐傷官】\n您的伴侶才華洋溢、聰明機靈，但言辭可能較為犀利。對方極具個人能力，不過有時心高氣傲，相處上容易因為拌嘴而傷和氣，需互相包容。';
            break;
        case '財':
            tenGodDesc = '夫妻宮坐正財】\n您的伴侶顧家、務實且傳統，極擅長理財與打理生活瑣事。這是一段分工明確的穩定關係，對方是您事業背後最堅實的後盾。';
            break;
        case '才':
            tenGodDesc = '夫妻宮坐偏財】\n您的伴侶慷慨大方、交際手腕佳，人緣極好。對方懂得賺錢也懂得享受生活，帶有浪漫特質，但也因外務較多，需要您給予一定的自由空間。';
            break;
        case '官':
            tenGodDesc = '夫妻宮坐正官】\n您的伴侶為人正直、端莊，極具責任感。行事作風偏向傳統與保守，重視社會規範，雖然有時略顯嚴肅或愛管人，但絕對是個能依靠的避風港。';
            break;
        case '殺':
            tenGodDesc = '夫妻宮坐七殺】\n您的伴侶性格強勢、極具魄力與野心，做事雷厲風行。對方自帶威嚴，但也可能脾氣較急。這段關係多半是「相愛相殺」的歡喜冤家模式。';
            break;
        case '印':
            tenGodDesc = '夫妻宮坐正印】\n您的伴侶心地善良、極富同理心與包容力，就像長輩一樣照顧著您。在這段關係中您能得到極大的精神慰藉與呵護。';
            break;
        case '卩':
            tenGodDesc = '夫妻宮坐偏印】\n您的伴侶思想獨特、直覺敏銳，性格較為內斂、不隨波逐流。有時顯得忽冷忽熱，需要您用心去理解其豐富且神祕的內心世界。';
            break;
    }
    
    report += `**【內在性格：${tenGodDesc}**\n\n`;

    // 3. 神煞桃花孤寡判斷
    if (allShenSha.includes('桃花') || allShenSha.includes('紅鸞')) {
        report += `綜合來看，因您命帶桃花、紅鸞星，您自帶迷人光芒，異性緣頗佳。但也須防範「遍野桃花」帶來的感情困擾，宜堅定內心選擇。\n`;
    } else if (allShenSha.includes('孤辰') || allShenSha.includes('寡宿')) {
        report += `綜合來看，命中帶有孤寡之氣，代表您在情感深處渴望絕對的自由與獨立。有時伴侶難以走入您的內心深處，晚婚或保持一定距離的相處模式會更適合您。\n`;
    }
    
    // 4. 五行調和心法
    report += `\n**【五行調和相處心法】**\n`;
    report += `夫妻相處如太極陰陽互補。因您的日主本性，建議您在感情中導入「${primaryFav}」五行的行為模式：\n`;
    if (primaryFav === '木') report += `木主仁。您需要學會如樹木般包容，給予伴侶成長的空間，多用傾聽與鼓勵代替批評，讓關係自然生根發芽。\n\n`;
    if (primaryFav === '火') report += `火主禮。多在生活中創造儀式感與驚喜，大方表達愛意與熱情，用陽光般的心態化解雙方的冷戰與摩擦。\n\n`;
    if (primaryFav === '土') report += `土主信。長情與陪伴是您最好的武器。信守對伴侶的每一個承諾，給予對方山一般的安全感，包容對方的生活瑣事。\n\n`;
    if (primaryFav === '金') report += `金主義。保持適當的界線與理性的溝通，不翻舊帳。用果斷的行動為家庭遮風擋雨，讓伴侶對您的能力產生崇拜。\n\n`;
    if (primaryFav === '水') report += `水主智。上善若水，以柔克剛。當雙方有爭執時，學會靈活變通，不硬碰硬，用溫柔的態度融化對方的防備。\n\n`;

    report += `### 五、 疾厄健康與中醫五行養生\n\n`;
    report += `民國命理泰斗韋千里在《千里命稿》中曾言：「五行之理，貴在中和。太旺則折，太弱則傾。」\n《黃帝內經》亦明言：「天有五音，人有五臟」。八字的五行分佈，直接對應著人體臟腑的強弱。\n\n`;
    
    const missing = Object.keys(wx).filter(k => wx[k] === 0);
    const tooMany = Object.keys(wx).filter(k => wx[k] >= 3);
    
    report += `在您的原局中：\n`;
      if (missing.length > 0) {
      if (missing.includes('金')) report += `- **缺金**：中醫五行中，金主肺與大腸。需特別留意呼吸道、過敏、皮膚及腸胃排毒功能。宜多食用白色食物（如百合、梨子）。\n`;
      if (missing.includes('木')) report += `- **缺木**：木主肝膽與神經系統。平時易疲勞或情緒鬱結，需避免熬夜，少飲酒。宜多食綠色蔬菜，保持心情舒暢。\n`;
      if (missing.includes('水')) report += `- **缺水**：水主腎臟與泌尿生殖系統。需注意內分泌平衡與水分補充，預防泌尿感染。宜多食黑色食物（如黑芝麻、黑豆）。\n`;
      if (missing.includes('火')) report += `- **缺火**：火主心臟與血液循環。容易有手腳冰冷、氣血不順的狀況。宜適度曬太陽、運動流汗，多食紅色食物。\n`;
      if (missing.includes('土')) report += `- **缺土**：土主脾胃與消化系統。飲食需定時定量，切忌暴飲暴食或過食生冷。宜多食黃色溫潤食物（如南瓜、地瓜）。\n`;
    } else {
      report += `五行相對齊全，體質基礎良好。但仍需順應四時節氣，注意飲食作息的平衡。\n`;
    }
    
    if (tooMany.length > 0) {
      report += `\n另外，您的**「${tooMany.join('、')}氣」**過旺，古中醫認為「亢害承制」，過旺的五行會對對應的臟腑造成嚴重的負荷過載：\n`;
      
      if (tooMany.includes('木')) {
          report += `- **木氣過盛 (傷肝膽)**：肝火容易過旺，平時容易有偏頭痛、肩頸僵硬、眼睛乾澀或情緒暴躁易怒的傾向。**保健建議**：切忌熬夜，多做瑜珈或拉筋伸展，飲食宜清淡，可適量飲用菊花茶平肝明目。\n`;
      }
      if (tooMany.includes('火')) {
          report += `- **火氣過盛 (傷心血管)**：心火與小腸負擔重，容易引發心悸、失眠多夢、口腔潰瘍、便秘或焦慮。**保健建議**：保持心平氣和，切忌情緒大起大落，務必多喝水，可適量攝取蓮子心、苦瓜等清心降火之物。\n`;
      }
      if (tooMany.includes('土')) {
          report += `- **土氣過盛 (傷脾胃)**：脾胃容易濕滯，導致消化不良、胃酸逆流、脹氣、身體沉重或容易發胖。**保健建議**：飲食必須定時定量，少吃黏膩甜食與精緻澱粉，飯後務必散步幫助運化，切忌吃飽就躺。\n`;
      }
      if (tooMany.includes('金')) {
          report += `- **金氣過盛 (傷肺腸)**：肺氣與大腸容易緊繃乾燥，可能有過敏性鼻炎、乾咳、皮膚乾燥搔癢或便秘的傾向。**保健建議**：注意呼吸道保濕與空氣品質，多做有氧擴胸運動，宜多吃銀耳、水梨、蜂蜜等潤肺化燥之物。\n`;
      }
      if (tooMany.includes('水')) {
          report += `- **水氣過盛 (傷腎陽)**：腎臟與泌尿生殖系統壓力大，容易導致水腫、頻尿、手腳冰冷，女性需注意婦科宮寒，男性需注意精力透支。**保健建議**：極度需要注重保暖（尤其是腰部與足部），睡前多泡腳，少吃生冷與過鹹的食物，多曬太陽補陽氣。\n`;
      }
      report += `\n`;
    }

    // --- 動態判斷月份：9月前只算今年，9月後(包含9月)算今年+明年 ---
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0=1月, 7=8月, 8=9月
    
    let targetYears = [];
    if (currentMonth < 8) { 
        targetYears = [currentYear]; // 9月前：只算今年
    } else { 
        targetYears = [currentYear, currentYear + 1]; // 9月後：算今年 + 明年
    }

    const yearDisplayStr = targetYears.map(y => y + '年').join('、');

    report += `### 六、 近期 (${yearDisplayStr}) 流年大勢推演\n\n`;
    report += `大運管十年之吉凶，流年管一年之休咎。為求精確指引，以下為您推演近期的運勢軌跡：\n\n`;

    targetYears.forEach((targetYear) => {
        const tgIdx = (targetYear - 4) % 10;
        const tzIdx = (targetYear - 4) % 12;
        const targetGan = TIANGAN[tgIdx >= 0 ? tgIdx : tgIdx + 10];
        const targetZhi = DIZHI[tzIdx >= 0 ? tzIdx : tzIdx + 12];
        const targetGanWuxing = WUXING_MAP[targetGan];
        const targetZhiWuxing = WUXING_MAP[targetZhi];
        const isYearGood = favWuxing.includes(targetGanWuxing) || favWuxing.includes(targetZhiWuxing);

        report += `** ${targetYear}年 (${targetGan}${targetZhi}年，五行屬${targetGanWuxing}${targetZhiWuxing})**\n`;
        if (isYearGood) {
            report += `此年流年引動了您的喜用之氣。**【運勢大吉，宜積極進取】**。工作上將迎來明顯的突破，有被提拔或成功轉換跑道的機會。財運豐收，過去的佈局將看到回報。感情方面春風得意，人際關係融洽，是適合籌辦喜事或擴展人脈的絕佳年份。\n\n`;
        } else {
            report += `此年流年氣場對您的原局產生消耗或壓制。**【運勢保守，宜韜光養晦】**。事業上容易遇到瓶頸或小人阻礙，切忌心浮氣躁、與人起強烈衝突。財務上嚴格控制支出，不宜做高風險投資。健康與情緒管理是本年重點，凡事退一步海闊天空，學習充實自我以待來年。\n\n`;
        }
    });

    report += `本命書由系統精密演算生成，涵蓋古文典籍、五行醫理與流年推演。知命方能造命，願您順應天時，開創璀璨人生！\n\n`;
    
    // --- 親算折抵與截圖提示 ---
    report += `### 💡【專屬親算升級優惠】\n\n`;
    report += `若您希望針對此命書進行更深入的探討，或有特定問題（如合婚、擇日、投資決策）需找甯博師傅親自批算，\n`;
    report += `**只要在付費後一年內預約任何玄學項目，本次解鎖的費用即可在完成服務後全額抵銷**！\n`;
    return report;
  };

    const handleUnlock = async () => {
    setIsAnalyzing(true);

    try {
        const stripe = await loadStripe('pk_test_51T7ccADBgMCgO6dLGUsQvxJQpzMack3iZxzKaecS0D3vRUEJMedXUDiueUC3BPGd4fFcJEEhiAjalWYK86n2UFFn00fRj8St9D');

        const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            itemName: "千字深度批命書",
            amount: 198,
            bookingId: "REPORT_" + Date.now(),
            currentUrl: window.location.href, 
        }),
        });

        // 🌟 加入這段：如果 API 回傳錯誤（例如 404 或 500），直接拋出錯誤
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`後端 API 發生錯誤 (代碼 ${response.status}): ${errorText}`);
        }

        const session = await response.json();

        const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
        });

        if (error) {
        alert("跳轉失敗: " + error.message);
        setIsAnalyzing(false);
        }
    } catch (err) {
        // 🌟 把真正的錯誤印在 Console 並用 Alert 顯示出來
        console.error("詳細錯誤訊息:", err);
        alert("系統發生錯誤：\n" + err.message);
        setIsAnalyzing(false);
    }
    };

  // 給 UI 畫面用的動態年份與文案
  const uiDate = new Date();
  const uiYear = uiDate.getFullYear();
  const uiMonth = uiDate.getMonth(); // 0=1月, 7=8月, 8=9月
  
  // 動態設定 <li> 的文案
  const uiFortuneText = uiMonth < 8 
    ? `預測 ${uiYear}年流年吉凶大勢` 
    : `超前部署！一次解鎖 ${uiYear}年歲末運勢與 ${uiYear + 1}年流年大勢`;

  return (
    <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.teal}`, paddingLeft: '8px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          千字深度批命書
        </h4>
        {isPaid && <span style={{ fontSize: '11px', color: '#fff', backgroundColor: THEME.green || '#52c41a', padding: '2px 6px', borderRadius: '4px' }}>已解鎖</span>}
      </div>

      {isAnalyzing ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <RefreshCw size={36} color={THEME.teal} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto' }} />
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.teal, marginTop: '16px' }}>正在融合古文解析...</div>
          <div style={{ fontSize: '13px', color: THEME.gray, marginTop: '8px' }}>推演中醫五行、近年大勢，即將生成千字報告</div>
        </div>
      ) : analysisResult ? (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ 
            backgroundColor: THEME.bgGray, padding: '24px', borderRadius: '8px', 
            fontSize: '15px', lineHeight: '1.8', color: '#222', textAlign: 'justify',
            border: `1px solid ${THEME.border}`, maxHeight: '700px', overflowY: 'auto'
          }}>
            {analysisResult.split('\n').map((line, i) => {
              if (line.startsWith('###')) return <h3 key={i} style={{ color: THEME.black, marginTop: '24px', marginBottom: '12px', fontSize: '18px', borderBottom: `1px solid #ddd`, paddingBottom: '8px' }}>{line.replace('### ', '')}</h3>;
              if (line.startsWith('- **')) {
                const parts = line.split('**');
                return <div key={i} style={{ marginLeft: '12px', marginBottom: '6px' }}>• <b>{parts[1]}</b>{parts[2]}</div>;
              }
              if (line.startsWith('**▶')) return <div key={i} style={{ fontWeight: 'bold', color: THEME.blue, marginTop: '16px', marginBottom: '8px', fontSize: '16px' }}>{line.replace(/\*\*/g, '')}</div>;
              const boldParts = line.split('**');
              if (boldParts.length > 1) {
                  return <p key={i} style={{ marginBottom: '14px' }}>
                      {boldParts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: THEME.red || '#d9363e' }}>{part}</strong> : part)}
                  </p>;
              }
              return <p key={i} style={{ marginBottom: '14px' }}>{line}</p>;
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 0' }}>
          <div style={{ backgroundColor: '#fafafa', border: '1px dashed #ccc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>解鎖千字深度命書，您將獲得：</div>
              <ul style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
              <li>引述古文印證，剖析日主核心靈魂</li>
              <li>透視六親宮位，判斷原局「用神」與「大運喜神」的精確干支</li>
              <li>深度財富格局分析，量身打造 **投資避險指南**</li>
              <li>結合《黃帝內經》，揭示身體臟腑弱點與養生宜忌</li>
              <li>{uiFortuneText}</li>
              <li>**只要在付費後一年內預約任何玄學項目，本次解鎖的費用即可在完成服務後全額抵銷**</li>
            </ul>
          </div>
          
          <button 
            onClick={handleUnlock} 
            style={{ width: '100%', padding: '14px', backgroundColor: THEME.black, color: '#FFD700', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' }}
          >
            <Unlock size={18} /> 單次付費$198解鎖 (支援Credit Card/Wallet Pay)
          </button>
        </div>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

// --- BaziResult (八字結果) ---
const BaziResult = ({ data, onBack, onSave, colorTheme }) => {
   const [selectedDaYunIndex, setSelectedDaYunIndex] = useState(0);
   const [selectedLiuNianYear, setSelectedLiuNianYear] = useState(null); 
   const [selectedLiuYue, setSelectedLiuYue] = useState(null);
   const [selectedLiuRi, setSelectedLiuRi] = useState(null);
   
   // [核心修改] 狀態改為三態字串: 'shiShen'(預設), 'zangGan'(藏干), 'shenSha'(神煞)
   const [displayMode, setDisplayMode] = useState('shiShen'); 
   
   const safeTheme = colorTheme || 'elemental';
   useEffect(() => { setSelectedLiuNianYear(null); }, [selectedDaYunIndex]);
   useEffect(() => { setSelectedLiuYue(null); }, [selectedLiuNianYear]);
   useEffect(() => { setSelectedLiuRi(null); }, [selectedLiuYue]);
   if (!data) return null;

   // 輔助：切換模式邏輯
   const toggleMode = (mode) => {
       if (displayMode === mode) {
           setDisplayMode('shiShen'); // 如果點選當前模式，則關閉(回到預設變通星)
       } else {
           setDisplayMode(mode); // 否則切換到該模式
       }
   };

   const getDisplayItems = (gan, zhi) => {
        if (displayMode === 'zangGan') return ZHI_HIDDEN[zhi] || [];
        if (displayMode === 'shenSha') return getShenSha(gan, zhi, data.bazi.dayGan, data.bazi.dayZhi, data.bazi.yearZhi, data.bazi.monthZhi);
        
        return (ZHI_HIDDEN[zhi] || []).map(h => getShiShen(data.bazi.dayGan, h));
    };

    const getTopRightItem = (gan) => {
        if (displayMode === 'shenSha') return null; // 神煞模式通常不顯示天干神煞
        if (displayMode === 'zangGan') return null; // 藏干模式不顯示天干變通星
        return getShiShen(data.bazi.dayGan, gan); // 預設顯示天干變通星
    };

   const getColor = (char, type) => {
       if (safeTheme !== 'elemental') return '#555555'; 
       return type === 'stem' ? (STEM_COLORS[char] || '#555555') : (BRANCH_COLORS[char] || '#555555');
   };

   const getLiuYueData = (yearGan, yearZhi, year) => {
       const yearGanIdx = TIANGAN.indexOf(yearGan);
       if (yearGanIdx === -1) return [];
       const startGanIdx = (yearGanIdx % 5) * 2 + 2; 
       const months = [];
       const JIE_QI_NAMES = ["立春", "驚蟄", "清明", "立夏", "芒種", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"];
       
       // 輔助函式：格式化日期時間 (例如: 2/4 16:20)
       const formatTime = (solarObj) => {
           const M = solarObj.getMonth();
           const D = solarObj.getDay();
           const h = String(solarObj.getHour()).padStart(2, '0');
           const m = String(solarObj.getMinute()).padStart(2, '0');
           return `${M}月${D}日 ${h}:${m}`;
       };

       for(let i=0; i<12; i++) {
           const ganIdx = (startGanIdx + i) % 10;
           const zhiIdx = (2 + i) % 12; 
           let searchYear = parseInt(year), searchMonth = i + 2; 
           if (searchMonth > 12) { searchMonth -= 12; searchYear += 1; }
           
           let dateStr = `${searchMonth}月`; 
           let jieInfo = '';
           let qiInfo = '';

           try {
               if (window.Solar) {
                   // 鎖定每月15號，確保位於節與氣之間
                   const solarCheck = window.Solar.fromYmd(searchYear, searchMonth, 15);
                   const lunar = solarCheck.getLunar();
                   
                   // 1. 抓取「節」(月頭)
                   const prevJie = lunar.getPrevJieQi(true); 
                   // 2. 抓取「氣」(月中) - 15號的下一個節氣通常就是中氣
                   const nextQi = lunar.getNextJieQi(true);

                   if (prevJie && toTraditional(prevJie.getName()) === JIE_QI_NAMES[i]) {
                       const solarJie = prevJie.getSolar();
                       // 格式
                       dateStr = `${solarJie.getMonth()}/${solarJie.getDay()}`;
                       // 詳細資訊
                       jieInfo = `${toTraditional(prevJie.getName())} ${formatTime(solarJie)}`;
                   }
                   
                   if (nextQi) {
                       qiInfo = `${toTraditional(nextQi.getName())} ${formatTime(nextQi.getSolar())}`;
                   }
               }
           } catch (e) { console.warn("節氣計算錯誤", e);
           }
           
           months.push({ 
               seq: i + 1, 
               name: JIE_QI_NAMES[i], // 節氣名 (如: 立春)
               dateStr: dateStr,      // 列表顯示用 (如: 4/2)
               jieInfo: jieInfo,      // 詳細節資訊 (如: 立春 2/4 16:20)
               qiInfo: qiInfo,        // 詳細氣資訊 (如: 雨水 2/19 12:00)
               gan: TIANGAN[ganIdx] || '', 
               zhi: DIZHI[zhiIdx] || '', 
               ganGod: getShiShen(data.bazi.dayGan, TIANGAN[ganIdx]), 
               zhiHidden: ZHI_HIDDEN[DIZHI[zhiIdx]] || [] 
           });
       }
       return months;
   };

   const getLiuRiData = () => {
       if (!selectedLiuYue || !selectedLiuNianYear || !window.Solar) return [];
       const days = [];
       
       // 1. 定義節氣白名單 (只找「節」，跳過「氣」)
       const JIE_NAMES_CN = ["立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"];

       try {
           // 2. 推算流月參考時間點 (該月15號)
           let searchMonth = selectedLiuYue.seq + 1;
           let searchYear = parseInt(selectedLiuNianYear);
           if (searchMonth > 12) { searchMonth -= 12; searchYear += 1; }

           const solarCheck = window.Solar.fromYmd(searchYear, searchMonth, 15);
           const lunar = solarCheck.getLunar();
           
           // 3. 獲取本月起點 (節)
           const currentJie = lunar.getPrevJieQi(false); 

           // 4. 尋找下一個真正的「節」 (排除中氣)
           let nextJie = lunar.getNextJieQi(true); 
           while (nextJie && !JIE_NAMES_CN.includes(nextJie.getName())) {
               // 如果是中氣(如春分)，往後推 1 天繼續找，直到找到下一個節(如清明)
               nextJie = nextJie.getSolar().next(1).getLunar().getNextJieQi(true);
           }

           if (currentJie && nextJie) {
               let iterSolar = currentJie.getSolar();
               
               // 【核心修正】：將結束時間轉為單純的日期字串 "2026-04-05"
               // 這樣可以完全忽略時分秒帶來的誤差
               const endDateStr = nextJie.getSolar().toYmd();
               
               // 5. 執行迴圈：只要「當前日期」不等於「下個節氣日期」，就繼續
               // 這樣 4/4 (不等於 4/5) 會被執行，而 4/5 (等於 4/5) 會停止
               while (iterSolar.toYmd() !== endDateStr) {
                   
                   const iterLunar = iterSolar.getLunar();
                   const dGanZhi = iterLunar.getDayInGanZhi();
                   
                   days.push({
                       dateStr: `${iterSolar.getMonth()}/${iterSolar.getDay()}`,
                       gan: dGanZhi.charAt(0),
                       zhi: dGanZhi.charAt(1),
                       ganGod: getShiShen(data.bazi.dayGan, dGanZhi.charAt(0)),
                       zhiHidden: ZHI_HIDDEN[dGanZhi.charAt(1)] || [] 
                   });
                   
                   // 往後推一天
                   iterSolar = iterSolar.next(1);

                   // 安全斷路器 (防止極端錯誤)
                   if (days.length > 40) break;
               }
           }
       } catch (e) {
           console.error("流日計算錯誤", e);
       }
       return days;
   };

    // 1. 新增 State
    const [shenShaModalConfig, setShenShaModalConfig] = useState({ isOpen: false, title: '', items: [] });

    // 2. 開啟 Modal 的 Handler
    const openShenShaModal = (title, items) => {
        setShenShaModalConfig({ isOpen: true, title, items });
    };

    // 3. 輔助函式：渲染神煞列表 (含截斷邏輯)
    const renderShenShaList = (fullList, contextTitle, e) => {
        
        // 截斷邏輯：最多 2 個
        const MAX_VISIBLE = 2;
        const visibleList = (fullList.length > MAX_VISIBLE) 
                ? fullList.slice(0, MAX_VISIBLE) 
                : fullList;
        // 共用的點擊事件：開啟 Modal 顯示「全部」
        const handleClick = (ev) => {
        ev.stopPropagation(); 
        openShenShaModal(contextTitle, fullList); // 這裡傳入的是 fullList (完整列表)
        };

        return (
            <>
                {visibleList.map((item, idx) => (
                    <span 
                        key={idx} 
                        onClick={handleClick}
                        style={{ 
                            writingMode: 'vertical-rl', 
                            textOrientation: 'upright',
                            fontSize: '11px', // 配合 Grid 空間，字維持小一點
                            letterSpacing: '1px', 
                            lineHeight: '1.1', 
                            color: '#888', 
                            marginBottom: '2px', 
                            cursor: 'pointer' // 保持手指游標
                        }}
                    >
                        {item}
                    </span>
                ))}
            </>
        );
    };

    // 空亡
    const getKongWangStatus = (zhi) => {
       if (!data.meta) return null;
       const { dayKongWang, yearKongWang } = data.meta;
       return dayKongWang.includes(zhi) || yearKongWang.includes(zhi);
    };

    const renderDaYunRow = (list) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: '8px' }}>
                {list.map((dy) => {
                    const isSelected = selectedDaYunIndex === (dy.seq - 1);
                    const displayTopRight = getTopRightItem(dy.gan);
                    const displayBottomRight = getDisplayItems(dy.gan, dy.zhi);
                    const gColor = getColor(dy.gan, 'stem'); const zColor = getColor(dy.zhi, 'branch');
                return (
                    <div key={dy.seq} onClick={() => setSelectedDaYunIndex(dy.seq - 1)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%', height: '115px', 
                                boxSizing: 'border-box', padding: '8px 4px', backgroundColor: isSelected ? THEME.bgBlue : THEME.bgGray, borderRadius: '8px', border: isSelected ? `2px solid ${THEME.blue}` : `2px solid ${THEME.border}`, cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                            <div style={{ position: 'relative', width: '30px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: gColor }}>{dy.gan}</span>
                                {displayTopRight && <div style={{ position: 'absolute', top: -5, right: -11, fontSize: '14px', color: THEME.gray }}>{displayTopRight}</div>}
                            </div>
                            <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: zColor }}>{dy.zhi}</span>
                            
                            <div style={{ position: 'absolute', top: 5, right: -11 }}>
                                {displayMode === 'shenSha' ? (
                                    <ShenShaVerticalList 
                                        items={displayBottomRight} // 這裡是完整神煞列表
                                        onClick={(fullList) => openShenShaModal(`${dy.gan}${dy.zhi} (大運)`, fullList)}
                                        fontSize="10px" // 大運框較小
                                    />
                                ) : (
                                    // 非神煞模式 (十神/藏干)
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                        {displayBottomRight.map((item, idx) => (
                                            <span key={idx} style={{ fontSize: '14px', lineHeight: '1.1', color: '#888' }}>{item}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                            {!data.isManual && ( <> <div style={{ marginTop: '6px', fontSize: '11px', color: THEME.black, fontWeight: 'bold' }}>{dy.startAge}歲</div> <div style={{ fontSize: '11px', color: THEME.gray }}>{dy.startYear}</div> </> )}                            
                        </div>
                    );
                })}
                {Array.from({ length: 5 - list.length }).map((_, i) => <div key={`empty-${i}`} style={{ width: '18%' }}></div>)}
            </div>
        );
    };
    
    const renderLiuNianGrid = () => {
        if (data.isManual) return null;
        const targetDaYun = data.daYuns[selectedDaYunIndex];
        if (!targetDaYun || !targetDaYun.liuNians || targetDaYun.liuNians.length === 0) return null;
        return (
            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.purple}`, paddingLeft: '8px', fontSize: '15px' }}>{targetDaYun.gan}{targetDaYun.zhi}大運 - 流年</h4>
                    <span style={{ fontSize: '12px', color: THEME.gray, marginLeft: '8px' }}>({targetDaYun.startAge}-{targetDaYun.startAge + 9}歲)</span>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', direction: 'rtl' }}>
                     {targetDaYun.liuNians.map((ln) => {
                         const isSelected = selectedLiuNianYear === ln.year;
                         const displayTopRight = getTopRightItem(ln.gan);
                         const displayBottomRight = getDisplayItems(ln.gan, ln.zhi);
                         const gColor = getColor(ln.gan, 'stem'); const zColor = getColor(ln.zhi, 'branch');
                         return (
                            <div key={ln.year} onClick={() => setSelectedLiuNianYear(ln.year)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', backgroundColor: isSelected ? THEME.bgRed : THEME.bgGray, borderRadius: '8px', height: '120px', 
                                      boxSizing: 'border-box', border: isSelected ? `2px solid ${THEME.red}` : `2px solid ${THEME.border}`, position: 'relative', minHeight: '120px', direction: 'ltr', cursor: 'pointer' }}>
                                    <div style={{ position: 'relative', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: gColor }}>{ln.gan}</span>
                                        {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -11, fontSize: '14px', color: THEME.gray, padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
                                    </div>
                                    <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '2px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: zColor }}>{ln.zhi}</span>
                                    
                                    <div style={{ position: 'absolute', top: 8, right: -11 }}>
                                        {displayMode === 'shenSha' ? (
                                            <ShenShaVerticalList 
                                                items={displayBottomRight}
                                                onClick={(fullList) => openShenShaModal(`${ln.gan}${ln.zhi} (流年)`, fullList)}
                                                fontSize="10px"
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                                {displayBottomRight.map((item, idx) => (
                                                    <span key={idx} style={{ fontSize: '14px', lineHeight: '1.1', color: '#888' }}>{item}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                  <div style={{ marginTop: 'auto', paddingTop: '6px', textAlign: 'center' }}>
                                      <div style={{ fontSize: '11px', color: THEME.black, fontWeight: 'bold' }}>{ln.age}歲</div>
                                      <div style={{ fontSize: '10px', color: THEME.gray }}>{ln.year}</div>
                                  </div>
                             </div>
                         );
                     })}
                 </div>
            </div>
        );
   };

   const renderLiuYueGrid = () => {
       if (!selectedLiuNianYear) return null;
       const targetDaYun = data.daYuns[selectedDaYunIndex];
       const lnData = targetDaYun.liuNians.find(l => l.year === selectedLiuNianYear);
       if(!lnData) return null;
       
       const liuYues = getLiuYueData(lnData.gan, lnData.zhi, lnData.year);
       
       // 決定標題顯示內容
       const renderTitle = () => {
           if (selectedLiuYue) {
               // 點選時顯示：節與氣的時間
               return (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                       <span style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>
                           {lnData.gan}{lnData.zhi}流年 {selectedLiuYue.gan}{selectedLiuYue.zhi}月
                       </span>
                       <span style={{ fontSize: '13px', color: THEME.blue }}>
                           <span style={{ marginRight: '12px' }}>{selectedLiuYue.jieInfo}</span>
                           <span>{selectedLiuYue.qiInfo}</span>
                       </span>
                   </div>
               );
           } else {
               // 預設標題
               return (
                   <h4 style={{ margin: '0', fontSize: '15px' }}>
                       {lnData.gan}{lnData.zhi}流年 - 流月
                   </h4>
               );
           }
       };

       return (
           <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {/* 標題列區塊 */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', height: '44px',           // 固定高度
                    boxSizing: 'border-box', borderLeft: `4px solid ${THEME.orange}`, paddingLeft: '8px' }}>
                   {renderTitle()}
                   <button onClick={() => setSelectedLiuNianYear(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: THEME.gray, fontSize: '12px', padding: '4px' }}>
                       <X size={18} />
                   </button>
                </div>

                {/* 流月網格 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', direction: 'rtl' }}>
                    {liuYues.map((ly) => {
                        // 判斷是否被選中
                        const isSelected = selectedLiuYue && selectedLiuYue.seq === ly.seq;
                        const displayTopRight = getTopRightItem(ly.gan);
                        const displayBottomRight = getDisplayItems(ly.gan, ly.zhi);
                        const gColor = getColor(ly.gan, 'stem'); 
                        const zColor = getColor(ly.zhi, 'branch');
                        
                        return (
                            <div key={ly.seq} onClick={() => setSelectedLiuYue(ly)}
                                style={{ 
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                    padding: '8px 4px', 
                                    // 選中時變色
                                    backgroundColor: isSelected ? '#fff7e6' : THEME.bgOrange, 
                                    borderRadius: '8px', 
                                    border: isSelected ? `2px solid ${THEME.orange}` : `2px solid ${THEME.border}`, 
                                    position: 'relative', Height: '110px', boxSizing: 'border-box', direction: 'ltr',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ position: 'relative', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: gColor }}>{ly.gan}</span>
                                    {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -9, fontSize: '11px', color: THEME.gray, padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
                                </div>
                                <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '2px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: zColor }}>{ly.zhi}</span>
                                    
                                    <div style={{ position: 'absolute', top: 8, right: -9 }}>
                                        {displayMode === 'shenSha' ? (
                                            <ShenShaVerticalList 
                                                items={displayBottomRight}
                                                onClick={(fullList) => openShenShaModal(`${ly.gan}${ly.zhi} (流月)`, fullList)}
                                                fontSize="10px"
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                                {displayBottomRight.map((item, idx) => (
                                                    <span key={idx} style={{ fontSize: '12px', lineHeight: '1.1', color: '#888' }}>{item}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '6px', textAlign: 'center' }}>
                                    {/* 顯示 日/月 */}
                                    <div style={{ fontSize: '10px', color: THEME.black, fontWeight: 'bold' }}>{ly.dateStr}</div>
                                    <div style={{ fontSize: '10px', color: THEME.gray }}>{ly.name}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
           </div>
       );
   };

    const renderLiuRiList = () => {
       // 1. 建立 ref 以便控制捲動容器
       const scrollRef = useRef(null);
       
       if (!selectedLiuYue) return null;
       const liuRis = getLiuRiData();
       if (liuRis.length === 0) return null;

       // 2. 滑鼠滾輪事件處理：將垂直滾動轉換為水平滾動
       const handleWheel = (e) => {
           if (scrollRef.current) {
               // 電腦端使用者捲動滾輪時，讓容器水平移動
               // 減去 deltaY 是為了讓捲動方向更符合直覺
               scrollRef.current.scrollLeft -= e.deltaY;
           }
       };

       return (
           <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
               {/* 標題與關閉按鈕 */}
               <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                   <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.green || '#4caf50'}`, paddingLeft: '8px', fontSize: '15px' }}>
                       {selectedLiuYue.gan}{selectedLiuYue.zhi}月 - 流日
                   </h4>
                   <button onClick={() => setSelectedLiuYue(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: THEME.gray, fontSize: '12px', padding: '4px', cursor: 'pointer' }}>
                       <X size={18} />
                   </button>
               </div>

               {/* 橫向滑動容器 */}
               <div 
                   ref={scrollRef}
                   onWheel={handleWheel} 
                   style={{ 
                       display: 'flex', 
                       direction: 'rtl', // 八字由右往左排列
                       overflowX: 'auto', // 確保捲軸出現           
                       WebkitOverflowScrolling: 'touch', 
                       width: '100%',                
                       gap: '6px', 
                       paddingBottom: '12px', // 給捲軸留一點空間，避免擋住日期
                   }} 
               >
                   {liuRis.map((day, idx) => {
                       const isSelected = selectedLiuRi === idx;
                       const displayTopRight = getTopRightItem(day.gan);
                       const displayBottomRight = getDisplayItems(day.gan, day.zhi);
                       const gColor = getColor(day.gan, 'stem'); 
                       const zColor = getColor(day.zhi, 'branch');

                       return (
                           <div key={idx} 
                               onClick={() => setSelectedLiuRi(idx)}
                               style={{ 
                                   direction: 'ltr', // 卡片內部文字恢復左往右
                                   flex: '0 0 auto', 
                                   width: '64px',
                                   display: 'flex', flexDirection: 'column', alignItems: 'center', 
                                   padding: '8px 4px', 
                                   backgroundColor: isSelected ? '#f0fff4' : THEME.bgGray, 
                                   borderRadius: '8px', 
                                   border: isSelected ? `2px solid ${THEME.green || '#4caf50'}` : `2px solid ${THEME.border}`, 
                                   position: 'relative', 
                                   height: '110px',
                                   cursor: 'pointer',
                                   transition: 'all 0.2s'
                               }}
                           >
                               <div style={{ position: 'relative', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                                   <span style={{ fontSize: '20px', fontWeight: 'bold', color: gColor }}>{day.gan}</span>
                                   {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -10, fontSize: '11px', color: THEME.gray }}>{displayTopRight}</div>}
                               </div>

                               <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '2px' }}>
                                   <span style={{ fontSize: '20px', fontWeight: 'bold', color: zColor }}>{day.zhi}</span>
                                   <div style={{ position: 'absolute', top: 8, right: -10 }}>
                                        {displayMode === 'shenSha' ? (
                                            <ShenShaVerticalList 
                                                items={displayBottomRight}
                                                onClick={(fullList) => openShenShaModal(`${day.gan}${day.zhi} (流日)`, fullList)}
                                                fontSize="10px"
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                                {displayBottomRight.map((item, i) => (
                                                    <span key={i} style={{ fontSize: '11px', lineHeight: '1.1', color: '#888' }}>{item}</span>
                                                ))}
                                            </div>
                                        )}
                                   </div>
                               </div>

                               <div style={{ marginTop: 'auto', paddingTop: '6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', color: THEME.black, fontWeight: 'bold' }}>{day.dateStr}</div>
                               </div>
                           </div>
                       );
                   })}
               </div>
           </div>
       );
    };

   const calculateWuXingStrength = () => {
       const counts = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
       const chars = [ data.bazi.yearGan, data.bazi.yearZhi, data.bazi.monthGan, data.bazi.monthZhi, data.bazi.dayGan, data.bazi.dayZhi, data.bazi.timeGan, data.bazi.timeZhi ];
       chars.forEach(char => { const wx = WUXING_MAP[char]; if (wx && counts[wx] !== undefined) counts[wx]++; });
       return counts;
   };   

   const firstRow = data.daYuns ? data.daYuns.slice(0, 5) : [];
   const secondRow = data.daYuns ? data.daYuns.slice(5, 10) : [];
   const btnStyle = { padding: '8px 12px', backgroundColor: THEME.bgGray, borderRadius: '20px', border: 'none', color: THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' };

return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: THEME.bg }}>
        {/* Header 區塊開始 */}
        <div style={{ 
            backgroundColor: THEME.white, 
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '16px', 
            border: `1px solid ${THEME.border}`, 
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',           
            flexDirection: 'column'    // 垂直排列：上方內容 vs 下方起運
        }}>
            
            {/* --- 上半部區域 (資料 + 按鈕) --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                
                {/* 1. 左側：姓名與日期資訊 (佔用剩餘空間) */}
                <div style={{ flex: 1, marginRight: '12px' }}>
                    {/* 姓名行 */}
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: THEME.black, marginBottom: '6px' }}>
                        {data.name} <span style={{ fontSize: '14px', color: THEME.gray, fontWeight: 'normal' }}>({data.genderText})</span>
                    </div>
                    
                    {/* 日期資訊 */}
                    {data.isManual ? ( 
                        <div style={{ fontSize: '13px', color: THEME.gray }}></div> 
                    ) : ( 
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}> 
                            <div style={{ fontSize: '13px', color: THEME.gray }}>西曆 {data.solarDate}</div> 
                            <div style={{ fontSize: '13px', color: THEME.purple, fontWeight: '500', lineHeight: '1' }}>
                                農曆 {data.lunarDate} 
                            </div>
                            {/* 節氣天數 */}
                            {data.jieQiSpan && (
                                <div style={{ fontSize: '11px', color: THEME.dark, fontWeight: 'bold' }}>
                                    ({data.jieQiSpan})
                                </div>
                            )}
                            <div style={{ fontSize: '13px', color: THEME.gray, fontWeight: '500', marginTop: '1px' }}>
                                日空: {data.meta.dayKongWang.join('')} 年空: {data.meta.yearKongWang.join('')}
                            </div> 
                        </div> 
                    )}
                </div>

                {/* 2. 右側：4個按鈕集中區 (固定在右上角) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                    {/* 第一排按鈕：操作功能 (保存/重排) */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => onSave(data)} style={{ ...btnStyle, padding: '6px 10px', minWidth: '60px', justifyContent: 'center' }}> 
                            <Bookmark size={13} /> 保存 
                        </button>
                        <button onClick={onBack} style={{ ...btnStyle, padding: '6px 10px', minWidth: '60px', justifyContent: 'center' }}> 
                            <RefreshCw size={13} /> 重排 
                        </button>
                    </div>
                    {/* 第二排按鈕：顯示模式 (藏干/神煞) */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                            onClick={() => toggleMode('zangGan')} 
                            style={{ 
                                ...btnStyle, 
                                backgroundColor: displayMode === 'zangGan' ? THEME.black : THEME.bgGray,
                                color: displayMode === 'zangGan' ? 'white' : THEME.gray,
                                justifyContent: 'center',
                                padding: '6px 10px', // 微調大小讓其緊湊
                                minWidth: '60px'
                            }}>
                            {displayMode === 'zangGan' ? <Eye size={13}/> : <EyeOff size={13}/>} 
                            藏干
                        </button>
                        <button 
                            onClick={() => toggleMode('shenSha')} 
                            style={{ 
                                ...btnStyle, 
                                backgroundColor: displayMode === 'shenSha' ? THEME.purple : THEME.bgGray,
                                color: displayMode === 'shenSha' ? 'white' : THEME.gray,
                                justifyContent: 'center',
                                padding: '6px 10px',
                                minWidth: '60px'
                            }}>
                            {displayMode === 'shenSha' ? <Eye size={13}/> : <EyeOff size={13}/>} 
                            神煞
                        </button>
                    </div>

                </div>
            </div>

            {/* --- 下半部區域：起運資訊 (獨立一行，寬度 100%) --- */}
            {data.yunInfo ? ( 
                <div style={{ 
                    fontSize: '13px', 
                    color: THEME.blue, 
                    fontWeight: 'bold',
                    marginTop: '1px',              // 與上方拉開距離
                    paddingTop: '1px',             // 增加內距
                    width: '100%',
                    lineHeight: '1'
                }}>
                    {data.yunInfo.detail}
                    <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                        (西曆 {data.yunInfo.startDate} 起運)
                    </span>
                </div> 
            ) : null}

        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <PillarCard 
                title="時柱" gan={data.bazi.timeGan} zhi={data.bazi.timeZhi} 
                kongWangStatus={getKongWangStatus(data.bazi.timeZhi)}
                {...{naYin:data.naYin.time, dayMaster:data.bazi.dayGan, displayMode, dayZhi:data.bazi.dayZhi, yearZhi:data.bazi.yearZhi, monthZhi:data.bazi.monthZhi, colorTheme, onShenShaClick:openShenShaModal}}
            />
            <PillarCard 
                title="日柱" gan={data.bazi.dayGan} zhi={data.bazi.dayZhi} 
                kongWangStatus={getKongWangStatus(data.bazi.dayZhi)}
                {...{naYin:data.naYin.day, dayMaster:data.bazi.dayGan, displayMode, dayZhi:data.bazi.dayZhi, yearZhi:data.bazi.yearZhi, monthZhi:data.bazi.monthZhi, colorTheme, genderText:data.genderText, onShenShaClick:openShenShaModal}}
            />
            <PillarCard 
                title="月柱" gan={data.bazi.monthGan} zhi={data.bazi.monthZhi} 
                kongWangStatus={getKongWangStatus(data.bazi.monthZhi)}
                {...{naYin:data.naYin.month, dayMaster:data.bazi.dayGan, displayMode, dayZhi:data.bazi.dayZhi, yearZhi:data.bazi.yearZhi, monthZhi:data.bazi.monthZhi, colorTheme, onShenShaClick:openShenShaModal}}
            />
            <PillarCard 
                title="年柱" gan={data.bazi.yearGan} zhi={data.bazi.yearZhi} 
                kongWangStatus={getKongWangStatus(data.bazi.yearZhi)}
                {...{naYin:data.naYin.year, dayMaster:data.bazi.dayGan, displayMode, dayZhi:data.bazi.dayZhi, yearZhi:data.bazi.yearZhi, monthZhi:data.bazi.monthZhi, colorTheme, onShenShaClick:openShenShaModal}}
            />
        </div>
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
           <h4 style={{ margin: '0 0 12px 0', borderLeft: `4px solid ${THEME.blue}`, paddingLeft: '8px', fontSize: '15px' }}>大運</h4>
           <div>{renderDaYunRow(firstRow)}{renderDaYunRow(secondRow)}</div>
       </div>
       {renderLiuNianGrid()}
       {renderLiuYueGrid()}
       {renderLiuRiList()}
        {/* 五行強弱 */}
        <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 12px 0', borderLeft: `4px solid ${THEME.orange}`, paddingLeft: '8px', fontSize: '15px' }}>五行強弱</h4>
            {(() => { 
                const wxCounts = calculateWuXingStrength(); 
                const order = ['木', '火', '土', '金', '水']; 
                return ( 
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '4px'
                    }}> 
                        {order.map(elm => ( 
                            <div key={elm} style={{ 
                                padding: '8px 2px',
                                backgroundColor: THEME.bgGray, 
                                borderRadius: '8px', 
                                fontSize: '13px', 
                                display: 'flex', 
                                flexDirection: 'row',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                whiteSpace: 'nowrap'
                            }}> 
                                <span style={{ color: THEME.gray, fontSize: '12px', marginBottom: '2px' }}>{elm}: </span>
                                <span style={{ fontWeight: 'bold', fontSize: '15px', color: wxCounts[elm] > 2 ? THEME.red : THEME.black }}>
                                    {wxCounts[elm]}
                                </span> 
                            </div> 
                        ))} 
                    </div> 
                ); 
            })()}
        </div>
        {/* --- Gemini AI 算命分析 --- */}
        <AiBaziAnalysis data={data} />
        <ShenShaModal 
                config={shenShaModalConfig} 
                onClose={() => setShenShaModalConfig({ ...shenShaModalConfig, isOpen: false })} 
            />
     </div>
   );
};

// =========================================================================
// PART B: 主程式結構 (使用共用 UI 殼)
// =========================================================================
export default function BaziApp() {
  // 全局啟用保護機制
  const isAuthorized = useProtection([]);
  if (!isAuthorized) return null;
  
  const libStatus = useLunarScript();
  
  // 2. 狀態管理
  const [view, setView] = useState('input');
  const [baziData, setBaziData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [editingData, setEditingData] = useState(null);

  // App 專屬狀態
  const [ziHourRule, setZiHourRule] = useState('ziShi');
  const [colorTheme, setColorTheme] = useState('elemental');

  // 3. 底部導航設定
  const tabs = [
    { id: 'input', label: '排盤', icon: Grid },
    { id: 'bookmarks', label: '紀錄', icon: Bookmark },
    { id: 'booking', label: '預約', icon: CalendarCheck },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  // 4. 資料讀取 Effect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'booking') {
      setView('booking'); // 如果網址有 ?tab=booking，就切換到預約畫面
    }
    if (params.get('success') === 'true') {
    // 付款成功了！
    // 這裡呼叫原本生成報告的 function
    const reportContent = generateLongReport(); 
    setAnalysisResult(reportContent);
    setIsPaid(true); // 標記為已解鎖
    setIsAnalyzing(false);
    }
    
    const loadData = async () => {
      try {
        const { value: savedBk } = await Preferences.get({ key: 'bazi_bookmarks' });
        if (savedBk) setBookmarks(JSON.parse(savedBk));

        const { value: savedRule } = await Preferences.get({ key: 'bazi_zi_rule' });
        if (savedRule) setZiHourRule(savedRule);

        const { value: savedTheme } = await Preferences.get({ key: 'bazi_color_theme' });
        if (savedTheme) setColorTheme(savedTheme);
      } catch (e) { console.error("讀取儲存資料失敗:", e); }
    };
    loadData();
  }, []);

  useEffect(() => { const saveRule = async () => { await Preferences.set({ key: 'bazi_zi_rule', value: ziHourRule }); }; saveRule(); }, [ziHourRule]);
  useEffect(() => { const saveTheme = async () => { await Preferences.set({ key: 'bazi_color_theme', value: colorTheme }); }; saveTheme(); }, [colorTheme]);

  // 5. 動作處理
  const handleCalculate = (formData) => {
     if (libStatus !== 'ready') return;
     try {
        const result = calculateBaziResult(formData, ziHourRule);
        setBaziData(result); 
        setEditingData(null); 
        setView('result');
     } catch(e) { console.error(e); alert('日期格式錯誤或計算異常'); }
  };

  const saveBookmark = async (data) => {
      const baziSource = data.bazi || {};
      const dm = baziSource.dayGan || '';
      const dmElement = WUXING_MAP[dm] || '';

      const dataToSave = {
          id: data.id || Date.now(),
          name: data.name,
          genderText: data.genderText || (data.gender === '1' ? '男' : '女'),
          solarDate: data.solarDate || `${data.year}-${data.month}-${data.day}`,
          lunarDate: data.lunarDate || `${data.year}-${data.month}-${data.day}`,
          dayMaster: dm + dmElement,
          monthBranch: baziSource.monthZhi || '', 
          rawDate: data.rawDate || data 
      };

      const existingIndex = bookmarks.findIndex(b => b.id === dataToSave.id);
      let newBk;
      
      if (existingIndex >= 0) { 
          newBk = [...bookmarks]; 
          newBk[existingIndex] = dataToSave; 
          alert('紀錄已更新'); 
      } else { 
          newBk = [dataToSave, ...bookmarks]; 
          alert('已保存至紀錄'); 
      }
      
      setBookmarks(newBk); 
      await Preferences.set({ key: 'bazi_bookmarks', value: JSON.stringify(newBk) });
  };
  
  const deleteBookmark = async (id) => {
      if (window.confirm('確定要刪除這條紀錄嗎？')) {
          const newBk = bookmarks.filter(b => b.id !== id);
          setBookmarks(newBk); 
          await Preferences.set({ key: 'bazi_bookmarks', value: JSON.stringify(newBk) });
      }
  };
  
  const openBookmark = (savedItem) => {
      if (!savedItem.rawDate) { alert('此書籤資料版本過舊，無法重新排盤'); return; }
      try {
          const freshResult = calculateBaziResult(savedItem.rawDate, ziHourRule);
          freshResult.id = savedItem.id; 
          setBaziData(freshResult); 
          setView('result');
      } catch (e) { console.error("Failed to recalulate bookmark:", e); alert('讀取失敗，資料可能已損壞'); }
  };

  if (libStatus === 'loading') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>載入命理數據庫...</div>;
  if (libStatus === 'error') return <div style={{ padding: 20, textAlign: 'center' }}>載入失敗，請檢查網路連線後重新整理。</div>;

  return (
    // ✅ 1. 使用全螢幕容器
    <div style={COMMON_STYLES.fullScreen}>
      <style>{`
        @font-face { font-family: '青柳隷書SIMO2_T'; src: url('/fonts/AoyagiReishoSIMO2_T.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
      `}</style>
      
      {/* ✅ 2. 共用 Header */}
      <AppHeader title={APP_NAME} logoChar={{ main: '八', sub: '字' }} />

      {/* ✅ 3. 內容滾動區 */}
      <div style={COMMON_STYLES.contentArea}>
          {view === 'input' && (
            <>
              <BaziInput onCalculate={handleCalculate} initialData={editingData} colorTheme={colorTheme} />
                  <div style={{ marginTop: '20px' }}><AdsterraNarrow /></div>
            </>
          )}
          
          {view === 'result' && (
            <>
              <BaziResult data={baziData} onBack={() => { setEditingData(null); setView('input'); }} onSave={saveBookmark} colorTheme={colorTheme} />
              <AdsterraNarrow />
            </>
          )}
            
          {view === 'bookmarks' && (
              <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                    <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的命盤紀錄</h2>
                  </div>
                  
                  {/* ✅ 4. 使用共用 BookmarkList */}
                  <BookmarkList 
                    bookmarks={bookmarks}
                    onSelect={openBookmark}
                    onDelete={deleteBookmark}
                    onEdit={(b) => { setEditingData({...b.rawDate, id: b.id}); setView('input'); }}
                  />
                  
                  <div style={{ marginTop: '20px' }}><Adsterra /></div>
              </div>
          )}

          {/* ✅ 5. 共用預約系統 */}
          {view === 'booking' && <BookingSystem 
            apiUrl={API_URL} 
            onNavigate={() => setView('input')} />}
          
          {/* ✅ 6. 設定頁 (包含共用與專屬) */}
          {view === 'settings' && <SettingsView 
            ziHourRule={ziHourRule} setZiHourRule={setZiHourRule} 
            colorTheme={colorTheme} setColorTheme={setColorTheme}
            bookmarks={bookmarks} setBookmarks={setBookmarks}
          />}
      </div>

      {/* ✅ 7. 安裝引導提示 */}
      <InstallGuide />

      {/* ✅ 8. 共用底部導航 */}
      <BottomTabBar 
        tabs={tabs} 
        currentTab={view === 'result' ? 'input' : view} 
        onTabChange={(id) => {
          if (id === 'input') setEditingData(null);
          setView(id);
        }} 
      />
    </div>
  );
}