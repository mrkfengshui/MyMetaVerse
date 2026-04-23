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

const AiBaziAnalysis = ({ data }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
    const [isPaid, setIsPaid] = useState(data.isPaid || false);

  useEffect(() => {
      if (data.isPaid && !analysisResult) {
          setIsPaid(true);
          setAnalysisResult(generateLongReport());
      }
  }, [data, analysisResult]);

  // --- 內部知識庫：滴天髓古文佐證 ---
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

  // 高相容性：地支合化引擎
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
              i1.forEach(a => {
                  i2.forEach(b => {
                      if (Math.abs(a - b) === 1) isAdj = true;
                  });
              });
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

      const banHeList = [
          ['亥', '卯', '木'], ['卯', '未', '木'],
          ['寅', '午', '火'], ['午', '戌', '火'],
          ['巳', '酉', '金'], ['酉', '丑', '金'],
          ['申', '子', '水'], ['子', '辰', '水']
      ];
      banHeList.forEach(item => {
          const z1 = item[0], z2 = item[1], wx = item[2];
          if (!used.has(z1) && !used.has(z2)) {
              const rel = checkRel(z1, z2);
              if (rel.exists) {
                  if (rel.isAdj) {
                      combos.push(`${z1}${z2}半合${wx}`);
                      wuxingSupport[wx] += 1;
                  } else {
                      potentialCombos.push(`${z1}${z2}半合${wx}局`);
                      wuxingSupport[wx] += 0.5;
                  }
                  used.add(z1); used.add(z2);
              }
          }
      });

      const liuHeList = [
          ['子', '丑', '土'], ['寅', '亥', '木'],
          ['卯', '戌', '火'], ['辰', '酉', '金'],
          ['巳', '申', '水'], ['午', '未', '火']
      ];
      liuHeList.forEach(item => {
          const z1 = item[0], z2 = item[1], wx = item[2];
          if (!used.has(z1) && !used.has(z2)) {
              const rel = checkRel(z1, z2);
              if (rel.exists) {
                  if (rel.isAdj) {
                      combos.push(`${z1}${z2}六合${wx}`);
                      wuxingSupport[wx] += 1;
                  } else {
                      potentialCombos.push(`${z1}${z2}六合${wx}局`);
                      wuxingSupport[wx] += 0.5;
                  }
                  used.add(z1); used.add(z2);
              }
          }
      });

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

  // 綜合生成千字深度報告
  const generateLongReport = () => {
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
    report += `《滴天髓》云：${DI_TIAN_SUI[dm]}\n\n`;
    
    if (combos.length > 0 || potentialCombos.length > 0) {
        if (combos.length > 0) {
            report += `原局地支見**【${combos.join('、')}】**。`;
        }
        if (potentialCombos.length > 0) {
            report += `又暗含**【${potentialCombos.join('、')}基因】**，待遇大運或流年填實引動，便會爆發出強大的相應五行能量。`;
        }
        report += `綜合判定後，`;
    } else {
        report += `原局地支氣場純粹，無明顯合化局。`;
    }

    report += `閣下八字屬於**「${isStrong ? '身旺' : '身弱'}」**之局。依據五行生剋原理，日元${isStrong ? '氣勢強旺，需引導宣洩或適當雕琢' : '根氣稍弱，急需生扶與滋補'}。\n`;
    
    let yongShenText = yongShenList.length > 0 ? yongShenList.join('、') : `${primaryFav}`;
    let xiShenText = xiShenList.length > 0 ? xiShenList.join('、') : `${favWuxing.slice(1).join('、')}`;
    report += `此命造用** 【${yongShenText} 】**，流運見** 【${xiShenText}】**亦可斟用，運勢起伏隨年月變化。\n\n`;

    report += `### 二、 天賦事業與財運格局\n`;

    const monthHidden = ZHI_HIDDEN[bazi.monthZhi] || [];
    const monthZhiMainGan = monthHidden[0] || '';
    const monthTenGod = getShiShen(bazi.dayGan, monthZhiMainGan);
    
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

    report += `八字用神，月令為尊，閣下生於${bazi.monthZhi}月，五行屬${monthZhiWuxing}，主氣為**【${monthTenGod}】**星。\n`;
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
        report += `閣下夫妻宮坐落於**【${bazi.dayZhi}】（四馬星）**。代表命定之另一半性格活潑外向、機智敏捷，具備極佳的溝通與適應能力。\n`;
    } else {
        report += `閣下夫妻宮坐落於**【${bazi.dayZhi}】（四庫星）**。代表命定之另一半性格沉穩、踏實，非常有責任感與傳統家庭觀念。\n`;
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
    report += `- 夫妻宮內藏${spouseTenGod}星，${spouseDesc}\n`;

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
        
        report += `大運管十年大局，閣下於 ${currentDaYun.startYear} 年至 ${currentDaYun.startYear + 9} 年，正行**【${currentDaYun.gan}${currentDaYun.zhi}】**大運，此十年是閣下人生軌跡中極為關鍵的轉折樞紐。命理中，天干**【${currentDaYun.gan}】**主導前五年的外在境遇與表象，地支【${currentDaYun.zhi}】則掌管後五年的潛在能量與真實收穫。\n\n`;
        
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
        const tGan = TIANGAN[tgIdx >= 0 ? tgIdx : tgIdx + 10];
        const tZhi = DIZHI[tzIdx >= 0 ? tzIdx : tzIdx + 12];
        const isYearGood = favWuxing.includes(WUXING_MAP[tGan]) || favWuxing.includes(WUXING_MAP[tZhi]);
        const tZhiWx = WUXING_MAP[tZhi];
        const isZhiFav = favWuxing.includes(tZhiWx);

        report += `**【${targetYear} ${tGan}${tZhi}流年詳述】**\n`;
        
        report += `**事業與財運：**\n`;
        if (wealthCount >= 3 && !isStrong) { 
            if (isYearGood) {
                report += `- ${targetYear}年天干地支引動喜神，幫扶日主，終於能扛起命中旺財！經歷過去低點，今年有望一雪前恥。過去積壓的投資或合夥項目將迎來豐收。若有合夥創業計畫，今年是極佳的啟動時機。但切記依舊要秉持「讓他人衝鋒、您居中協調」的作風，見好就收，方能讓財庫真正充實。\n`;
            } else {
                report += `- ${targetYear}年流年犯忌，原局「財多壓身」的壓力加劇。極易因貪念或聽信他人「必賺」的突發合作邀約而破大財。事業上易遇小人找碴或官非詞訟。投資務必極度死守現金，或轉入長線保本資產。創業與副業絕對嚴禁擴張，寧可少賺不可大賠。\n`;
            }
        } else if (wealthCount >= 2 && isStrong) { 
            if (isYearGood) {
                report += `- ${targetYear}年天干地支引動喜神，加上閣下本身承載財富能力極強，簡直如虎添翼！事業上將有拓展版圖、開創獨立品牌或承接大型專案的絕佳機遇。投資作風可大膽佈局新興市場或擴張團隊，勇於進取必能獲利豐厚，創造事業高峰。\n`;
            } else {
                report += `- ${targetYear}年流年犯忌，反剋自身。雖然閣下本身理財能力極強，但此年大環境動盪，事業上易遇同行惡意競爭、小人找碴或官非詞訟。原本積極進取的投資與創業步伐必須暫時放緩，切忌盲目抄底或過度舉債擴張，保留現金實力以待來年。\n`;
            }
        } else { 
            if (isYearGood) {
                report += `- ${targetYear}年天干地支引動喜神，閣下的專業價值將被市場高度認可！經歷過去數月低點，此年有望一雪前恥。事業上適合考取高階證照、轉換至更高薪的跑道，或是藉由專業技術、顧問服務獲取豐厚報酬。在自身熟悉的領域或自我進修上的投資，將獲得最大的回報。\n`;
            } else {
                report += `- ${targetYear}年流年犯忌，剋掉命中喜神。此年較為動盪，易感懷才不遇或專業受人質疑。事業上不宜貿然跳槽或轉換不熟悉的領域，更要小心因越界投資自己不熟悉的金融產品而慘遭套牢。此年當以「穩守本業、深耕專業」為主，凡遇突如其來的邀約需保持高度警戒。\n`;
            }
        }

        report += `**姻緣運勢：**\n`;
        if (isYearGood) {
            report += `- **若閣下現時未婚：** 此年天干地支引動，感情上有機會認識不錯的對象。${hasPeach ? '命中帶桃花，異性緣尤佳，但仍需帶眼識人，避免霧水情緣。' : '宜多參與社交活動，擴展人脈，自然能遇見懂得欣賞您的理想伴侶。'}\n`;
            report += `- **若閣下現時已婚：** 此年感情生活大致平穩。但日常相處仍需注意因「${marriedFriction}」而生磨擦。建議多包容對方，尋找共同興趣，感情方能進一步昇華。\n`;
        } else {
            report += `- **若閣下現時未婚：** 此年感情運勢較為平淡或易生波折。${hasPeach ? '雖有假姻緣突至，但往往開心一陣子後便要收拾心情。' : '前度若有糾纏不清的意味，情深緣淺，勉強復合最終亦會再次分離，建議早日放手。'}應將重心放在事業與自我充實上。\n`;
            report += `- **若閣下現時已婚：** 此年流年氣場動盪，婚姻生活易受考驗。極易因「${marriedFriction}」爆發較大爭執。${hasPeach ? '特別需防範外來誘惑，必然不懷好意，切勿因一時意亂情迷而影響家宅安寧。' : '逢流年沖剋之時，需特別防範無謂爭執，學習柔軟溝通，退一步海闊天空。'}\n`;
        }

        report += `**疾厄與健康：**\n`;
        if (WUXING_MAP[tZhi] === rel.controlledBy) {
            report += `- 流年地支與原局呈現「刑、沖」之象。需特別注意腰椎病情、關節及金屬硬物所傷。驛馬動盪，外出需格外小心車禍碰撞。如有舊疾，宜在此年積極調理。\n`;
        } else {
            report += `- 健康運勢整體尚可，很多時候出現的小毛病並不會造成實質的影響，只需放鬆心情，問題自然迎刃而解。\n`;
        }

        // ✅ 升級：根據喜忌判定流年健康養生
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

        // 西曆約略對應五行：2,3月木；4月土；5,6月火；7月土；8,9月金；10月土；11,12月水；1月土
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
        
        // 為了排版美觀，各取 3 個最具代表性的月份
        const displayLucky = luckyMonths.slice(0, 3).join('、');
        // 凶月取陣列後面的月份，讓數字分佈看起來更自然
        const displayBad = badMonths.slice(-3).join('、'); 

        report += `\n**【關鍵流月預警】**\n`;
        report += `- **吉利月份（西曆 ${displayLucky} 月）：** 五行氣場生扶，運勢轉順，可見曙光。此時最有利於推動重要計畫，得貴人相助，生活重回正軌。\n`;
        report += `- **凶險月份（西曆 ${displayBad} 月）：** 流月氣場犯忌，準備多時的計劃易遭打擊。此期間切忌心浮氣躁，凡事保守為上，避免官非詞訟，小心小人找碴。\n\n`;
    }); // <-- 這裡是 forEach 迴圈的結尾

    report += `### 七、 開運與吉方建議\n`;
    const lk = getLuckyInfo(primaryFav);
    report += `- **吉利方位：** 閣下之爵祿與開運位在**${lk.dir}**，可在此方位擺放生旺之物。\n`;
    report += `- **幸運色系：** 日常穿著宜以**${lk.color}**為主調，有助調和氣場。\n\n`;
    
    report += `本命書由【許甯博風水命理館】監修編撰。版權所有，翻印必究。\n\n`;
    report += `💡 **【專屬親算升級優惠】**\n若需針對合婚、擇日或投資決策尋找師傅親自批算，本次解鎖費用可於一年內預約服務時全額抵銷。\n\n`;
    report += `馬上預約：請點擊畫面最下方導航列的 **「預約」** ，即可查看師傅最新空檔，安排專屬的一對一親算服務。`;

    return report;
  };

  const handleUnlock = async () => {
      setIsAnalyzing(true);
      setTimeout(() => {
          setIsPaid(true);
          setAnalysisResult(generateLongReport());
          setIsAnalyzing(false);
      }, 800); 
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
        <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.teal}`, paddingLeft: '8px', fontSize: '15px' }}>
          千字深度批命書
        </h4>
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
              if (line.startsWith('  •')) {
                  const content = line.substring(3);
                  const parts = content.split('**');
                  if (parts.length > 1) {
                      return <div key={i} style={{ marginLeft: '24px', marginBottom: '6px', fontSize: '14px', color: '#444' }}>◦ {parts.map((part, idx) => idx % 2 === 1 ? <b key={idx} style={{color: '#333'}}>{part}</b> : part)}</div>;
                  }
                  return <div key={i} style={{ marginLeft: '24px', marginBottom: '6px', fontSize: '14px', color: '#444' }}>◦ {content}</div>;
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
                    width: '100%', 
                    padding: '12px', 
                    backgroundColor: THEME.black, 
                    color: '#FFD700', 
                    border: 'none', 
                    borderRadius: '30px', 
                    cursor: 'pointer', 
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px' 
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