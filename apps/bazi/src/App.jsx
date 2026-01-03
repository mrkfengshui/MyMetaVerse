import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Bookmark, Settings, 
  Calendar as CalendarIcon, X, Sparkles, Grid, 
  Check, CalendarCheck, User, ArrowRight, Zap, Compass, List,
  Trash2, Edit3, Eye, EyeOff, RefreshCw, Search,
  House, LampDesk,
  CloudUpload, Download, 
} from 'lucide-react';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Preferences } from '@capacitor/preferences';

// 全域設定
const APP_VERSION = "元星八字 v1.0";
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";

const COLORS = {
  jia: '#006400', yi: '#90EE90', bing: '#ff0000ff', ding: '#FF6347', wu: '#8B4513',
  ji: '#D2B48C', geng: '#FFA500', xin: '#FFD700', ren: '#00008B', gui: '#87CEEB',
};

const THEME = {
  red: '#ff4d4f', blue: '#1890ff', teal: '#13c2c2', orange: '#fa8c16',
  purple: '#722ed1', black: '#262626', gray: '#8c8c8c', lightGray: '#d1d5db',
  bg: '#f0f2f5', white: '#ffffff', bgGray: '#f9fafb', border: '#e8e8e8',
  bgRed: '#fff1f0', bgBlue: '#e6f7ff', bgOrange: '#fff7e6', vermillion: '#ce0000'
};

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 生成六十甲子表
const JIA_ZI = [];
for(let i=0; i<60; i++) {
    JIA_ZI.push(TIANGAN[i%10] + DIZHI[i%12]);
}

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
    // 農曆月份通常稱：正月(一月), 二月... 十二月
    if (m === 1) return '正月';
    if (m <= 10) return CN_NUMS[m] + '月';
    if (m === 11) return '十一月';
    if (m === 12) return '十二月';
    return m + '月';
};

const getLunarDayText = (d) => {
    // 農曆日期習慣：初一~初十, 十一~二十, 廿一~廿九, 三十
    if (d <= 10) return '初' + CN_NUMS[d];
    if (d < 20) return '十' + CN_NUMS[d % 10]; // 十一, 十二...
    if (d === 20) return '二十';
    if (d < 30) return '廿' + (d % 10 === 0 ? '十' : CN_NUMS[d % 10]); // 廿一...
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

// --- 1. 輔助函式 ---
const getLocalDateString = (date) => {
  if (!date || isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CN_MAP = {
  '惊': '驚', '蛰': '蟄', '种': '種', '长': '長', '涧': '澗', '蜡': '蠟', '杨': '楊', '雳': '靂', 
  '灯': '燈', '驿': '驛', '钗': '釵', '炉': '爐', '剑': '劍', '钟': '鐘', '岚': '嵐', '构': '構', 
  '莹': '瑩', '灵': '靈', '叶': '葉', '烂': '爛', '头': '頭'
};

const toTraditional = (str) => {
  if (!str) return '';
  return str.split('').map(char => CN_MAP[char] || char).join('');
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

// 核心計算函數
const calculateBaziResult = (formData, ziHourRule) => {
    // --- 修改：如果是手動輸入干支模式 ---
    if (formData.isManual && formData.manualInput) {
        const mp = formData.manualInput;
        
        // 構造 baziObj
        const baziObj = {
            yearGan: mp.year.gan, yearZhi: mp.year.zhi,
            monthGan: mp.month.gan, monthZhi: mp.month.zhi,
            dayGan: mp.day.gan, dayZhi: mp.day.zhi,
            timeGan: mp.time.gan, timeZhi: mp.time.zhi,
        };

        // --- 新增：手動模式下的大運推算 (從月柱起，陽順陰逆) ---
        const yearGanIdx = TIANGAN.indexOf(mp.year.gan);
        const monthGanIdx = TIANGAN.indexOf(mp.month.gan);
        const monthZhiIdx = DIZHI.indexOf(mp.month.zhi);
        
        // 判斷年干陰陽 (偶數為陽: 甲丙戊庚壬, 奇數為陰: 乙丁己辛癸)
        const isYangYear = yearGanIdx % 2 === 0;
        const isMale = formData.gender === '1';
        
        // 決定順逆：男陽女陰=順(1), 男陰女陽=逆(-1)
        // 邏輯化簡：若 (男且陽) 或 (女且陰) -> 順，否則逆
        let direction = (isMale && isYangYear) || (!isMale && !isYangYear) ? 1 : -1;

        const manualDaYuns = [];
        for (let i = 1; i <= 10; i++) {
            // 計算大運干支索引 (需處理負數與循環)
            const nextGanIdx = (monthGanIdx + (direction * i) + 100) % 10;
            const nextZhiIdx = (monthZhiIdx + (direction * i) + 120) % 12;
            
            const nextGan = TIANGAN[nextGanIdx];
            const nextZhi = DIZHI[nextZhiIdx];

            manualDaYuns.push({ 
                seq: i, 
                gan: nextGan, 
                zhi: nextZhi,
                ganGod: getShiShen(mp.day.gan, nextGan),
                zhiHidden: ZHI_HIDDEN[nextZhi] || [],
                // 手動模式下，無法精確計算起運歲數與年份，設為空或示意文字
                startAge: i, // 僅顯示第幾運，或您可設為 null
                startYear: '', 
                liuNians: [] // 手動模式無真實年份，不排流年
            });
        }

        return {
            id: Date.now(),
            name: formData.name || '未命名',
            gender: formData.gender,
            genderText: formData.gender === '1' ? '元男' : '元女',
            rawDate: formData,
            isManual: true, // 標記為手動模式
            solarDate: null, // 隱藏西曆
            lunarDate: null, // 隱藏農曆
            bazi: baziObj,
            // 手動模式暫不計算納音，若需要可再補上查表法，這裡留空
            naYin: { year: '', month: '', day: '', time: '' }, 
            yunInfo: null, // 不顯示起運時間詳情
            daYuns: manualDaYuns // 放入計算好的大運
        };
    }

    // 1. 取得原始輸入 (用於顯示，絕不修改)
    const rawYear = parseInt(formData.year);
    const rawMonth = parseInt(formData.month);
    const rawDay = parseInt(formData.day);
    const rawHour = parseInt(formData.hour);
    const rawMinute = parseInt(formData.minute);

    // 2. 設定計算用變數 (預設為原始值)
    let calcYear = rawYear;
    let calcMonth = rawMonth;
    let calcDay = rawDay;
    let calcHour = rawHour;

    // 3. 根據子時規則調整 "計算用日期"
    // 如果選擇 'ziShi' (早夜子/23:00換日)，且時間 >= 23:00
    // 我們將計算日期推至 "隔日" 的 "0點" (早子時)，以取得隔天的日柱與正確的子時柱
    if (ziHourRule === 'ziShi' && rawHour >= 23) {
        const tempDate = new Date(rawYear, rawMonth - 1, rawDay);
        tempDate.setDate(tempDate.getDate() + 1); // 日期 +1
        
        calcYear = tempDate.getFullYear();
        calcMonth = tempDate.getMonth() + 1;
        calcDay = tempDate.getDate();
        calcHour = 0; // 強制設為 0 點 (確保 library 抓到的是隔日的早子時)
    }

    // 4. 使用 "計算用日期" 進行八字運算
    const solar = window.Solar.fromYmdHms(
        calcYear, calcMonth, calcDay, calcHour, rawMinute, 0
    );    

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

    // 1. 定義標準繁體月份 (強制 11月顯示十一，12月顯示十二)
    const stdMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    // 2. 定義標準繁體日期 (強制 21-29 顯示廿)
    const stdDays = [
        '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];

    // 3. 取得數值 (Math.abs 確保取得正整數，防止 library 負數表示閏月)
    const mVal = Math.abs(lunar.getMonth()); 
    const dVal = Math.abs(lunar.getDay());

    // 4. 判斷是否為閏月 (檢查 raw string 是否包含簡體或繁體閏字)
    const rawString = lunar.toString(); 
    const isLeap = rawString.includes('闰') || rawString.includes('閏');
    
    // 5. 組裝字串
    const monthText = stdMonths[mVal - 1] || `${mVal}月`; // 對應索引
    const dayText = stdDays[dVal - 1] || `${dVal}日`;
    const leapText = isLeap ? '閏' : ''; // 強制使用繁體「閏」

    // 最終農曆字串
    const lunarString = `${bazi.getYearGan()}${bazi.getYearZhi()}年 ${leapText}${monthText}${dayText} ${bazi.getTimeZhi()}時`;
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
                    ganGod: getShiShen(bz.dayGan, lnGan),
                    zhiHidden: ZHI_HIDDEN[lnZhi] || []
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
        isManual: false, // 標記為自動排盤
        rawDate: formData, 
        
        // 5. 修正：使用 "raw" (原始輸入) 來顯示西曆日期，確保顯示為 30日 23:00
        solarDate: `${rawYear}-${pad(rawMonth)}-${pad(rawDay)} ${pad(rawHour)}:${pad(rawMinute)}`,
        
        lunarDate: lunarString,
        bazi: baziObj,
            naYin: {
            year: toTraditional(bazi.getYearNaYin()), 
            month: toTraditional(bazi.getMonthNaYin()),
            day: toTraditional(bazi.getDayNaYin()), 
            time: toTraditional(bazi.getTimeNaYin())
        },
        yunInfo: {
            startAge: startAge, startMonth: startMonth, startDate: startSolar.toYmd(),
            detail: `出生後 ${startAge} 年 ${startMonth} 個月起運`
        },
        daYuns: daYuns
    };
};

// --- Header ---
const Header = ({ isPro }) => (
  <div style={{ backgroundColor: THEME.white, padding: '10px 16px', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> 
        <div style={{ width: '36px', height: '36px', backgroundColor: THEME.vermillion, borderRadius: '50%', position: 'relative', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <span style={{ fontFamily: "'青柳隷書SIMO2_T', serif", position: 'absolute', color: 'white', fontSize: '12px', lineHeight: 1, bottom: '26%', right: '8%', pointerEvents: 'none', fontWeight: 'normal' }}>字</span>
            <span style={{ fontFamily: "'青柳隷書SIMO2_T', serif", position: 'absolute', color: 'black', fontSize: '30px', lineHeight: 1, top: '12%', left: '2%', pointerEvents: 'none', fontWeight: 'normal' }}>八</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: '17px', fontWeight: 'normal', color: '#262626', marginLeft: '4px' }}>元星八字</span>
          {isPro && ( <span style={{ fontSize: '10px', color: THEME.orange, border: `1px solid ${THEME.orange}`, borderRadius: '4px', padding: '1px 4px', marginLeft: '6px', fontWeight: 'bold', transform: 'translateY(-2px)' }}>專業版</span> )}
        </div>
      </div>
    </div>
  </div>
);

// --- AdBanner ---
const AdBanner = ({ onRemoveAds }) => (
  <div style={{ height: '60px', backgroundColor: '#f0f0f0', borderTop: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, position: 'relative', zIndex: 5 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
      <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '3px', padding: '1px 3px', fontSize: '9px', color: '#999' }}>Ad</div>
      <div style={{ fontSize: '12px', color: '#555', display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}><span style={{ fontWeight: 'bold' }}>贊助商廣告</span><span style={{ fontSize: '10px' }}>點擊此處查看更多優惠資訊...</span></div>
   </div>
    <button onClick={(e) => { e.stopPropagation(); onRemoveAds(); }} style={{ fontSize: '11px', color: THEME.white, backgroundColor: THEME.black, border: 'none', borderRadius: '12px', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>移除廣告</button>
  </div>
);

// --- BookingView ---
const generateBookingId = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字元如 O, 0, I, 1
      let result = '';
      for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
  };

const BookingView = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState('book'); 
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({ service: null, date: null, time: null, name: '', phone: '', email: '', notes: '' });
  const [searchPhone, setSearchPhone] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineServices, setOnlineServices] = useState([]);
  const [scheduleData, setScheduleData] = useState({ fs: {}, general: {} }); 
  const [availableTimesForSelectedDate, setAvailableTimesForSelectedDate] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);
  
  const { minDate, maxDate } = useMemo(() => {
     const now = new Date();
     const min = new Date(); min.setDate(now.getDate() + 3);
     const max = new Date(); max.setMonth(now.getMonth() + 2); 
     max.setDate(new Date(max.getFullYear(), max.getMonth() + 1, 0).getDate()); 
     return { minDate: min, maxDate: max };
  }, []);

  const fetchLatestData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await fetch(`${API_URL}?action=getServices`);
      const data = await response.json();
      
      if (data.services) {
         const mappedServices = data.services.map(s => ({
             ...s,
             icon: s.id === 'fs_home' ? <House size={24} color={COLORS.yi} /> : 
                   s.id === 'fs_biz' ? <LampDesk size={24} color={THEME.red} /> : 
                   s.id === 'bz' ? <Sparkles size={24} color={COLORS.wu} /> :
                   s.id === 'qm' ? <Grid size={24} color={COLORS.geng} /> :
                   <CalendarIcon size={24} color={THEME.blue} />
         }));
         setOnlineServices(mappedServices);
      }
      if (data.schedule) {
        setScheduleData(data.schedule);
        if (bookingData.date) {
            const dateStr = getLocalDateString(bookingData.date);
            let currentType = bookingData.service?.type || 'general';
            if (bookingData.service?.id?.includes('fs')) currentType = 'fs';
            const typeSchedule = (currentType === 'fs') ? data.schedule.fs : data.schedule.general;
            const newTimes = typeSchedule?.[dateStr] || [];
            setAvailableTimesForSelectedDate(newTimes);
        }
      }
    } catch (error) {
      console.error("讀取 Google Sheet 失敗:", error);
    } finally {
      setLoadingData(false);
    }
  }, [bookingData.date, bookingData.service]);

  useEffect(() => { fetchLatestData(); }, []); 
  
  const handleServiceSelect = (srv) => { setBookingData({ ...bookingData, service: srv }); setStep(2); };
  
  const getRelevantSchedule = useCallback(() => {
     if (bookingData.service?.type === 'fs') return scheduleData.fs || {};
     return scheduleData.general || {};
  }, [bookingData.service, scheduleData]);
  
  const handleDateChange = (dateObj) => {
      const dateStr = getLocalDateString(dateObj);
      const currentSchedule = getRelevantSchedule();
      const times = currentSchedule[dateStr] || []; 
      setAvailableTimesForSelectedDate(times);
      setBookingData({ ...bookingData, date: dateObj, time: null }); 
  };
  
  const handleTimeSelect = (t) => { setBookingData({ ...bookingData, time: t }); setStep(3); };
  
  const isDateDisabled = ({ date, view }) => {
     if (view === 'month') {
        const dateStr = getLocalDateString(date);
        const currentSchedule = getRelevantSchedule();
        return !currentSchedule[dateStr] || currentSchedule[dateStr].length === 0;
     }
     return false;
  };
  
  const validateAndSubmit = () => {
      const { name, phone, email } = bookingData;
      if (!name) return alert('請填寫聯絡姓名');
      const phoneRegex = /^852\d{8}$/;
      if (!phoneRegex.test(phone)) return alert('電話格式錯誤！\n請輸入 852 開頭的 11 位數字');
      if (email && !/\S+@\S+\.\S+/.test(email)) return alert('Email 格式不正確');
      const isConfirmed = window.confirm("【預約須知】\n\n1. 按金一經收取，恕不退還。\n2. 按金將全數扣除於您的服務總額中。\n\n請問您確認以上條款並前往支付嗎？");
      if (isConfirmed) handlePayment();
  };

    const [searchId, setSearchId] = useState(''); // 新增：搜尋用的 ID 狀態

    const handlePayment = async () => {
        setStep(4);
        try {
        const bId = generateBookingId(); // 生成隨機 ID
        const payload = {
        bookingId: bId, // 新增：傳送 ID 給後端
        name: bookingData.name,
        phone: bookingData.phone,
        email: bookingData.email,
        service: bookingData.service.name, 
        date: getLocalDateString(bookingData.date), 
        time: bookingData.time, 
        notes: bookingData.notes
      };
        const response = await fetch(API_URL, { 
            method: "POST", 
            headers: { "Content-Type": "text/plain;charset=utf-8" }, 
            body: JSON.stringify(payload) 
        });
        
        const resultData = await response.json();
        if (resultData.result === 'success') {
            // 將生成的 ID 存入狀態，以便在成功頁面顯示
            setBookingData(prev => ({ ...prev, currentBookingId: bId }));
            setTimeout(() => { setStep(5); }, 500);
        }
      else if (resultData.message === 'occupied') { alert("❌ 預約失敗\n\n哎呀！該時段剛剛被其他客人預約走了。"); setBookingData(prev => ({ ...prev, time: null })); await fetchLatestData(); setStep(2); } 
      else { throw new Error(resultData.message || "Unknown error"); }
    } catch (error) { console.error("預約請求錯誤:", error); alert("⚠️ 連線異常或時段已滿，正在更新最新資料..."); await fetchLatestData(); setStep(2); }
  };

    const handleCheckBooking = async () => {
        if (!searchPhone || !searchId) return alert("請輸入電話號碼及預約代碼");
        setIsSearching(true);
        try {
            const response = await fetch(`${API_URL}?action=getMyBookings&phone=${searchPhone}&id=${searchId}`);
            const data = await response.json();
            setMyBookings(data.bookings || []);
        } catch (e) { 
            alert("查詢失敗"); 
        } finally { 
            setIsSearching(false); 
        }
    };

  const handlePhoneChange = (text) => {
      const numericText = text.replace(/\D/g, '');
      if (numericText.length <= 11) setBookingData({ ...bookingData, phone: numericText });
  };

  const renderCheckBookingView = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={{ backgroundColor: THEME.white, padding: '20px', borderRadius: '12px', border: `1px solid ${THEME.border}`, marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: THEME.black }}>身份驗證查詢</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="tel" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} placeholder="登記電話 (如: 85291234567)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} />
                <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value.toUpperCase())} placeholder="預約代碼 (6位英文數字)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} />
                <button onClick={handleCheckBooking} disabled={isSearching} style={{ width: '100%', padding: '12px', backgroundColor: THEME.black, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    {isSearching ? '查詢中...' : <><Search size={20} /> 驗證並查詢</>}
                </button>
            </div>
        </div>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: THEME.gray }}>您的預約紀錄</h4>
        {myBookings.length === 0 ? ( <div style={{ textAlign: 'center', color: THEME.gray, padding: '40px' }}>{isSearching ? '正在搜尋...' : '尚無紀錄'}</div> ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myBookings.map((bk, idx) => (
                    <div key={idx} style={{ backgroundColor: THEME.white, padding: '16px', borderRadius: '12px', border: `1px solid ${THEME.border}`, borderLeft: `4px solid ${THEME.blue}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: THEME.black }}>{bk.service}</span>
                            <span style={{ fontSize: '12px', color: THEME.blue, backgroundColor: THEME.bgBlue, padding: '2px 8px', borderRadius: '10px' }}>{bk.status}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: THEME.black, marginBottom: '2px' }}>{bk.date} {bk.time}</div>
                        <div style={{ fontSize: '12px', color: THEME.gray }}>預約人: {bk.name}</div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderBookingProcess = () => ( <>{step === 1 && renderServiceStep()} {step === 2 && renderDateStep()} {step === 3 && renderInfoStep()} {step === 4 && renderPaymentLoading()} {step === 5 && renderSuccess()}</> );
  
  const renderServiceStep = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: THEME.black }}>請選擇預約項目</h3>
      {loadingData ? ( <div style={{ textAlign: 'center', padding: '20px', color: THEME.gray }}>載入中...</div> ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {onlineServices.map(srv => (
            <div key={srv.id} onClick={() => handleServiceSelect(srv)} style={{ backgroundColor: THEME.white, padding: '16px', borderRadius: '12px', border: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
              <div style={{ padding: '10px', backgroundColor: THEME.bgGray, borderRadius: '50%' }}>{srv.icon}</div>
              <div style={{ flex: 1 }}> <div style={{ fontWeight: 'bold', fontSize: '16px', color: THEME.black }}>{srv.name}</div><div style={{ fontSize: '12px', color: THEME.gray, marginTop: '2px' }}>{srv.desc}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '14px', fontWeight: 'bold', color: THEME.blue }}>HK${srv.price}</div><div style={{ fontSize: '10px', color: THEME.red, marginTop: '2px' }}>按金 ${srv.deposit}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  const renderDateStep = () => (
    <div>
      <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'none', color: THEME.gray, marginBottom: '10px', padding: 0 }}><ChevronLeft size={16}/> 返回服務</button>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: THEME.black }}>選擇日期與時間</h3>
      <div style={{ marginBottom: '20px', border: `1px solid ${THEME.border}`, borderRadius: '12px', overflow: 'hidden', padding: '10px', backgroundColor: 'white' }}>
          <style>{` .react-calendar { width: 100%; border: none; font-family: inherit; } .react-calendar__tile--active { background: ${THEME.blue} !important; color: white !important; } .react-calendar__tile--now { background: ${THEME.bgBlue}; color: ${THEME.black}; } .react-calendar__tile:disabled { background-color: #f5f5f5; color: #ccc; cursor: not-allowed; } `}</style>
          <Calendar onChange={handleDateChange} value={bookingData.date} minDate={minDate} maxDate={maxDate} tileDisabled={isDateDisabled} locale="zh-TW" />
      </div>
      {bookingData.date && ( <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: THEME.gray }}>{bookingData.date.getMonth()+1}月{bookingData.date.getDate()}日 可用時段</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {availableTimesForSelectedDate.length > 0 ? ( availableTimesForSelectedDate.map(t => ( <button key={t} onClick={() => handleTimeSelect(t)} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.blue}`, backgroundColor: THEME.bgBlue, color: THEME.blue, fontWeight: 'bold', cursor: 'pointer' }}>{t}</button> )) ) : ( <div style={{gridColumn: '1 / -1', color: THEME.red, fontSize: '13px', textAlign: 'center', padding: '10px', backgroundColor: THEME.bgRed, borderRadius: '8px' }}>本日已無可預約時段 (或已額滿)</div> )}
            </div> 
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
         </div> )}
    </div>
  );

  const renderInfoStep = () => (
    <div>
      <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'none', color: THEME.gray, marginBottom: '10px', padding: 0 }}><ChevronLeft size={16}/> 返回日期</button>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: THEME.black }}>填寫預約資料</h3>
      <div style={{ backgroundColor: THEME.white, padding: '16px', borderRadius: '12px', border: `1px solid ${THEME.border}`, marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: THEME.gray }}>聯絡姓名</label><input type="text" placeholder="請輸入您的稱呼" value={bookingData.name} onChange={e => setBookingData({...bookingData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} /></div>
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: THEME.gray }}>WhatsApp 電話 <span style={{fontSize:'12px', fontWeight:'normal'}}>(852 + 8位數字)</span></label>
            <input type="tel" placeholder="例如: 85291234567" value={bookingData.phone} onChange={e => handlePhoneChange(e.target.value)} maxLength={11} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: THEME.gray }}>Email <span style={{fontSize:'12px', fontWeight:'normal'}}>(接收確認信用)</span></label>
            <input type="email" placeholder="example@email.com" value={bookingData.email} onChange={e => setBookingData({...bookingData, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} />
        </div>
        <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: THEME.gray }}>備註事項 (選填)</label><textarea placeholder="例如：想問的問題、準確出生時間等..." rows={3} value={bookingData.notes} onChange={e => setBookingData({...bookingData, notes: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontSize: '16px', resize: 'none' }} /></div>
      </div>
      <button onClick={validateAndSubmit} style={{ width: '100%', padding: '14px', backgroundColor: THEME.black, color: THEME.white, borderRadius: '30px', border: 'none', fontSize: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>前往支付 HK${bookingData.service?.deposit}</button>
    </div>
  );

  const renderPaymentLoading = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div style={{ width: '40px', height: '40px', border: `4px solid ${THEME.bgBlue}`, borderTop: `4px solid ${THEME.blue}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div><style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style><div style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'bold', color: THEME.black }}>正在傳送預約資料...</div></div>
  );

  const renderSuccess = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
      <div style={{ width: '80px', height: '80px', backgroundColor: '#f6ffed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}><Check size={40} color="#52c41a" /></div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.black, marginBottom: '8px' }}>預約成功！</h2>
      <p style={{ color: THEME.gray, marginBottom: '30px' }}>我們已收到您的預約，將會盡快聯絡您。</p>
      <div style={{ width: '100%', backgroundColor: THEME.white, padding: '20px', borderRadius: '12px', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ borderBottom: `1px solid ${THEME.bg}`, paddingBottom: '12px', marginBottom: '12px', fontWeight: 'bold', fontSize: '16px' }}>預約明細</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: THEME.gray }}>服務項目</span><span>{bookingData.service?.name}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: THEME.gray }}>日期時間</span><span>{bookingData.date?.getMonth()+1}月{bookingData.date?.getDate()}日 {bookingData.time}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: THEME.gray }}>預約人</span><span>{bookingData.name}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '8px', backgroundColor: THEME.bgOrange, borderRadius: '4px' }}>
            <span style={{ color: THEME.gray, fontWeight: 'bold' }}>預約代碼 (請截圖保存)</span>
            <span style={{ fontWeight: 'bold', color: THEME.vermillion, fontSize: '18px' }}>{bookingData.currentBookingId}</span>
        </div>
      </div>
      <button onClick={onNavigate} style={{ marginTop: '30px', padding: '12px 32px', backgroundColor: THEME.blue, color: 'white', borderRadius: '24px', border: 'none', fontWeight: 'bold' }}>返回首頁</button>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: THEME.bg, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '8px 16px', backgroundColor: THEME.white, borderRadius: '8px' }}>
        <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0, fontSize: '20px' }}>
            {viewMode === 'book' ? '線上預約' : '我的預約'}
        </h2>
        <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '20px', padding: '2px' }}>
            <button onClick={() => setViewMode('book')} style={{ padding: '6px 12px', border: 'none', borderRadius: '18px', backgroundColor: viewMode === 'book' ? THEME.blue : 'transparent', color: viewMode === 'book' ? 'white' : THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>預約</button>
            <button onClick={() => setViewMode('check')} style={{ padding: '6px 12px', border: 'none', borderRadius: '18px', backgroundColor: viewMode === 'check' ? THEME.blue : 'transparent', color: viewMode === 'check' ? 'white' : THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>查詢</button>
        </div>
      </div>
      {viewMode === 'book' ? renderBookingProcess() : renderCheckBookingView()}
    </div>
  );
};

const DataManager = ({ bookmarks, setBookmarks, isPro }) => {
    
    // 產生 CSV 字串
    const generateCSV = () => {
        // 定義 CSV 標頭
        const headers = ['姓名', '性別', '西曆日期', '農曆日期', '八字(年)', '八字(月)', '八字(日)', '八字(時)'];
        
        // 轉換資料列
        const rows = bookmarks.map(b => {
            return [
                `"${b.name}"`, // 加引號避免內容有逗號出錯
                `"${b.genderText}"`,
                `"${b.solarDate}"`,
                `"${b.lunarDate}"`,
                `"${b.bazi.yearGan}${b.bazi.yearZhi}"`,
                `"${b.bazi.monthGan}${b.bazi.monthZhi}"`,
                `"${b.bazi.dayGan}${b.bazi.dayZhi}"`,
                `"${b.bazi.timeGan}${b.bazi.timeZhi}"`
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    };

    // 處理匯出 CSV
    const handleExportCSV = async () => {
        if (!isPro) return alert('此為專業版功能');
        if (bookmarks.length === 0) return alert('目前沒有紀錄可匯出');

        try {
            const csvData = generateCSV();
            const fileName = `八字紀錄_${new Date().toISOString().split('T')[0]}.csv`;

            // 1. 寫入暫存檔
            const result = await Filesystem.writeFile({
                path: fileName,
                data: csvData,
                directory: Directory.Cache,
                encoding: Encoding.UTF8
            });

            // 2. 呼叫原生分享 (讓用戶選 Google Drive / Mail / Excel)
            await Share.share({
                title: '匯出八字紀錄 (CSV)',
                text: '這是您的八字命盤 CSV 檔案',
                url: result.uri,
                dialogTitle: '匯出 CSV'
            });

        } catch (e) {
            console.error('匯出失敗', e);
            alert('匯出失敗，請稍後再試');
        }
    };

    // 處理備份 (JSON) -> iCloud / Google Drive
    const handleBackup = async () => {
        if (!isPro) return alert('此為專業版功能');
        try {
            const backupData = JSON.stringify(bookmarks, null, 2);
            const fileName = `八字備份_${new Date().toISOString().split('T')[0]}.json`;

            const result = await Filesystem.writeFile({
                path: fileName,
                data: backupData,
                directory: Directory.Cache,
                encoding: Encoding.UTF8
            });

            await Share.share({
                title: '八字資料備份',
                text: '請選擇「儲存到檔案」(iOS) 或 「儲存至雲端硬碟」(Android)',
                url: result.uri,
                dialogTitle: '備份資料'
            });
        } catch (e) {
            console.error('備份失敗', e);
            alert('備份失敗');
        }
    };

    // 處理還原
    const handleRestore = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    if (window.confirm(`讀取到 ${importedData.length} 筆資料。\n確定要覆蓋現有紀錄嗎？(建議先備份現有紀錄)`)) {
                        setBookmarks(importedData);
                        // 同步寫入 Native Storage
                        await Preferences.set({ key: 'bazi_bookmarks', value: JSON.stringify(importedData) });
                        alert('還原成功！');
                    }
                } else {
                    alert('檔案格式錯誤：這不是有效的備份檔');
                }
            } catch (err) {
                alert('解析失敗，請確認檔案是否正確');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: THEME.bgGray, borderBottom: `1px solid ${THEME.border}`, fontSize: '14px', fontWeight: 'bold', color: THEME.black }}>
                資料管理 (專業版)
            </div>
            
            <div style={{ padding: '8px' }}>
                {/* 隱藏的檔案輸入框 */}
                <input 
                    type="file" 
                    id="restore-input" 
                    accept=".json" 
                    style={{ display: 'none' }} 
                    onChange={handleRestore}
                />

                <button onClick={handleExportCSV} disabled={!isPro} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'none', borderBottom: `1px solid ${THEME.bg}`, cursor: isPro ? 'pointer' : 'not-allowed', opacity: isPro ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <List size={18} color={THEME.blue} />
                        <span style={{ fontSize: '14px' }}>匯出 CSV (Excel)</span>
                    </div>
                    {!isPro && <span style={{ fontSize: '10px', color: THEME.orange, border: `1px solid ${THEME.orange}`, padding: '1px 4px', borderRadius: '4px' }}>Pro</span>}
                </button>

                <button onClick={handleBackup} disabled={!isPro} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'none', borderBottom: `1px solid ${THEME.bg}`, cursor: isPro ? 'pointer' : 'not-allowed', opacity: isPro ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CloudUpload size={18} color={THEME.purple} />
                        <span style={{ fontSize: '14px' }}>備份至雲端 (iCloud/Drive)</span>
                    </div>
                    {!isPro && <span style={{ fontSize: '10px', color: THEME.orange, border: `1px solid ${THEME.orange}`, padding: '1px 4px', borderRadius: '4px' }}>Pro</span>}
                </button>

                <button onClick={() => isPro ? document.getElementById('restore-input').click() : alert('此為專業版功能')} disabled={!isPro} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'none', cursor: isPro ? 'pointer' : 'not-allowed', opacity: isPro ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} color={THEME.green || '#52c41a'} />
                        <span style={{ fontSize: '14px' }}>從備份還原</span>
                    </div>
                    {!isPro && <span style={{ fontSize: '10px', color: THEME.orange, border: `1px solid ${THEME.orange}`, padding: '1px 4px', borderRadius: '4px' }}>Pro</span>}
                </button>
            </div>
        </div>
    );
  };

const SettingsView = ({ 
    isPro, onPurchase, 
    ziHourRule, setZiHourRule,
    bookmarks, setBookmarks,
    colorTheme, setColorTheme,
}) => {
  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (sec) => setOpenSection(openSection === sec ? null : sec);

  const APP_INFO = {
    version: isPro ? "Pro (專業版)" : "Free (廣告版)",
    about: "本程式旨在提供專業八字排盤服務，結合子平命理與現代演算法，輔助使用者進行命理分析。",
    agreement: "本程式提供的資訊僅供參考，使用者應自行判斷吉凶。開發者不對因使用本程式而產生的任何直接或間接後果負責。",
    contactEmail: "email@mrkfengshui.com", 
    emailSubject: "關於元星八字的建議"
  };
  const handleContactClick = () => { 
    window.location.href = `mailto:${APP_INFO.contactEmail}?subject=${encodeURIComponent(APP_INFO.emailSubject)}`; 
  };

  const handleReset = () => {
      if(window.confirm('確定要還原所有設定至預設值嗎？')) {
          setZiHourRule('ziShi');
          alert('已還原預設值');
      }
  };
  
  const renderInfoRow = (label, content, isLast = false) => (
    <div style={{ padding: '16px', borderBottom: isLast ? 'none' : `1px solid ${THEME.bg}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>{label}</div>
      <div style={{ fontSize: '14px', color: THEME.gray, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{content}</div>
    </div>
  );

  // 通用「丸型切換」組件 (Pill Toggle)
  const ToggleSelector = ({ options, currentValue, onChange }) => (
    <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '20px', padding: '2px' }}>
      {options.map((opt) => {
        const isActive = currentValue === opt.val;
        return (
          <button 
            key={opt.val} 
            onClick={() => onChange(opt.val)} 
            style={{ 
              padding: '6px 14px', border: 'none', borderRadius: '18px', 
              backgroundColor: isActive ? THEME.blue : 'transparent', 
              color: isActive ? 'white' : THEME.gray, 
              fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: THEME.bg, width: '100%', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
        <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2>
      </div>

      {/* 會員狀態區塊 */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>會員狀態</h3>
        <div style={{ backgroundColor: THEME.white, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${THEME.border}`, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: isPro ? THEME.orange : THEME.black }}>{isPro ? '專業版' : '免費廣告版'}</div>
              <div style={{ fontSize: '12px', color: THEME.gray, marginTop: '4px' }}>{isPro ? '您已享有永久無廣告專業體驗' : '升級以移除所有廣告及無限命盤紀錄空間'}</div>
            </div>
            {!isPro ? ( 
              <button onClick={onPurchase} style={{ backgroundColor: THEME.blue, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>US$35</button> 
            ) : ( 
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: THEME.orange, fontWeight: 'bold', fontSize: '13px' }}><Check size={16} /> 已啟用</div> 
            )}
        </div>
      </div>

      {/* 特殊設定 */}
      <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>偏好設定</h3>
      
      {/* 子時設定 */}
      <div style={{ backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', marginBottom: '12px' }}>
          
          {/* 1. 子時設定 */}
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>子時設定</div>
              <ToggleSelector 
                options={[{val: 'ziZheng', label: '子正換日'}, {val: 'ziShi', label: '子時換日'}]} 
                currentValue={ziHourRule} 
                onChange={setZiHourRule} 
              />
          </div>

          {/* 2. [分隔線] 使用 span 隔開 */}
          <span style={{ display: 'block', height: '1px', backgroundColor: THEME.bg, margin: '0 16px' }} />

          {/* 3. [新增] 顯示配色 */}
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>顯示配色</div>
              <ToggleSelector 
                options={[{val: 'elemental', label: '五行五色'}, {val: 'dark', label: '純深色'}]} 
                currentValue={colorTheme} 
                onChange={setColorTheme} 
              />
          </div>
      </div>

      <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px', marginTop: '20px' }}>資料備份與匯出</h3>
      <DataManager bookmarks={bookmarks} setBookmarks={setBookmarks} isPro={isPro} />

      {/* 關於本程式區塊 */}
      <div>
        <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>關於與支援</h3>
        <div style={{ backgroundColor: THEME.white, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
          {renderInfoRow("關於", APP_INFO.about)}
          {renderInfoRow("服務協議", APP_INFO.agreement)}
          <div style={{ padding: '16px', borderBottom: `1px solid ${THEME.bg}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>版本資訊</span>
            <span style={{ fontSize: '14px', color: THEME.gray }}>{APP_VERSION}</span>
          </div>
          <div onClick={handleContactClick} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: THEME.white }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.blue }}>聯絡我們</span>
              <span style={{ fontSize: '12px', color: THEME.gray, marginTop: '2px' }}>回報問題或提供建議</span>
            </div>
            <ChevronRight size={20} color={THEME.gray} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
          <button onClick={handleReset} style={{ width: '100%', padding: '12px', backgroundColor: THEME.bgGray, color: THEME.red, border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> 還原預設值
          </button>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'center', color: THEME.lightGray, fontSize: '11px' }}>System Build: {APP_VERSION}</div>
    </div>
  );
};

// --- [新增] 陰陽屬性判斷與彈窗選擇器 ---

// 判斷是否為陽性 (天干: 甲丙戊庚壬 / 地支: 子寅辰午申戌 為陽)
// 索引：偶數為陽 (0, 2, 4...)，奇數為陰 (1, 3, 5...)
const isYang = (index) => index % 2 === 0;

// 彈出式干支選擇器 (含陰陽過濾邏輯)
const GanZhiModalPicker = ({ title, isOpen, onClose, initialGan, initialZhi, onConfirm, colorTheme }) => {
  const [tempGan, setTempGan] = useState(initialGan);
  const [tempZhi, setTempZhi] = useState(initialZhi);

  // 當打開彈窗時，重置為傳入的初始值
  useEffect(() => {
    if (isOpen) {
      setTempGan(initialGan);
      setTempZhi(initialZhi);
    }
  }, [isOpen, initialGan, initialZhi]);

  if (!isOpen) return null;

  // 根據當前選擇的天干，判斷該地支是否應該被「禁用(變灰)」
  const isZhiDisabled = (zhi) => {
    if (!tempGan) return false; // 還沒選天干時，地支全開
    const ganIdx = TIANGAN.indexOf(tempGan);
    const zhiIdx = DIZHI.indexOf(zhi);
    // 規則：陽干配陽支，陰干配陰支
    // 如果 天干是陽(偶數)，地支必須是陽(偶數) -> 否則禁用
    // 如果 天干是陰(奇數)，地支必須是陰(奇數) -> 否則禁用
    return isYang(ganIdx) !== isYang(zhiIdx);
  };

  // 處理天干點擊
  const handleGanClick = (gan) => {
    setTempGan(gan);
    // 如果切換天干後，原本選的地支不符合陰陽屬性，則清空地支或自動修正
    // 這裡選擇清空，讓用戶重選，避免混淆
    if (tempZhi) {
        const ganIdx = TIANGAN.indexOf(gan);
        const zhiIdx = DIZHI.indexOf(tempZhi);
        if (isYang(ganIdx) !== isYang(zhiIdx)) {
            setTempZhi(''); 
        }
    }
  };

  const handleConfirm = () => {
    if (tempGan && tempZhi) {
      onConfirm(tempGan, tempZhi);
      onClose();
    } else {
      alert("請完整選擇天干與地支");
    }
  };

  // 樣式設定
  const safeTheme = colorTheme || 'elemental';
  const getItemStyle = (item, isSelected, type, disabled) => {
    if (disabled) {
        return {
            backgroundColor: '#f5f5f5',
            color: '#d9d9d9', // 淺灰色文字
            border: '1px solid #eee',
            cursor: 'not-allowed',
            opacity: 0.6
        };
    }
    
    let itemColor = THEME.black;
    if (safeTheme === 'elemental') {
        itemColor = type === 'gan' ? (STEM_COLORS[item] || THEME.black) : (BRANCH_COLORS[item] || THEME.black);
    }

    if (isSelected) {
        return {
            backgroundColor: THEME.blue,
            color: 'white',
            border: `1px solid ${THEME.blue}`,
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(24, 144, 255, 0.4)'
        };
    }
    return {
        backgroundColor: THEME.white,
        color: itemColor,
        border: `1px solid ${THEME.border}`,
        fontWeight: 'normal'
    };
  };

  const btnBase = {
      flex: 1, padding: '12px 0', borderRadius: '8px', fontSize: '18px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s ease', minWidth: '40px', outline: 'none', userSelect: 'none'
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div style={{ width: '90%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'popIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{title} - 選擇干支</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px' }}><X size={24} color={THEME.gray}/></button>
        </div>

        {/* 天干區 */}
        <div style={{ marginBottom: '8px', fontSize: '14px', color: THEME.gray, fontWeight: 'bold' }}>天干 (選陽鎖陰)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {TIANGAN.map(gan => (
                <button key={gan} onClick={() => handleGanClick(gan)} style={{ ...btnBase, ...getItemStyle(gan, tempGan === gan, 'gan', false) }}>{gan}</button>
            ))}
        </div>

        {/* 地支區 */}
        <div style={{ marginBottom: '8px', fontSize: '14px', color: THEME.gray, fontWeight: 'bold' }}>地支</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {DIZHI.map(zhi => {
                const disabled = isZhiDisabled(zhi);
                return (
                    <button 
                        key={zhi} 
                        onClick={() => !disabled && setTempZhi(zhi)} 
                        disabled={disabled}
                        style={{ ...btnBase, ...getItemStyle(zhi, tempZhi === zhi, 'zhi', disabled) }}
                    >{zhi}</button>
                );
            })}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', color: THEME.gray }}>預覽：</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.blue, marginLeft: '8px' }}>
                {tempGan || '?'}{tempZhi || '?'}
            </span>
        </div>

        <button onClick={handleConfirm} style={{ width: '100%', padding: '14px', backgroundColor: THEME.black, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none' }}>確認選擇</button>
      </div>
      <style>{`@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

// --- 4. BaziInput (八字輸入表單) - 支援四柱干支直選 ---
const BaziInput = ({ onCalculate, initialData, colorTheme }) => {
  const now = new Date();
  const [inputType, setInputType] = useState('solar');
  
  // 基礎表單 (西曆/農曆用)
  const [formData, setFormData] = useState(initialData || {
    name: '', gender: '1', year: now.getFullYear(), month: now.getMonth() + 1, 
    day: now.getDate(), hour: now.getHours(), minute: now.getMinutes()
  });
  const [lunarData, setLunarData] = useState({ year: now.getFullYear(), month: 1, day: 1, hour: 0, minute: 0, isLeap: false });

  const [manualPillars, setManualPillars] = useState({
      year: { gan: '甲', zhi: '子' },
      month: { gan: '丙', zhi: '寅' },
      day: { gan: '戊', zhi: '辰' },
      time: { gan: '庚', zhi: '申' }
  });

  // 控制彈窗 State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, pillar: null }); // pillar: 'year' | 'month' | 'day' | 'time'

  // ... (保留原本的 years, hours, minutes useMemo) ...
  const years = useMemo(() => { const arr = []; for (let i = 1900; i <= 2100; i++) arr.push(i); return arr; }, []);
  const hours = useMemo(() => Array.from({length: 24}, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({length: 60}, (_, i) => i), []);

  const handleSolarChange = (field, value) => {
        // 先建立新的資料物件
        const newData = { ...formData, [field]: value };
        
        // 如果使用者修改的是「年」或「月」，需要檢查「日」是否合法
        if (field === 'year' || field === 'month') {
            const newYear = parseInt(field === 'year' ? value : formData.year);
            const newMonth = parseInt(field === 'month' ? value : formData.month);
            
            // 計算該年該月有多少天 (JS中 month 為 0-11，但這裡傳入的參數 0 會自動變為上個月最後一天，
            // 所以 new Date(year, month, 0) 剛好取得 month 月的總天數)
            const maxDays = new Date(newYear, newMonth, 0).getDate();
            
            // 如果原本選的日子大於該月最大天數 (例如 30 > 29)，強制修正為最大天數
            if (parseInt(newData.day) > maxDays) {
                newData.day = maxDays;
            }
        }
        
        setFormData(newData);
    };

    // 2. 計算當前選擇年月的天數陣列 (用於渲染 UI)
    const solarDays = useMemo(() => {
        if (inputType !== 'solar') return [];
        const y = parseInt(formData.year);
        const m = parseInt(formData.month);
        // 取得該月總天數
        const max = new Date(y, m, 0).getDate();
        return Array.from({ length: max }, (_, i) => i + 1);
    }, [formData.year, formData.month, inputType]);

// 1. 新增：計算該農曆月最大天數 (29 或 30)
  const getLunarMaxDays = (y, m, isLeap) => {
      // 確保 library 已載入
      if (!window.LunarYear) return 30; 
      try {
          // 取得該農曆年的所有月份資訊
          const lunarYear = window.LunarYear.fromYear(parseInt(y));
          const months = lunarYear.getMonths();
          
          // 尋找匹配的月份 (需同時對應月份數字 & 是否為閏月)
          // library 的 getMonth() 回傳 1-12，isLeap() 回傳 true/false
          const target = months.find(lm => lm.getMonth() === parseInt(m) && lm.isLeap() === isLeap);
          
          // 如果找到了，回傳該月天數；沒找到(例如該年該月沒閏月)則回傳30防呆
          return target ? target.getDayCount() : 30;
      } catch (e) {
          return 30; 
      }
  };

  // 2. 修改：農曆變更處理函式 (加入自動修正日期邏輯)
  const handleLunarChange = (field, value) => {
      // 複製一份新的 state
      let newData = { ...lunarData, [field]: value };
      
      // 如果變動的是 年、月 或 閏月選項，需要檢查「日」是否超出範圍
      if (field === 'year' || field === 'month' || field === 'isLeap') {
          const maxDays = getLunarMaxDays(newData.year, newData.month, newData.isLeap);
          
          // 如果原本選的日子 (例如 30) 大於 新月份的最大天數 (例如 29)
          if (parseInt(newData.day) > maxDays) {
              newData.day = maxDays; // 自動修正為 29
          }
      }
      
      setLunarData(newData);
  };

  const lunarDays = useMemo(() => {
      if (inputType !== 'lunar') return [];
      const max = getLunarMaxDays(lunarData.year, lunarData.month, lunarData.isLeap);
      return Array.from({ length: max }, (_, i) => i + 1);
  }, [lunarData.year, lunarData.month, lunarData.isLeap, inputType]);

  // --- 手動干支處理函式 ---
  const openPicker = (pillarKey) => {
      setModalConfig({ isOpen: true, pillar: pillarKey });
  };

  const handlePickerConfirm = (newGan, newZhi) => {
      setManualPillars(prev => ({
          ...prev,
          [modalConfig.pillar]: { gan: newGan, zhi: newZhi }
      }));
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

  const getTabBtnStyle = (isActive) => ({
      flex: 1, padding: '10px', borderRadius: '8px', 
      border: `1px solid ${isActive ? THEME.blue : THEME.border}`, 
      backgroundColor: isActive ? THEME.bgBlue : THEME.white, 
      color: isActive ? THEME.blue : THEME.black, 
      fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
  });

  const renderPillarInput = (label, pillarKey) => {
      const pData = manualPillars[pillarKey];
      const ganColor = STEM_COLORS[pData.gan] || THEME.black;
      const zhiColor = BRANCH_COLORS[pData.zhi] || THEME.black;
      
      return (
          <div onClick={() => openPicker(pillarKey)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '10px 4px', backgroundColor: THEME.white, boxShadow: '0 2px 5px rgba(0,0,0,0.03)', transition: 'transform 0.1s', userSelect: 'none' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '12px', color: THEME.gray, marginBottom: '8px' }}>{label}</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: ganColor, lineHeight: 1.2 }}>{pData.gan}</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: zhiColor, lineHeight: 1.2 }}>{pData.zhi}</div>
              <div style={{ marginTop: '8px', fontSize: '10px', color: THEME.blue, backgroundColor: THEME.bgBlue, padding: '2px 6px', borderRadius: '4px' }}>點擊修改</div>
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
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: THEME.gray }}>西元年</label>
                <select value={formData.year} onChange={e => handleSolarChange('year', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: THEME.gray }}>月</label>
                <select value={formData.month} onChange={e => handleSolarChange('month', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}</option>)}</select>
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: THEME.gray }}>日</label>
                {/* 修改：使用計算好的 solarDays 陣列 */}
                <select value={formData.day} onChange={e => handleSolarChange('day', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>
                    {solarDays.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
        </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>出生時間</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                        <select value={formData.hour} onChange={e => handleSolarChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                    </div>
                    <span>:</span>
                    <div style={{ flex: 1 }}>
                        <select value={formData.minute} onChange={e => handleSolarChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                    </div>
                </div>
              </>
          )}

{inputType === 'lunar' && (
      <>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: THEME.gray }}>農曆年</label>
                <select value={lunarData.year} onChange={e => handleLunarChange('year', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: THEME.gray }}>月</label>
                <select value={lunarData.month} onChange={e => handleLunarChange('month', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>
                    {Array.from({length:12},(_,i)=>i+1).map(m => (
                        <option key={m} value={m}>{getLunarMonthText(m)}</option>
                    ))}
                </select>
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: THEME.gray }}>日</label>
                {/* 使用計算好的 lunarDays (可能是 29 或 30 天) */}
                <select value={lunarData.day} onChange={e => handleLunarChange('day', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>
                    {lunarDays.map(d => (
                        <option key={d} value={d}>{getLunarDayText(d)}</option>
                    ))}
                </select>
            </div>
        </div>
                      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" id="leapMonth" checked={lunarData.isLeap} onChange={e => handleLunarChange('isLeap', e.target.checked)} style={{ marginRight: '8px', width: '18px', height: '18px' }} />
                      <label htmlFor="leapMonth" style={{ fontSize: '13px', color: THEME.black }}>是閏月 (例如閏四月)</label>
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>出生時間</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                        <select value={lunarData.hour} onChange={e => handleLunarChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                    </div>
                    <span>:</span>
                    <div style={{ flex: 1 }}>
                        <select value={lunarData.minute} onChange={e => handleLunarChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    </div>
                    </div>
                </div>
              </>
          )}

          {inputType === 'ganzhi' && (
                      <div style={{ marginBottom: '24px' }}>
                          <div style={{ fontSize: '13px', color: THEME.gray, marginBottom: '10px' }}>點選下方修改四柱</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                              {renderPillarInput('時柱', 'time')}
                              {renderPillarInput('日柱', 'day')}
                              {renderPillarInput('月柱', 'month')}
                              {renderPillarInput('年柱', 'year')}
                          </div>
                      </div>
                    )}

                    <button onClick={handleStartCalculate} style={{ width: '100%', padding: '14px', backgroundColor: THEME.blue, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                      <Sparkles size={20} />
                      {initialData ? '重新排盤' : '開始排盤'}
                    </button>
                </div>

                {/* 這裡插入彈窗組件 */}
                <GanZhiModalPicker 
                    title={modalConfig.pillar ? { year: '年柱', month: '月柱', day: '日柱', time: '時柱' }[modalConfig.pillar] : ''}
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    initialGan={modalConfig.pillar ? manualPillars[modalConfig.pillar].gan : ''}
                    initialZhi={modalConfig.pillar ? manualPillars[modalConfig.pillar].zhi : ''}
                    onConfirm={handlePickerConfirm}
                    colorTheme={colorTheme}
                />
              </div>
            );
          };

          // --- 5. PillarCard (四柱卡片) ---
const PillarCard = ({ title, gan, zhi, naYin, dayMaster, showHiddenStems, colorTheme }) => {
   // 修正邏輯：
   // 1. 如果 colorTheme 是 'elemental' (預設)，使用五行顏色。
   // 2. 如果 colorTheme 是 'dark'，使用深灰色。
   // 3. 為了防止參數未傳入導致全黑，增加預設值判定 (|| 'elemental')
   const safeTheme = colorTheme || 'elemental';
   
   const ganColor = safeTheme === 'elemental' ? (STEM_COLORS[gan] || '#555555') : '#555555';
   const zhiColor = safeTheme === 'elemental' ? (BRANCH_COLORS[zhi] || '#555555') : '#555555';
   
   const ganGod = (title === '日柱') ? null : getShiShen(dayMaster, gan);
   const hiddenStems = ZHI_HIDDEN[zhi] || [];
   const hiddenGods = hiddenStems.map(h => getShiShen(dayMaster, h));
   const displayTopRight = showHiddenStems ? null : ganGod;
   const displayBottomRight = showHiddenStems ? hiddenStems : hiddenGods;

return (
     <div style={{ 
        flex: 1, 
        backgroundColor: THEME.white, 
        borderRadius: '12px', 
        border: `1px solid ${THEME.border}`, 
        padding: '12px 4px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        minHeight: '175px', 
        justifyContent: 'space-between'
     }}>
        <div style={{ fontSize: '12px', color: THEME.gray, marginBottom: '8px' }}>{title}</div>
        <div style={{ position: 'relative', width: '40px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: ganColor, lineHeight: 1.2 }}>{gan}</span>
            {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -14, fontSize: '14px', color: '#888', padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
        </div>
        <div style={{ position: 'relative', width: '40px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: zhiColor, lineHeight: 1.2 }}>{zhi}</span>
            <div style={{ position: 'absolute', top: 6, right: -14, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                {displayBottomRight.map((item, idx) => (<span key={idx} style={{ fontSize: '14px', lineHeight: '1', transform: 'scale(1)', color: '#888' }}>{item}</span>))}
            </div>
        </div>
        <div style={{ fontSize: '10px', color: THEME.gray, marginTop: '8px', backgroundColor: THEME.bgGray, padding: '2px 6px', borderRadius: '4px' }}>{naYin}</div>
     </div>
   );
};

// --- 6. BaziResult (八字結果展示) - 修正版 ---
const BaziResult = ({ data, onBack, onSave, colorTheme }) => {
   const [selectedDaYunIndex, setSelectedDaYunIndex] = useState(0);
   const [selectedLiuNianYear, setSelectedLiuNianYear] = useState(null); 
   const [showHiddenStems, setShowHiddenStems] = useState(false);
   
   // 安全的主題設定
   const safeTheme = colorTheme || 'elemental';

   useEffect(() => { setSelectedLiuNianYear(null); }, [selectedDaYunIndex]);
   if (!data) return null;

   // 取得顏色的輔助函式 (修正：深色模式回傳深灰)
   const getColor = (char, type) => {
       if (safeTheme !== 'elemental') return '#555555'; // 純深色模式下的文字顏色
       return type === 'stem' ? (STEM_COLORS[char] || '#555555') : (BRANCH_COLORS[char] || '#555555');
   };

   const getLiuYueData = (yearGan, yearZhi, year) => {
       const yearGanIdx = TIANGAN.indexOf(yearGan);
       const startGanIdx = (yearGanIdx % 5) * 2 + 2; 
       const months = [];
       const JIE_QI_NAMES = ["立春", "驚蟄", "清明", "立夏", "芒種", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"];

       for(let i=0; i<12; i++) {
           const ganIdx = (startGanIdx + i) % 10;
           const zhiIdx = (2 + i) % 12; 
           let searchYear = year, searchMonth = i + 2; 
           if (searchMonth > 12) { searchMonth -= 12; searchYear += 1; }
           let jieQiDateStr = "";
           try {
               const solarCheck = window.Solar.fromYmd(searchYear, searchMonth, 15);
               const lunar = solarCheck.getLunar();
               const jieQi = lunar.getPrevJieQi(true); 
               if (jieQi && toTraditional(jieQi.getName()) === JIE_QI_NAMES[i]) {
                   const solarJie = jieQi.getSolar(); jieQiDateStr = `${solarJie.getMonth()}/${solarJie.getDay()}`;
               } else { jieQiDateStr = `${searchMonth}/?`; }
           } catch (e) { jieQiDateStr = `${searchMonth}月`; }

           months.push({
               seq: i + 1, name: JIE_QI_NAMES[i], dateStr: jieQiDateStr, gan: TIANGAN[ganIdx], zhi: DIZHI[zhiIdx],
               ganGod: getShiShen(data.bazi.dayGan, TIANGAN[ganIdx]), zhiHidden: ZHI_HIDDEN[DIZHI[zhiIdx]] || []
           });
       }
       return months;
   };

  const renderDaYunRow = (list) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: '8px' }}>
                {list.map((dy) => {
                    const isSelected = selectedDaYunIndex === (dy.seq - 1);
                    const displayTopRight = showHiddenStems ? null : dy.ganGod;
                    const displayBottomRight = showHiddenStems ? dy.zhiHidden : dy.zhiHidden.map(h => getShiShen(data.bazi.dayGan, h));
                    
                    const gColor = getColor(dy.gan, 'stem');
                    const zColor = getColor(dy.zhi, 'branch');

                return (
                       <div key={dy.seq} onClick={() => setSelectedDaYunIndex(dy.seq - 1)} style={{ 
                           display: 'flex', 
                           flexDirection: 'column', 
                           alignItems: 'center', 
                           width: '18%', 
                           minHeight: '110px', 
                           padding: '8px 4px',
                           backgroundColor: isSelected ? THEME.bgBlue : THEME.bgGray, 
                           borderRadius: '8px', 
                           border: isSelected ? `2px solid ${THEME.blue}` : `1px solid ${THEME.border}`, 
                           cursor: 'pointer', 
                           transition: 'all 0.2s ease',
                           position: 'relative'
                       }}>
                            <div style={{ position: 'relative', width: '30px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: gColor }}>{dy.gan}</span>
                                {displayTopRight && <div style={{ position: 'absolute', top: -5, right: -12, fontSize: '14px', color: '#888' }}>{displayTopRight}</div>}
                            </div>
                            <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: zColor }}>{dy.zhi}</span>
                                <div style={{ position: 'absolute', top: 5, right: -12, display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>{displayBottomRight.map((item, idx) => (<span key={idx} style={{ fontSize: '14px', lineHeight: '1.1', color: '#888' }}>{item}</span>))}</div>
                            </div>
                            
                            {!data.isManual && (
                                <>
                                    <div style={{ marginTop: '6px', fontSize: '11px', color: THEME.black, fontWeight: 'bold' }}>{dy.startAge}歲</div>
                                    <div style={{ fontSize: '11px', color: THEME.gray }}>{dy.startYear}</div>
                                </>
                            )}                            
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
                         const displayTopRight = showHiddenStems ? null : ln.ganGod;
                         const displayBottomRight = showHiddenStems ? ln.zhiHidden : ln.zhiHidden.map(h => getShiShen(data.bazi.dayGan, h));

                         // 修正：使用 getColor
                         const gColor = getColor(ln.gan, 'stem');
                         const zColor = getColor(ln.zhi, 'branch');

                         return (
                             <div key={ln.year} onClick={() => setSelectedLiuNianYear(ln.year)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', backgroundColor: isSelected ? THEME.bgRed : THEME.bgGray, borderRadius: '8px', border: isSelected ? `2px solid ${THEME.red}` : `1px solid ${THEME.border}`, position: 'relative', minHeight: '120px', direction: 'ltr', cursor: 'pointer' }}>
                                  <div style={{ position: 'relative', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: gColor }}>{ln.gan}</span>
                                      {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -12, fontSize: '14px', color: '#888', padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
                                  </div>
                                  <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '2px' }}>
                                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: zColor }}>{ln.zhi}</span>
                                      <div style={{ position: 'absolute', top: 8, right: -12, display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>{displayBottomRight.map((item, idx) => (<span key={idx} style={{ fontSize: '14px', lineHeight: '1.1', color: '#888' }}>{item}</span>))}</div>
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

       return (
           <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                   <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.orange}`, paddingLeft: '8px', fontSize: '15px' }}>{lnData.gan}{lnData.zhi}流年 ({lnData.year}年) - 流月</h4>
                   <button onClick={() => setSelectedLiuNianYear(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: THEME.gray, fontSize: '12px' }}><X size={16} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', direction: 'rtl' }}>
                    {liuYues.map((ly) => {
                        const displayTopRight = showHiddenStems ? null : ly.ganGod;
                        const displayBottomRight = showHiddenStems ? ly.zhiHidden : ly.zhiHidden.map(h => getShiShen(data.bazi.dayGan, h));
                        
                        // 修正：使用 getColor
                        const gColor = getColor(ly.gan, 'stem');
                        const zColor = getColor(ly.zhi, 'branch');

                        return (
                            <div key={ly.seq} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', backgroundColor: THEME.bgOrange, borderRadius: '8px', border: `1px solid ${THEME.border}`, position: 'relative', minHeight: '110px', direction: 'ltr' }}>
                                <div style={{ position: 'relative', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: gColor }}>{ly.gan}</span>
                                    {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -12, fontSize: '14px', color: '#888', padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
                                </div>
                                <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '2px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: zColor }}>{ly.zhi}</span>
                                    <div style={{ position: 'absolute', top: 8, right: -12, display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>{displayBottomRight.map((item, idx) => (<span key={idx} style={{ fontSize: '14px', lineHeight: '1.1', color: '#888' }}>{item}</span>))}</div>
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '6px', textAlign: 'center' }}>
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

   // 計算五行數量
   const calculateWuXingStrength = () => {
       const counts = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
       
       // 取出四柱所有的字
       const chars = [
           data.bazi.yearGan, data.bazi.yearZhi,
           data.bazi.monthGan, data.bazi.monthZhi,
           data.bazi.dayGan, data.bazi.dayZhi,
           data.bazi.timeGan, data.bazi.timeZhi
       ];

       chars.forEach(char => {
           const wx = WUXING_MAP[char];
           if (wx && counts[wx] !== undefined) {
               counts[wx]++;
           }
       });
       
       return counts;
   };   

   const firstRow = data.daYuns ? data.daYuns.slice(0, 5) : [];
   const secondRow = data.daYuns ? data.daYuns.slice(5, 10) : [];

   const btnStyle = { 
       padding: '8px 12px', 
       backgroundColor: THEME.bgGray, 
       borderRadius: '20px', 
       border: 'none', 
       color: THEME.gray, 
       fontSize: '12px', 
       fontWeight: 'bold', 
       cursor: 'pointer',
       display: 'flex', 
       alignItems: 'center', 
       gap: '4px',
       whiteSpace: 'nowrap'
   };

return (
     <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: THEME.bg }}>
       {/* 上方資訊與操作列 */}
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 1, marginRight: '8px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: THEME.black }}>{data.name} <span style={{ fontSize: '14px', color: THEME.gray, fontWeight: 'normal' }}>({data.genderText})</span></div>
                 <button onClick={() => setShowHiddenStems(!showHiddenStems)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', border: `1px solid ${THEME.border}`, backgroundColor: showHiddenStems ? THEME.black : THEME.white, color: showHiddenStems ? THEME.white : THEME.black, fontSize: '12px', cursor: 'pointer' }}>
                     {showHiddenStems ? <Eye size={14}/> : <EyeOff size={14}/>} {showHiddenStems ? '藏干' : '十神'}
                 </button>
             </div>

             {data.isManual ? (
                 <div style={{ fontSize: '13px', color: THEME.gray, marginTop: '6px' }}></div>
             ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
                    <div style={{ fontSize: '13px', color: THEME.gray }}>西曆 {data.solarDate}</div>
                    <div style={{ fontSize: '13px', color: THEME.purple, fontWeight: '500' }}>農曆 {data.lunarDate}</div>
                 </div>
             )}

             {data.yunInfo ? (
                 <>
                     <div style={{ fontSize: '13px', color: THEME.blue, marginTop: '4px', fontWeight: 'bold' }}>{data.yunInfo.detail}</div>
                     <div style={{ fontSize: '13px', color: THEME.blue, marginTop: '4px', fontWeight: 'bold' }}>(西元 {data.yunInfo.startDate} 起運)</div>
                 </>
             ) : null}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => onSave(data)} style={btnStyle}>
                 <Bookmark size={14} /> 保存
              </button>
              <button onClick={onBack} style={btnStyle}>
                 <RefreshCw size={14} /> 重排
              </button>
          </div>
       </div>
       
       {/* 修正：將 colorTheme={safeTheme} 傳遞給 PillarCard */}
       <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <PillarCard title="時柱" gan={data.bazi.timeGan} zhi={data.bazi.timeZhi} naYin={data.naYin.time} dayMaster={data.bazi.dayGan} showHiddenStems={showHiddenStems} colorTheme={safeTheme} />
          <PillarCard title="日柱" gan={data.bazi.dayGan} zhi={data.bazi.dayZhi} naYin={data.naYin.day} dayMaster={data.bazi.dayGan} showHiddenStems={showHiddenStems} colorTheme={safeTheme} />
          <PillarCard title="月柱" gan={data.bazi.monthGan} zhi={data.bazi.monthZhi} naYin={data.naYin.month} dayMaster={data.bazi.dayGan} showHiddenStems={showHiddenStems} colorTheme={safeTheme} />
          <PillarCard title="年柱" gan={data.bazi.yearGan} zhi={data.bazi.yearZhi} naYin={data.naYin.year} dayMaster={data.bazi.dayGan} showHiddenStems={showHiddenStems} colorTheme={safeTheme} />
       </div>
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
           <h4 style={{ margin: '0 0 12px 0', borderLeft: `4px solid ${THEME.blue}`, paddingLeft: '8px', fontSize: '15px' }}>大運</h4>
           <div>{renderDaYunRow(firstRow)}{renderDaYunRow(secondRow)}</div>
       </div>
       {renderLiuNianGrid()}
       {renderLiuYueGrid()}
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', borderLeft: `4px solid ${THEME.orange}`, paddingLeft: '8px' }}>五行強弱</h4>
{(() => {
           const wxCounts = calculateWuXingStrength();
           // 定義五行生成順序 (木火土金水) 或您喜歡的順序
           const order = ['木', '火', '土', '金', '水']; 
           
           return (
               <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                       {order.map(elm => (
                           <div key={elm} style={{ padding: '6px 12px', backgroundColor: THEME.bgGray, borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                               {elm}: <span style={{ fontWeight: 'bold', color: wxCounts[elm] > 2 ? THEME.red : THEME.black }}>{wxCounts[elm]}</span>
                           </div>
                       ))}
                   </div>
               </div>
           );
       })()}
      </div>
     </div>
   );
};

// --- 7. 主程式 (BaziApp) ---
export default function BaziApp() {
  const libStatus = useLunarScript();
  const [view, setView] = useState('input');
  const [baziData, setBaziData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [editingData, setEditingData] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [ziHourRule, setZiHourRule] = useState('ziShi');
  
  // [新增] 顏色主題狀態，預設為 'elemental' (五行五色)
  const [colorTheme, setColorTheme] = useState('elemental');

  // 讀取設定 (改用 Preferences 寫法)
  useEffect(() => {
    const loadData = async () => {
      try {
        const { value: savedBk } = await Preferences.get({ key: 'bazi_bookmarks' });
        if (savedBk) setBookmarks(JSON.parse(savedBk));

        const { value: savedPro } = await Preferences.get({ key: 'bazi_is_pro' });
        if (savedPro === 'true') setIsPro(true);

        const { value: savedRule } = await Preferences.get({ key: 'bazi_zi_rule' });
        if (savedRule) setZiHourRule(savedRule);

        // [新增] 讀取顏色主題
        const { value: savedTheme } = await Preferences.get({ key: 'bazi_color_theme' });
        if (savedTheme) setColorTheme(savedTheme);

      } catch (e) {
        console.error("讀取儲存資料失敗:", e);
      }
    };
    loadData();
  }, []);

  // 儲存 ziHourRule
  useEffect(() => { 
      const saveRule = async () => {
          await Preferences.set({ key: 'bazi_zi_rule', value: ziHourRule });
      };
      saveRule();
  }, [ziHourRule]);

  // [新增] 儲存 colorTheme
  useEffect(() => { 
      const saveTheme = async () => {
          await Preferences.set({ key: 'bazi_color_theme', value: colorTheme });
      };
      saveTheme();
  }, [colorTheme]);

  // ... (保留 handleCalculate, saveBookmark 等其他邏輯不變) ...
  const handleCalculate = (formData) => {
     if (libStatus !== 'ready') return;
     try {
        const result = calculateBaziResult(formData, ziHourRule);
        setBaziData(result); 
        setEditingData(null); 
        setView('result');
     } catch(e) { 
        console.error(e);
        alert('日期格式錯誤或計算異常'); 
     }
  };

  const saveBookmark = async (data) => {
      const existingIndex = bookmarks.findIndex(b => b.id === data.id);
      if (existingIndex < 0 && !isPro && bookmarks.length >= 5) {
          alert("免費版最多只能儲存 5 筆紀錄。\n請升級專業版以解除限制，或刪除舊紀錄。");
          return;
      }
      let newBk;
      if (existingIndex >= 0) { newBk = [...bookmarks]; newBk[existingIndex] = data; alert('紀錄已更新'); } 
      else { newBk = [data, ...bookmarks]; alert('已保存至紀錄'); }
      setBookmarks(newBk); 
      await Preferences.set({ key: 'bazi_bookmarks', value: JSON.stringify(newBk) });
  };
  
  const deleteBookmark = async (id, e) => {
      e.stopPropagation();
      if (window.confirm('確定要刪除這條紀錄嗎？')) {
          const newBk = bookmarks.filter(b => b.id !== id);
          setBookmarks(newBk); 
          await Preferences.set({ key: 'bazi_bookmarks', value: JSON.stringify(newBk) });
      }
  };
  
  const editBookmark = (data, e) => {
      e.stopPropagation(); setEditingData({ ...data.rawDate, id: data.id }); setView('input');
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

  const handlePurchase = async () => {
    if (window.confirm("是否支付 US$35 升級為專業版 (移除所有廣告及無限命盤紀錄空間)？")) {
       setIsPro(true); 
       await Preferences.set({ key: 'bazi_is_pro', value: 'true' });
       alert("感謝您的購買！");
    }
  };

  if (libStatus === 'loading') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>載入命理數據庫...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: THEME.white, fontFamily: '-apple-system, sans-serif', paddingTop: 'max(env(safe-area-inset-top), 25px)', width: '100vw', overflow: 'hidden' }}>
      <style>{`
        @font-face { font-family: '青柳隷書SIMO2_T'; src: url('/fonts/AoyagiReishoSIMO2_T.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
        * { box-sizing: border-box; } body { margin: 0; }
      `}</style>
      
      <Header isPro={isPro} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
          {view === 'input' && <><BaziInput onCalculate={handleCalculate} initialData={editingData} colorTheme={colorTheme} />{!isPro && <AdBanner onRemoveAds={handlePurchase} />}</>}
          
          {/* [修改] 傳遞 colorTheme 給 BaziResult */}
          {view === 'result' && <><BaziResult data={baziData} onBack={() => { setEditingData(null); setView('input'); }} onSave={saveBookmark} colorTheme={colorTheme} />{!isPro && <AdBanner onRemoveAds={handlePurchase} />}</>}
            
          {view === 'bookmarks' && (
              <div style={{ padding: '16px', backgroundColor: THEME.bg, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                    <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        我的命盤紀錄
                        <span style={{ fontSize: '16px', fontWeight: 'normal', color: (!isPro && bookmarks.length >= 5) ? THEME.red : THEME.gray }}>
                            ({bookmarks.length}{!isPro && '/5'})
                        </span>
                    </h2>
                  </div>
                  {bookmarks.length === 0 ? <p style={{ color: THEME.gray, textAlign: 'center', marginTop: '40px' }}>暫無紀錄</p> : bookmarks.map((b, i) => (
                        <div key={b.id || i} onClick={() => openBookmark(b)} style={{ padding: '16px', backgroundColor: THEME.white, marginBottom: '10px', borderRadius: '12px', border: `1px solid ${THEME.border}`, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div>
                               <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{b.name} <span style={{ fontSize: '12px', color: THEME.gray, fontWeight: 'normal' }}>({b.genderText})</span></div>
                               <div style={{ fontSize: '12px', color: THEME.gray, marginTop: '4px' }}>{b.solarDate}</div>
                           </div>
                           <div style={{ display: 'flex', gap: '8px' }}>
                               <button onClick={(e) => editBookmark(b, e)} style={{ padding: '8px', backgroundColor: THEME.bgBlue, border: 'none', borderRadius: '50%', color: THEME.blue, cursor: 'pointer' }}><Edit3 size={16} /></button>
                               <button onClick={(e) => deleteBookmark(b.id, e)} style={{ padding: '8px', backgroundColor: THEME.bgRed, border: 'none', borderRadius: '50%', color: THEME.red, cursor: 'pointer' }}><Trash2 size={16} /></button>
                           </div>
                        </div>
                  ))}
              </div>
          )}
          {view === 'booking' && <BookingView onNavigate={() => setView('input')} />}
          
          {/* [修改] 傳遞 colorTheme 設定給 SettingsView */}
          {view === 'settings' && <SettingsView 
            ziHourRule={ziHourRule} setZiHourRule={setZiHourRule} 
            colorTheme={colorTheme} setColorTheme={setColorTheme}
            isPro={isPro} onPurchase={handlePurchase} 
          />}
      </div>

      <div style={{ position: 'relative', width: '100%', zIndex: 50, flexShrink: 0 }}>
          <div style={{ backgroundColor: THEME.white, borderTop: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-around', padding: '8px 0 24px 0' }}>
              <button onClick={() => { setEditingData(null); setView('input'); }} style={{ background: 'none', border: 'none', color: (view==='input'||view==='result') ? THEME.blue : THEME.gray, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Grid size={22} /><span style={{ fontSize: '10px' }}>排盤</span></button>
              <button onClick={() => setView('bookmarks')} style={{ background: 'none', border: 'none', color: view==='bookmarks' ? THEME.blue : THEME.gray, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Bookmark size={22} /><span style={{ fontSize: '10px' }}>紀錄</span></button>
              <button onClick={() => setView('booking')} style={{ background: 'none', border: 'none', color: view==='booking' ? THEME.blue : THEME.gray, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><CalendarCheck size={22} /><span style={{ fontSize: '10px' }}>預約</span></button>
              <button onClick={() => setView('settings')} style={{ background: 'none', border: 'none', color: view==='settings' ? THEME.blue : THEME.gray, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Settings size={22} /><span style={{ fontSize: '10px' }}>設定</span></button>
          </div>
      </div>
    </div>
  );
}