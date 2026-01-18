import React, { useState, useEffect, useMemo } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';

// 1. 引入共用 UI 和 工具
import { 
  AdBanner, AppHeader, AppInfoCard, 
  BookingSystem, BottomTabBar, BookmarkList, BuyMeCoffee, 
  InstallGuide, WebBackupManager, 
  COLORS, THEME, COMMON_STYLES
} from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Bookmark, BookOpen, Briefcase,
  Calendar, CalendarCheck, ChevronLeft, ChevronRight, Circle, Compass, CloudUpload,
  DoorOpen, Download,
  Edit3, Eye, EyeOff, Grid, Lock, MapPin,
  RefreshCw, Save, Settings, Sparkles,
  Trash2, Unlock, User, X
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";
const APP_NAME = "甯博八字";
const APP_VERSION = "v1.0";

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
    if (m === 11) return '十一月';
    if (m === 12) return '十二月';
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
    '學士': '學士：主才華，學識渊博，利於求學，聰明好學。',
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

    const stdMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
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

    return {
        id: formData.id || Date.now(),
        name: formData.name || '未命名',
        gender: formData.gender,
        genderText: formData.gender === '1' ? '元男' : '元女',
        isManual: false, 
        rawDate: formData, 
        solarDate: `${rawYear}-${pad(rawMonth)}-${pad(rawDay)} ${pad(rawHour)}:${pad(rawMinute)}`,
        lunarDate: lunarString,
        bazi: baziObj,
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
    about: "本程式旨在提供專業子平八字排盤服務，結合傳統命理與現代流暢 UI，輔助使用者進行深入的命理分析。",
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
            <input type="text" value={formData.name} onChange={e => handleSolarChange('name', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} placeholder="輸入姓名" />
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
                    <div style={{ flex: 1 }}> <select value={formData.hour} onChange={e => handleSolarChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select> </div>
                    <span>:</span>
                    <div style={{ flex: 1 }}> <select value={formData.minute} onChange={e => handleSolarChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select> </div>
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
                    <div style={{ flex: 1 }}> <select value={lunarData.hour} onChange={e => handleLunarChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select> </div>
                    <span>:</span>
                    <div style={{ flex: 1 }}> <select value={lunarData.minute} onChange={e => handleLunarChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select> </div>
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
const PillarCard = ({ title, gan, zhi, naYin, dayMaster, displayMode, dayZhi, yearZhi, monthZhi, colorTheme, genderText, onShenShaClick }) => {
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
       displayTopRight = null; 
       displayBottomRight = shenShas;
   } else {
       displayTopRight = ganGod;
       displayBottomRight = zhiGods;
   }

   const handleShenShaClick = (e) => {
       if (displayMode === 'shenSha' && onShenShaClick) {
           e.stopPropagation();
           onShenShaClick(`${gan}${zhi} (${title})`, shenShas);
       }
   };

   const visibleItems = (displayMode === 'shenSha' && displayBottomRight.length > 2)
       ? displayBottomRight.slice(0, 2)
       : displayBottomRight;

   return (
     <div style={{ 
         flex: 1, backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, 
         padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
         boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minHeight: '175px', justifyContent: 'space-between' 
     }}>
        <div style={{ fontSize: '12px', color: THEME.gray, marginBottom: '8px' }}>{title}</div>
        
        {/* 天干區塊 */}
        <div style={{ position: 'relative', width: '40px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: ganColor, lineHeight: 1.2 }}>{gan}</span>
            {displayMode === 'shiShen' && displayTopRight && (
                <div style={{ position: 'absolute', top: -4, right: -11, fontSize: '14px', color: '#888', padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>
            )}
            
            {/* 元男/元女 (直書) */}
            {genderText && (
                <div style={{ position: 'absolute', top: -2, right: -11, writingMode: 'vertical-rl', textOrientation: 'upright', fontSize: '14px', fontWeight: 'bold', color: THEME.gray, opacity: 0.8, letterSpacing: '2px', whiteSpace: 'nowrap' }}>
                    {genderText}
                </div>
            )}
        </div>
        
        {/* 地支區塊 */}
        <div style={{ position: 'relative', width: '40px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: zhiColor, lineHeight: 1.2 }}>{zhi}</span>
            <div style={{ position: 'absolute', top: 6, right: -11 }}>
                
                {/* [核心修改] 使用共用元件 */}
                {displayMode === 'shenSha' ? (
                    <ShenShaVerticalList 
                        items={shenShas}
                        onClick={(fullList) => onShenShaClick && onShenShaClick(`${gan}${zhi} (${title})`, fullList)}
                        fontSize="11px" // 原局空間大，字可以稍大或維持 11px
                        maxItems={2}    // 明確指定最多 2 個
                    />
                ) : (
                    // 非神煞模式 (變通星/藏干)
                    displayBottomRight.length > 0 ? displayBottomRight.map((item, idx) => (
                        <span key={idx} style={{ writingMode: 'horizontal-tb', fontSize: '14px', lineHeight: '1', color: '#888', display: 'block', marginBottom: '2px' }}>
                            {item}
                        </span>
                    )) : null
                )}

            </div>
        </div>
        
        {/* 納音 */}
        <div style={{ fontSize: '10px', color: THEME.gray, marginTop: '8px', backgroundColor: THEME.bgGray, padding: '2px 6px', borderRadius: '4px' }}>{naYin}</div>
     </div>
   );
};

// --- BaziResult (八字結果) ---
const BaziResult = ({ data, onBack, onSave, colorTheme }) => {
   const [selectedDaYunIndex, setSelectedDaYunIndex] = useState(0);
   const [selectedLiuNianYear, setSelectedLiuNianYear] = useState(null); 
   const [selectedLiuYue, setSelectedLiuYue] = useState(null);
   
   // [核心修改] 狀態改為三態字串: 'shiShen'(預設), 'zangGan'(藏干), 'shenSha'(神煞)
   const [displayMode, setDisplayMode] = useState('shiShen'); 
   
   const safeTheme = colorTheme || 'elemental';
   useEffect(() => { setSelectedLiuNianYear(null); }, [selectedDaYunIndex]);
   useEffect(() => { setSelectedLiuYue(null); }, [selectedLiuNianYear]);
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
           return `${M}/${D} ${h}:${m}`;
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
                                    {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -11, fontSize: '12px', color: THEME.gray, padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
                                </div>
                                <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '2px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: zColor }}>{ly.zhi}</span>
                                    
                                    <div style={{ position: 'absolute', top: 8, right: -11 }}>
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
                                    <div style={{ fontSize: '12px', color: THEME.black, fontWeight: 'bold' }}>{ly.dateStr}</div>
                                    <div style={{ fontSize: '10px', color: THEME.gray }}>{ly.name}</div>
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
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', // 垂直置中改為對齊頂部可能會更好，視內容多寡而定，這邊維持 center 
            border: `1px solid ${THEME.border}`, 
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
        }}>
            
            {/* --- 左側：姓名與日期資訊 --- */}
            <div style={{ flex: 1, marginRight: '8px' }}>
                {/* 姓名行 */}
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: THEME.black }}>
                    {data.name} <span style={{ fontSize: '14px', color: THEME.gray, fontWeight: 'normal' }}>({data.genderText})</span>
                </div>
                
                {/* 日期資訊 */}
                {data.isManual ? ( 
                    <div style={{ fontSize: '13px', color: THEME.gray, marginTop: '6px' }}></div> 
                ) : ( 
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}> 
                        <div style={{ fontSize: '13px', color: THEME.gray }}>西曆 {data.solarDate}</div> 
                        <div style={{ fontSize: '13px', color: THEME.purple, fontWeight: '500' }}>農曆 {data.lunarDate}</div> 
                    </div> 
                )}
                
                {/* 起運資訊 */}
                {data.yunInfo ? ( 
                    <> 
                        <div style={{ fontSize: '13px', color: THEME.blue, marginTop: '4px', fontWeight: 'bold' }}>{data.yunInfo.detail}</div> 
                        <div style={{ fontSize: '13px', color: THEME.blue, marginTop: '4px', fontWeight: 'bold' }}>(西元 {data.yunInfo.startDate} 起運)</div> 
                    </> 
                ) : null}
            </div>


            {/* --- 右側：控制區 (垂直排列) --- */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                
                {/* 1. 上方：顯示模式切換 (藏干 / 神煞) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {/* 藏干按鈕 */}
                    <button 
                        onClick={() => toggleMode('zangGan')} 
                        style={{ 
                            ...btnStyle, // [繼承] 基礎按鈕樣式
                            // [覆寫] 選中時變黑底白字，未選中維持 btnStyle 的灰底灰字
                            backgroundColor: displayMode === 'zangGan' ? THEME.black : THEME.bgGray,
                            color: displayMode === 'zangGan' ? 'white' : THEME.gray,
                            // 微調：讓兩個按鈕寬度一致看起來較整齊 (可選)
                            justifyContent: 'center'
                        }}>
                        {/* 圖示邏輯：選中(開啟)時顯示 Eye，未選中(關閉)時顯示 EyeOff */}
                        {displayMode === 'zangGan' ? <Eye size={14}/> : <EyeOff size={14}/>} 
                        藏干
                    </button>

                    {/* 神煞按鈕 */}
                    <button 
                        onClick={() => toggleMode('shenSha')} 
                        style={{ 
                            ...btnStyle, // [繼承] 基礎按鈕樣式
                            // [覆寫] 選中時變紫底白字
                            backgroundColor: displayMode === 'shenSha' ? THEME.purple : THEME.bgGray,
                            color: displayMode === 'shenSha' ? 'white' : THEME.gray,
                            justifyContent: 'center'
                        }}>
                        {displayMode === 'shenSha' ? <Eye size={14}/> : <EyeOff size={14}/>} 
                        神煞
                    </button>
                </div>

                {/* 2. 下方：操作按鈕 (保存 / 重排) */}
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                    <button onClick={() => onSave(data)} style={btnStyle}> <Bookmark size={14} /> 保存 </button>
                    <button onClick={onBack} style={btnStyle}> <RefreshCw size={14} /> 重排 </button>
                </div>
                
            </div>

        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <PillarCard 
                title="時柱" gan={data.bazi.timeGan} zhi={data.bazi.timeZhi} naYin={data.naYin.time} 
                dayMaster={data.bazi.dayGan} displayMode={displayMode}
                dayZhi={data.bazi.dayZhi} yearZhi={data.bazi.yearZhi} monthZhi={data.bazi.monthZhi}
                colorTheme={safeTheme} onShenShaClick={openShenShaModal}
            />
            <PillarCard 
                title="日柱" gan={data.bazi.dayGan} zhi={data.bazi.dayZhi} naYin={data.naYin.day} 
                dayMaster={data.bazi.dayGan} displayMode={displayMode}
                dayZhi={data.bazi.dayZhi} yearZhi={data.bazi.yearZhi} monthZhi={data.bazi.monthZhi}
                colorTheme={safeTheme} genderText={data.genderText} onShenShaClick={openShenShaModal}
            />
            <PillarCard 
                title="月柱" gan={data.bazi.monthGan} zhi={data.bazi.monthZhi} naYin={data.naYin.month} 
                dayMaster={data.bazi.dayGan} displayMode={displayMode} 
                dayZhi={data.bazi.dayZhi} yearZhi={data.bazi.yearZhi} monthZhi={data.bazi.monthZhi}
                colorTheme={safeTheme} onShenShaClick={openShenShaModal}
            />
            <PillarCard 
                title="年柱" gan={data.bazi.yearGan} zhi={data.bazi.yearZhi} naYin={data.naYin.year} 
                dayMaster={data.bazi.dayGan} displayMode={displayMode} 
                dayZhi={data.bazi.dayZhi} yearZhi={data.bazi.yearZhi} monthZhi={data.bazi.monthZhi}
                colorTheme={safeTheme} onShenShaClick={openShenShaModal}
            />
        </div>
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
           <h4 style={{ margin: '0 0 12px 0', borderLeft: `4px solid ${THEME.blue}`, paddingLeft: '8px', fontSize: '15px' }}>大運</h4>
           <div>{renderDaYunRow(firstRow)}{renderDaYunRow(secondRow)}</div>
       </div>
       {renderLiuNianGrid()}
       {renderLiuYueGrid()}
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
  // 1. 安全保護 & 載入檢查
  // useProtection(['mrkfengshui.com', 'mrkbazi.vercel.app', 'localhost']);
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
              <AdBanner />
            </>
          )}
          
          {view === 'result' && (
            <>
              <BaziResult data={baziData} onBack={() => { setEditingData(null); setView('input'); }} onSave={saveBookmark} colorTheme={colorTheme} />
              <AdBanner />
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
                  
                  <div style={{ marginTop: '20px' }}><AdBanner /></div>
              </div>
          )}

          {/* ✅ 5. 共用預約系統 */}
          {view === 'booking' && <BookingSystem apiUrl={API_URL} onNavigate={() => setView('input')} />}
          
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