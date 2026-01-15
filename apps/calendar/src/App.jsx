import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Calendar, CalendarCheck, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Circle, Compass, CloudUpload,
  DoorOpen, Download,
  Edit3, Eye, EyeOff, Grid, Lock, MapPin,
  RefreshCw, RotateCcw, Save, Settings, Sparkles,
  Trash2, Unlock, User, X, Zap
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯 (保持不變)
// =========================================================================
const APP_NAME = "進氣萬年曆";
const APP_VERSION = "進氣萬年曆 v1.3";
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";

// --- 核心數據定義 ---
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const SAN_NIANG_DAYS = [3, 7, 13, 18, 22, 27];

// 對應顏色映射
const STEM_COLORS = [COLORS.jia, COLORS.yi, COLORS.bing, COLORS.ding, COLORS.wu, COLORS.ji, COLORS.geng, COLORS.xin, COLORS.ren, COLORS.gui];
const BRANCH_COLORS = [COLORS.ren, COLORS.ji, COLORS.jia, COLORS.yi, COLORS.wu, COLORS.ding, COLORS.bing, COLORS.ji, COLORS.geng, COLORS.xin, COLORS.wu, COLORS.gui];

// --- 進退氣規則庫 ---
const QI_RULES = {
  stems: [[[-2, 4], [8, 14]], [[-3, 3], [7, 13]], [[-4, 2], [6, 12]], [[5, 11]], [[4, 10]], [[3, 9]], [[2, 8]], [[1, 7]], [[0, 6]], [[-1, 5], [9, 15]]],
  branches: [[[-2, 5], [10, 17]], [[-1, 5], [11, 17]], [[0, 6]], [[1, 7]], [[2, 8]], [[3, 9]], [[4, 10]], [[5, 11]], [[-6, 3], [6, 15]], [[-5, 4], [7, 16]], [[-4, 2], [8, 14]], [[-3, 5], [9, 17]]]
};

// --- 輔助函式與對照表 ---
const JIAN_FIX_MAP = { '满': '滿', '执': '執', '开': '開', '闭': '閉', '建': '建', '除': '除', '平': '平', '定': '定', '破': '破', '危': '危', '成': '成', '收': '收' };
const XIU_FIX_MAP = { '虚': '虛', '娄': '婁', '毕': '畢', '参': '參', '张': '張', '轸': '軫', '角': '角', '亢': '亢', '氐': '氐', '房': '房', '心': '心', '尾': '尾', '箕': '箕', '斗': '斗', '牛': '牛', '女': '女', '虛': '虛', '危': '危', '室': '室', '壁': '壁', '奎': '奎', '婁': '婁', '胃': '胃', '昴': '昴', '畢': '畢', '觜': '觜', '參': '參', '井': '井', '鬼': '鬼', '柳': '柳', '星': '星', '張': '張', '翼': '翼', '軫': '軫' };
const JIAN_CHU_COLOR_MAP = { '建': THEME.red, '除': THEME.blue, '滿': THEME.red, '平': THEME.red, '定': THEME.blue, '執': THEME.blue, '破': THEME.red, '危': THEME.red, '成': THEME.blue, '收': THEME.red, '開': THEME.blue, '閉': THEME.red };
const XIU_COLOR_MAP = { '角': THEME.blue, '房': THEME.blue, '心': THEME.red, '箕': THEME.blue, '斗': THEME.blue, '牛': THEME.red, '女': THEME.red, '虛': THEME.red, '危': THEME.red, '室': THEME.blue, '壁': THEME.blue, '奎': THEME.red, '婁': THEME.blue, '胃': THEME.blue, '亢': THEME.red, '氐': THEME.red, '尾': THEME.blue, '鬼': THEME.red, '柳': THEME.red, '星': THEME.red, '張': THEME.blue, '翼': THEME.red, '軫': THEME.blue, '畢': THEME.blue, '觜': THEME.red, '參': THEME.blue, '井': THEME.blue, '昴': THEME.red };
const XIU_FULL_NAME_MAP = { '角': '角木蛟', '亢': '亢金龍', '氐': '氐土貉', '房': '房日兔', '心': '心月狐', '尾': '尾火虎', '箕': '箕水豹', '斗': '斗木獬', '牛': '牛金牛', '女': '女土蝠', '虛': '虛日鼠', '危': '危月燕', '室': '室火豬', '壁': '壁水貐', '奎': '奎木狼', '婁': '婁金狗', '胃': '胃土雉', '昴': '昴日雞', '畢': '畢月烏', '觜': '觜火猴', '參': '參水猿', '井': '井木犴', '鬼': '鬼金羊', '柳': '柳土獐', '星': '星日馬', '張': '張月鹿', '翼': '翼火蛇', '軫': '軫水蚓' };

const DONG_GONG_RULES = {
  1: { '寅': { r: '凶', t: '建寅日：往亡日。不利起造、結婚姻。' }, '卯': { r: '凶', t: '除卯日：不宜起造、婚姻。' }, '辰': { r: '凶', t: '滿辰日：天富、天賊。' }, '巳': { r: '凶', t: '平巳日：小紅沙日，百事大凶。' }, '午': { r: '吉', t: '定午日：黃沙日，諸吉星蓋照，大吉。' }, '未': { r: '凶', t: '執未日：天賊、朱雀。' }, '申': { r: '凶', t: '破申日：朱雀、勾絞。' }, '酉': { r: '凶', t: '危酉日：辛酉正四廢。', s: {'丁酉': '次吉'} }, '戌': { r: '凶', t: '成戌日：天喜、地網。' }, '亥': { r: '凶', t: '收亥日：勾絞星臨。' }, '子': { r: '次吉', t: '開子日：甲子自死。', s: {'戊子': '吉', '丙子': '吉', '庚子': '吉'} }, '丑': { r: '凶', t: '閉丑日：不利婚姻。' } },
  2: { '卯': { r: '凶', t: '建卯日：天地轉煞。' }, '辰': { r: '凶', t: '除辰日：不利移居。' }, '巳': { r: '吉', t: '滿巳日：天空、往亡。' }, '午': { r: '平', t: '平午日：只宜作生基。' }, '未': { r: '凶', t: '定未日：不利婚姻。', s: {'癸未': '吉'} }, '申': { r: '吉', t: '執申日：天月二德。', s: {'庚申': '凶'} }, '酉': { r: '凶', t: '破酉日：小紅沙。' }, '戌': { r: '次吉', t: '危戌日：宜合板。', s: {'丙戌': '凶', '壬戌': '凶'} }, '亥': { r: '吉', t: '成亥日：天喜。' }, '子': { r: '凶', t: '收子日：忌婚姻。' }, '丑': { r: '凶', t: '開丑日：不利造作。' }, '寅': { r: '平', t: '閉寅日：黃沙日。' } },
  3: { '辰': { r: '凶', t: '建辰日：地網。' }, '巳': { r: '吉', t: '除巳日：丁巳吉。', s: {'丁巳': '吉', '己巳': '吉'} }, '午': { r: '平', t: '滿午日：甲午土鬼。', s: {'壬午': '次吉'} }, '未': { r: '凶', t: '平未日：不宜用事。' }, '申': { r: '吉', t: '定申日：甲申大吉。', s: {'戊申': '凶', '庚申': '凶'} }, '酉': { r: '吉', t: '執酉日：乙酉吉。', s: {'辛酉': '凶'} }, '戌': { r: '凶', t: '破戌日：月建沖破。' }, '亥': { r: '次吉', t: '危亥日：己亥次吉。' }, '子': { r: '凶', t: '成子日：黃沙。' }, '丑': { r: '凶', t: '收丑日：小紅沙。' }, '寅': { r: '吉', t: '開寅日：戊寅天赦。' }, '卯': { r: '凶', t: '閉卯日：百事不宜。' } },
  4: { '巳': { r: '凶', t: '建巳日：小紅沙。' }, '午': { r: '吉', t: '除午日：黃沙。', s: {'丙午': '凶', '戊午': '凶'} }, '未': { r: '次吉', t: '滿未日：辛未次吉。' }, '申': { r: '凶', t: '平申日：朱雀。' }, '酉': { r: '凶', t: '定酉日：九土鬼。' }, '戌': { r: '凶', t: '執戌日：丙戌大凶。', s: {'甲戌': '次吉'} }, '亥': { r: '凶', t: '破亥日：往亡日。' }, '子': { r: '吉', t: '危子日：庚子大吉。', s: {'甲子': '凶', '壬子': '凶'} }, '丑': { r: '凶', t: '成丑日：天喜。' }, '寅': { r: '凶', t: '收寅日：天喜。' }, '卯': { r: '吉', t: '開卯日：辛卯大吉。' }, '辰': { r: '凶', t: '閉辰日：戊辰大凶。' } },
  5: { '午': { r: '凶', t: '建午日：天地轉煞。', s: {'甲午': '次吉'} }, '未': { r: '次吉', t: '除未日：乙未不利。', s: {'乙未': '凶'} }, '申': { r: '吉', t: '滿申日：甲申吉。', s: {'壬申': '凶', '庚申': '平'} }, '酉': { r: '凶', t: '平酉日：小紅沙。' }, '戌': { r: '吉', t: '定戌日：甲戌大吉。', s: {'丙戌': '凶', '壬戌': '凶'} }, '亥': { r: '次吉', t: '執亥日：乙亥次吉。', s: {'癸亥': '凶'} }, '子': { r: '凶', t: '破子日：天賊。' }, '丑': { r: '凶', t: '危丑日：丁丑大凶。' }, '寅': { r: '吉', t: '成寅日：黃沙。' }, '卯': { r: '凶', t: '收卯日：往亡。' }, '辰': { r: '吉', t: '開辰日：丙辰大吉。', s: {'戊辰': '凶', '甲辰': '凶'} }, '巳': { r: '吉', t: '閉巳日：乙巳大吉。' } },
  6: { '未': { r: '凶', t: '建未日：乙未大凶。' }, '申': { r: '吉', t: '除申日：甲申大吉。', s: {'丙申': '凶'} }, '酉': { r: '次吉', t: '滿酉日：乙酉次吉。', s: {'丁酉': '凶', '己酉': '凶'} }, '戌': { r: '凶', t: '平成日：諸事招官非。', s: {'甲戌': '次吉'} }, '亥': { r: '吉', t: '定亥日：丁亥大吉。', s: {'辛亥': '凶', '癸亥': '凶'} }, '子': { r: '次吉', t: '執子日：黃沙。', s: {'丙子': '吉', '庚子': '吉', '甲子': '凶', '壬子': '凶'} }, '丑': { r: '凶', t: '破丑日：小紅沙。' }, '寅': { r: '吉', t: '危寅日：甲寅大吉。' }, '卯': { r: '吉', t: '成卯日：天喜。' }, '辰': { r: '次吉', t: '收辰日：甲辰天德。' }, '巳': { r: '次吉', t: '開巳日：乙巳次吉。' }, '午': { r: '平', t: '閉午日：往亡。', s: {'戊午': '凶'} } },
  7: { '申': { r: '凶', t: '建申日：庚申煞。' }, '酉': { r: '次吉', t: '除酉日：往亡。', s: {'辛酉': '凶'} }, '戌': { r: '凶', t: '滿戌日：天富。' }, '亥': { r: '凶', t: '平亥日：螣蛇纏繞。' }, '子': { r: '吉', t: '定子日：丙子大吉。', s: {'甲子': '凶', '壬子': '凶'} }, '丑': { r: '凶', t: '執丑日：丁丑不可用。' }, '寅': { r: '凶', t: '破寅日：甲寅正四廢。' }, '卯': { r: '吉', t: '危卯日：癸卯大吉。', s: {'乙卯': '凶'} }, '辰': { r: '次吉', t: '成辰日：天喜。', s: {'戊辰': '凶', '甲辰': '凶'} }, '巳': { r: '凶', t: '收巳日：小紅沙。' }, '午': { r: '吉', t: '開午日：黃沙。', s: {'庚午': '凶'} }, '未': { r: '次吉', t: '閉未日：天成。', s: {'乙未': '凶'} } },
  8: { '酉': { r: '凶', t: '建酉日：小紅沙。' }, '戌': { r: '次吉', t: '除戌日：庚戌次吉。', s: {'丙戌': '凶', '壬戌': '凶'} }, '亥': { r: '吉', t: '滿亥日：天富。', s: {'癸亥': '凶'} }, '子': { r: '吉', t: '平子日：往亡。', s: {'甲子': '凶', '壬子': '凶'} }, '丑': { r: '次吉', t: '定丑日：辛丑次吉。', s: {'己丑': '凶'} }, '寅': { r: '吉', t: '執寅日：黃沙。', s: {'甲寅': '凶'} }, '卯': { r: '次吉', t: '破卯日：天賊。', s: {'乙卯': '凶'} }, '辰': { r: '吉', t: '危辰日：壬辰大吉。', s: {'甲辰': '凶'} }, '巳': { r: '吉', t: '成巳日：天喜。' }, '午': { r: '次吉', t: '收午日：福星。', s: {'戊午': '凶', '庚午': '凶'} }, '未': { r: '次吉', t: '開未日：丁未次吉。', s: {'乙未': '凶'} }, '申': { r: '吉', t: '閉申日：戊申天赦。' } },
  9: { '戌': { r: '凶', t: '建戌日：餘戌大凶。', s: {'丙戌': '吉'} }, '亥': { r: '吉', t: '除亥日：天成。', s: {'癸亥': '凶'} }, '子': { r: '吉', t: '滿子日：黃沙。', s: {'壬子': '凶'} }, '丑': { r: '凶', t: '平丑日：小紅沙。' }, '寅': { r: '吉', t: '定寅日：丙寅大吉。', s: {'甲寅': '凶'} }, '卯': { r: '吉', t: '執卯日：辛卯大吉。', s: {'乙卯': '凶'} }, '辰': { r: '次吉', t: '破辰日：往亡。', s: {'戊辰': '凶', '甲辰': '凶'} }, '巳': { r: '吉', t: '危巳日：乙巳大吉。' }, '午': { r: '吉', t: '成午日：天喜。' }, '未': { r: '次吉', t: '收未日：己未次吉。', s: {'乙未': '凶'} }, '申': { r: '次吉', t: '開申日：天賊。', s: {'庚申': '凶'} }, '酉': { r: '凶', t: '閉酉日：暴敗。' } },
  10: { '亥': { r: '凶', t: '建亥日：不利起造。' }, '子': { r: '凶', t: '除子日：轉煞。', s: {'甲子': '次吉'} }, '丑': { r: '凶', t: '滿丑日：天富。' }, '寅': { r: '次吉', t: '平寅日：甲寅上吉。', s: {'甲寅': '吉'} }, '卯': { r: '吉', t: '定卯日：乙卯大吉。' }, '辰': { r: '凶', t: '執辰日：甲辰只可偷修。' }, '巳': { r: '凶', t: '破巳日：小紅沙。', s: {'乙巳': '次吉'} }, '午': { r: '吉', t: '危午日：黃沙。', s: {'丙午': '凶'} }, '未': { r: '凶', t: '成未日：乙未煞。', s: {'癸未': '吉'} }, '申': { r: '吉', t: '收申日：甲申大吉。', s: {'庚申': '凶'} }, '酉': { r: '吉', t: '開酉日：乙酉上吉。' }, '戌': { r: '次吉', t: '閉戌日：甲戌月德。', s: {'丙戌': '凶', '戊戌': '凶'} } },
  11: { '子': { r: '凶', t: '建子日：火星。' }, '丑': { r: '吉', t: '除丑日：天乙。' }, '寅': { r: '吉', t: '滿寅日：黃沙。' }, '卯': { r: '凶', t: '平卯日：天賊。', s: {'乙卯': '次吉'} }, '辰': { r: '凶', t: '定辰日：天羅地網。', s: {'壬辰': '次吉'} }, '巳': { r: '吉', t: '執巳日：乙巳大吉。', s: {'丁巳': '凶'} }, '午': { r: '凶', t: '破午日：天賊。' }, '未': { r: '吉', t: '危未日：丁未大吉。', s: {'乙未': '凶'} }, '申': { r: '吉', t: '成申日：天喜。', s: {'庚申': '凶', '丙申': '凶'} }, '酉': { r: '凶', t: '收酉日：小紅沙。' }, '戌': { r: '次吉', t: '開戌日：往亡。', s: {'甲戌': '吉', '丙戌': '凶', '壬戌': '凶'} }, '亥': { r: '吉', t: '閉亥日：乙亥大吉。', s: {'癸亥': '凶', '辛亥': '凶'} } },
  12: { '丑': { r: '次吉', t: '建丑日：小紅沙。' }, '寅': { r: '吉', t: '除寅日：庚寅大吉。' }, '卯': { r: '次吉', t: '滿卯日：天富。' }, '辰': { r: '凶', t: '平辰日：到州星。', s: {'壬辰': '次吉', '庚辰': '次吉'} }, '巳': { r: '凶', t: '定巳日：天成。', s: {'癸巳': '次吉'} }, '午': { r: '吉', t: '執午日：庚午吉。', s: {'丙午': '凶'} }, '未': { r: '吉', t: '破未日：丁未大吉。', s: {'己未': '凶', '辛未': '凶', '乙未': '凶'} }, '申': { r: '次吉', t: '危申日：庚申次吉。' }, '酉': { r: '吉', t: '成酉日：天喜。' }, '戌': { r: '次吉', t: '收戌日：庚戌先凶後吉。', s: {'丙戌': '凶', '壬戌': '凶', '戊戌': '凶'} }, '亥': { r: '吉', t: '開亥日：天賊。', s: {'癸亥': '凶', '辛亥': '凶'} }, '子': { r: '凶', t: '閉子日：黃沙。' } }
};

const GET_SHI_CHEN_MAPPING = (rule) => {
  const base = [
    { name: '丑', time: '01:00-03:00', hour: 2 }, { name: '寅', time: '03:00-05:00', hour: 4 }, { name: '卯', time: '05:00-07:00', hour: 6 },
    { name: '辰', time: '07:00-09:00', hour: 8 }, { name: '巳', time: '09:00-11:00', hour: 10 }, { name: '午', time: '11:00-13:00', hour: 12 },
    { name: '未', time: '13:00-15:00', hour: 14 }, { name: '申', time: '15:00-17:00', hour: 16 }, { name: '酉', time: '17:00-19:00', hour: 18 },
    { name: '戌', time: '19:00-21:00', hour: 20 }, { name: '亥', time: '21:00-23:00', hour: 22 }
  ];
  return rule === 'ziShi' 
    ? [{ name: '子', time: '23:00-01:00', hour: 0 }, ...base]
    : [{ name: '早子', time: '00:00-01:00', hour: 0 }, ...base, { name: '夜子', time: '23:00-24:00', hour: 23 }];
};

const getDefaultTimeIndex = (hour, rule) => {
  const mapping = GET_SHI_CHEN_MAPPING(rule);
  if (rule === 'ziShi') {
    if (hour >= 23 || hour < 1) return 0;
    for (let i = 1; i < mapping.length; i++) { if (hour >= mapping[i].hour && hour < mapping[i].hour + 2) return i; }
  } else {
    if (hour === 23) return 12; if (hour === 0) return 0;
    for (let i = 1; i < mapping.length - 1; i++) { if (hour >= mapping[i].hour && hour < mapping[i].hour + 2) return i; }
  }
  return 6; 
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

const getLocalDateString = (date) => {
  if (!date || isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getShiGan = (dayGan, timeZhiName) => {
  if (!dayGan) return '';
  const dayGanIdx = TIANGAN.indexOf(dayGan);
  const zhiMap = { '子':0, '早子':0, '丑':1, '寅':2, '卯':3, '辰':4, '巳':5, '午':6, '未':7, '申':8, '酉':9, '戌':10, '亥':11, '夜子':12 };
  const zhiIdx = zhiMap[timeZhiName] ?? 0;
  return TIANGAN[((dayGanIdx % 5) * 2 + zhiIdx) % 10];
};

// --- 共用小組件: ToggleSelector (修改：藍底白字，圓頭風格) ---
const ToggleSelector = ({ options, currentValue, onChange }) => (
  <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '30px', padding: '4px', border: `1px solid ${THEME.border}` }}>
    {options.map((opt) => {
      const isActive = currentValue === opt.val;
      return (
        <button
          key={opt.val}
          onClick={() => onChange(opt.val)}
          style={{
            flex: 1,
            padding: '8px 16px',
            borderRadius: '24px', // 圓頭
            border: 'none',
            fontSize: '13px',
            fontWeight: isActive ? 'bold' : 'normal',
            backgroundColor: isActive ? THEME.blue : 'transparent', // 藍底
            color: isActive ? 'white' : THEME.gray, // 白字
            boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// --- SettingsView ---
const SettingsView = ({ 
    ziHourRule, setZiHourRule,   // App 專屬設定
    bookmarks, setBookmarks      // 共用資料
}) => {
  // 定義這個 App 獨有的資訊
  const APP_INFO = {
    appName: APP_NAME,
    version: APP_VERSION,
    about: "本應用程式旨在提供精確的流年流月進退氣萬年曆查詢，結合民間簡易神煞，輔助使用者進行擇日與命理分析。",
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
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>子時設定</div>
              <ToggleSelector options={[{val: 'ziZheng', label: '子正換日'}, {val: 'ziShi', label: '子時換日'}]} currentValue={ziHourRule} onChange={setZiHourRule} />
          </div>
      </div>

      {/* 2. 共用功能區塊 (直接使用 UI Library) */}
      <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="CALENDAR_BACKUP" />
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

// --- 組件: Calendar Toolbar ---
const CalendarToolbar = ({ currentDate, onToday, solarTerms, headerGanZhi, onToggleQiMenu, onTitleClick }) => (
  <div style={{ backgroundColor: THEME.white, padding: '10px 16px', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> 
        <button onClick={(e) => { e.stopPropagation(); onToggleQiMenu(); }} style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: THEME.bgBlue, border: `1px solid ${THEME.blue}`, borderRadius: '12px', padding: '4px 10px', cursor: 'pointer' }}>
             <Zap size={14} color={THEME.blue} fill={THEME.blue} />
             <span style={{ fontSize: '12px', fontWeight: 'bold', color: THEME.blue }}>進退氣</span>
        </button>
      </div>
      <button onClick={onToday} style={{ color: THEME.blue, fontSize: '14px', fontWeight: 'bold', background: 'none', border: 'none', outline: 'none', cursor: 'pointer' }}>返回今天</button>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
       <div onClick={onTitleClick} style={{ position: 'relative', display: 'flex', alignItems: 'baseline', cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: THEME.black }}>{currentDate.getFullYear()}</span>
          <span style={{ fontSize: '28px', fontWeight: '800', color: THEME.black, marginLeft: '6px' }}>{currentDate.getMonth()+1}</span>
          <ChevronRight size={20} color={THEME.lightGray} style={{ marginLeft: '4px', transform: 'translateY(2px)' }} />
       </div>
       <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
           {headerGanZhi && (<span style={{ fontSize: '13px', color: THEME.gray, fontWeight: '500', lineHeight: '1.2' }}>{headerGanZhi.year} {headerGanZhi.month}</span>)}
           <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', lineHeight: '1.2' }}>
              {solarTerms.map((term, idx) => (<span key={idx} style={{ color: THEME.purple, fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>{term.name}{term.day}日</span>))}
           </div>
       </div>
    </div>
  </div>
);

// --- 組件: Calendar 相關 ---
const YearMonthPicker = ({ visible, onClose, onConfirm, initialDate }) => {
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth() + 1);
  useEffect(() => { if (visible) { setSelectedYear(initialDate.getFullYear()); setSelectedMonth(initialDate.getMonth() + 1); } }, [visible, initialDate]);
  if (!visible) return null;
  const years = []; for (let y = 1900; y <= 2100; y++) years.push(y);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }} onClick={onClose}>
      <div style={{ backgroundColor: THEME.white, borderRadius: '16px', width: '85%', maxWidth: '320px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: THEME.black }}>跳轉日期</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}><X size={24} color={THEME.gray} /></button>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: THEME.gray, marginBottom: '6px' }}>年份</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px', backgroundColor: THEME.white }}>{years.map(y => <option key={y} value={y}>{y}年</option>)}</select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: THEME.gray, marginBottom: '6px' }}>月份</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px', backgroundColor: THEME.white }}>{months.map(m => <option key={m} value={m}>{m}月</option>)}</select>
          </div>
        </div>
        <button onClick={() => { onConfirm(selectedYear, selectedMonth); onClose(); }} style={{ width: '100%', padding: '12px', backgroundColor: THEME.blue, color: 'white', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>確認跳轉</button>
      </div>
    </div>
  );
};

const DayCell = ({ date, isCurrentMonth, isToday, isSelected, onClick, canRender, bookmarks, qiMode }) => {
  if (!canRender || !date || isNaN(date.getTime())) return <div style={{ height: '75px', background: '#fff' }}></div>;
  let data = { lunarDisplay: date.getDate(), ganZhi: '', jian: '', xiu: '', isSanNiang: false, colorJian: THEME.black, colorXiu: THEME.black, isJieQi: false, dongGongRating: '', isNewYear: false };
  let activeColors = [null, null, null, null];

  try {
      const solar = window.Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
      const lunar = solar.getLunar();
      const d = lunar.getDay();
      const m = lunar.getMonthInChinese();
      const term = lunar.getJieQi();
      if (term) { 
          data.lunarDisplay = term;
          data.isJieQi = true;
      } else {
        if (lunar.getMonth() === 1 && d <= 3) {
            data.lunarDisplay = `年初${['一','二','三'][d-1]}`;
            data.isNewYear = true; 
        } 
        else if (d === 1) {
            let monthDisplay = m;
            if (m === '冬') monthDisplay = '十一';
            if (m === '腊') monthDisplay = '十二';
            else if (m === '臘') monthDisplay = '十二';
            data.lunarDisplay = `${monthDisplay}月`;
        } 
        else {
            data.lunarDisplay = lunar.getDayInChinese();
        }
      }

      data.ganZhi = lunar.getDayInGanZhi();
      const rawJian = lunar.getZhiXing();
      const fixJian = JIAN_FIX_MAP[rawJian] || rawJian;
      data.jian = fixJian; data.colorJian = JIAN_CHU_COLOR_MAP[rawJian] || JIAN_CHU_COLOR_MAP[fixJian] || THEME.teal;
      const rawXiu = lunar.getXiu();
      const fixXiu = XIU_FIX_MAP[rawXiu] || rawXiu;
      data.xiu = fixXiu; data.colorXiu = XIU_COLOR_MAP[rawXiu] || XIU_COLOR_MAP[fixXiu] || THEME.red;
      if (SAN_NIANG_DAYS.includes(d)) data.isSanNiang = true;
      const monthNum = Math.abs(lunar.getMonth());
      const dayZhi = lunar.getDayZhi(); const dayGanZhi = lunar.getDayInGanZhi();
      const dgRule = DONG_GONG_RULES[monthNum]?.[dayZhi];
      if (dgRule) data.dongGongRating = (dgRule.s && dgRule.s[dayGanZhi]) ? dgRule.s[dayGanZhi] : dgRule.r;
      if (qiMode) {
          let baseStemIdx = -1, baseBranchIdx = -1;
          let currStemIdx = -1, currBranchIdx = -1;
          if (qiMode === 'nian') {
              baseStemIdx = TIANGAN.indexOf(lunar.getYearGan());
              baseBranchIdx = DIZHI.indexOf(lunar.getYearZhi());
              currStemIdx = TIANGAN.indexOf(lunar.getMonthGan());
              currBranchIdx = DIZHI.indexOf(lunar.getMonthZhi());
          } else if (qiMode === 'yue') {
              baseStemIdx = TIANGAN.indexOf(lunar.getMonthGan());
              baseBranchIdx = DIZHI.indexOf(lunar.getMonthZhi());
              currStemIdx = TIANGAN.indexOf(lunar.getDayGan());
              currBranchIdx = DIZHI.indexOf(lunar.getDayZhi());
          }
          const getRelIdx = (bIdx) => (bIdx - 2 + 12) % 12;
          const currRelIdx = getRelIdx(currBranchIdx); 
          [-1, 0, 1].forEach(offset => {
              const targetStemIdx = (baseStemIdx + offset + 10) % 10;
              const targetBranchIdx = (baseBranchIdx + offset + 12) % 12;
              const sRules = QI_RULES.stems[targetStemIdx];
              const bRules = QI_RULES.branches[targetBranchIdx];
              const myPos = currRelIdx - (offset * 12);
              if (sRules) {
                   sRules.forEach(range => {
                      if (myPos >= range[0] && myPos <= range[1]) {
                          const color = STEM_COLORS[targetStemIdx];
                          if (targetStemIdx % 2 === 0) activeColors[0] = color;
                          else activeColors[1] = color;
                      }
                  });
              }
              if (bRules) {
                  bRules.forEach(range => {
                      if (myPos >= range[0] && myPos <= range[1]) {
                          const color = BRANCH_COLORS[targetBranchIdx];
                          if (targetBranchIdx % 2 === 0) activeColors[2] = color;
                          else activeColors[3] = color;
                      }
                  });
              }
          });
      }

  } catch (e) { console.error(e); }

  const isBookmarked = bookmarks.includes(getLocalDateString(date));
  const dayOfWeek = date.getDay();
  const numColor = (dayOfWeek === 0) ? THEME.red : THEME.black;
  let bg = THEME.white;
  let textOpacity = 1;
  if (!isCurrentMonth) { bg = '#e0e0e0'; textOpacity = 0.45; }

return (
    <div onClick={() => onClick(date)} style={{ height: '75px', backgroundColor: bg, borderRight: `1px solid ${THEME.border}`, borderBottom: `1px solid ${THEME.border}`, position: 'relative', cursor: 'pointer', boxSizing: 'border-box', overflow: 'hidden' }}>
      {activeColors[0] && <div style={{ position: 'absolute', left: 0, right: 0, top: '0%', height: '25%', backgroundColor: activeColors[0], opacity: 0.4, zIndex: 1 }} />}
      {activeColors[1] && <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', height: '25%', backgroundColor: activeColors[1], opacity: 0.4, zIndex: 1 }} />}
      {activeColors[2] && <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '25%', backgroundColor: activeColors[2], opacity: 0.4, zIndex: 1 }} />}
      {activeColors[3] && <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', height: '25%', backgroundColor: activeColors[3], opacity: 0.4, zIndex: 1 }} />}
      <div style={{ opacity: textOpacity, position: 'relative', height: '100%', zIndex: 2, textShadow: qiMode ? '0 0 2px #fff, 0 0 3px #fff, 0 0 4px #fff' : 'none', fontWeight: qiMode ? 'bold' : 'normal' }}>
          <div style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '20px', fontWeight: '800', color: numColor, lineHeight: 1 }}>{date.getDate()}</div>
          <div style={{ position: 'absolute', top: '3px', right: '3px', fontSize: '14px', fontWeight: 'bold', color: THEME.teal, writingMode: 'vertical-rl', lineHeight: '1', letterSpacing: '1px' }}>{data.ganZhi}</div>
          {data.isSanNiang && (<div style={{ position: 'absolute', top: '38px', left: '4px', fontSize: '8px', color: THEME.red, border: `1px solid ${THEME.red}`, borderRadius: '4px', padding: '1px 0px' }}>三娘煞</div>)}
          <div style={{ position: 'absolute', top: '22px', left: '4px', fontSize: '12px', fontWeight: 'bold', color: data.isNewYear ? THEME.red : (data.isJieQi ? THEME.purple : THEME.black), whiteSpace: 'nowrap' }}>{data.lunarDisplay}</div>
          <div style={{ position: 'absolute', bottom: '16px', right: '4px', fontSize: '12px', fontWeight: 'bold', color: data.colorXiu, textAlign: 'right' }}>{data.xiu}</div>
          <div style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '14px', fontWeight: 'bold', color: data.colorJian }}>{data.jian}</div>
          {data.dongGongRating && (
            <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '11px', fontWeight: 'bold', color: data.dongGongRating.includes('吉') ? THEME.blue : (data.dongGongRating.includes('凶') ? THEME.red : THEME.gray) }}>{data.dongGongRating}</div>
          )}
      </div>
      {isBookmarked && <div style={{ position: 'absolute', top: '4px', right: '28px', width: '6px', height: '6px', backgroundColor: THEME.red, borderRadius: '50%', zIndex: 3 }}></div>}
      {isSelected && <div style={{ position: 'absolute', inset: 0, border: `2px solid ${THEME.blue}`, pointerEvents: 'none', zIndex: 10 }}></div>}
    </div>
  );
};

const TimePickerModal = ({ visible, onClose, onSelect, currentRule, currentIndex, dayGan }) => {
  if (!visible) return null;
  const mapping = GET_SHI_CHEN_MAPPING(currentRule);
  const upperRow = mapping.slice(0, 6);
  const lowerRow = mapping.slice(6);
  const formatTimeRange = (timeStr) => {
      const parts = timeStr.split('-');
      const start = parseInt(parts[0].split(':')[0], 10);
      let end = parseInt(parts[1].split(':')[0], 10);
      if (end === 24) end = 0;
      return `${start}-${end}`;
  };
  const renderButton = (item, idx, rowOffset) => {
      const realIdx = idx + rowOffset;
      const isSelected = realIdx === currentIndex;
      const stem = getShiGan(dayGan, item.name);
      const displayName = item.name.replace('早','').replace('夜','');
      return (
        <button key={item.name} onClick={() => onSelect(realIdx)} style={{ flex: 1, padding: '10px 0', margin: 0, borderRadius: '8px', border: isSelected ? `1px solid ${THEME.blue}` : `1px solid ${THEME.border}`, backgroundColor: isSelected ? THEME.bgBlue : THEME.white, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', minWidth: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: isSelected ? THEME.blue : THEME.black, marginBottom: '2px' }}>{stem}{displayName}</div>
          <div style={{ fontSize: '11px', color: THEME.lightGray, fontWeight: '500' }}>{formatTimeRange(item.time)}</div>
        </button>
      );
  };
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ backgroundColor: THEME.white, borderRadius: '16px', width: '96%', maxWidth: '390px', padding: '20px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: THEME.black }}>選擇時辰</h3><div style={{ fontSize: '12px', color: THEME.gray, marginTop: '2px' }}>日干: <span style={{ color: THEME.orange, fontWeight: 'bold' }}>{dayGan}</span></div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px' }}><X size={24} color={THEME.gray} /></button>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>{upperRow.map((item, idx) => renderButton(item, idx, 0))}</div>
        <div style={{ display: 'flex', gap: '6px' }}>{lowerRow.map((item, idx) => renderButton(item, idx, 6))}</div>
      </div>
    </div>
  );
};

// --- InfoBridge: 新增折疊功能 (解決遮擋問題) ---
const InfoBridge = ({ info, date, isBookmarked, toggleBookmark, onOpenTimePicker, isExpanded, onToggleExpand }) => {
  if (!info) return null;
  const baziFontStyle = { fontSize: '18px', color: THEME.orange, fontWeight: '800', fontFamily: 'fangsong' };
  
  return (
    <div style={{ backgroundColor: '#f0f2f5', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
      {/* 1. 可點擊的標題列 (總是顯示) */}
      <div onClick={onToggleExpand} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: THEME.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.black }}>{date.getFullYear()}年{date.getMonth()+1}月{date.getDate()}日 週{info.weekDay}</div>
               {isExpanded ? <ChevronDown size={18} color={THEME.gray} /> : <ChevronUp size={18} color={THEME.gray} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             {/* 未展開時，顯示簡易摘要 */}
             {!isExpanded && (
                 <div style={{ fontSize: '13px', color: THEME.gray }}>
                    {info.lunarStr} {info.ganZhiYear}
                 </div>
             )}
             <button onClick={(e) => { e.stopPropagation(); toggleBookmark(date); }} style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer' }}><Bookmark size={18} fill={isBookmarked ? THEME.red : 'none'} color={isBookmarked ? THEME.red : THEME.gray} /></button>
          </div>
      </div>

      {/* 2. 詳細資訊區 (根據 isExpanded 顯示/隱藏) */}
      {isExpanded && (
        <div style={{ padding: '0 12px 8px 12px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
                <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '13px', color: THEME.gray, marginBottom: '4px' }}>{info.ganZhiYear} 肖{info.zodiacAnimal} {info.lunarStr}</div>
                     {info.isSanNiang && (<div><span style={{ color: THEME.red, border: `1px solid ${THEME.red}`, padding: '0px 4px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#fff1f0' }}>三娘煞 不宜嫁娶</span></div>)}
                </div>
                {/* 八字盤 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
                     <div style={{ fontSize: '12px', color: THEME.blue, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', width: '110px', marginBottom: '2px' }}><span style={{ cursor: 'pointer' }} onClick={onOpenTimePicker}>時</span><span>日</span><span>月</span><span>年</span></div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', width: '110px' }}>
                         <div onClick={onOpenTimePicker} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', backgroundColor: '#e6f7ff', borderRadius: '4px', padding: '0px 0' }}><span style={baziFontStyle}>{info.bazi.timeGan}</span><span style={baziFontStyle}>{info.bazi.timeZhi}</span></div>
                         <div style={{ display: 'flex', flexDirection: 'column' }}><span style={baziFontStyle}>{info.bazi.dayGan}</span><span style={baziFontStyle}>{info.bazi.dayZhi}</span></div>
                         <div style={{ display: 'flex', flexDirection: 'column' }}><span style={baziFontStyle}>{info.bazi.monthGan}</span><span style={baziFontStyle}>{info.bazi.monthZhi}</span></div>
                         <div style={{ display: 'flex', flexDirection: 'column' }}><span style={baziFontStyle}>{info.bazi.yearGan}</span><span style={baziFontStyle}>{info.bazi.yearZhi}</span></div>
                     </div>
                </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
};

const BottomSection = ({ info }) => {
  if (!info) return null;
  const zhiXing = info.jian;
  const xiu = info.xiu;
  return (
    <div style={{ padding: '8px 12px', backgroundColor: '#f0f2f5', flexShrink: 0 }}>
       <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <DetailCard title="十二建除" value={zhiXing} color={JIAN_CHU_COLOR_MAP[zhiXing]} />
          <DetailCard title="二十八星宿" value={info.xiuFull} color={XIU_COLOR_MAP[xiu]} />
       </div>
       <DongGongCard rating={info.dongGongRating} text={info.dongGongText} />
    </div>
  );
};

const DetailCard = ({ title, value, sub, color }) => (
  <div style={{ backgroundColor: THEME.white, borderRadius: '8px', padding: '8px', flex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontSize: '12px', color: THEME.gray, marginBottom: '2px' }}>{title}</div>
    <div style={{ fontSize: '18px', fontWeight: 'bold', color: color }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: THEME.gray, marginTop: '2px' }}>{sub}</div>}
  </div>
);

const DongGongCard = ({ rating, text }) => {
  let bg = THEME.white; let borderColor = THEME.border;
  if (rating.includes('吉')) { bg = THEME.bgBlue; borderColor = THEME.blue; }
  else if (rating.includes('凶')) { bg = THEME.bgRed; borderColor = THEME.red; }
  else if (rating.includes('平')) { bg = THEME.bgOrange; borderColor = THEME.orange; }
  return (
    <div style={{ backgroundColor: bg, borderRadius: '8px', padding: '8px 12px', border: `1px solid ${borderColor}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: THEME.black }}>董公擇日</span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: borderColor }}>{rating}</span>
       </div>
       <div style={{ fontSize: '13px', color: THEME.black, lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{text}</div>
    </div>
  );
};

// --- Main App Component ---

export default function CalendarApp() {
  const libStatus = useLunarScript();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookmarks, setBookmarks] = useState([]);
  const [view, setView] = useState('calendar');
  const [ziHourRule, setZiHourRule] = useState('ziShi'); 
  const [timeIndex, setTimeIndex] = useState(6);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [qiMode, setQiMode] = useState(null);
  const [showQiMenu, setShowQiMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // 3. 解決遮擋：新增面板展開狀態 (預設關閉，讓月曆最大化)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  // 觸控滑動相關 State
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    const lockOrientation = async () => { try { if (window.screen?.orientation?.lock) await window.screen.orientation.lock("portrait"); } catch (e) {} };
    lockOrientation();
  }, []);

  useEffect(() => {
    const savedRule = localStorage.getItem('zi_hour_rule');
    if (savedRule) setZiHourRule(savedRule);
    const savedDateStr = localStorage.getItem('selected_date');
    if (savedDateStr) { const d = new Date(savedDateStr); if (!isNaN(d.getTime())) { setSelectedDate(d); setCurrentDate(d); } }
    const savedBk = localStorage.getItem('calendar_bookmarks');
    if (savedBk) { try { setBookmarks(JSON.parse(savedBk)); } catch(e) {} }
    // 移除 isPro 讀取
    const currentHour = new Date().getHours();
    const ruleToUse = savedRule || 'ziZheng';
    setTimeIndex(getDefaultTimeIndex(currentHour, ruleToUse));
  }, []);

  useEffect(() => { localStorage.setItem('zi_hour_rule', ziHourRule); }, [ziHourRule]);
  useEffect(() => { if (!isNaN(selectedDate.getTime())) localStorage.setItem('selected_date', getLocalDateString(selectedDate)); }, [selectedDate]);
  useEffect(() => {
      const mapping = GET_SHI_CHEN_MAPPING(ziHourRule);
      if (timeIndex >= mapping.length) setTimeIndex(0); 
  }, [ziHourRule]);

  // 移除 handlePurchase 函式

  const handleQiModeSelect = (mode) => {
    setQiMode(mode === qiMode ? null : mode);
    setShowQiMenu(false);
  };

  const toggleBookmark = (date) => {
    const s = getLocalDateString(date);
    let newBookmarks;
    if (bookmarks.includes(s)) newBookmarks = bookmarks.filter(b => b !== s);
    else newBookmarks = [s, ...bookmarks];
    setBookmarks(newBookmarks);
    localStorage.setItem('calendar_bookmarks', JSON.stringify(newBookmarks));
  };

  const restoreBookmarks = (importedData) => {
     // 匯入資料格式驗證與轉換
     const newIds = importedData.map(item => typeof item === 'string' ? item : item.id);
     const merged = [...new Set([...bookmarks, ...newIds])];
     setBookmarks(merged);
     localStorage.setItem('calendar_bookmarks', JSON.stringify(merged));
     alert('書籤匯入成功！');
  };

  // 換月邏輯
  const changeMonth = (offset) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentDate(newDate);
  };
  
  // 直接跳轉到指定年月
  const jumpToDate = (year, month) => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    // 選擇該月1號為默認選中
    setSelectedDate(newDate);
  };

  // 觸控事件偵測 (左右滑動)
  const onTouchStart = (e) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const minSwipeDistance = 50;
      if (distance > minSwipeDistance) changeMonth(1);
      else if (distance < -minSwipeDistance) changeMonth(-1);
  };

  const solarTerms = useMemo(() => {
    if (libStatus !== 'ready') return [];
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const days = [];
        for (let d = 1; d <= new Date(year, month, 0).getDate(); d++) {
            const term = window.Solar.fromYmd(year, month, d).getLunar().getJieQi();
            if (term) days.push({ name: term, day: d });
        }
        return days;
    } catch(e) { return []; }
  }, [currentDate, libStatus]);

  const headerGanZhi = useMemo(() => {
      if (libStatus !== 'ready' || !selectedDate) return null;
      try {
          const solar = window.Solar.fromYmd(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate());
          const lunar = solar.getLunar();
          return { year: lunar.getYearInGanZhi() + '年', month: lunar.getMonthInGanZhi() + '月' };
      } catch(e) { return null; }
  }, [selectedDate, libStatus]);

  const selectedInfo = useMemo(() => {
    if (libStatus !== 'ready' || !selectedDate) return null;
    const mapping = GET_SHI_CHEN_MAPPING(ziHourRule);
    const safeTimeIndex = (timeIndex >= 0 && timeIndex < mapping.length) ? timeIndex : 0;
    try {
        const targetHour = mapping[safeTimeIndex].hour;
        let lunarForDay, lunarForTime; 
        if (ziHourRule === 'ziZheng' && targetHour === 23) {
            const solarDay = window.Solar.fromYmdHms(selectedDate.getFullYear(), selectedDate.getMonth()+1, selectedDate.getDate(), 22, 0, 0);
            lunarForDay = solarDay.getLunar();
            const solarTime = window.Solar.fromYmdHms(selectedDate.getFullYear(), selectedDate.getMonth()+1, selectedDate.getDate(), 23, 30, 0);
            lunarForTime = solarTime.getLunar();
        } else {
            const solar = window.Solar.fromYmdHms(selectedDate.getFullYear(), selectedDate.getMonth()+1, selectedDate.getDate(), targetHour, 0, 0);
            lunarForDay = solar.getLunar();
            lunarForTime = solar.getLunar();
        }
        const isSanNiang = SAN_NIANG_DAYS.includes(lunarForDay.getDay()); 
        const monthNum = Math.abs(lunarForDay.getMonth());
        const dayZhi = lunarForDay.getDayZhi();
        const dayGanZhi = lunarForDay.getDayInGanZhi();
        const dgRule = DONG_GONG_RULES[monthNum]?.[dayZhi];
        let dgRating = '平'; let dgText = '暫無資料';
        if (dgRule) {
            dgText = dgRule.t;
            if (dgRule.s && dgRule.s[dayGanZhi]) { dgRating = dgRule.s[dayGanZhi]; dgText += ` (本日${dayGanZhi}為${dgRating})`; } 
            else { dgRating = dgRule.r; }
        }
        const rawJian = lunarForDay.getZhiXing();
        const fixJian = JIAN_FIX_MAP[rawJian] || rawJian;
        const rawXiu = lunarForDay.getXiu(); const fixXiu = XIU_FIX_MAP[rawXiu] || rawXiu;
        const xiuFull = XIU_FULL_NAME_MAP[fixXiu] || (fixXiu + '宿');

        let lunarMonthName = lunarForDay.getMonthInChinese();
        if (lunarMonthName === '冬') lunarMonthName = '十一';
        if (lunarMonthName === '腊') lunarMonthName = '十二';
        else if (lunarMonthName === '臘') lunarMonthName = '十二';

        return {
            weekDay: WEEKDAYS[selectedDate.getDay()],
            ganZhiYear: lunarForDay.getYearInGanZhi(),
            zodiacAnimal: lunarForDay.getYearShengXiao(),
            lunarStr: `${lunarMonthName}月${lunarForDay.getDayInChinese()}`,
            bazi: {
                yearGan: lunarForDay.getYearGan(), yearZhi: lunarForDay.getYearZhi(),
                monthGan: lunarForDay.getMonthGan(), monthZhi: lunarForDay.getMonthZhi(),
                dayGan: lunarForDay.getDayGan(), dayZhi: lunarForDay.getDayZhi(),
                timeGan: lunarForTime.getTimeGan(), timeZhi: lunarForTime.getTimeZhi()
            },
            jian: fixJian, xiu: fixXiu, xiuFull: xiuFull,
            dongGongRating: dgRating, dongGongText: dgText, isSanNiang: isSanNiang,
            currentTimeName: mapping[safeTimeIndex].name + '時',
            currentTimeRange: mapping[safeTimeIndex].time
        };
    } catch(e) { console.error("InfoBridge Error:", e); return null; }
  }, [selectedDate, libStatus, timeIndex, ziHourRule]);

  const calendarDays = useMemo(() => {
    if (isNaN(currentDate.getTime())) return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push({ date: new Date(year, month, -firstDay.getDay() + 1 + i), isCurrentMonth: false });
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    for (let i = 1; i <= 42 - days.length; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    return days;
  }, [currentDate]);

  // --- 轉換書籤數據給 BookmarkList 使用 ---
  const formattedBookmarks = useMemo(() => {
    return bookmarks
      .map(dateStr => {
        try {
            if(window.Solar) {
                const d = new Date(dateStr);
                const solar = window.Solar.fromYmd(d.getFullYear(), d.getMonth()+1, d.getDate());
                const lunar = solar.getLunar();
                const rawJian = lunar.getZhiXing();
                
                let monthNum = Math.abs(lunar.getMonth());
                const dayZhi = lunar.getDayZhi();
                const dgRule = DONG_GONG_RULES[monthNum]?.[dayZhi];
                let dg = dgRule ? (dgRule.s?.[lunar.getDayInGanZhi()] || dgRule.r) : '';

                return {
                    id: dateStr,
                    name: dateStr, 
                    lunarDateStr: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
                    jianChu: JIAN_FIX_MAP[rawJian] || rawJian,
                    dongGong: dg,
                    solarDate: dateStr
                };
            }
        } catch(e) {}
        return { id: dateStr, name: dateStr, solarDate: dateStr };
      })
      .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
  }, [bookmarks, libStatus]);


  if (libStatus === 'loading') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8c8c8c' }}>載入萬年曆數據...</div>;
  if (libStatus === 'error') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'red' }}>載入失敗，請檢查網路連線</div>;

  const TABS = [
      { id: 'calendar', label: '萬年曆', icon: Calendar },
      { id: 'bookmarks', label: '書籤', icon: Bookmark },
      { id: 'booking', label: '預約', icon: CalendarCheck },
      { id: 'settings', label: '設定', icon: Settings },
  ];

  return (
      <div style={COMMON_STYLES.fullScreen}>
        <style>{`
          @font-face { font-family: '青柳隷書SIMO2_T'; src: url('/fonts/AoyagiReishoSIMO2_T.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
        `}</style>
        
      {/* ✅ 共用 Header */}
      <AppHeader title={APP_NAME} logoChar={{ main: '進', sub: '氣' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        {/* 進退氣選單 (Overlay) */}
        {showQiMenu && (
          <div onClick={() => setShowQiMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'transparent' }}>
             <div style={{ position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: `1px solid ${THEME.border}` }}>
                <button onClick={(e) => { e.stopPropagation(); handleQiModeSelect('nian'); }} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: qiMode === 'nian' ? THEME.blue : '#f0f0f0', color: qiMode === 'nian' ? 'white' : THEME.black }}>流年</button>
                <button onClick={(e) => { e.stopPropagation(); handleQiModeSelect('yue'); }} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', backgroundColor: qiMode === 'yue' ? THEME.blue : '#f0f0f0', color: qiMode === 'yue' ? 'white' : THEME.black }}>流月</button>
             </div>
          </div>
        )}

        {/* 2. Content Area (根據 View 切換) */}
        {view === 'calendar' && (
          <>
            <CalendarToolbar 
              currentDate={currentDate} 
              onToday={() => { const n = new Date(); setCurrentDate(n); setSelectedDate(n); }} 
              solarTerms={solarTerms} 
              headerGanZhi={headerGanZhi} 
              onToggleQiMenu={() => setShowQiMenu(!showQiMenu)} 
              onTitleClick={() => setShowDatePicker(true)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', flexShrink: 0, width: '100%' }}>
              {WEEKDAYS.map((d, i) => (<div key={i} style={{ textAlign: 'center', padding: '6px 0', fontSize: '12px', color: THEME.gray }}>{d}</div>))}
            </div>
            
            <div 
              onTouchStart={onTouchStart} 
              onTouchMove={onTouchMove} 
              onTouchEnd={onTouchEnd} 
              style={{ flex: 1, overflowY: 'auto', backgroundColor: THEME.white, minHeight: 0, width: '100%' }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${THEME.border}`, width: '100%' }}>
                  {calendarDays.map((item, idx) => (
                    <DayCell key={idx} {...item} isToday={getLocalDateString(item.date) === getLocalDateString(new Date())} isSelected={getLocalDateString(item.date) === getLocalDateString(selectedDate)} onClick={(d) => !isNaN(d.getTime()) && setSelectedDate(d)} canRender={libStatus === 'ready'} bookmarks={bookmarks} qiMode={qiMode} />
                  ))}
                </div>
            </div>

            {/* 廣告條 (常駐顯示) */}
            <AdBanner />

            {/* 下方資訊面板 - 支援折疊以解決遮擋問題 */}
            <div style={{ 
                height: isPanelExpanded ? '40vh' : 'auto', // 展開時固定高度，收合時自適應(只顯示標題列)
                display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5', borderTop: `1px solid ${THEME.border}`, zIndex: 10, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', flexShrink: 0, width: '100%',
                transition: 'height 0.3s ease'
            }}>
               <div style={{ flex: 1, overflowY: isPanelExpanded ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                  <InfoBridge 
                      info={selectedInfo} 
                      date={selectedDate} 
                      isBookmarked={bookmarks.includes(getLocalDateString(selectedDate))} 
                      toggleBookmark={toggleBookmark} 
                      onOpenTimePicker={() => setShowTimeModal(true)} 
                      isExpanded={isPanelExpanded}
                      onToggleExpand={() => setIsPanelExpanded(!isPanelExpanded)}
                  />
                  {isPanelExpanded && <BottomSection info={selectedInfo} />}
              </div>
            </div>
          </>
        )}

        {view === 'bookmarks' && (
          <div style={COMMON_STYLES.contentArea}>
             <div style={{ padding: '16px', backgroundColor: THEME.bg }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                  <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的書籤</h2>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <BookmarkList 
                        bookmarks={formattedBookmarks} 
                        onSelect={(b) => {
                            const d = new Date(b.id);
                            if(!isNaN(d.getTime())) {
                                setCurrentDate(d);
                                setSelectedDate(d);
                                setView('calendar');
                            }
                        }}
                        onDelete={(id) => {
                             if(window.confirm('確定刪除此書籤？')) toggleBookmark(new Date(id));
                        }}
                    />
                </div>
             </div>
          </div>
        )}
        
        {view === 'settings' && (
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', backgroundColor: THEME.bg }}>
                <SettingsView 
                    ziHourRule={ziHourRule} 
                    setZiHourRule={setZiHourRule} 
                    bookmarks={bookmarks}
                    onRestore={restoreBookmarks}
                />
            </div>
        )}
        
        {view === 'booking' && (
            <BookingSystem apiUrl={API_URL} onNavigate={() => setView('calendar')} />
        )}
      </div>
      
      {/* 全域 Modal 與 提示 */}
      <TimePickerModal visible={showTimeModal} onClose={() => setShowTimeModal(false)} currentRule={ziHourRule} currentIndex={timeIndex} dayGan={selectedInfo?.bazi?.dayGan} onSelect={(idx) => { setTimeIndex(idx); setShowTimeModal(false); }} />

      <YearMonthPicker 
        visible={showDatePicker} 
        initialDate={currentDate}
        onClose={() => setShowDatePicker(false)}
        onConfirm={jumpToDate}
      />
      
      <InstallGuide />

      {/* 3. Bottom Tab Bar (底部導航) */}
      <BottomTabBar tabs={TABS} currentTab={view} onTabChange={setView} />
      
    </div>
  );
}