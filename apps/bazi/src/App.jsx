// 1. 引入共用 UI 和 工具
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';

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
        isPaid: formData.isPaid || false,
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

// --- 姓名學 81 格大吉數及短評 (全域共用) ---
const EIGHTY_ONE_ATTR = {
    1: "【萬象始起卦】旭日東升，能成大業；繁榮發達，信用得固 (大吉)",
    2: "【混沌離亂卦】枝節橫生，缺乏判斷力 (凶)",
    3: "【名利雙收卦】進退如意，可以名揚四海；根深蒂固，蒸蒸日上 (大吉)",
    4: "【破壞滅裂卦】災厄凶變，暗淡破敗 (凶)",
    5: "【福壽雙美卦】家門榮昌，福祿壽全；陰陽和合，生意欣榮 (大吉)",
    6: "【富裕平安卦】大富大貴，一生安穩鼎盛；萬寶集門，天降幸運 (大吉)",
    7: "【剛頑俊敏卦】決斷力超群，剛毅果斷；獨營生意，和氣致祥 (吉)",
    8: "【堅毅克己卦】意志堅定，適合循序漸進；努力發達，貫徹志望 (吉)",
    9: "【貧苦逆惡卦】多成也多敗，盛盡轉衰 (凶)",
    10: "【死滅凶惡卦】黯淡無光，境遇悲慘 (凶)",
    11: "【萬象更新卦】久旱逢甘霖，可振家運；草木逢春，穩健踏實 (大吉)",
    12: "【薄弱挫折卦】容易沉淪，有志難申 (凶)",
    13: "【奇才藝精卦】智慧超群，博學多才；智略超群，富有奇謀 (大吉)",
    14: "【浮沈破敗卦】孤獨苦難，難享天倫之樂 (凶)",
    15: "【慈祥有德卦】德高望重，福祿壽全；謙恭做事，外得人和 (大吉)",
    16: "【宅心仁厚卦】領導力超群，多有貴人之助；能獲眾望，成就大業 (大吉)",
    17: "【剛健不屈卦】剛強倔強，有突破萬難之氣概；排除萬難，有貴人助 (吉)",
    18: "【掌權利達卦】有權望威勢，需培養包容力；經商做事，順利昌隆 (吉)",
    19: "【挫敗不利卦】一生多挫折，缺少貴人提拔 (凶)",
    20: "【破滅衰亡卦】困難重重，多苦難挫折 (凶)",
    21: "【獨立權威卦】人人敬仰，有領導才能；專心經營，善用智慧 (吉)",
    22: "【秋草逢霜卦】災困不絕，晚景淒涼 (凶)",
    23: "【壯麗果敢卦】富貴沖天，能克服萬難；旭日東昇，名顯四方 (大吉)",
    24: "【金錢豐惠卦】才略智謀超群，溫和勤儉；錦繡前程，須靠自力 (大吉)",
    25: "【英邁俊敏卦】有才傲物，天資英敏；天時地利，只欠人和 (吉)",
    26: "【波瀾重著卦】聰明機敏，一生變化萬端 (平)",
    27: "【挫敗中折卦】人生跌宕起伏，易受到攻擊 (凶)",
    28: "【禍亂別離卦】災難頻至，生離死別 (凶)",
    29: "【貴重智謀卦】平步青雲，慾望無涯；如龍得雲，青雲直上 (大吉)",
    30: "【浮沈不安卦】成敗難定，多遇絕處逢生 (平)",
    31: "【和順圓滿卦】智仁勇俱全，可成就大業；此數大吉，名利雙收 (大吉)",
    32: "【貴人多助卦】得貴人扶，終能成功；池中之龍，風雲際會 (大吉)",
    33: "【剛毅果斷卦】如日中天，處事剛毅；意氣用事，人和必失 (吉)",
    34: "【破家亡身卦】禍狂層出不窮，人生孤苦 (凶)",
    35: "【保守平安卦】溫和保守，嚴謹有正義感；處事嚴謹，進退保守 (吉)",
    36: "【波瀾萬丈卦】波瀾不平，沉浮變動萬端 (凶)",
    37: "【慈祥忠實卦】權威赫赫，富貴顯達；逢凶化吉，吉人天相 (吉)",
    38: "【薄弱平凡卦】意志薄弱，半途而廢 (平)",
    39: "【榮華富貴卦】榮華富貴，有能力突破困境；雲開見月，雖勞無怨 (吉)",
    40: "【浮沉變化卦】生猛狂傲，好投機冒險 (平)",
    41: "【健全有德卦】德高望重，一心努力向上；天賦吉運，德望兼備 (大吉)",
    42: "【博達多能卦】有藝術天賦，但需培養恆心 (平)",
    43: "【薄弱散漫卦】信念不堅定，善玩弄權術 (凶)",
    44: "【逆境煩悶卦】多受阻逆，晚景淒涼 (凶)",
    45: "【德量宏厚卦】順風揚帆，大業啓程；新生泰和，順風揚帆 (吉)",
    46: "【載寶沉舟卦】天羅地網，籠罩全身 (凶)",
    47: "【禎祥吉慶卦】草木逢春，利於合伙幹事業；開花結果，權威進達 (大吉)",
    48: "【英邁德厚卦】足智多謀，是參謀和幕僚之才；青松立鶴，智謀兼備 (吉)",
    49: "【變格為仁卦】吉中帶凶，凶中帶吉 (平)",
    50: "【孤寡離愁卦】曇花一現，可獲短暫的榮達 (凶)",
    51: "【先盛後衰卦】半世榮枯，先成功後失敗 (平)",
    52: "【卓識達智卦】深謀遠慮，有先見之明；草木逢春，雨過天晴 (吉)",
    53: "【難苦內憂卦】日落西山，穩重踏實可自保 (平)",
    54: "【衰頹未達卦】多災多難，苟且殘喘 (凶)",
    55: "【外榮內衰卦】華而不實，吉極生凶 (凶)",
    56: "【凶敗不立卦】缺乏恆心毅力，挫折不斷 (凶)",
    57: "【成就犯險卦】堅忍不拔，魄力信心超群；寒雪青松，最大榮昌 (吉)",
    58: "【先苦後甜卦】前運多挫折，晚年得榮華 (平)",
    59: "【意志退敗卦】缺乏信念，遇事則六神無主 (凶)",
    60: "【無謀失著卦】心神不定，缺乏主見和目標 (凶)",
    61: "【榮華繁達卦】名利雙收，富貴雙全；雲遮半月，百隱風波 (吉)",
    62: "【雪上加霜卦】根基不穩固，信用薄弱 (凶)",
    63: "【富達貴重卦】順和如意，子孫繁昌；萬物化育，繁榮之象 (大吉)",
    64: "【沉悶平凡卦】一生沉浮不定，多為骨肉離散 (凶)",
    65: "【名財兼得卦】福祿滿堂，富貴長壽；吉星高照，萬事無阻 (大吉)",
    66: "【退守自在卦】信用喪失，內外不和 (凶)",
    67: "【自我增進卦】白手起家，有獨立自主之魄力；利路亨通，萬商雲集 (吉)",
    68: "【霸氣成仁卦】忠厚守信，興家立業；智慮周祥，集眾信達 (吉)",
    69: "【沉淪難成卦】坐立難安，容易心浮氣躁 (凶)",
    70: "【破滅敗身卦】病弱難愈，易遭受極端不幸 (凶)",
    71: "【吉凶參半卦】枕戈待旦，才可成就事業 (平)",
    72: "【外祥中凶卦】先甜後苦，應趁早防範準備 (凶)",
    73: "【志大才疏卦】志向遠大，但心有餘而力不足 (凶)",
    74: "【沉淪逆害卦】智能欠乏，一生碌碌無為 (凶)",
    75: "【英邁退安卦】動輒得咎，保守謹慎可自保 (平)",
    76: "【病災難危卦】信譽地位如同破巢之卵 (凶)",
    77: "【半憂半喜卦】前運辛苦，後半生幸福 (平)",
    78: "【勤行智達卦】前運理想，晚景孤獨 (平)",
    79: "【內外要祥卦】有勇無謀，缺少周全計劃 (凶)",
    80: "【波瀾萬丈卦】一生辛苦，宜積德行善 (凶)",
    81: "【春風怡人卦】大尊大貴，福祿壽全；最吉之數，還本歸元 (大吉)"
};

// --- 專業姓名學五格圖表組件 (含詩詞尋源) ---
const NameCardLayout = ({ surname, name1, name2, s0, s1, s2, tonePattern, p1, p2 }) => {
    const tian = s0 + 1;
    const ren = s0 + s1;
    const di = s1 + s2;
    const wai = s2 + 1;
    const zong = s0 + s1 + s2;

    const getWx = (num) => {
        const d = num % 10;
        if (d===1||d===2) return '木';
        if (d===3||d===4) return '火';
        if (d===5||d===6) return '土';
        if (d===7||d===8) return '金';
        return '水';
    };

    const green = "#27ae60"; 
    const blue = "#0984e3";  
    const red = "#d63031";   

    return (
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '12px', marginBottom: '16px', backgroundColor: '#fafafa', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            
            {/* 上半部：圖表與短評 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ position: 'relative', width: '220px', height: '200px', flexShrink: 0, margin: '0 auto', fontFamily: 'sans-serif' }}>
                    <svg width="220" height="200" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <path d="M 75 25 Q 55 25 55 85 Q 55 145 75 145" fill="transparent" stroke={green} strokeWidth="1" />
                        <path d="M 105 25 Q 125 25 125 45 Q 125 65 105 65" fill="transparent" stroke={green} strokeWidth="1" />
                        <path d="M 105 65 Q 125 65 125 85 Q 125 105 105 105" fill="transparent" stroke={green} strokeWidth="1" />
                        <path d="M 105 105 Q 125 105 125 125 Q 125 145 105 145" fill="transparent" stroke={green} strokeWidth="1" />
                        <line x1="30" y1="165" x2="190" y2="165" stroke={green} strokeWidth="1" />
                    </svg>
                    
                    <div style={{ position: 'absolute', left: '10px', top: '75px', textAlign: 'center', width: '40px' }}>
                        <div style={{ fontSize: '11px', color: '#000' }}>外格 <span style={{color: red}}>{wai}</span></div>
                        <div style={{ fontSize: '13px', color: green, marginTop: '2px' }}>{getWx(wai)}</div>
                    </div>

                    <div style={{ position: 'absolute', left: '85px', top: '15px', fontSize: '12px', color: red }}>1</div>
                    
                    <div style={{ position: 'absolute', left: '80px', top: '48px', fontSize: '20px', color: blue }}>{surname}</div>
                    <div style={{ position: 'absolute', left: '105px', top: '56px', fontSize: '11px', color: red }}>{s0}</div>

                    <div style={{ position: 'absolute', left: '80px', top: '88px', fontSize: '20px', color: blue }}>{name1}</div>
                    <div style={{ position: 'absolute', left: '105px', top: '96px', fontSize: '11px', color: red }}>{s1}</div>

                    <div style={{ position: 'absolute', left: '80px', top: '128px', fontSize: '20px', color: blue }}>{name2}</div>
                    <div style={{ position: 'absolute', left: '105px', top: '136px', fontSize: '11px', color: red }}>{s2}</div>

                    <div style={{ position: 'absolute', left: '130px', top: '35px', width: '60px' }}>
                        <div style={{ fontSize: '11px', color: '#000' }}>天格 <span style={{color: red}}>{tian}</span></div>
                        <div style={{ fontSize: '13px', color: green, marginTop: '2px' }}>{getWx(tian)}</div>
                    </div>
                    <div style={{ position: 'absolute', left: '130px', top: '75px', width: '60px' }}>
                        <div style={{ fontSize: '11px', color: '#000' }}>人格 <span style={{color: red}}>{ren}</span></div>
                        <div style={{ fontSize: '13px', color: green, marginTop: '2px' }}>{getWx(ren)}</div>
                    </div>
                    <div style={{ position: 'absolute', left: '130px', top: '115px', width: '60px' }}>
                        <div style={{ fontSize: '11px', color: '#000' }}>地格 <span style={{color: red}}>{di}</span></div>
                        <div style={{ fontSize: '13px', color: green, marginTop: '2px' }}>{getWx(di)}</div>
                    </div>

                    <div style={{ position: 'absolute', left: '0', top: '175px', width: '220px', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#000' }}><span style={{color: red}}>{zong}</span> 總格</div>
                        <div style={{ fontSize: '14px', color: green }}>{getWx(zong)}</div>
                    </div>
                </div>

                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', fontSize: '14px', color: '#333' }}>
                    <div><strong style={{ color: '#000' }}>人格 ({ren}畫) 主運：</strong><br/><span style={{ color: '#555' }}>{EIGHTY_ONE_ATTR[ren] || '吉'}</span></div>
                    <div><strong style={{ color: '#000' }}>地格 ({di}畫) 前運：</strong><br/><span style={{ color: '#555' }}>{EIGHTY_ONE_ATTR[di] || '吉'}</span></div>
                    <div><strong style={{ color: '#000' }}>總格 ({zong}畫) 後運：</strong><br/><span style={{ color: '#555' }}>{EIGHTY_ONE_ATTR[zong] || '吉'}</span></div>
                    <div><strong style={{ color: '#000' }}>外格 ({wai}畫) 輔運：</strong><br/><span style={{ color: '#555' }}>{EIGHTY_ONE_ATTR[wai] || '吉'}</span></div>
                </div>
            </div>

            {/* 下半部：古典詩詞藏頭尋源 */}
            <div style={{ width: '100%', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #ccc', fontSize: '13px', color: '#444', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#8e44ad', fontWeight: 'bold', fontSize: '15px' }}>📜 古典詩詞尋源</span>
                    <span style={{ fontSize: '12px', backgroundColor: '#e8daef', color: '#8e44ad', padding: '2px 8px', borderRadius: '12px' }}>
                        音律：{tonePattern}
                    </span>
                </div>
                <div style={{ marginBottom: '4px' }}><strong style={{color:'#000', fontSize:'15px'}}>「{name1}」</strong>：{p1}</div>
                <div><strong style={{color:'#000', fontSize:'15px'}}>「{name2}」</strong>：{p2}</div>
            </div>
        </div>
    );
};

const AiBaziAnalysis = ({ data }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isPaid, setIsPaid] = useState(data.isPaid || false);
  
  // 🌟 1. 新增這兩個狀態：用於記錄是否為管理員解鎖，以及自訂的五行陣列
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [customWuxing, setCustomWuxing] = useState([]);

  useEffect(() => {
      if (data.isPaid && !analysisResult) {
          setIsPaid(true);
          setTimeout(() => {
              try { setAnalysisResult(generateLongReport(false)); } 
              catch (e) { console.error("Report Generation Error:", e); }
          }, 50);
      }
  }, [data, analysisResult]);

  const DI_TIAN_SUI = {
    '甲': '「甲木參天，脫胎要火。春不容金，秋不容土。火熾乘龍，水宕騎虎。地潤天和，植立千古。」',
    '乙': '「乙木雖柔，刲羊解牛。懷丁抱丙，跨鳳乘猴。虛濕之地，騎馬亦憂。藤蘿繫甲，可春可秋。」',
    '丙': '「丙火猛烈，欺霜侮雪。能煆庚金，逢辛反怯。土眾成慈，水猖顯節。虎馬犬鄉，甲木若來，必當焚滅。」',
    '丁': '「丁火柔中，內性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不窮。如有嫡母，可秋可冬。」',
    '戊': '「戊土固重，既中且正。靜翕動闢，萬物司命。水潤物生，火燥物病。若在艮坤，怕沖宜靜。」',
    '己': '「己土卑濕，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜幫。」',
    '庚': '「庚金帶煞，剛健為最。得水而清，得火而銳。土潤則生，土乾則脆。能贏甲兄，輸於乙妹。」',
    '辛': '「辛金軟弱，溫潤而清。畏土之疊，樂水之盈。能扶社稷，能救生靈。熱則喜母，寒則喜丁。」',
    '壬': '「壬水通河，能洩金氣。剛中之德，周流不滯。通根透癸，沖天奔地。化則有情，從則相濟。」',
    '癸': '「癸水至弱，達於天津。得龍而運，功化斯神。不愁火土，不論庚辛。合戊見火，化象斯真。」'
  };

  const DI_TIAN_SUI_DESC = {
    '甲': '甲木就像高聳入雲的大樹。如果在春天出生（木旺），需要「火」來發洩它的生機（木生火，即「食傷洩秀」），才能開花結果，脫胎換骨。春天木極旺，金來剋木反而會導致刀刃捲口；秋天金極旺，此時甲木凋零，若再見厚土生金，甲木必死無疑。如果八字火勢太猛，甲木需要坐在「辰」（即龍，辰為濕土）上來散火培根；如果水勢滔天，甲木需要坐在「寅」（即虎，寅為木之本氣）上，才能吸收水分並穩固根基。只要地支有適當的水分潤澤，天干氣候調和，甲木就能萬古長青。',
    '乙': '乙木雖然柔軟如花草，但它的根鬚極具穿透力，能夠剋制並疏通「未」（羊）和「丑」（牛）這兩種堅硬的土。只要天干有丙火、丁火保護，乙木就敢騎在「酉」（鳳/雞）和「申」（猴）這兩個強大的金之上，不怕被砍伐。如果八字充滿了水（虛濕之地），乙木根部腐爛，此時就算坐在「午」（馬，火）上，火也會被旺水撲滅，乙木依舊堪憂。這是乙木最著名的生存哲學：只要八字裡有「甲木」，乙木就像藤蔓纏繞著參天大樹，無論春夏秋冬都能屹立不倒（即依靠貴人、合夥人）。',
    '丙': '丙火就像太陽，陽氣最盛，不怕冰霜雨雪。它能輕易將堅硬的庚金熔化；但遇到柔弱的辛金，丙火反而會變得溫柔（丙辛合水），太陽遇到陰雲化作雨水，失去猛烈之性。遇到很多土，丙火的烈性會被吸收（火生土），變得慈祥；遇到猖狂的大水，陽光照在水面上反而波光粼粼，顯得更有節操與光芒。如果地支湊齊了「寅、午、戌」（虎馬犬，三合火局），火勢已經失控，這時候如果再來甲木生火，木一定會被燒成灰燼。',
    '丁': '丁火是人間的燈火、爐火或星光，性情柔和中庸，內在明亮而溫暖。遇到乙木（偏印），丁火不會像丙火那樣把它燒盡，反而能保護乙木不被辛金剋；遇到壬水（正官），「丁壬合木」，它甘願化作木氣來輔佐，故稱忠孝。即使在夏天火旺之時，丁火也不會像丙火那樣猛烈毒辣；即使在冬天火弱之時，只要有一點點油（木），它就能生生不息，不會輕易熄滅。嫡母就是「甲木」。丁火只要有甲木（大木柴）來生，不管生在秋天還是冬天，都能一直燃燒。',
    '戊': '戊土就像巍峨的高山或厚重的城牆，極其穩固，代表中正、包容與信用。它安靜的時候（秋冬）閉藏萬物，萌動的時候（春夏）孕育生機，是萬物生死的掌管者。厚重的土必須要有「水」來滋潤，萬物才能生長；如果只有「火」來烤，高山變成焦土，萬物就會生病枯死。艮代表寅（東北），坤代表申（西南）。如果戊土生在寅或申的月份，最怕地支發生相沖（寅申沖會導致山崩地裂），這時最需要安靜穩定。',
    '己': '己土是低窪的田園之土或爛泥巴，自帶濕氣，善於蓄藏養分。它不怕木多（因為草木本來就生長在泥土裡）；也不怕水狂（因為爛泥巴遇水只會跟著流動，或將水吸收，不會被輕易沖垮）。如果火太弱（如微弱的丁火），遇到濕濕的己土，火反而會被撲滅、遮蔽；但己土非常會養金，能讓金屬保持光澤而不被火鎔。己土本身陰濕，如果要孕育萬物並有所成就，非常需要「丙火」來給予陽光照耀，或「戊土」來幫忙阻擋大水。',
    '庚': '庚金代表刀劍、斧頭或粗礦，自帶一股肅殺之氣，是十天干中最為剛硬猛烈的。遇到壬水，就像寶劍在水裡洗滌，鋒芒清澈（金水相生）；遇到丁火，就像礦石進入火爐鍛造，百煉成鋼，變得極為鋒銳。金靠土生，但庚金喜歡「濕土」（辰、丑）來生養；如果遇到「燥土」（未、戌），不但生不了金，反而會把金烤得極度脆弱易斷。庚金能輕鬆砍斷參天的甲木；但遇到柔弱的乙木，卻會因為「乙庚合金」（鐵漢柔情）而被絆住，為了愛情放棄了殺伐果斷。',
    '辛': '辛金是已經被打磨好的鑽石、珠寶或金銀首飾，本身柔軟、精緻且清亮。珠寶最怕厚重的土（戊土）把它掩埋，失去光澤（土多金埋）；它最喜歡豐盈的水（壬水）來淘洗，讓它閃閃發光。辛金能與猛烈的丙火相合（丙辛合水），把灼熱的太陽化作雨水，拯救被烈日烤乾的萬物。夏天極熱時，辛金需要「己土」（濕土）來幫忙散熱並保護它；冬天極寒時，需要「丁火」（溫和的燈光）來照耀它，顯現它的璀璨。',
    '壬': '壬水就像長江黃河或汪洋大海，水勢浩大，能夠大量消耗金的銳氣（金生水）。它的本性剛健，不喜歡被拘束，喜歡不斷地流動、循環不息。如果地支水旺（有亥、子等根基），天干又透出癸水來幫忙，那這股水勢就會引發洪災，沖天奔地，難以阻擋。遇到丁火，可以「丁壬合木」，水火交融變得非常有情；如果八字裡其他五行（如木或土）實在太旺，壬水也懂得順勢而為（從格），去滋潤萬物。',
    '癸': '癸水是清晨的露水、天上的雲霧或毛毛雨。它雖然極其微弱，但卻能輕盈地升騰到天際。龍就是「辰」（水庫）。癸水只要見到辰，就能藉助龍的雲雨之氣，發揮出神奇的化育功能，行雲布雨。它不怕火土來剋（因為雲霧遇熱只會蒸發消散，不會真正死亡）；它也不依賴庚辛金來生（雨露之水靠天地自然運化，並不需要金屬來淘洗）。癸水遇到戊土（戊癸合火），如果八字中還有火來引導，它就能真正化作火氣，徹底改變自己的本性，這是一種極高的格局變化。'
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
    return { same: dayWuxing, produce: cycle[(idx + 1) % 5], control: cycle[(idx + 2) % 5], controlledBy: cycle[(idx + 3) % 5], producedBy: cycle[(idx + 4) % 5] };
  };

  const analyzeCombinations = (zhis) => {
      const combos = [];
      const potentialCombos = []; 
      const has = (z) => zhis.includes(z);
      const wuxingSupport = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
      let used = new Set(); 

      const checkRel = (z1, z2) => {
          let isAdj = false;
          let i1 = [], i2 = [];
          zhis.forEach((z, i) => { if(z===z1) i1.push(i); if(z===z2) i2.push(i); });
          if (i1.length > 0 && i2.length > 0) {
              i1.forEach(a => { i2.forEach(b => { if (Math.abs(a - b) === 1) isAdj = true; }); });
          }
          return { exists: i1.length > 0 && i2.length > 0, isAdj };
      };

      if (has('寅') && has('卯') && has('辰')) { combos.push('寅卯辰三會木局'); wuxingSupport['木'] += 2; used.add('寅'); used.add('卯'); used.add('辰'); }
      if (has('巳') && has('午') && has('未')) { combos.push('巳午未三會火局'); wuxingSupport['火'] += 2; used.add('巳'); used.add('午'); used.add('未'); }
      if (has('申') && has('酉') && has('戌')) { combos.push('申酉戌三會金局'); wuxingSupport['金'] += 2; used.add('申'); used.add('酉'); used.add('戌'); }
      if (has('亥') && has('子') && has('丑')) { combos.push('亥子丑三會水局'); wuxingSupport['水'] += 2; used.add('亥'); used.add('子'); used.add('丑'); }

      if (!used.has('卯') && has('亥') && has('卯') && has('未')) { combos.push('亥卯未三合木局'); wuxingSupport['木'] += 1.5; used.add('亥'); used.add('卯'); used.add('未'); }
      if (!used.has('午') && has('寅') && has('午') && has('戌')) { combos.push('寅午戌三合火局'); wuxingSupport['火'] += 1.5; used.add('寅'); used.add('午'); used.add('戌'); }
      if (!used.has('酉') && has('巳') && has('酉') && has('丑')) { combos.push('巳酉丑三合金局'); wuxingSupport['金'] += 1.5; used.add('巳'); used.add('酉'); used.add('丑'); }
      if (!used.has('子') && has('申') && has('子') && has('辰')) { combos.push('申子辰三合水局'); wuxingSupport['水'] += 1.5; used.add('申'); used.add('子'); used.add('辰'); }

      const banHeList = [ ['亥', '卯', '木'], ['卯', '未', '木'], ['寅', '午', '火'], ['午', '戌', '火'], ['巳', '酉', '金'], ['酉', '丑', '金'], ['申', '子', '水'], ['子', '辰', '水'] ];
      banHeList.forEach(item => {
          const z1 = item[0], z2 = item[1], wx = item[2];
          if (!used.has(z1) && !used.has(z2)) {
              const rel = checkRel(z1, z2);
              if (rel.exists) {
                  if (rel.isAdj) { combos.push(`${z1}${z2}半合${wx}`); wuxingSupport[wx] += 1; } 
                  else { potentialCombos.push(`${z1}${z2}半合${wx}局`); wuxingSupport[wx] += 0.5; }
                  used.add(z1); used.add(z2);
              }
          }
      });
      
      const liuHeList = [ ['子', '丑', '土'], ['寅', '亥', '木'], ['卯', '戌', '火'], ['辰', '酉', '金'], ['巳', '申', '水'], ['午', '未', '火'] ];
      liuHeList.forEach(item => {
          const z1 = item[0], z2 = item[1], wx = item[2];
          if (!used.has(z1) && !used.has(z2)) {
              const rel = checkRel(z1, z2);
              if (rel.exists) {
                  if (rel.isAdj) { combos.push(`${z1}${z2}六合${wx}`); wuxingSupport[wx] += 1; } 
                  else { potentialCombos.push(`${z1}${z2}六合${wx}局`); wuxingSupport[wx] += 0.5; }
                  used.add(z1); used.add(z2);
              }
          }
      });

      // 🌟 【已補回】暗拱 (Dark Arches) 檢查邏輯
      if (has('申') && has('辰') && !has('子')) { combos.push('申辰暗拱子水'); wuxingSupport['水'] += 0.5; }
      if (has('亥') && has('未') && !has('卯')) { combos.push('亥未暗拱卯木'); wuxingSupport['木'] += 0.5; }
      if (has('寅') && has('戌') && !has('午')) { combos.push('寅戌暗拱午火'); wuxingSupport['火'] += 0.5; }
      if (has('巳') && has('丑') && !has('酉')) { combos.push('巳丑暗拱酉金'); wuxingSupport['金'] += 0.5; }

      if (has('寅') && has('辰') && !has('卯')) { combos.push('寅辰暗拱卯木'); wuxingSupport['木'] += 0.5; }
      if (has('巳') && has('未') && !has('午')) { combos.push('巳未暗拱午火'); wuxingSupport['火'] += 0.5; }
      if (has('申') && has('戌') && !has('酉')) { combos.push('申戌暗拱酉金'); wuxingSupport['金'] += 0.5; }
      if (has('亥') && has('丑') && !has('子')) { combos.push('亥丑暗拱子水'); wuxingSupport['水'] += 0.5; }

      return { combos, potentialCombos, wuxingSupport };
  };

  const getLuckyInfo = (wuxing) => {
      const info = {
          '木': { dir: '正東、東南', color: '青、綠色系' },
          '火': { dir: '正南', color: '紅、紫、粉色系' },
          '土': { dir: '中宮、西南、東北', color: '黃、咖、大地色系' },
          '金': { dir: '正西、西北', color: '白、金、銀色系' },
          '水': { dir: '正北', color: '黑、藍、灰色系' }
      };
      return info[wuxing] || info['水'];
  };

  const generateLongReport = (isAdmin = false, overrideWuxing = null) => {
    const { bazi, genderText } = data;
    const wx = getCounts();
    const dm = bazi.dayGan;
    const dmWuxing = WUXING_MAP[dm];
    const monthZhiWuxing = WUXING_MAP[bazi.monthZhi];
    const rel = getRelations(dmWuxing);
    
    const zhiArray = [bazi.yearZhi, bazi.monthZhi, bazi.dayZhi, bazi.timeZhi];
    const { combos, potentialCombos, wuxingSupport } = analyzeCombinations(zhiArray);
    
    const baseSelfCount = wx[dmWuxing] + wx[rel.producedBy];
    const comboSupportCount = wuxingSupport[dmWuxing] + wuxingSupport[rel.producedBy];
    const totalSelfPower = baseSelfCount + comboSupportCount;

    const isMonthFavorable = ['same', 'producedBy'].includes(Object.keys(rel).find(k => rel[k] === monthZhiWuxing));
    const isStrong = totalSelfPower >= 4.5 || (isMonthFavorable && totalSelfPower >= 3.5);
    const favWuxing = isStrong ? [rel.control, rel.produce, rel.controlledBy] : [rel.producedBy, rel.same];
    const primaryFav = favWuxing[0];

    const namingWuxing = (overrideWuxing && overrideWuxing.length > 0) ? overrideWuxing : favWuxing;

    const chartChars = [bazi.yearGan, bazi.yearZhi, bazi.monthGan, bazi.monthZhi, bazi.dayGan, bazi.dayZhi, bazi.timeGan, bazi.timeZhi];
    const WUXING_CHARS = { '木': ['甲', '乙', '寅', '卯'], '火': ['丙', '丁', '巳', '午'], '土': ['戊', '己', '辰', '戌', '丑', '未'], '金': ['庚', '辛', '申', '酉'], '水': ['壬', '癸', '亥', '子'] };

    let yongShenList = []; 
    let xiShenList = [];   
    favWuxing.forEach(wxElem => {
        const charsOfWx = WUXING_CHARS[wxElem];
        if (charsOfWx) {
            charsOfWx.forEach(char => {
                const fullName = `${char}${wxElem}`; 
                if (chartChars.includes(char)) {
                    if (!yongShenList.includes(fullName)) yongShenList.push(fullName);
                } else {
                    if (!xiShenList.includes(fullName)) xiShenList.push(fullName);
                }
            });
        }
    });

    const pillars = [ { g: bazi.yearGan, z: bazi.yearZhi }, { g: bazi.monthGan, z: bazi.monthZhi }, { g: bazi.dayGan, z: bazi.dayZhi }, { g: bazi.timeGan, z: bazi.timeZhi } ];
    const allShenSha = [...new Set(pillars.reduce((acc, p) => acc.concat(getShenSha(p.g, p.z, bazi.dayGan, bazi.dayZhi, bazi.yearZhi, bazi.monthZhi)), []))];

    const seasonMap = { '寅':'孟春', '卯':'仲春', '辰':'季春', '巳':'孟夏', '午':'仲夏', '未':'季夏', '申':'孟秋', '酉':'仲秋', '戌':'季秋', '亥':'孟冬', '子':'仲冬', '丑':'季冬' };
    const season = seasonMap[bazi.monthZhi] || '';

    // ================= 開始撰寫報告 =================
    let report = `### 一、 原局總論與古典格局剖析\n`;
    
    report += `閣下為**【${dm}${dmWuxing}】**日元，生於${season}${bazi.monthZhi}月。\n`;
    report += `《滴天髓》云：${DI_TIAN_SUI[dm] || ''}\n\n`;
    report += `- ${DI_TIAN_SUI_DESC[dm] || ''}\n\n`;
    report += `原局地支`;
    
    if (combos.length > 0 || potentialCombos.length > 0) {
        if (combos.length > 0) {
            report += `見**【${combos.join('、')}】**，`;
        }
        if (potentialCombos.length > 0) {
            report += `暗含**【${potentialCombos.join('、')}】基因**，待遇大運或流年填實引動，便會爆發出強大的相應五行能量。`;
        }
        report += `綜合判定後，`;
    } else {
        report += `氣場純粹，無明顯合化局。`;
    }

    report += `閣下八字屬於**「${isStrong ? '身旺' : '身弱'}」**之局。依據五行生剋原理，日元${isStrong ? '氣勢強旺，需引導宣洩或適當雕琢' : '根氣稍弱，急需生扶與滋補'}。\n`;
    
    let yongShenText = yongShenList.length > 0 ? yongShenList.join('、') : `${primaryFav}`;
    let xiShenText = xiShenList.length > 0 ? xiShenList.join('、') : `${favWuxing.slice(1).join('、')}`;
    report += `此命造用** 【${yongShenText} 】**，流運見** 【${xiShenText}】**亦可斟用，運勢起伏隨年月變化。\n\n`;

    report += `### 二、 天賦事業與財運格局\n`;

    const monthHidden = ZHI_HIDDEN[bazi.monthZhi] || [];
    const monthZhiMainGan = monthHidden[0] || '';
    const monthTenGod = getShiShen(bazi.dayGan, monthZhiMainGan);
    
    const TEN_GOD_FULL_NAME = {
        '比': '比肩', '劫': '劫財', '食': '食神', '傷': '傷官',
        '財': '正財', '才': '偏財', '官': '正官', '殺': '七殺',
        '印': '正印', '卩': '偏印'
    };
    const monthTenGodFullName = TEN_GOD_FULL_NAME[monthTenGod] || monthTenGod;
    
    let monthWxDesc = '';
    if (monthZhiWuxing === '木') monthWxDesc = '木主仁，賦予您仁慈溫和、具備生長潛能與包容的特質';
    else if (monthZhiWuxing === '火') monthWxDesc = '火主禮，賦予您熱情明朗、具爆發力與強大感染力的特質';
    else if (monthZhiWuxing === '土') monthWxDesc = '土主信，賦予您穩重踏實、極具包容力與承載重任的特質';
    else if (monthZhiWuxing === '金') monthWxDesc = '金主義，賦予您果決剛毅、雷厲風行與重情重義的特質';
    else if (monthZhiWuxing === '水') monthWxDesc = '水主智，賦予您聰明靈活、應變力強與深沉智慧的特質';

    let monthGodDesc = '';
    switch(monthTenGod) {
        case '印': monthGodDesc = '心地善良，包容力強，重視精神內涵與傳統道德，領悟力極高，具備深度的學術與企劃天賦'; break;
        case '卩': monthGodDesc = '思想獨特，直覺敏銳，不隨波逐流，對神祕學或偏門專業領悟力極高，具備非凡的創造與洞察天賦'; break;
        case '官': monthGodDesc = '為人正直，循規蹈矩，極具責任感與自我要求，重視紀律與名譽，天生有穩健的行政與管理才能'; break;
        case '殺': monthGodDesc = '極具魄力與野心，行事雷厲風行，敢於挑戰權威與難關，天生有開創疆土與危機處理的領導才能'; break;
        case '財': monthGodDesc = '務實理智，腳踏實地，對數字極為敏感，重視家庭與穩定，擅長按部就班的資源積累與理財操作'; break;
        case '才': monthGodDesc = '慷慨大方，交際手腕佳，具備敏銳的商業嗅覺與宏觀視野，擅長人脈整合與捕捉市場先機'; break;
        case '食': monthGodDesc = '性格溫和寬厚，懂得享受生活，人緣極佳，具備卓越的審美觀與平易近人的表達天分'; break;
        case '傷': monthGodDesc = '才華洋溢，聰明機靈，追求絕對的自由與創新，不喜受傳統拘束，擁有獨特的專業技術與犀利的思辯天分'; break;
        case '比': monthGodDesc = '獨立自主，意志堅定，凡事親力親為，重視平等的友誼，具備不屈不撓、貫徹始終的毅力'; break;
        case '劫': monthGodDesc = '充滿行動力，好勝心強，極具群眾魅力與適應力，具備在激烈競爭中脫穎而出的拼搏精神'; break;
    }

    report += `八字用神，月令為尊，閣下生於${bazi.monthZhi}月，五行屬${monthZhiWuxing}，主氣為**【${monthTenGodFullName}】**星。\n`;
    report += `- 性格與天賦方面，${monthWxDesc}；同時，${monthGodDesc}。\n`;

    let shenShaTraits = [];
    if (allShenSha.includes('將星') || allShenSha.includes('羊刃')) shenShaTraits.push(`命逢將星羊刃，敢於向權威挑戰，內心不喜陳規`);
    if (allShenSha.includes('文昌') || allShenSha.includes('學士') || allShenSha.includes('華蓋')) shenShaTraits.push(`命透文星華蓋，具備強大領悟力與才華，一生循規蹈矩，重視權威`);
    if (allShenSha.includes('驛馬')) shenShaTraits.push(`坐擁驛馬之星，主舟車勞動方能增財，適合向外拓展`);
    
    if (shenShaTraits.length > 0) {
      report += `- 輔以神煞來看，${shenShaTraits.join('；')}。\n`;
    }
    
    report += `- 原局五行以${primaryFav}為喜用，事業上比較適合與「${primaryFav}」相關的行業與場所。\n`;
    if (primaryFav === '木') report += `- 尤以與木相關的行業有緣，例如文章寫作、文職、造紙造船、教職、教育、文藝創作、醫療、法律等。\n`;
    if (primaryFav === '火') report += `- 尤以與火相關的行業有緣，例如餐飲烘焙、光電能源、影視娛樂、演說傳播、美容美髮、心理治療等。\n`;
    if (primaryFav === '土') report += `- 尤以與土相關的行業有緣，例如房地產、建築工程、物業管理、傳統農牧、顧問諮詢、生前契約等。\n`;
    if (primaryFav === '金') report += `- 尤以與金相關的行業有緣，例如金融保險、證券投資、軍警法務、五金機械、科技硬體製造、汽車產業等。\n`;
    if (primaryFav === '水') report += `- 尤以與水相關的行業有緣，例如國際貿易、物流船運、旅遊導遊、飲品酒類、電子商務、公關外交等。\n`;

    const wealthCount = wx[rel.control];
    if (wealthCount >= 3 && !isStrong) {
      report += `財運方面，格局屬「財多身弱」，這意味著閣下對商機極為敏感，身邊總不乏賺錢機會，但易「因財生煩惱」或財來財去。\n投資作風**必須極度保守**，切忌高槓桿或投機短炒，宜選擇長線收息、藍籌股或實體物業，以「慢富」為上策。\n創業建議方面，極不建議單打獨鬥。若要創業，務必尋找八字互補的穩健合夥人同行，由他人主導衝鋒，您**退居幕後策劃**，或選擇加盟成熟品牌，藉助他人之力方能守住財富。\n\n`;
    } else if (wealthCount >= 2 && isStrong) {
      report += `財運方面，格局屬優質的「身財兩停」，具備強大的承載與駕馭財富能力，不僅能賺錢更能守財，一生財源廣進。\n投資作風**可適度積極進取**，具備承受一定風險的能力，適合佈局多元資產、股權投資或新興市場。\n創業建議方面，閣下極具**老闆命格**，生財之道在於「敢為天下先」。非常適合自立門戶、開創獨立品牌或開拓新藍海市場。只要經過理性評估，勇於投入資源與擴張團隊，必能開創出屬於自己的財富王國。\n\n`;
    } else {
      report += `財運方面，原局財星較為隱退。這不代表貧窮，而是指閣下的財富多屬**「正印生身」**或**「食傷生財」**的專業技術之財。\n投資作風應以**「穩紮穩打、保本增值」為核心**，最好的投資其實是「投資大腦與專業技能」，其次才是定期定額的被動理財。\n創業建議方面，不宜從事高資本投入、囤貨或買賣價差的純商業模式。若要創業，強烈建議以**「個人專業、知識變現、顧問服務或特殊手藝」**為切入點，建立無可取代的專業口碑，財富自然會不請自來。\n\n`;
    }

    report += `### 三、 感情婚姻與伴侶特質\n`;
    
    const dayHidden = ZHI_HIDDEN[bazi.dayZhi] || [];
    const dayZhiMainGan = dayHidden[0] || ''; 
    const spouseTenGod = getShiShen(bazi.dayGan, dayZhiMainGan); 
    const hasPeach = allShenSha.includes('桃花') || allShenSha.includes('紅鸞');

    if (['子', '午', '卯', '酉'].includes(bazi.dayZhi)) {
        report += `閣下夫妻宮坐落於**【${bazi.dayZhi}】（四正星）**。代表命定之另一半多半外貌姣好、氣質出眾，性格較為直率、愛恨分明。\n`;
    } else if (['寅', '申', '巳', '亥'].includes(bazi.dayZhi)) {
        report += `閣下夫妻宮坐落於**【${bazi.dayZhi}】（四驛馬）**。代表命定之另一半性格活潑外向、機智敏捷，具備極佳的溝通與適應能力。\n`;
    } else {
        report += `閣下夫妻宮坐落於**【${bazi.dayZhi}】（四墓庫）**。代表命定之另一半性格沉穩、踏實，非常有責任感與傳統家庭觀念。\n`;
    }

    let spouseDesc = '';
    switch(spouseTenGod) {
        case '比': spouseDesc = '代表對方性格獨立自主，雙方地位平等，但也易因堅持己見而互不相讓。'; break;
        case '劫': spouseDesc = '代表對方充滿行動力，但相處時易生磨擦或財務糾紛，需學習柔軟溝通。'; break;
        case '食': spouseDesc = '代表對方性格溫和寬厚，懂得享受生活，脾氣佳。'; break;
        case '傷': spouseDesc = '代表您性格獨立爽朗，心直口快，不懂得修飾言辭。初時對方會被您爽朗的性格吸引，但拍拖則易生磨擦、心生間隙。'; break;
        case '財': spouseDesc = '代表對方顧家、務實且傳統，極擅長理財與打理生活瑣事。'; break;
        case '才': spouseDesc = '代表對方慷慨大方、交際手腕佳，但外務較多，需給予適當空間。'; break;
        case '官': spouseDesc = '代表對方為人正直、端莊，極具責任感，行事作風偏向傳統。'; break;
        case '殺': spouseDesc = '代表對方性格強勢、具魄力與野心。關係多半是相愛相殺的模式。'; break;
        case '印': spouseDesc = '代表對方心地善良、極富同理心與包容力，能給予極大精神慰藉。'; break;
        case '卩': spouseDesc = '代表對方思想獨特、直覺敏銳，性格較為內斂。'; break;
    }
    
    const spouseTenGodFullName2 = TEN_GOD_FULL_NAME[spouseTenGod] || spouseTenGod;
    report += `夫妻宮內藏**【${spouseTenGodFullName2}】**星，${spouseDesc}\n`;

    if (hasPeach) {
        report += `- 另外，本命多合或帶桃花紅鸞，代表閣下人緣極佳，易與人有關連牽扯，多應於男女之事，即多人追求，或易給人有追求者的感覺。\n\n`;
    } else {
        report += `\n`;
    }

    report += `### 四、 疾厄與中醫五行養生\n`;
    report += `《黃帝內經》有云：「天有五音，人有五臟」。八字的五行分佈，直接對應著人體臟腑的強弱先天基礎。\n`;

    const missing = Object.keys(wx).filter(k => wx[k] === 0);
    const tooMany = Object.keys(wx).filter(k => wx[k] >= 3);
    
    if (missing.length === 0 && tooMany.length === 0) {
        report += `閣下原局五行流通，先天體質基礎良好。日常保養只需順應四時節氣，「春夏養陽，秋冬養陰」，保持飲食作息的平衡，便能維持身心康泰。\n\n`;
    } else {
        if (missing.length > 0) {
            report += `先天五行**缺【${missing.join('、')}】：** 缺乏之五行代表該臟腑機能先天較弱，需特別藉由後天補足。\n`;
            missing.forEach(m => {
                if (m === '木') report += `  • **缺木（肝膽）：** 容易疲勞、視力減退或情緒鬱結。宜盡量在子時（晚上11點前）入睡以養肝血；飲食可多攝取綠色蔬菜，保持心胸開闊。\n`;
                if (m === '火') report += `  • **缺火（心血管/小腸）：** 氣血循環較差，易有手腳冰冷或缺乏活力的現象。宜多曬早晨的太陽，保持適度有氧運動以推動氣血，可多吃紅色食物。\n`;
                if (m === '土') report += `  • **缺土（脾胃/消化）：** 吸收功能受限，容易腸胃不適或肌肉無力。飲食務必「定時定量、忌生冷油膩」，可多吃黃色根莖類食物（如南瓜、地瓜）以健脾。\n`;
                if (m === '金') report += `  • **缺金（肺/大腸）：** 呼吸道及皮膚防禦力較弱，易有過敏、感冒或便秘。應注意環境通風與保暖，多做擴胸運動，宜多食白色溫潤之物（如百合、銀耳）。\n`;
                if (m === '水') report += `  • **缺水（腎/膀胱）：** 內分泌與生殖系統較弱，容易腰酸背痛或精力衰退。平時需注重下半身保暖，適當補充水分，宜多攝取黑色食物（如黑芝麻、黑豆）。\n`;
            });
        }
        if (tooMany.length > 0) {
            report += `先天五行**【${tooMany.join('、')}】氣過旺：** 古人認為「亢害承制」，過旺的五行會對臟腑造成負荷，甚至「剋」傷其他臟腑。\n`;
            tooMany.forEach(tm => {
                if (tm === '木') report += `  • **木旺（肝火過盛）：** 脾氣容易急躁、偏頭痛，且木多剋土，易致消化不良。保養上首重「疏肝解鬱」，可適量飲用菊花茶平肝明目，多做拉筋伸展。\n`;
                if (tm === '火') report += `  • **火旺（心火熾盛）：** 容易有心悸、失眠多夢、口腔潰瘍或焦慮。保養上忌熬夜與情緒大起大落，務必多喝水，可適量攝取蓮子心、苦瓜等清熱降火之物。\n`;
                if (tm === '土') report += `  • **土旺（脾胃濕滯）：** 身體容易感覺沉重、水腫，甚至有發胖或三高傾向。保養上需多做運動流汗以「祛濕」，少吃甜食與精緻澱粉，飯後宜散步。\n`;
                if (tm === '金') report += `  • **金旺（肺氣過燥）：** 呼吸道容易緊繃，且為人易因過度執著而產生龐大精神壓力。保養上需「潤肺化痰」，多喝溫熱開水，練習腹式呼吸以放鬆身心。\n`;
                if (tm === '水') report += `  • **水旺（寒濕過重）：** 容易有宮寒、下肢水腫、頻尿，或易生恐懼焦慮之情。保養上極度需要注重保暖，忌吃冰冷生食，睡前多泡腳以引火歸元。\n`;
            });
        }
        report += `\n`;
    }

    report += `### 五、 當前十年大運解析\n`;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); 
    const currentDaYun = (data.daYuns || []).find(dy => currentYear >= dy.startYear && currentYear <= dy.startYear + 9);

    if (currentDaYun) {
        const dyGanWuxing = WUXING_MAP[currentDaYun.gan];
        const dyZhiWuxing = WUXING_MAP[currentDaYun.zhi];
        const isDyGood = favWuxing.includes(dyGanWuxing) || favWuxing.includes(dyZhiWuxing);
        
        report += `大運管十年大局，閣下於 ${currentDaYun.startYear} 年至 ${currentDaYun.startYear + 9} 年，正行**【${currentDaYun.gan}${currentDaYun.zhi}】**大運，此十年是閣下人生軌跡中極為關鍵的轉折樞紐。命理中，天干**【${currentDaYun.gan}】**主導前五年的外在境遇與表象，地支**【${currentDaYun.zhi}】**則掌管後五年的潛在能量與真實收穫。\n\n`;
        
        if (isDyGood) {
            report += `- 此大運五行帶有「${dyGanWuxing}${dyZhiWuxing}」之氣，正中閣下命中喜用之神，氣場猶如「枯木逢春，揚帆順水」。在這十年間，閣下的思維將變得格外清晰，判斷力敏銳，能夠精準捕捉到市場或職場上的隱藏機遇。外在境遇上，人緣關係將變得空前緊密，極易得到長輩、長官或權威人士的賞識與提攜，主「事業突破，大勢向好」。\n`;
            report += `- 這是一個值得閣下放手一搏的黃金十年。財務上多屬穩步上升、甚至有爆發增長之態。唯需提醒閣下，順境中切忌驕矜自滿，應趁勢擴大格局、建立穩固的資源網絡。只要善加把握，這十年的積累將能為您往後的人生奠定難以撼動的堅實基礎。\n\n`;
        } else {
            report += `- 此大運五行帶有「${dyGanWuxing}${dyZhiWuxing}」之氣，與閣下原局喜用神相左，屬於氣場較為混雜的「沉澱考驗期」。古語云：「君子藏器於身，待時而動」。在這十年間，閣下內心常會湧現強烈的企圖心，但外在環境卻時常事與願違，主「驛馬動盪，舟車勞動，事倍功半」。\n`;
            report += `- 此時的行事策略必須以「守」為攻。職場上易感心力交瘁、遭遇小人阻礙或付出與回報不成正比。強烈建議閣下切勿在此運中盲目擴張事業或進行高風險的高槓桿投資。遇到人事糾紛，一切「可以用錢解決的都建議用錢解決掉」，以空間換取時間。請將這十年視為修練內功、累積專業與廣結善緣的時期，韜光養晦，方能安然度過並為下一波大運蓄力。\n\n`;
        }
    } else {
        report += `您目前正處於兩個十年大運的「交運脫運期」。古書謂：「男怕交，女怕脫」，這個時期的氣場正處於新舊交替的動盪狀態，磁場極不穩定。\n`;
        report += `- 閣下可能會感到內心迷惘、生活重心轉移或面臨突如其來的環境變遷。此時凡事務必以穩健保守為第一要務，切忌作出衝動的重大決策（如閃婚、大額投資或貿然轉行）。建議靜下心來，多閱讀進修、沈澱自我，靜待新大運氣場的完全穩步到來。\n\n`;
    }

    report += `### 六、 近期流年大勢詳述\n\n`;
    let targetYears = currentMonth < 8 ? [currentYear] : [currentYear, currentYear + 1];

    let marriedFriction = '生活瑣事與價值觀差異';
    if (['比', '劫'].includes(spouseTenGod)) marriedFriction = '雙方主觀意識強、互不相讓';
    if (['傷', '食'].includes(spouseTenGod)) marriedFriction = '言語直接、心直口快';
    if (['殺'].includes(spouseTenGod)) marriedFriction = '彼此性格強勢、互爭主導權';
    if (['印', '卩'].includes(spouseTenGod)) marriedFriction = '內心世界難以交集、溝通不足';

    targetYears.forEach((targetYear) => {
        const tgIdx = (targetYear - 4) % 10;
        const tzIdx = (targetYear - 4) % 12;
        const tGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'][tgIdx >= 0 ? tgIdx : tgIdx + 10];
        const tZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][tzIdx >= 0 ? tzIdx : tzIdx + 12];
        const isYearGood = favWuxing.includes(WUXING_MAP[tGan]) || favWuxing.includes(WUXING_MAP[tZhi]);
        const tZhiWx = WUXING_MAP[tZhi];
        const isZhiFav = favWuxing.includes(tZhiWx);

        report += `**【${targetYear} ${tGan}${tZhi}流年詳述】**\n`;
        
        report += `**事業與財運：**\n`;
        if (wealthCount >= 3 && !isStrong) { 
            if (isYearGood) {
                report += `- ${targetYear}年天干地支引動喜神，幫扶日主，終於能扛起命中旺財！經歷過去低點，今年有望一雪前恥。過去積壓的投資或合夥項目將迎來豐收。若有合夥創業計畫，今年是極佳的啟動時機。但切記依舊要秉持「讓他人衝鋒、您居中協調」的作風，見好就收，方能讓財庫真正充實。\n`;
            } else {
                report += `- ${targetYear}年流年犯忌，原局「財多壓身」的壓力加劇。極易因貪念或聽信他人「必賺」的突發合作邀約而破大財。事業上易遇小人找碴或官非詞訟。**投資務必極度死守現金流**，或轉入長線保本資產。創業與副業絕對嚴禁擴張，寧可少賺不可大賠。\n`;
            }
        } else if (wealthCount >= 2 && isStrong) { 
            if (isYearGood) {
                report += `- ${targetYear}年天干地支引動喜神，加上閣下本身承載財富能力極強，簡直如虎添翼！事業上將有拓展版圖、開創獨立品牌或承接大型專案的絕佳機遇。投資作風可大膽佈局新興市場或擴張團隊，勇於進取必能獲利豐厚，創造事業高峰。\n`;
            } else {
                report += `- ${targetYear}年流年犯忌，反剋自身。雖然閣下本身理財能力極強，但此年大環境動盪，事業上易遇同行惡意競爭、小人找碴或官非詞訟。原本積極進取的投資與創業步伐必須暫時放緩，**切忌盲目抄底或過度舉債擴張**，保留現金實力以待來年。\n`;
            }
        } else { 
            if (isYearGood) {
                report += `- ${targetYear}年天干地支引動喜神，閣下的專業價值將被市場高度認可！經歷過去數月低點，此年有望一雪前恥。事業上適合考取高階證照、轉換至更高薪的跑道，或是藉由專業技術、顧問服務獲取豐厚報酬。在自身熟悉的領域或自我進修上的投資，將獲得最大的回報。\n`;
            } else {
                report += `- ${targetYear}年流年犯忌，剋掉命中喜神。此年較為動盪，易感懷才不遇或專業受人質疑。事業上不宜貿然跳槽或轉換不熟悉的領域，更要小心因越界投資自己不熟悉的金融產品而慘遭套牢。此年當以**「穩守本業、深耕專業」**為主，凡遇突如其來的邀約需保持高度警戒。\n`;
            }
        }

        report += `**姻緣運勢：**\n`;
        if (isYearGood) {
            report += `- **若閣下現時未婚：** 此年天干地支引動，感情上有機會認識不錯的對象。${hasPeach ? '命中帶桃花，異性緣尤佳，但仍需帶眼識人，避免霧水情緣。' : '宜多參與社交活動，擴展人脈，自然能遇見懂得欣賞您的理想伴侶。'}\n`;
            report += `- **若閣下已婚：** 此年感情生活大致平穩。但日常相處仍需注意因「${marriedFriction}」而生磨擦。建議多包容對方，尋找共同興趣，感情方能進一步昇華。\n`;
        } else {
            report += `- **若閣下現時未婚：** 此年感情運勢較為平淡或易生波折。${hasPeach ? '雖有假姻緣突至，但往往開心一陣子後便要收拾心情。' : '前度若有糾纏不清的意味，情深緣淺，勉強復合最終亦會再次分離，建議早日放手。'}應將重心放在事業與自我充實上。\n`;
            report += `- **若閣下已婚：** 此年流年氣場動盪，婚姻生活易受考驗。極易因「${marriedFriction}」爆發較大爭執。${hasPeach ? '特別需防範外來誘惑，必然不懷好意，切勿因一時意亂情迷而影響家宅安寧。' : '逢流年沖剋之時，需特別防範無謂爭執，學習柔軟溝通，退一步海闊天空。'}\n`;
        }

        report += `**疾厄與健康：**\n`;
        if (WUXING_MAP[tZhi] === rel.controlledBy) {
            report += `- 流年地支與原局呈現「刑、沖」之象。需特別注意腰椎病情、關節及金屬硬物所傷。驛馬動盪，外出需格外小心車禍碰撞。如有舊疾，宜在此年積極調理。\n`;
        } else {
            report += `- 健康運勢整體尚可，很多時候出現的小毛病並不會造成實質的影響，只需放鬆心情，問題自然迎刃而解。\n`;
        }

        let healthAdvice = '';
        if (isZhiFav) {
            if (tZhiWx === '木') healthAdvice = '流年木為喜神，氣場生扶，肝膽神經系統獲益。精神飽滿，決斷力佳。日常保養宜早睡早起，適當增加戶外活動以吸收自然生氣。';
            else if (tZhiWx === '火') healthAdvice = '流年火為喜神，氣場溫煦，心血管與血液循環佳。活力充沛，氣色紅潤。日常保養可多曬早晨太陽，保持適度有氧運動推動氣血。';
            else if (tZhiWx === '土') healthAdvice = '流年土為喜神，氣場培元，脾胃與消化系統運化良好。吸收力佳，體力充沛。日常保養維持定時定量，多食溫潤之物即可。';
            else if (tZhiWx === '金') healthAdvice = '流年金為喜神，氣場清肅，呼吸道及免疫排毒功能順暢。日常保養建議多做擴胸運動，保持環境通風，呼吸新鮮空氣。';
            else if (tZhiWx === '水') healthAdvice = '流年水為喜神，氣場潤澤，腎臟與泌尿生殖系統得到滋養。精力旺盛，神智清明。日常保養上適當補充水分，注重腰腎保暖即可。';
        } else {
            if (tZhiWx === '木') healthAdvice = '流年木為忌神，木氣過旺而為患。木主肝膽與神經系統，平時易有疲勞、偏頭痛或情緒鬱結的傾向。保養上宜在子時前入睡，保持心情舒暢，多做拉筋伸展，可適量飲用菊花茶平肝明目。';
            else if (tZhiWx === '火') healthAdvice = '流年火為忌神，火氣偏重而為患。火主心臟與血液循環，需留意心火過旺引起的心悸、失眠多夢或焦慮。保養上忌熬夜與情緒大起大落，務必多補充水分，可適量攝取蓮子心、苦瓜等清心降火之物。';
            else if (tZhiWx === '土') healthAdvice = '流年土為忌神，土氣過重而為患。土主脾胃與消化系統，容易出現消化不良、胃酸逆流、脹氣或身體沉重感。保養上飲食必須定時定量，忌暴飲暴食與生冷油膩，飯後宜散步幫助運化。';
            else if (tZhiWx === '金') healthAdvice = '流年金為忌神，金氣過旺而為患。金主肺與呼吸道，需防範過敏性鼻炎、乾咳、皮膚乾燥搔癢或大腸排毒不順。保養上注意環境通風與保濕，多做有氧擴胸運動，宜多食百合、水梨等潤肺化燥之物。';
            else if (tZhiWx === '水') healthAdvice = '流年水為忌神，水氣偏寒而為患。水主腎臟與泌尿生殖系統，易有疲憊、水腫、頻尿或手腳冰冷之狀。保養上極度需要注重保暖（尤其是腰部與足部），避免精力透支，睡前多泡腳，少吃過鹹食物。';
        }
        report += `- **流年五行養生：** ${healthAdvice}\n`;

        const mWxMap = { 1:'土', 2:'木', 3:'木', 4:'土', 5:'火', 6:'火', 7:'土', 8:'金', 9:'金', 10:'土', 11:'水', 12:'水' };
        const luckyMonths = [];
        const badMonths = [];
        
        for (let m = 1; m <= 12; m++) {
            if (favWuxing.includes(mWxMap[m])) {
                luckyMonths.push(m);
            } else {
                badMonths.push(m);
            }
        }
        
        const displayLucky = luckyMonths.slice(0, 3).join('、');
        const displayBad = badMonths.slice(-3).join('、'); 

        report += `\n**【關鍵流月預警】**\n`;
        report += `- **吉利月份（西曆 ${displayLucky} 月）：** 五行氣場生扶，運勢轉順，可見曙光。此時最有利於推動重要計畫，得貴人相助，生活重回正軌。\n`;
        report += `- **凶險月份（西曆 ${displayBad} 月）：** 流月氣場犯忌，準備多時的計劃易遭打擊。此期間切忌心浮氣躁，凡事保守為上，避免官非詞訟，小心小人找碴。\n\n`;
    }); 

    report += `### 七、 開運與吉方建議\n`;
    const lk = getLuckyInfo(primaryFav);
    report += `- **吉利方位：** 閣下之爵祿與開運位在**${lk.dir}**。\n`;
    report += `- **幸運色系：** 日常穿著宜以**${lk.color}**為主調。\n\n`;

    // 👑 專屬改名建議邏輯
    if (isAdmin) {
        report += `\n### 👑 專屬改名建議\n`;
        
        // 🌟 5. 根據是否手動設定，改變提示文字
        if (overrideWuxing && overrideWuxing.length > 0) {
            report += `根據您手動設定之需求，本次取名五行鎖定為**【${namingWuxing.join('、')}】**。以下為您推薦符合康熙字典五行、三才五格大吉，且蘊含古典詩詞之美的精選好名。\n`;
        } else {
            report += `根據八字喜忌，閣下之喜用神為**【${namingWuxing.join('、')}】**。以下為您推薦符合康熙字典五行、三才五格大吉，且蘊含古典詩詞之美的精選好名。\n`;
        }

        const nameStr = data.name || '未命名';
        const surname = nameStr.charAt(0);
        const KANGXI_SURNAMES = { 
            '李':{s:7,t:'仄'}, '王':{s:4,t:'平'}, '張':{s:11,t:'平'}, '劉':{s:15,t:'平'}, '陳':{s:16,t:'平'}, 
            '楊':{s:13,t:'平'}, '黃':{s:12,t:'平'}, '趙':{s:14,t:'仄'}, '周':{s:8,t:'平'}, '吳':{s:7,t:'平'}, 
            '徐':{s:10,t:'平'}, '孫':{s:10,t:'平'}, '朱':{s:6,t:'平'}, '馬':{s:10,t:'仄'}, '胡':{s:11,t:'平'}, 
            '郭':{s:15,t:'仄'}, '林':{s:8,t:'平'}, '何':{s:7,t:'平'}, '高':{s:10,t:'平'}, '梁':{s:11,t:'平'}, 
            '鄭':{s:19,t:'仄'}, '羅':{s:20,t:'平'}, '宋':{s:7,t:'仄'}, '謝':{s:17,t:'仄'}, '唐':{s:10,t:'平'},
            '韓':{s:17,t:'平'}, '曹':{s:11,t:'平'}, '許':{s:11,t:'仄'}, '鄧':{s:19,t:'仄'}, '蕭':{s:18,t:'平'},
            '馮':{s:12,t:'平'}, '曾':{s:12,t:'平'}, '蔡':{s:17,t:'仄'}, '彭':{s:12,t:'平'}, '潘':{s:15,t:'平'},
            '袁':{s:10,t:'平'}, '于':{s:3,t:'平'}, '董':{s:15,t:'仄'}, '余':{s:7,t:'平'}, '蘇':{s:22,t:'平'},
            '葉':{s:15,t:'仄'}, '呂':{s:7,t:'仄'}, '魏':{s:18,t:'仄'}, '蔣':{s:17,t:'仄'}, '田':{s:5,t:'平'},
            '杜':{s:7,t:'仄'}, '丁':{s:2,t:'平'}, '沈':{s:8,t:'仄'}, '姜':{s:9,t:'平'}, '范':{s:11,t:'仄'},
            '江':{s:7,t:'平'}, '傅':{s:12,t:'仄'}, '鍾':{s:17,t:'平'}, '盧':{s:16,t:'平'}, '汪':{s:8,t:'平'},
            '戴':{s:18,t:'仄'}, '崔':{s:11,t:'平'}, '任':{s:6,t:'仄'}, '陸':{s:16,t:'仄'}, '廖':{s:14,t:'仄'},
            '姚':{s:9,t:'平'}, '方':{s:4,t:'平'}, '熊':{s:14,t:'平'}, '史':{s:5,t:'仄'}, '顧':{s:21,t:'仄'},
            '侯':{s:9,t:'平'}, '邵':{s:12,t:'仄'}, '孟':{s:8,t:'仄'}, '龍':{s:16,t:'平'}, '萬':{s:15,t:'仄'},
            '段':{s:9,t:'仄'}, '雷':{s:13,t:'平'}, '錢':{s:16,t:'平'}, '湯':{s:13,t:'平'}, '尹':{s:4,t:'仄'},
            '易':{s:8,t:'仄'}, '黎':{s:15,t:'平'}, '賴':{s:16,t:'仄'}, '莊':{s:13,t:'平'} 
        };
        
        let surInfo = KANGXI_SURNAMES[surname] || {s:10, t:'平'};
        let surnameStrokes = surInfo.s;
        let surnameTone = surInfo.t;

        report += `- **姓氏分析：** ${surname} (康熙筆畫：${surnameStrokes}畫 | 聲調：${surnameTone})\n`;

        const parseChars = (arr) => arr.map(str => {
            const [c, s, t, p] = str.split('|');
            return { c, s: Number(s), t, p };
        });

        const CHARS = {
            '金': parseChars([
                // 4畫
                '仁|4|平|仁者安仁豈偶然 (王安石《伯夷》)', '戈|4|平|秋高風怒擁雕戈 (陸游《秋聲》)',
                // 5畫
                '仙|5|平|仙人撫我頂 (李白《經亂離後天恩流夜郎》)', '史|5|仄|青史憑誰定是非 (陸游《讀史》)', '正|5|仄|正入萬山圈子裡 (楊萬里《過松源晨炊漆公店》)',
                // 6畫
                '舟|6|平|孤舟蓑笠翁 (柳宗元《江雪》)', '存|6|平|海內存知己 (王勃《送杜少府之任蜀州》)', '臣|6|平|老臣病且衰 (杜甫《病後遇王倚飲贈歌》)',
                // 7畫
                '辛|7|平|辛苦遭逢起一經 (文天祥《過零丁洋》)', '吹|7|平|春風吹又生 (白居易《賦得古原草送別》)', '判|7|仄|判與東風作勝遊 (陸游《春遊》)',
                // 8畫
                '金|8|平|金樽清酒鬥十千 (李白《行路難》)', '孤|8|平|孤帆遠影碧空盡 (李白《黃鶴樓送孟浩然之廣陵》)', '尚|8|仄|尚思為國戍輪臺 (陸游《十一月四日風雨大作》)',
                // 9畫
                '秋|9|平|萬里悲秋常作客 (杜甫《登高》)', '春|9|平|春色滿園關不住 (葉紹翁《遊園不值》)', '昨|9|仄|昨夜星辰昨夜風 (李商隱《無題》)',
                // 10畫
                '剛|10|平|剛被太陽收拾去 (蘇軾《退之詩》)', '乘|10|平|乘風破浪會有時 (李白《行路難》)', '宵|10|平|春宵一刻值千金 (蘇軾《春宵》)',
                // 11畫
                '商|11|平|商女不知亡國恨 (杜牧《泊秦淮》)', '晨|11|平|清晨入古寺 (常建《題破山寺後禪院》)', '釣|11|仄|閒來垂釣碧溪上 (李白《行路難》)',
                // 12畫
                '鈞|12|平|鈞天無人帝悲傷 (韓愈《調張籍》)', '尊|12|平|一尊還酹江月 (蘇軾《念奴嬌·赤壁懷古》)', '斯|12|平|逝者如斯夫 (孔子《論語》)',
                // 13畫
                '詩|13|平|詩家清景在新春 (白居易《新春江次》)', '誠|13|平|誠知此恨人人有 (晏殊《浣溪沙》)', '歲|13|仄|歲寒然後知松柏 (孔子《論語》)',
                // 14畫
                '瑞|14|仄|瑞腦消金獸 (李清照《醉花陰》)', '銅|14|平|銅雀春深鎖二喬 (杜牧《赤壁》)', '銀|14|平|銀燭秋光冷畫屏 (杜牧《秋夕》)',
                // 15畫
                '劍|15|仄|劍外忽傳收薊北 (杜甫《聞官軍收河南河北》)', '賞|15|仄|奇文共欣賞 (陶淵明《移居》)', '節|15|仄|清明時節雨紛紛 (杜牧《清明》)',
                // 16畫
                '錦|16|仄|錦瑟無端五十弦 (李商隱《錦瑟》)', '錯|16|仄|錯把杭州作汴州 (林升《題臨安邸》)', '錢|16|平|青錢買野竹 (杜甫《絕句漫興》)',
                // 17畫
                '鍾|17|平|鍾山只隔數重山 (王安石《泊船瓜洲》)', '霜|17|平|月落烏啼霜滿天 (張繼《楓橋夜泊》)', '聲|17|平|此處無聲勝有聲 (白居易《琵琶行》)',
                // 18畫
                '鎖|18|仄|鎖向金籠聽客啼 (歐陽修《畫眉鳥》)', '雙|18|平|雙袖龍鍾淚不乾 (岑參《逢入京使》)', '遲|18|平|春日遲遲 (《詩經·七月》)',
                // 19畫
                '鏡|19|仄|鏡中衰鬢已先斑 (陸游《秋興》)', '辭|19|平|朝辭白帝彩雲間 (李白《早發白帝城》)', '識|19|仄|相逢何必曾相識 (白居易《琵琶行》)',
                // 20畫
                '鐘|20|平|夜半鐘聲到客船 (張繼《楓橋夜泊》)', '鐵|20|仄|鐵馬冰河入夢來 (陸游《十一月四日風雨大作》)', '寶|20|仄|寶馬雕車香滿路 (辛棄疾《青玉案·元夕》)'
            ]),
            '水': parseChars([
                // 4畫
                '水|4|仄|春江水暖鴨先知 (蘇軾《惠崇春江晚景》)', '化|4|仄|化作春泥更護花 (龔自珍《己亥雜詩》)', '夫|4|平|逝者如斯夫 (孔子《論語》)',
                // 5畫
                '永|5|仄|永結無情遊 (李白《月下獨酌》)', '弘|5|平|人能弘道 (孔子《論語》)', '白|5|仄|白日依山盡 (王之渙《登鸛雀樓》)',
                // 6畫
                '冰|6|平|一片冰心在玉壺 (王昌齡《芙蓉樓送辛漸》)', '帆|6|平|孤帆遠影碧空盡 (李白《黃鶴樓送孟浩然之廣陵》)', '汗|6|仄|汗滴禾下土 (李紳《憫農》)',
                // 7畫
                '江|7|平|春江潮水連海平 (張若虛《春江花月夜》)', '池|7|平|池面冰初解 (白居易《春風》)', '步|7|仄|散步詠涼天 (韋應物《秋夜寄邱員外》)',
                // 8畫
                '沉|8|平|沉舟側畔千帆過 (劉禹錫《酬樂天揚州初逢席上見贈》)', '法|8|仄|道法自然 (老子《道德經》)', '岸|8|仄|兩岸猿聲啼不住 (李白《早發白帝城》)',
                // 9畫
                '波|9|平|波撼岳陽城 (孟浩然《望洞庭湖贈張丞相》)', '泉|9|平|清泉石上流 (王維《山居秋暝》)', '泓|9|平|泓泓湛清波 (白居易《題新池》)',
                // 10畫
                '流|10|平|飛流直下三千尺 (李白《望廬山瀑布》)', '洛|10|仄|洛陽親友如相問 (王昌齡《芙蓉樓送辛漸》)', '洲|10|平|關關雎鳩在河之洲 (《詩經·關雎》)',
                // 11畫
                '海|11|仄|海內存知己 (王勃《送杜少府之任蜀州》)', '浩|11|仄|浩蕩離愁白日斜 (龔自珍《己亥雜詩》)', '雪|11|仄|雪卻輸梅一段香 (盧梅坡《雪梅》)',
                // 12畫
                '清|12|平|清泉石上流 (王維《山居秋暝》)', '深|12|平|雲深不知處 (賈島《尋隱者不遇》)', '涵|12|平|涵虛混太清 (孟浩然《望洞庭湖贈張丞相》)',
                // 13畫
                '湖|13|平|湖光秋月兩相和 (劉禹錫《望洞庭》)', '湘|13|平|湘水無情弔屈平 (劉長卿《長沙過賈誼宅》)', '湛|13|仄|湛湛長江去 (杜甫《水檻遣心》)',
                // 14畫
                '源|14|平|為有源頭活水來 (朱熹《觀書有感》)', '溪|14|平|溪頭臥剝蓮蓬 (辛棄疾《清平樂·村居》)', '溫|14|平|溫故而知新 (孔子《論語》)',
                // 15畫
                '滿|15|仄|滿城盡帶黃金甲 (黃巢《不第後賦菊》)', '滴|15|仄|汗滴禾下土 (李紳《憫農》)', '漫|15|仄|漫卷詩書喜欲狂 (杜甫《聞官軍收河南河北》)',
                // 16畫
                '潤|16|仄|潤物細無聲 (杜甫《春夜喜雨》)', '潮|16|平|春江潮水連海平 (張若虛《春江花月夜》)', '澄|16|平|澄江淨如練 (謝朓《晚登三山還望京邑》)',
                // 17畫
                '澤|17|平|氣蒸雲夢澤 (孟浩然《望洞庭湖贈張丞相》)', '濃|17|平|濃睡不消殘酒 (李清照《如夢令》)', '微|17|平|微雨燕雙飛 (晏幾道《臨江仙》)',
                // 18畫
                '濤|18|平|怒濤卷霜雪 (柳永《望海潮》)', '瀑|18|仄|飛流直下三千尺 (李白《望廬山瀑布》)', '濟|18|仄|直掛雲帆濟滄海 (李白《行路難》)',
                // 19畫
                '霧|19|仄|霧失樓臺月迷津 (秦觀《踏莎行》)', '薄|19|仄|日薄西山 (李密《陳情表》)', '瀟|19|平|風雨瀟瀟 (《詩經·鄭風》)',
                // 20畫
                '瀛|20|平|瀛洲採滿袖 (李白《夢遊天姥吟留別》)', '瀚|20|仄|瀚海闌干百丈冰 (岑參《白雪歌送武判官歸京》)', '露|20|仄|露從今夜白 (杜甫《月夜憶舍弟》)'
            ]),
            '木': parseChars([
                // 4畫
                '木|4|仄|草木本無意 (李白《贈孟浩然》)', '月|4|仄|明月幾時有 (蘇軾《水調歌頭》)', '及|4|仄|不及林間自在啼 (王維《鳥鳴澗》)',
                // 5畫
                '本|5|仄|本是同根生 (曹植《七步詩》)', '未|5|仄|出師未捷身先死 (杜甫《蜀相》)', '可|5|仄|可憐身上衣正單 (白居易《賣炭翁》)',
                // 6畫
                '竹|6|仄|竹喧歸浣女 (王維《山居秋暝》)', '朵|6|仄|千朵萬朵壓枝低 (杜甫《江畔獨步尋花》)', '朱|6|平|朱門酒肉臭 (杜甫《自京赴奉先縣詠懷五百字》)',
                // 7畫
                '杏|7|仄|牧童遙指杏花村 (杜牧《清明》)', '杖|7|仄|竹杖芒鞋輕勝馬 (蘇軾《定風波》)', '村|7|平|柳暗花明又一村 (陸游《遊山西村》)',
                // 8畫
                '林|8|平|停車坐愛楓林晚 (杜牧《山行》)', '枝|8|平|紅杏枝頭春意鬧 (宋祁《玉樓春》)', '松|8|平|明月松間照 (王維《山居秋暝》)',
                // 9畫
                '柳|9|仄|柳暗花明又一村 (陸游《遊山西村》)', '柏|9|仄|歲寒然後知松柏 (孔子《論語》)', '相|9|平|相看兩不厭 (李白《獨坐敬亭山》)',
                // 10畫
                '桃|10|平|人面桃花相映紅 (崔護《題都城南莊》)', '桂|10|仄|桂子月中落 (宋之問《靈隱寺》)', '桐|10|平|梧桐更兼細雨 (李清照《聲聲慢》)',
                // 11畫
                '梅|11|平|梅子金黃杏子肥 (范成大《四時田園雜興》)', '梧|11|平|梧桐相待老 (孟郊《烈女操》)', '笛|11|仄|誰家玉笛暗飛聲 (李白《春夜洛城聞笛》)',
                // 12畫
                '棋|12|平|閒敲棋子落燈花 (趙師秀《約客》)', '植|12|仄|植杖而耘 (陶淵明《歸去來兮辭》)', '棟|12|仄|畫棟朝飛南浦雲 (王勃《滕王閣詩》)',
                // 13畫
                '楓|13|平|江楓漁火對愁眠 (張繼《楓橋夜泊》)', '楚|13|仄|楚天千里清秋 (辛棄疾《水龍吟》)', '楊|13|平|楊柳岸曉風殘月 (柳永《雨霖鈴》)',
                // 14畫
                '榮|14|平|草木秋死春復榮 (李白《將進酒》)', '綠|14|仄|春來江水綠如藍 (白居易《憶江南》)', '華|14|平|昔日繁華子 (王維《洛陽女兒行》)',
                // 15畫
                '樓|15|平|更上一層樓 (王之渙《登鸛雀樓》)', '樂|15|仄|長樂鐘聲花外盡 (韓翃《寒食》)', '標|15|平|標格誰能似 (杜甫《孤雁》)',
                // 16畫
                '樹|16|仄|樹樹皆秋色 (王績《野望》)', '橋|16|平|二十四橋明月夜 (杜牧《寄揚州韓綽判官》)', '橘|16|仄|江南有丹橘 (張九齡《感遇》)',
                // 17畫
                '檀|17|平|檀郎故隱傳呼裡 (李商隱《無題》)', '蓮|17|平|接天蓮葉無窮碧 (楊萬里《曉出淨慈寺送林子方》)', '蔚|17|仄|林木蔚然 (歐陽修《醉翁亭記》)',
                // 18畫
                '叢|18|平|叢菊兩開他日淚 (杜甫《秋興八首》)', '蕊|18|仄|花蕊知誰歇 (杜甫《客至》)', '歸|18|平|視死忽如歸 (曹植《白馬篇》)',
                // 19畫
                '攀|19|平|敢將空谷攀流俗 (王安石《孤桐》)', '簾|19|平|捲起珠簾總不如 (杜牧《贈別》)', '薪|19|平|薪盡火傳 (莊子《養生主》)',
                // 20畫
                '藏|20|平|藏在深閨人未識 (白居易《長恨歌》)', '覺|20|仄|春眠不覺曉 (孟浩然《春曉》)', '藍|20|平|春來江水綠如藍 (白居易《憶江南》)'
            ]),
            '火': parseChars([
                // 4畫
                '日|4|仄|白日依山盡 (王之渙《登鸛雀樓》)', '斗|4|仄|金樽清酒鬥十千 (李白《行路難》)', '天|4|平|孤帆遠影碧空盡 (李白《黃鶴樓送孟浩然之廣陵》)',
                // 5畫
                '冬|5|平|冬至陽生春又來 (杜甫《小至》)', '旦|5|仄|日月光華旦 (《詩經·卿雲歌》)', '代|5|仄|江山代有才人出 (趙翼《論詩》)',
                // 6畫
                '光|6|平|床前明月光 (李白《靜夜思》)', '同|6|平|本是同根生 (曹植《七步詩》)', '老|6|仄|少小離家老大回 (賀知章《回鄉偶書》)',
                // 7畫
                '志|7|仄|壯志飢餐胡虜肉 (岳飛《滿江紅》)', '彤|7|平|彤管有煒 (《詩經·靜女》)', '男|7|平|男兒何不帶吳鉤 (李賀《南園十三首》)',
                // 8畫
                '明|8|平|明月松間照 (王維《山居秋暝》)', '知|8|平|春江水暖鴨先知 (蘇軾《惠崇春江晚景》)', '易|8|仄|風蕭蕭兮易水寒 (《史記·刺客列傳》)',
                // 9畫
                '星|9|平|星垂平野闊 (杜甫《旅夜書懷》)', '南|9|平|悠然見南山 (陶淵明《飲酒》)', '映|9|仄|映日荷花別樣紅 (楊萬里《曉出淨慈寺送林子方》)',
                // 10畫
                '夏|10|仄|夏木陰陰正可人 (秦觀《三月晦日偶題》)', '晃|10|仄|明月晃明珠 (李白《贈別》)', '笑|10|仄|笑問客從何處來 (賀知章《回鄉偶書》)',
                // 11畫
                '烽|11|平|烽火連三月 (杜甫《春望》)', '將|11|平|將進酒 (李白《將進酒》)', '晨|11|平|清晨入古寺 (常建《題破山寺後禪院》)',
                // 12畫
                '晴|12|平|晴空一鶴排雲上 (劉禹錫《秋詞》)', '尋|12|平|尋尋覓覓 (李清照《聲聲慢》)', '智|12|仄|智者樂水 (孔子《論語》)',
                // 13畫
                '暖|13|仄|春江水暖鴨先知 (蘇軾《惠崇春江晚景》)', '照|13|仄|留取丹心照汗青 (文天祥《過零丁洋》)', '煥|13|仄|文章煥乎 (孔子《論語》)',
                // 14畫
                '熙|14|平|雅俗熙熙物態妍 (柳永《望海潮》)', '寧|14|平|寧靜致遠 (諸葛亮《誡子書》)', '對|14|仄|對影成三人 (李白《月下獨酌》)',
                // 15畫
                '輝|15|平|蓬蓽生光輝 (王勃《滕王閣序》)', '熟|15|仄|熟讀深思子自知 (蘇軾《送安惇落第詩》)', '德|15|仄|惟吾德馨 (劉禹錫《陋室銘》)',
                // 16畫
                '燈|16|平|孤燈聞楚角 (李商隱《晚晴》)', '燕|16|仄|舊時王謝堂前燕 (劉禹錫《烏衣巷》)', '曉|16|仄|春眠不覺曉 (孟浩然《春曉》)',
                // 17畫
                '陽|17|平|夕陽無限好 (李商隱《登樂遊原》)', '臨|17|平|臨行密密縫 (孟郊《遊子吟》)', '燦|17|仄|星漢燦爛 (曹操《觀滄海》)',
                // 18畫
                '曜|18|仄|雙曜以之明 (李白《明堂賦》)', '豐|18|平|豐年留客足雞豚 (陸游《遊山西村》)', '題|18|平|金榜題名時 (汪洙《神童詩》)',
                // 19畫
                '麗|19|仄|麗宇芳林對此生 (李商隱《無題》)', '爆|19|仄|爆竹聲中一歲除 (王安石《元日》)', '辭|19|平|朝辭白帝彩雲間 (李白《早發白帝城》)',
                // 20畫
                '耀|20|仄|光耀不可測 (韓愈《石鼓歌》)', '爐|20|平|日照香爐生紫煙 (李白《望廬山瀑布》)', '騰|20|平|潛龍騰淵 (梁啟超《少年中國說》)'
            ]),
            '土': parseChars([
                // 4畫
                '山|4|平|空山新雨後 (王維《山居秋暝》)', '尹|4|仄|尹氏之尊 (《詩經·節南山》)', '友|4|仄|洛陽親友如相問 (王昌齡《芙蓉樓送辛漸》)',
                // 5畫
                '石|5|仄|清泉石上流 (王維《山居秋暝》)', '央|5|平|宛在水中央 (《詩經·蒹葭》)', '出|5|仄|出師未捷身先死 (杜甫《蜀相》)',
                // 6畫
                '宇|6|仄|宇宙一何悠 (陶淵明《飲酒》)', '地|6|仄|疑是地上霜 (李白《靜夜思》)', '圭|6|平|白圭之玷 (《詩經·大雅》)',
                // 7畫
                '辰|7|平|昨夜星辰昨夜風 (李商隱《無題》)', '見|7|仄|悠然見南山 (陶淵明《飲酒》)', '里|7|仄|萬里悲秋常作客 (杜甫《登高》)',
                // 8畫
                '坤|8|平|乾坤日夜浮 (杜甫《登岳陽樓》)', '岩|8|平|千岩萬壑不辭勞 (于謙《石灰吟》)', '坦|8|仄|君子坦蕩蕩 (孔子《論語》)',
                // 9畫
                '幽|9|平|曲徑通幽處 (常建《題破山寺後禪院》)', '勇|9|仄|勇者不懼 (孔子《論語》)', '城|9|平|一片孤城萬仞山 (王之渙《涼州詞》)',
                // 10畫
                '峰|10|平|橫看成嶺側成峰 (蘇軾《題西林壁》)', '容|10|平|有容乃大 (林則徐《對聯》)', '軒|10|平|軒窗一何敞 (王維《新晴野望》)',
                // 11畫
                '堂|11|平|高堂明鏡悲白髮 (李白《將進酒》)', '堅|11|平|千磨萬擊還堅勁 (鄭燮《竹石》)', '野|11|仄|星垂平野闊 (杜甫《旅夜書懷》)',
                // 12畫
                '嵐|12|平|晴嵐浮玉壘 (杜甫《江頭五詠》)', '畫|12|仄|畫圖省識春風面 (杜甫《詠懷古跡》)', '越|12|仄|越女採蓮秋水畔 (李白《子夜吳歌》)',
                // 13畫
                '園|13|平|春色滿園關不住 (葉紹翁《遊園不值》)', '圓|13|平|長河落日圓 (王維《使至塞上》)', '意|13|仄|春風得意馬蹄疾 (孟郊《登科後》)',
                // 14畫
                '碧|14|仄|碧水東流至此迴 (李白《望天門山》)', '塵|14|平|一騎紅塵妃子笑 (杜牧《過華清宮》)', '碩|14|仄|碩鼠碩鼠 (《詩經·碩鼠》)',
                // 15畫
                '影|15|仄|孤帆遠影碧空盡 (李白《黃鶴樓送孟浩然之廣陵》)', '層|15|平|更上一層樓 (王之渙《登鸛雀樓》)', '踏|15|仄|踏破鐵鞋無覓處 (夏元鼎《絕句》)',
                // 16畫
                '衡|16|平|衡陽雁去無留意 (范仲淹《漁家傲》)', '壁|16|仄|半壁見海日 (李白《夢遊天姥吟留別》)', '歷|16|仄|晴川歷歷漢陽樹 (崔顥《黃鶴樓》)',
                // 17畫
                '遠|17|仄|孤帆遠影碧空盡 (李白《黃鶴樓送孟浩然之廣陵》)', '嶺|17|仄|橫看成嶺側成峰 (蘇軾《題西林壁》)', '應|17|仄|應是良辰好景 (柳永《雨霖鈴》)',
                // 18畫
                '壘|18|仄|故壘西邊 (蘇軾《念奴嬌·赤壁懷古》)',
                // 19畫
                '穩|19|仄|穩泛平波任醉眠 (陸游《鷓鴣天》)', '攀|19|平|敢將空谷攀流俗 (王安石《孤桐》)', '識|19|仄|相逢何必曾相識 (白居易《琵琶行》)',
                // 20畫
                '巖|20|平|千巖萬轉路不定 (李白《夢遊天姥吟留別》)', '寶|20|仄|寶馬雕車香滿路 (辛棄疾《青玉案·元夕》)', '壤|20|仄|泰山不讓土壤 (李斯《諫逐客書》)'
            ])
        };

        const AUSPICIOUS = Object.keys(EIGHTY_ONE_ATTR)
            .filter(k => EIGHTY_ONE_ATTR[k].includes('(吉)') || EIGHTY_ONE_ATTR[k].includes('(大吉)'))
            .map(Number);
        const ALLOWED_TONES = ['平平仄', '平仄平', '仄仄平', '仄平仄', '平平平', '仄平平', '平仄仄'];

        let recommendations = [];
        let pool = [];
        namingWuxing.forEach(wx => { if (CHARS[wx]) pool = pool.concat(CHARS[wx].map(item => ({...item, wx}))); });
        for (let i = 0; i < pool.length; i++) {
            for (let j = 0; j < pool.length; j++) {
                if (i === j) continue; 
                const c1 = pool[i];
                const c2 = pool[j];
                
                // 1. 檢查三才五格 (新增外格計算)
                const renGe = surnameStrokes + c1.s;         // 人格 = 姓氏 + 名字1
                const diGe = c1.s + c2.s;                    // 地格 = 名字1 + 名字2
                const zongGe = surnameStrokes + c1.s + c2.s; // 總格 = 姓氏 + 名字1 + 名字2
                const waiGe = c2.s + 1;                      // 外格 = 名字2 + 1 (單姓雙名規則)
                
                // 2. 檢查平仄音律
                const tonePattern = `${surnameTone}${c1.t}${c2.t}`;

                // 3. 嚴格要求：人格、地格、總格、外格【全部】都必須在吉/大吉的名單內
                if (AUSPICIOUS.includes(renGe) && 
                    AUSPICIOUS.includes(diGe) && 
                    AUSPICIOUS.includes(zongGe) && 
                    AUSPICIOUS.includes(waiGe)) {
                    
                    if (ALLOWED_TONES.includes(tonePattern)) {
                        recommendations.push({
                            name1: c1.c, name2: c2.c, s1: c1.s, s2: c2.s,
                            renGe, diGe, zongGe, waiGe, tonePattern, p1: c1.p, p2: c2.p
                        });
                    }
                }
            }
        }

        // 🌟 嚴格去重邏輯：確保抽出的名字中單字絕不重複
        if (recommendations.length > 0) {
            recommendations.sort(() => 0.5 - Math.random()); // 洗牌
            
            const top = [];
            const usedChars = new Set(); 
            
            for (let k = 0; k < recommendations.length; k++) {
                const rec = recommendations[k];
                if (!usedChars.has(rec.name1) && !usedChars.has(rec.name2) && rec.name1 !== rec.name2) {
                    top.push(rec);
                    usedChars.add(rec.name1); 
                    usedChars.add(rec.name2); 
                }
                if (top.length === 10) break; // 選滿 10 組
            }
            
            report += `\n- **【精選大吉詩意組合】** (符合喜神、81數理，過濾不雅音律，且單字完全不重複)：\n`;
            
            top.forEach(rec => {
                // 使用分隔符 | 傳遞數據給組件解析
                report += `[NAMECARD]:${surname}|${rec.name1}|${rec.name2}|${surnameStrokes}|${rec.s1}|${rec.s2}|${rec.tonePattern}|${rec.p1}|${rec.p2}\n`;
            });
            report += `\n*註：以上筆畫以康熙字典為準。僅提供如「平平仄、仄平平」等黃金韻律組合。*\n\n`;
        } else {
            report += `\n- 根據您的姓氏，在目前的精選字庫中暫無完美匹配雙方五行與三才五格大吉的組合。建議由專業師傅依據您的完整八字與家族字輩進行人工造字。\n\n`;
        }
    }
    
    report += `本命書由【許甯博風水命理館】監修編撰。版權所有，翻印必究。\n\n`;
    report += `💡 **【專屬親算升級優惠】**\n若需針對合婚、擇日或投資決策尋找師傅親自批算，本次解鎖費用可於一年內預約服務時全額抵銷。\n\n`;
    report += `馬上預約：請點擊畫面最下方導航列的 **「預約」** ，即可查看師傅最新空檔，安排專屬的一對一親算服務。`;

    return report;
  };

  const handleUnlock = () => {
      setIsAnalyzing(true);
      setTimeout(() => {
          try {
              setIsPaid(true);
              setAnalysisResult(generateLongReport(false));
          } catch (e) { console.error(e); alert("錯誤：" + e.message); } 
          finally { setIsAnalyzing(false); }
      }, 500); 
  };

  const handlePasswordUnlock = (e) => {
      e.stopPropagation(); 
      const password = prompt("請輸入後台授權解鎖密碼：");
      if (!password) return;
      if (password === "mrk888") {
          setIsAnalyzing(true);
          setTimeout(() => {
              try {
                  setIsPaid(true);
                  setIsAdminUnlocked(true); // 🌟 2. 標記為管理員解鎖
                  setAnalysisResult(generateLongReport(true)); 
                  alert("🔓 已為您手動開啟命書與【專屬改名建議】！");
              } catch (e) { console.error(e); } 
              finally { setIsAnalyzing(false); }
          }, 500);
      } else { alert("❌ 密碼錯誤，無法解鎖。"); }
  };

  const uiDate = new Date();
  const uiYear = uiDate.getFullYear();
  const uiMonth = uiDate.getMonth(); 
  const uiFortuneText = uiMonth < 8 
      ? `預測 ${uiYear}年流年吉凶大勢` 
      : `超前部署！一次解鎖 ${uiYear}年歲末運勢與 ${uiYear + 1}年流年大勢`;

  return (
    <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.teal}`, paddingLeft: '8px', fontSize: '15px' }}>
            千字深度批命書
          </h4>
          {!isPaid && (
            <Lock 
              size={14} 
              color={THEME.gray} 
              style={{ cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s' }} 
              onClick={handlePasswordUnlock}
              title="後台密碼解鎖"
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            />
          )}
        </div>
        {isPaid && <span style={{ fontSize: '11px', color: '#fff', backgroundColor: THEME.green || '#52c41a', padding: '2px 6px', borderRadius: '4px' }}>已解鎖</span>}
      </div>

      {isAnalyzing ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <RefreshCw size={36} color={THEME.teal} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto' }} />
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.teal, marginTop: '16px' }}>正在融合古文與大運運勢...</div>
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
              
              if (line.startsWith('[NAMECARD]:')) {
                  const dataStr = line.substring(11);
                  const [sur, n1, n2, s0, s1, s2, tone, p1, p2] = dataStr.split('|');
                  return <NameCardLayout 
                            key={i} 
                            surname={sur} name1={n1} name2={n2} 
                            s0={Number(s0)} s1={Number(s1)} s2={Number(s2)} 
                            tonePattern={tone} p1={p1} p2={p2}
                         />;
              }

              if (line.startsWith('**▶')) return <div key={i} style={{ fontWeight: 'bold', color: THEME.blue, marginTop: '16px', marginBottom: '8px', fontSize: '16px' }}>{line.replace(/\*\*/g, '')}</div>;
              if (line.startsWith('**【') && line.endsWith('】**')) return <div key={i} style={{ fontWeight: 'bold', color: THEME.teal, marginTop: '20px', marginBottom: '10px', fontSize: '17px', borderBottom: `2px dashed ${THEME.teal}`, paddingBottom: '4px' }}>{line.replace(/\*\*/g, '')}</div>;
              if (line.startsWith('- ')) {
                  const content = line.substring(2);
                  const parts = content.split('**');
                  if (parts.length > 1) {
                      return <div key={i} style={{ marginLeft: '12px', marginBottom: '8px' }}>• {parts.map((part, idx) => idx % 2 === 1 ? <b key={idx} style={{color: '#333'}}>{part}</b> : part)}</div>;
                  }
                  return <div key={i} style={{ marginLeft: '12px', marginBottom: '8px' }}>• {content}</div>;
              }
              const boldParts = line.split('**');
              if (boldParts.length > 1) {
                  return <p key={i} style={{ marginBottom: '14px' }}>
                    {boldParts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: THEME.red || '#d9363e' }}>{part}</strong> : part)}
                  </p>;
              }
              return <p key={i} style={{ marginBottom: '14px' }}>{line}</p>;
            })}
          </div>
          {/* 🌟 7. 新增：手動設定五行區塊 (僅在管理員解鎖模式下顯示) */}
          {isAdminUnlocked && (
             <div style={{ marginTop: '16px', padding: '16px', backgroundColor: THEME.white, borderRadius: '8px', border: `1px dashed ${THEME.blue}` }}>
                 <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black, marginBottom: '8px' }}>⚙️ 手動設定命名五行</div>
                 <div style={{ fontSize: '13px', color: THEME.gray, marginBottom: '12px' }}>
                     若不滿意系統自動判斷的喜用神，可勾選您需要的五行並重新產生名字：
                 </div>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                     {['木', '火', '土', '金', '水'].map(wx => (
                         <label key={wx} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px' }}>
                             <input 
                                 type="checkbox" 
                                 checked={customWuxing.includes(wx)} 
                                 onChange={(e) => {
                                     let newWx = [...customWuxing];
                                     if (e.target.checked) newWx.push(wx);
                                     else newWx = newWx.filter(w => w !== wx);
                                     setCustomWuxing(newWx);
                                 }}
                                 style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                             /> 
                             {wx}
                         </label>
                     ))}
                 </div>
                 <button 
                     onClick={() => setAnalysisResult(generateLongReport(true, customWuxing))}
                     style={{ padding: '10px 16px', backgroundColor: THEME.blue, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
                 >
                     重新生成改名建議
                 </button>
             </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '10px 0' }}>
            <div style={{ backgroundColor: '#fafafa', border: '1px dashed #ccc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>解鎖千字深度命書，您將獲得：</div>
                <ul style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
                <li>引述古文印證，剖析日主核心靈魂</li>
                <li>透視六親宮位，精確判斷原局「用神」與天賦事業</li>
                <li>深度財富格局分析，量身打造 **投資避險指南**</li>
                <li>結合《黃帝內經》，揭示身體臟腑弱點與養生宜忌</li>
                <li>**獨家剖析當前【十年大運】，指引人生黃金期與潛藏危機**</li>
                <li>{uiFortuneText}（含事業、姻緣、疾厄分類及流月預警）</li>
                <li>**只要在付費後一年內預約任何玄學項目，本次解鎖的費用即可在完成服務後全額抵銷**</li>
                </ul>
            </div>
            
            <button 
                onClick={handleUnlock} 
                style={{ 
                    width: '100%', padding: '12px', backgroundColor: THEME.black, color: '#FFD700', 
                    border: 'none', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' 
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '16px' }}>
                    <Unlock size={18} /> 單次付費$198解鎖
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>
                    (支援信用卡 / Apple Pay / Google Pay等)
                </div>
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
    const isSuccess = params.get('success') === 'true';
    const isCanceled = params.get('canceled') === 'true';
    const bookingId = params.get('booking_id');

    // 🌟 把它包在一個大函數裡，讓讀取和存檔「乖乖排隊」，解決覆蓋問題
    const initializeApp = async () => {
        let currentBookmarks = [];
        try {
            // 先讀取最新的所有紀錄
            const { value: savedBk } = await Preferences.get({ key: 'bazi_bookmarks' });
            if (savedBk) currentBookmarks = JSON.parse(savedBk);

            const { value: savedRule } = await Preferences.get({ key: 'bazi_zi_rule' });
            if (savedRule) setZiHourRule(savedRule);

            const { value: savedTheme } = await Preferences.get({ key: 'bazi_color_theme' });
            if (savedTheme) setColorTheme(savedTheme);
        } catch (e) { console.error("讀取儲存資料失敗:", e); }

        if (isSuccess) {
            if (bookingId && bookingId.startsWith('REPORT_')) {
                const savedResult = sessionStorage.getItem('bazi_paid_result');
                if (savedResult) {
                    const parsedData = JSON.parse(savedResult);
                    const nowTime = Date.now();
                    
                    // 🌟 確實把狀態跟時間寫進當前的資料中
                    parsedData.isPaid = true;
                    parsedData.paidAt = nowTime;
                    if (parsedData.rawDate) {
                        parsedData.rawDate.isPaid = true;
                        parsedData.rawDate.paidAt = nowTime;
                    }

                    setBaziData(parsedData); 
                    setView('result'); 

                    // 執行自動保存
                    const baziSource = parsedData.bazi || {};
                    const dm = baziSource.dayGan || '';
                    const dmElement = WUXING_MAP[dm] || '';

                    const dataToSave = {
                        id: parsedData.id,
                        name: parsedData.name,
                        genderText: parsedData.genderText || (parsedData.gender === '1' ? '男' : '女'),
                        solarDate: parsedData.solarDate,
                        lunarDate: parsedData.lunarDate,
                        dayMaster: dm + dmElement,
                        monthBranch: baziSource.monthZhi || '', 
                        rawDate: parsedData.rawDate,
                        isPaid: true, 
                        paidAt: nowTime 
                    };

                    const existingIndex = currentBookmarks.findIndex(b => b.id === dataToSave.id);
                    if (existingIndex >= 0) { 
                        currentBookmarks[existingIndex] = dataToSave; 
                    } else { 
                        currentBookmarks = [dataToSave, ...currentBookmarks]; 
                    }
                    
                    // 正式寫入手機儲存空間
                    setBookmarks(currentBookmarks); 
                    await Preferences.set({ key: 'bazi_bookmarks', value: JSON.stringify(currentBookmarks) });

                    setTimeout(() => {
                        alert("✅ 付款成功！千字命書已為您解鎖。\n\n系統已自動為您將此命盤更新至「紀錄」中，日後可隨時免費重看！");
                    }, 600);
                }
                window.history.replaceState(null, '', window.location.pathname);
            } 
            else if (bookingId) {
                setBookmarks(currentBookmarks); 
                setView('booking'); 
            }
        } 
        else if (isCanceled) {
            setBookmarks(currentBookmarks); 
            sessionStorage.removeItem('bazi_paid_result');
            window.history.replaceState(null, '', window.location.pathname);
        } 
        else {
            setBookmarks(currentBookmarks); 
            if (params.get('tab') === 'booking') {
                setView('booking'); 
            }
        }
    };

    initializeApp();
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
          rawDate: data.rawDate || data,
          isPaid: data.isPaid || false,
          paidAt: data.paidAt || (data.isPaid ? Date.now() : null)
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
          const raw = { 
              ...savedItem.rawDate, 
              isPaid: savedItem.isPaid === true || savedItem.rawDate?.isPaid === true,
              // 🌟 【新增】讓原始資料也繼承付款時間
              paidAt: savedItem.paidAt || savedItem.rawDate?.paidAt || null 
          };
          
          const freshResult = calculateBaziResult(raw, ziHourRule);
          freshResult.id = savedItem.id; 
          
          freshResult.isPaid = raw.isPaid; 
          // 🌟 【新增】讓新排好的盤也繼承付款時間
          freshResult.paidAt = raw.paidAt; 

          setBaziData(freshResult); 
          setView('result');
      } catch (e) { 
          console.error("Failed to recalulate bookmark:", e); 
          alert('讀取失敗，資料可能已損壞'); 
      }
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