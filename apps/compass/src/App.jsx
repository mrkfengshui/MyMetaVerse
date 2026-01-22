// 1. 引入共用 UI 和 工具
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';

import { 
  AdBanner, Adsterra, AppHeader, AppInfoCard, 
  BookingSystem, BottomTabBar, BookmarkList, BuyMeCoffee, 
  InstallGuide, WebBackupManager, 
  COLORS, THEME, COMMON_STYLES
} from '@my-meta/ui';

import { useProtection } from '@my-meta/ui';

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
const APP_NAME = "甯博風水";
const APP_VERSION = "v1.0";
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";

// 數字轉中文對照表 (全域使用)
const PERIOD_MAP_CHART = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };

const GUA_TO_DIR = {
    '坎': '北', '離': '南', '震': '東', '兌': '西',
    '巽': '東南', '坤': '西南', '艮': '東北', '乾': '西北'
};

// --- 核心數據定義 ---
const MOUNTAINS = [
    { name: '子', angle: 0, gua: '坎', yuan: '天' }, { name: '癸', angle: 15, gua: '坎', yuan: '人' },
    { name: '丑', angle: 30, gua: '艮', yuan: '地' }, { name: '艮', angle: 45, gua: '艮', yuan: '天' }, { name: '寅', angle: 60, gua: '艮', yuan: '人' },
    { name: '甲', angle: 75, gua: '震', yuan: '地' }, { name: '卯', angle: 90, gua: '震', yuan: '天' }, { name: '乙', angle: 105, gua: '震', yuan: '人' },
    { name: '辰', angle: 120, gua: '巽', yuan: '地' }, { name: '巽', angle: 135, gua: '巽', yuan: '天' }, { name: '巳', angle: 150, gua: '巽', yuan: '人' },
    { name: '丙', angle: 165, gua: '離', yuan: '地' }, { name: '午', angle: 180, gua: '離', yuan: '天' }, { name: '丁', angle: 195, gua: '離', yuan: '人' },
    { name: '未', angle: 210, gua: '坤', yuan: '地' }, { name: '坤', angle: 225, gua: '坤', yuan: '天' }, { name: '申', angle: 240, gua: '坤', yuan: '人' },
    { name: '庚', angle: 255, gua: '兌', yuan: '地' }, { name: '酉', angle: 270, gua: '兌', yuan: '天' }, { name: '辛', angle: 285, gua: '兌', yuan: '人' },
    { name: '戌', angle: 300, gua: '乾', yuan: '地' }, { name: '乾', angle: 315, gua: '乾', yuan: '天' }, { name: '亥', angle: 330, gua: '乾', yuan: '人' },
    { name: '壬', angle: 345, gua: '坎', yuan: '地' }, 
];

const YIN_YANG_MAP = {
    1: { '地': 1, '天': -1, '人': -1 }, 2: { '地': -1, '天': 1, '人': 1 },
    3: { '地': 1, '天': -1, '人': -1 }, 4: { '地': -1, '天': 1, '人': 1 },
    5: { '地': -1, '天': 1, '人': 1 },  6: { '地': -1, '天': 1, '人': 1 },
    7: { '地': 1, '天': -1, '人': -1 }, 8: { '地': -1, '天': 1, '人': 1 },
    9: { '地': 1, '天': -1, '人': -1 },
};

const LUOSHU_PATH = [4, 8, 5, 6, 1, 7, 2, 3, 0]; 
const DIRECTION_MAP = { '巽': 0, '離': 1, '坤': 2, '震': 3, '中': 4, '兌': 5, '艮': 6, '坎': 7, '乾': 8 };

const EIGHT_KILLINGS = { '坎': '辰', '坤': '卯', '震': '申', '巽': '酉', '乾': '午', '兌': '巳', '艮': '寅', '離': '亥' };
const YELLOW_SPRING = { '庚': '坤', '丁': '坤', '坤': ['庚', '丁'], '丙': '巽', '乙': '巽', '巽': ['丙', '乙'], '甲': '艮', '癸': '艮', '艮': ['甲', '癸'], '壬': '乾', '辛': '乾', '乾': ['辛', '壬'] };
const EAR_LATE_WATER = { '乾': { early: '離', late: '艮' }, '坎': { early: '兌', late: '坤' }, '艮': { early: '乾', late: '震' }, '震': { early: '艮', late: '離' }, '巽': { early: '坤', late: '兌' }, '離': { early: '震', late: '乾' }, '坤': { early: '坎', late: '巽' }, '兌': { early: '巽', late: '坎' } };
const NA_JIA = { '乾': ['甲'], '坎': ['癸', '申', '子', '辰'], '艮': ['丙'], '震': ['庚', '亥', '卯', '未'], '巽': ['辛'], '離': ['壬', '寅', '午', '戌'], '坤': ['乙'], '兌': ['丁', '巳', '酉', '丑'] };
const FAN_GUA_CONFIG = { '坎': { mt: '兌', water: '坎' }, '艮': { mt: '離', water: '艮' }, '震': { mt: '坤', water: '震' }, '巽': { mt: '乾', water: '巽' }, '離': { mt: '艮', water: '離' }, '坤': { mt: '震', water: '坤' }, '兌': { mt: '坎', water: '兌' }, '乾': { mt: '巽', water: '乾' } };

const BA_ZHAI_INFO = {
    '生氣': { type: '吉', color: '#389e0d', star: '貪狼', desc: '大吉之位。主財運亨通、事業騰達。' },
    '天醫': { type: '吉', color: '#096dd9', star: '巨門', desc: '次吉之位。主健康長壽、貴人相助。' },
    '延年': { type: '吉', color: '#13c2c2', star: '武曲', desc: '中吉之位。主婚姻和諧、人際圓滿。' },
    '伏位': { type: '吉', color: '#595959', star: '輔弼', desc: '小吉之位。主平穩安定、守成待機。' },
    '絕命': { type: '凶', color: '#cf1322', star: '破軍', desc: '大凶之位。主意外傷災、破財損丁。' },
    '五鬼': { type: '凶', color: '#d46b08', star: '廉貞', desc: '大凶之位。主口舌是非、官司火災。' },
    '六煞': { type: '凶', color: '#c41d7f', star: '文曲', desc: '中凶之位。主桃花糾紛、家庭不睦。' },
    '禍害': { type: '凶', color: '#8c8c8c', star: '祿存', desc: '小凶之位。主官司訴訟、是非口舌。' }
};

const BA_ZHAI_MAPPING = {
    '坎': { '坎': '伏位', '巽': '生氣', '震': '天醫', '離': '延年', '坤': '絕命', '艮': '五鬼', '乾': '六煞', '兌': '禍害' },
    '坤': { '坤': '伏位', '艮': '生氣', '兌': '天醫', '乾': '延年', '坎': '絕命', '巽': '五鬼', '離': '六煞', '震': '禍害' },
    '震': { '震': '伏位', '離': '生氣', '坎': '天醫', '巽': '延年', '兌': '絕命', '乾': '五鬼', '艮': '六煞', '坤': '禍害' },
    '巽': { '巽': '伏位', '坎': '生氣', '離': '天醫', '震': '延年', '艮': '絕命', '坤': '五鬼', '兌': '六煞', '乾': '禍害' },
    '乾': { '乾': '伏位', '兌': '生氣', '艮': '天醫', '坤': '延年', '離': '絕命', '震': '五鬼', '坎': '六煞', '巽': '禍害' },
    '兌': { '兌': '伏位', '乾': '生氣', '坤': '天醫', '艮': '延年', '震': '絕命', '離': '五鬼', '巽': '六煞', '坎': '禍害' },
    '艮': { '艮': '伏位', '坤': '生氣', '乾': '天醫', '兌': '延年', '巽': '絕命', '坎': '五鬼', '震': '六煞', '離': '禍害' },
    '離': { '離': '伏位', '震': '生氣', '巽': '天醫', '坎': '延年', '乾': '絕命', '兌': '五鬼', '坤': '六煞', '艮': '禍害' }
};

const KUN_REN_YI = {
    '坤': { star: '巨門', type: '吉', color: '#096dd9' }, '壬': { star: '巨門', type: '吉', color: '#096dd9' }, '乙': { star: '巨門', type: '吉', color: '#096dd9' },
    '艮': { star: '破軍', type: '凶', color: '#cf1322' }, '丙': { star: '破軍', type: '凶', color: '#cf1322' }, '辛': { star: '破軍', type: '凶', color: '#cf1322' },
    '巽': { star: '武曲', type: '吉', color: '#389e0d' }, '辰': { star: '武曲', type: '吉', color: '#389e0d' }, '亥': { star: '武曲', type: '吉', color: '#389e0d' },
    '甲': { star: '貪狼', type: '吉', color: '#389e0d' }, '癸': { star: '貪狼', type: '吉', color: '#389e0d' }, '申': { star: '貪狼', type: '吉', color: '#389e0d' },
    '丑': { star: '祿存', type: '凶', color: '#8c8c8c' }, '未': { star: '祿存', type: '凶', color: '#8c8c8c' }, '乾': { star: '祿存', type: '凶', color: '#8c8c8c' },
    '寅': { star: '廉貞', type: '凶', color: '#d46b08' }, '庚': { star: '廉貞', type: '凶', color: '#d46b08' }, '丁': { star: '廉貞', type: '凶', color: '#d46b08' },
    '卯': { star: '文曲', type: '凶', color: '#c41d7f' }, '酉': { star: '文曲', type: '凶', color: '#c41d7f' }, '午': { star: '文曲', type: '凶', color: '#c41d7f' },
    '子': { star: '左輔', type: '吉', color: '#595959' }, '戌': { star: '左輔', type: '吉', color: '#595959' }, '巳': { star: '左輔', type: '吉', color: '#595959' }
};

const SHOU_SHAN_CHU_SHA = { '辰': '出煞', '戌': '出煞', '丑': '出煞', '未': '出煞', 
                            '乙': '出煞', '辛': '出煞', '丁': '出煞', '癸': '出煞', 
                            '寅': '出煞', '申': '出煞', '子': '出煞', '午': '出煞', 
                            '艮': '出煞', '坤': '出煞', 
                            '卯': '收山', '酉': '收山', '乾': '收山', '巽': '收山', 
                            '壬': '收山', '丙': '收山', '巳': '收山', '亥': '收山', 
                            '甲': '收山', '庚': '收山' };

const DA_GUA_64 = [
    {n:'復',q:1,y:8},{n:'頤',q:1,y:3},{n:'屯',q:3,y:4},{n:'益',q:8,y:9},{n:'震',q:8,y:8},{n:'噬嗑',q:8,y:3},{n:'隨',q:4,y:7},{n:'無妄',q:2,y:2},
    {n:'明夷',q:2,y:3},{n:'賁',q:2,y:8},{n:'既濟',q:9,y:9},{n:'家人',q:4,y:4},{n:'豐',q:4,y:8},{n:'離',q:3,y:3},{n:'革',q:3,y:4},{n:'同人',q:7,y:7},
    {n:'臨',q:1,y:7},{n:'損',q:1,y:2},{n:'節',q:3,y:9},{n:'中孚',q:8,y:4},{n:'歸妹',q:8,y:7},{n:'睽',q:8,y:2},{n:'兌',q:4,y:1},{n:'履',q:2,y:6},
    {n:'泰',q:1,y:9},{n:'大畜',q:1,y:4},{n:'需',q:3,y:6},{n:'小畜',q:8,y:1},{n:'大壯',q:2,y:9},{n:'大有',q:2,y:4},{n:'夬',q:4,y:6},{n:'乾',q:9,y:1},
    {n:'姤',q:9,y:8},{n:'大過',q:9,y:3},{n:'鼎',q:7,y:4},{n:'恒',q:2,y:9},{n:'巽',q:2,y:8},{n:'井',q:2,y:3},{n:'蠱',q:6,y:7},{n:'升',q:8,y:2},
    {n:'訟',q:8,y:3},{n:'困',q:8,y:8},{n:'未濟',q:1,y:9},{n:'解',q:6,y:4},{n:'渙',q:6,y:8},{n:'坎',q:7,y:3},{n:'蒙',q:7,y:4},{n:'師',q:3,y:7},
    {n:'遯',q:9,y:7},{n:'咸',q:9,y:2},{n:'旅',q:7,y:9},{n:'小過',q:2,y:4},{n:'漸',q:2,y:7},{n:'蹇',q:2,y:2},{n:'艮',q:6,y:1},{n:'謙',q:8,y:6},
    {n:'否',q:9,y:9},{n:'萃',q:9,y:4},{n:'晉',q:7,y:6},{n:'豫',q:2,y:1},{n:'觀',q:8,y:9},{n:'比',q:8,y:4},{n:'剝',q:6,y:6},{n:'坤',q:1,y:1}
];

const STAR_COMBINATIONS = {
// 1白水
    '1-1': { title: '坎宮重疊', text: '雙一雙水，主漂泊、桃花、文書往來。吉則利文貴，凶則淫蕩漂流。', source: '玄空秘旨：坎宮重疊，身飄蕩而無依。' },
    '1-2': { title: '土水相剋', text: '土剋水，主婦女掌權，需防腎病、腸胃病。', source: '紫白訣：一二，土水相剋，中男被中女之欺。' },
    '1-3': { title: '水木相生', text: '水生木，利長子，發科名，但防是非口舌。', source: '玄機賦：水生木而聲名狼藉？非也，主顯貴。' },
    '1-4': { title: '文昌大旺', text: '一四同宮，準發科名。利讀書、考試、學術研究，亦主桃花。', source: '紫白訣：四一同宮，準發科名之顯。' },
    '1-5': { title: '子癸生瘍', text: '土剋水，主性病、腎病、耳疾，防波折。', source: '飛星賦：子癸生瘍，在一五之位。' },
    '1-6': { title: '金水相生', text: '一六共宗，主武職騰達，技術成名，大吉。', source: '紫白訣：虛聯奎壁，啟八代之文章。' },
    '1-7': { title: '金水多情', text: '金水相生，主桃花、貪花戀酒，亦利口才。', source: '玄空秘旨：金水多情，貪花戀酒。' },
    '1-8': { title: '耳腎之疾', text: '土剋水，八白艮土剋一白水，防耳病、腎病、小兒災。', source: '玄機賦：一八剋傷，中男受辱。' },
    '1-9': { title: '水火既濟', text: '水火交戰，調和則成既濟，主婚喜；不調則主眼疾、心病。', source: '玄空秘旨：南離北坎，位極中央。' },
    // 2黑土
    '2-1': { title: '土剋水', text: '婦人當家，需防腹疾、腎病、流產。', source: '紫白訣：土水相剋，中男被中女之欺。' },
    '2-2': { title: '二黑重疊', text: '純陰，主病符、寡婦，醫院常客，大凶。', source: '玄空秘旨：風行地而硬直難當。' },
    '2-3': { title: '鬥牛煞', text: '木剋土，主口舌是非、官非刑獄、腹痛。', source: '紫白訣：鬥牛煞起惹官刑。' },
    '2-4': { title: '婆媳不和', text: '木剋土，主婆媳不和、腹疾、風疾。', source: '飛星賦：風行地而硬直難當。' },
    '2-5': { title: '二五交加', text: '二黑病符會五黃廉貞，主重病、死亡、破財，大凶之最。', source: '飛星賦：二五交加，罹死亡並生疾病。' },
    '2-6': { title: '富比陶朱', text: '土生金，利財源，主富，但略損健康(腸胃)。', source: '玄機賦：二六富比陶朱。' },
    '2-7': { title: '先天火數', text: '二七同道化火，主火災、熱病，因女色破財。', source: '玄空秘旨：庶妾難投寡母之歡心。' },
    '2-8': { title: '比和旺財', text: '二八合十，利田宅、地產，吉。', source: '紫白訣：二八同宮，少男逢老母。' },
    '2-9': { title: '火炎土燥', text: '火生土，主生愚鈍之子，或眼疾、腸胃病。', source: '玄機賦：火炎土燥，南離何益乎艮坤。' },
    // 3碧木
    '3-1': { title: '水木相生', text: '利長子，發科名，稍防四肢受傷。', source: '紫白訣：一三生子，長男得貴。' },
    '3-2': { title: '鬥牛煞', text: '木剋土，主官非、爭鬥、腸胃病。', source: '紫白訣：鬥牛煞起惹官刑。' },
    '3-3': { title: '蚩尤煞', text: '雙木成林，主爭鬥、盜賊、官災、神經痛。', source: '玄空秘旨：蚩尤碧色，好勇鬥狠。' },
    '3-4': { title: '碧綠風魔', text: '桃花劫，主瘋癲、哮喘、中風、盜賊。', source: '紫白訣：三四碧綠風魔，他處廉貞莫見。' },
    '3-5': { title: '寒戶遭瘟', text: '木剋土，主怪病、中毒、破財、官司。', source: '紫白訣：寒戶遭瘟，緣自三廉夾綠。' },
    '3-6': { title: '金木相戰', text: '金剋木，主手足受傷、肝膽病、車禍。', source: '飛星賦：三六，長男被老父之剋。' },
    '3-7': { title: '穿心煞', text: '金剋木，主盜賊、官災、手足傷、肝病。', source: '紫白訣：三七疊至，被劫盜更見官災。' },
    '3-8': { title: '傷小口', text: '木剋土，不利少男，筋骨損，或絕嗣。', source: '玄空秘旨：八逢三四，損小口而絕嗣。' },
    '3-9': { title: '木火通明', text: '木生火，主聰明、富貴、生貴子。', source: '玄機賦：木見火而生聰明奇士。' },
    // 4綠木
    '4-1': { title: '文昌大旺', text: '水生木，大利科名、考試、桃花、聲望。', source: '玄機賦：名揚科第，貪狼星入巽宮。' },
    '4-2': { title: '腹疾風疾', text: '木剋土，主婆媳不和，脾胃病。', source: '玄空秘旨：風行地而硬直難當。' },
    '4-3': { title: '碧綠風魔', text: '桃花、竊盜、乞丐、風病。', source: '飛星賦：同來震巽，昧事無常。' },
    '4-4': { title: '雙木成林', text: '文昌旺，亦主漂泊、桃花、繩索(自縊)。', source: '玄空秘旨：巽宮重疊，懸樑之厄。' },
    '4-5': { title: '乳癰博奕', text: '木剋土，主皮膚病、乳疾、賭博破財。', source: '飛星賦：乳癰兮，四五。' },
    '4-6': { title: '金木相剋', text: '主懸樑、刀傷、家中婦女不和。', source: '飛星賦：風逢天，巽宮水木傷。' },
    '4-7': { title: '刀傷桃花', text: '金剋木，主桃花劫、刀傷、嘔血。', source: '玄機賦：破軍居巽，雷風擊而金勝木，有傷。' },
    '4-8': { title: '傷小口', text: '木剋土，主精神病、結石、不利幼童。', source: '玄空秘旨：山風值而泉石膏肓。' },
    '4-9': { title: '木火通明', text: '木火相生，利文職、專業人才、喜慶。', source: '玄機賦：木見火而生聰明奇士。' },
    // 5黃土
    '5-1': { title: '子癸生瘍', text: '土剋水，主性病、腎病、泌尿系統疾病。', source: '飛星賦：子癸生瘍。' },
    '5-2': { title: '二五交加', text: '主死亡、重病、破產，大凶。', source: '紫白訣：二五交加，罹死亡並生疾病。' },
    '5-3': { title: '災瘟劫掠', text: '木剋土，主破財、官非、怪病。', source: '玄空秘旨：我生之子，反遭其辱。' },
    '5-4': { title: '乳癰博奕', text: '木剋土，主毒瘡、賭博傾家。', source: '飛星賦：乳癰兮，四五。' },
    '5-5': { title: '二五重疊', text: '大凶，主災禍連連，難以救治。', source: '一般論斷：五黃重疊，兇性最烈。' },
    '5-6': { title: '土金相生', text: '土生金，主頭痛、骨病，化解五黃之氣。', source: '玄空秘旨：土制水復生金，定主田莊之富。' },
    '5-7': { title: '紫黃毒藥', text: '土生金，主口舌、性病、中毒、喉疾。', source: '飛星賦：青樓染疾，只因七九之合(誤?應為五七)。' },
    '5-8': { title: '小口損傷', text: '土多金埋，主筋骨痛、胃病。', source: '玄機賦：五八，小口損傷。' },
    '5-9': { title: '毒藥入口', text: '火生土，晦火，主眼疾、心病、腦病、中毒。', source: '紫白訣：九七合轍，常招回祿之災(此為95)。' },
    // 6白金
    '6-1': { title: '金水相生', text: '利武職、技術、財運，大吉。', source: '玄機賦：職掌兵權，武曲入坎宮。' },
    '6-2': { title: '富比陶朱', text: '土生金，巨富，利地產、金融。', source: '玄機賦：堅金遇土，富比陶朱。' },
    '6-3': { title: '金木相戰', text: '金剋木，主足疾、刀傷、車禍。', source: '玄空秘旨：足以金而蹣跚。' },
    '6-4': { title: '金木相剋', text: '主婦女不和、刀傷、自縊。', source: '飛星賦：雷風金伐，定被刀傷。' },
    '6-5': { title: '骨痛頭痛', text: '五黃煞氣，主頭疾、骨折。', source: '玄空秘旨：庭無耆老，多因寡母遭傷。' },
    '6-6': { title: '比和旺財', text: '官運亨通，利機械、交通。', source: '一般論斷：乾宮重疊，主要領導地位。' },
    '6-7': { title: '交劍煞', text: '兩金相擊，主刀傷、搶劫、車禍、爭鬥。', source: '紫白訣：交劍煞興多劫掠。' },
    '6-8': { title: '武科發跡', text: '土生金，大吉，利軍警、地產、財富。', source: '玄機賦：富比陶朱，堅金遇土。' },
    '6-9': { title: '火燒天門', text: '火剋金，主老父不利、頭病、肺病、逆子。', source: '玄空秘旨：火燒天門張牙舞爪。' },
    // 7赤金
    '7-1': { title: '金水多情', text: '主桃花、才藝，亦主漂泊。', source: '玄空秘旨：金水多情，貪花戀酒。' },
    '7-2': { title: '先天火數', text: '火災、熱病、桃花破財。', source: '玄機賦：火炎土燥，南離何益乎艮坤。' },
    '7-3': { title: '穿心煞', text: '金剋木，主盜賊、官災、肝病。', source: '紫白訣：三七疊至，被劫盜更見官災。' },
    '7-4': { title: '桃花刀傷', text: '金剋木，主婦女淫亂、刀傷。', source: '飛星賦：破軍居巽，雷風擊而金勝木。' },
    '7-5': { title: '紫黃毒藥', text: '主吸毒、中毒、性病、口舌。', source: '飛星賦：青樓染疾。' },
    '7-6': { title: '交劍煞', text: '主爭鬥、刀傷、車禍。', source: '紫白訣：交劍煞興多劫掠。' },
    '7-7': { title: '雙星到會', text: '主醫卜星相、口舌、桃花。', source: '玄空秘旨：兌宮重疊，口舌是非。' },
    '7-8': { title: '少男少女', text: '土生金，主戀愛、富貴。', source: '玄機賦：胃入斗牛，積千箱之玉帛。' },
    '7-9': { title: '回祿之災', text: '火剋金，主火災、心肺病、少女受損。', source: '玄機賦：午酉逢而江湖花酒。' },
    // 8白土
    '8-1': { title: '中男受辱', text: '土剋水，主耳病、腎病、不孕。', source: '玄機賦：一八剋傷，中男受辱。' },
    '8-2': { title: '比和旺財', text: '土多金埋，利地產，稍損小口。', source: '紫白訣：二八同宮，少男逢老母。' },
    '8-3': { title: '傷小口', text: '木剋土，不利兒童、手足傷。', source: '玄空秘旨：八逢三四，損小口而絕嗣。' },
    '8-4': { title: '山風蠱', text: '木剋土，主精神衰弱、結石。', source: '玄空秘旨：山風值而泉石膏肓。' },
    '8-5': { title: '小口損傷', text: '土煞重，主筋骨痛、運滯。', source: '玄機賦：五八，小口損傷。' },
    '8-6': { title: '文武全才', text: '土生金，利功名、財富、健康。', source: '玄機賦：堅金遇土，富比陶朱。' },
    '8-7': { title: '富足風流', text: '土生金，主財旺，但利偏財、娛樂。', source: '玄機賦：胃入斗牛，積千箱之玉帛。' },
    '8-8': { title: '雙星旺財', text: '利置業、地產、財富。', source: '一般論斷：八八雙星，大旺田宅。' },
    '8-9': { title: '喜慶重來', text: '火生土，主婚喜、置業、大發。', source: '紫白訣：八九和諧，婚喜重來。' },
    // 9紫火
    '9-1': { title: '水火既濟', text: '吉則婚喜，凶則眼疾、心臟病。', source: '玄空秘旨：南離北坎，位極中央。' },
    '9-2': { title: '火炎土燥', text: '生愚子，眼疾，血光。', source: '玄機賦：火炎土燥，南離何益乎艮坤。' },
    '9-3': { title: '木火通明', text: '聰明、顯貴、生貴子。', source: '玄機賦：木見火而生聰明奇士。' },
    '9-4': { title: '木火通明', text: '利文昌、桃花、喜慶。', source: '玄機賦：木見火而生聰明奇士。' },
    '9-5': { title: '毒藥入口', text: '主眼疾、心病、重症、火災。', source: '紫白訣：九七合轍，常招回祿(95同論)。' },
    '9-6': { title: '火燒天門', text: '主逆子、肺病、腦溢血。', source: '玄空秘旨：火燒天門張牙舞爪。' },
    '9-7': { title: '回祿之災', text: '主火災、心病、桃花劫。', source: '玄機賦：午酉逢而江湖花酒。' },
    '9-8': { title: '婚喜重來', text: '火生土，主喜事、進財。', source: '紫白訣：八九和諧，婚喜重來。' },
    '9-9': { title: '火曜連珠', text: '目疾、火災，吉則大發文名。', source: '玄機賦：火曜連珠，青雲路上。' },
};

// --- 工具函數 ---
const normalizeAngle = (angle) => { let a = angle % 360; return a < 0 ? a + 360 : a; };

const getMountain = (degree) => {
    const normalized = normalizeAngle(degree);
    let minDiff = 360; 
    let target = MOUNTAINS[0];
    for (let m of MOUNTAINS) {
        let diff = Math.abs(normalizeAngle(m.angle - normalized));
        if (diff > 180) diff = 360 - diff; 
        if (diff < minDiff) { minDiff = diff; target = m; }
    }
    return target;
};

const getGuaFromStr = (str) => {
    if (DIRECTION_MAP[str] !== undefined) return str;
    const found = MOUNTAINS.find(m => m.name === str);
    return found ? found.gua : null;
};

const getStarCombination = (mtStar, faceStar) => {
    const key1 = `${mtStar}-${faceStar}`;
    const key2 = `${faceStar}-${mtStar}`;
    if (STAR_COMBINATIONS[key1]) return STAR_COMBINATIONS[key1];
    if (STAR_COMBINATIONS[key2]) return STAR_COMBINATIONS[key2];
    return { title: '一般組合', text: '無特殊吉凶克應', source: '一般論斷' };
};

const getDaGua = (degree) => {
    const normalized = normalizeAngle(degree);
    const offsetDegree = normalizeAngle(normalized + 2.8125);
    const index = Math.floor(offsetDegree / 5.625);
    const safeIndex = index >= 64 ? 0 : index;
    return DA_GUA_64[safeIndex];
};

const findAuspsiciousDirections = (facingGua) => {
    const suggestions = [];
    const faceQ = facingGua.q; 
    DA_GUA_64.forEach((targetGua, idx) => {
        if (targetGua.n === facingGua.n) return;
        const targetQ = targetGua.q;
        const relations = [];
        if (targetQ === faceQ) relations.push('一卦純清');
        if (targetQ + faceQ === 10) relations.push('合十');
        if (Math.abs(targetQ - faceQ) === 5) relations.push('合生成');
        if (relations.length > 0) {
            const centerDegree = (idx * 5.625) - 2.8125;
            const startDegree = normalizeAngle(centerDegree - 2.8125);
            const endDegree = normalizeAngle(centerDegree + 2.8125);
            const mt = getMountain(centerDegree);
            suggestions.push({
                gua: targetGua,
                relations: relations,
                location: { mountain: mt.name, range: `${startDegree.toFixed(1)}°~${endDegree.toFixed(1)}°` }
            });
        }
    });
    return suggestions;
};

// --- 三元納氣法邏輯 ---
const calculateNaQi = (period, guaName) => {
    const p = Number(period);
    // 納氣：1坎, 2坤, 3震, 4巽, 6乾, 7兌, 8艮, 9離
    const guaMap = { '坎': 1, '坤': 2, '震': 3, '巽': 4, '乾': 6, '兌': 7, '艮': 8, '離': 9 };
    const doorNum = guaMap[guaName];
    
    if (p === 5) return { type: '平', text: '五運寄宮', color: '#fa8c16' };

    // 定義元運：上元(1,2,3,4) 下元(6,7,8,9)
    const isPeriodUpper = p >= 1 && p <= 4;
    const isDoorUpper = doorNum >= 1 && doorNum <= 4;
    const isSameYuan = isPeriodUpper === isDoorUpper;

    if (isSameYuan) {
        if (doorNum === p) {
            return { type: '大吉', text: '當運大發', color: '#389e0d' };
        } else if (doorNum > p) {
            return { type: '吉', text: '未來大發', color: '#13c2c2' };
        } else {
            return { type: '平', text: '運過平安', color: '#fa8c16' };
        }
    } else {
        return { type: '凶', text: '運過衰退', color: '#cf1322' };
    }
};

// --- 商戰核心邏輯 ---
const POSTERIOR_ELEMENTS = { '坎': '水', '艮': '土', '震': '木', '巽': '木', '離': '火', '坤': '土', '兌': '金', '乾': '金' };
const HE_TU_ELEMENTS = { '坎': '水', '坤': '火', '震': '木', '巽': '金', '中': '土', '乾': '水', '兌': '火', '艮': '木', '離': '金' };
const SHOP_NUM_ELEMENTS = { 1: '水', 6: '水', 2: '火', 7: '火', 3: '木', 8: '木', 4: '金', 9: '金', 5: '土', 10: '土', 0: '土' }; // 0處理

const getFiveElementRelation = (me, other) => {
    if (me === other) return { type: '吉', text: '吉', color: '#13c2c2' };
    const relations = {
        '水': { gen: '木', ctrl: '火' }, '火': { gen: '土', ctrl: '金' },
        '土': { gen: '金', ctrl: '水' }, '金': { gen: '水', ctrl: '木' },
        '木': { gen: '火', ctrl: '土' }
    };
    if (relations[me].ctrl === other) return { type: '大吉', text: '財旺', color: '#fa8c16' };
    if (relations[other].gen === me) return { type: '吉', text: '吉', color: '#13c2c2' };
    if (relations[me].gen === other) return { type: '凶', text: '凶', color: '#cf1322' };
    if (relations[other].ctrl === me) return { type: '凶', text: '凶', color: '#cf1322' };
    return { type: '平', text: '平', color: '#999' };
};

// --- 核心計算 ---
const calculateEverything = (degree, period, year, month = 1) => {
    const safePeriod = Number(period) || 9;
    const safeYear = Number(year) || new Date().getFullYear();
    const safeMonth = Number(month) || 1;
    const facingMt = getMountain(degree); 
    const sittingDegree = normalizeAngle(degree + 180);
    const sittingMt = getMountain(sittingDegree); 

    let baseGrid = new Array(9).fill(0);
    let curr = safePeriod;
    for (let i = 0; i < 9; i++) { baseGrid[LUOSHU_PATH[i]] = curr; curr = (curr % 9) + 1; }

    const sitIndex = DIRECTION_MAP[sittingMt.gua];
    const faceIndex = DIRECTION_MAP[facingMt.gua];
    const sitBaseStar = baseGrid[sitIndex]; 
    const faceBaseStar = baseGrid[faceIndex]; 

    const getFlightDirection = (starNum, mountainYuan) => {
        let refStar = (starNum === 5) ? safePeriod : starNum;
        return YIN_YANG_MAP[refStar] ? YIN_YANG_MAP[refStar][mountainYuan] : 1; 
    };

    const sitDir = getFlightDirection(sitBaseStar, sittingMt.yuan);
    const faceDir = getFlightDirection(faceBaseStar, facingMt.yuan);

    let mtGrid = new Array(9).fill(0);
    curr = sitBaseStar;
    for (let i = 0; i < 9; i++) {
        mtGrid[LUOSHU_PATH[i]] = curr;
        if (sitDir === 1) curr++; else curr--;
        if (curr > 9) curr = 1; if (curr < 1) curr = 9;
    }

    let faceGrid = new Array(9).fill(0);
    curr = faceBaseStar;
    for (let i = 0; i < 9; i++) {
        faceGrid[LUOSHU_PATH[i]] = curr;
        if (faceDir === 1) curr++; else curr--;
        if (curr > 9) curr = 1; if (curr < 1) curr = 9;
    }

    let annualBaseStar = (11 - (safeYear % 9)) % 9;
    if (annualBaseStar === 0) annualBaseStar = 9;
    let annualGrid = new Array(9).fill(0);
    curr = annualBaseStar;
    for (let i = 0; i < 9; i++) { annualGrid[LUOSHU_PATH[i]] = curr; curr = (curr % 9) + 1; }

    const yearBranchIdx = safeYear % 12;
    let monthlyStartStar = 0;
    if ([4, 10, 7, 1].includes(yearBranchIdx)) monthlyStartStar = 8;
    else if ([8, 2, 5, 11].includes(yearBranchIdx)) monthlyStartStar = 5;
    else monthlyStartStar = 2;
    let monthlyCenter = (monthlyStartStar - (safeMonth - 1)) % 9;
    if (monthlyCenter <= 0) monthlyCenter += 9;
    let monthlyGrid = new Array(9).fill(0);
    curr = monthlyCenter;
    for (let i = 0; i < 9; i++) { monthlyGrid[LUOSHU_PATH[i]] = curr; curr = (curr % 9) + 1; }

    let sanShaGua = '';
    if ([0, 4, 8].includes(yearBranchIdx)) sanShaGua = '離';
    else if ([6, 10, 2].includes(yearBranchIdx)) sanShaGua = '坎';
    else if ([9, 1, 5].includes(yearBranchIdx)) sanShaGua = '震';
    else sanShaGua = '兌';

    let liShiGua = '';
    if ([0, 4, 8].includes(yearBranchIdx)) liShiGua = '艮';
    else if ([3, 7, 11].includes(yearBranchIdx)) liShiGua = '坤';
    else if ([6, 10, 2].includes(yearBranchIdx)) liShiGua = '乾';
    else liShiGua = '巽';

    const TAI_SUI_MAPPING = { 4: '坎', 5: '艮', 6: '艮', 7: '震', 8: '巽', 9: '巽', 10: '離', 11: '坤', 0: '坤', 1: '兌', 2: '乾', 3: '乾' };
    const taiSuiGua = TAI_SUI_MAPPING[yearBranchIdx];
    const SUI_PO_MAPPING = { '坎': '離', '艮': '坤', '震': '兌', '巽': '乾', '離': '坎', '坤': '艮', '兌': '震', '乾': '巽' };
    const suiPoGua = SUI_PO_MAPPING[taiSuiGua];
    const wuHuangIndex = annualGrid.findIndex(n => n === 5);
    const dirNames = ["巽", "離", "坤", "震", "中", "兌", "艮", "坎", "乾"];
    const wuHuangGua = dirNames[wuHuangIndex];

    const sitPalaceMtStar = mtGrid[sitIndex];
    const sitPalaceFaceStar = faceGrid[sitIndex];
    const facePalaceMtStar = mtGrid[faceIndex];
    const facePalaceFaceStar = faceGrid[faceIndex];
    const p = safePeriod;

    let chartType = '特殊格局';
    if (sitPalaceMtStar === p && facePalaceFaceStar === p) chartType = '旺山旺向';
    else if (facePalaceMtStar === p && sitPalaceFaceStar === p) chartType = '上山下水';
    else if (facePalaceMtStar === p && facePalaceFaceStar === p) chartType = '雙星到向';
    else if (sitPalaceMtStar === p && sitPalaceFaceStar === p) chartType = '雙星到坐';

    const sha8 = EIGHT_KILLINGS[sittingMt.gua] || '無';
    let huangQuan = null;
    const yq = YELLOW_SPRING[facingMt.name] || YELLOW_SPRING[facingMt.gua];
    if (yq) huangQuan = Array.isArray(yq) ? yq.join('/') : yq;
    const waterMethod = EAR_LATE_WATER[sittingMt.gua] || {early:'-', late:'-'};
    
    const dirSequence = [7, 6, 3, 0, 1, 2, 5, 8]; 
    const currentFaceGua = facingMt.gua;
    const seqIdx = dirSequence.findIndex(d => Object.keys(DIRECTION_MAP).find(key => DIRECTION_MAP[key] === d) === currentFaceGua);
    let chengMen = { main: '計算中', sub: '計算中' };
    if (seqIdx !== -1) {
        const prevIdx = (seqIdx - 1 + 8) % 8;
        const nextIdx = (seqIdx + 1) % 8;
        const getGuaName = (idx) => Object.keys(DIRECTION_MAP).find(key => DIRECTION_MAP[key] === idx);
        chengMen.sub = getGuaName(dirSequence[prevIdx]); 
        chengMen.main = getGuaName(dirSequence[nextIdx]);
    }

    const fanGuaCfg = FAN_GUA_CONFIG[sittingMt.gua] || { mt: '無', water: '無' };
    const mountainDragon = { gua: fanGuaCfg.mt, mountains: NA_JIA[fanGuaCfg.mt] || [] };
    const waterDragon = { gua: fanGuaCfg.water, mountains: NA_JIA[fanGuaCfg.water] || [] };
    const baZhaiMap = BA_ZHAI_MAPPING[sittingMt.gua] || {};
    const faceDaGua = getDaGua(degree);
    const sitDaGua = getDaGua(sittingDegree);
    const daGuaSuggestions = findAuspsiciousDirections(faceDaGua);

    return {
        sitting: sittingMt, facing: facingMt,
        baseGrid, mtGrid, faceGrid, annualGrid, monthlyGrid,
        period: safePeriod, year: safeYear, month: safeMonth,
        chartType,
        advanced: {
            sha8, huangQuan, waterMethod, chengMen,
            mountainDragon, waterDragon, baZhaiMap,
            daGua: { sit: sitDaGua, face: faceDaGua, suggestions: daGuaSuggestions },
            yearlyAfflictions: { sanSha: sanShaGua, liShi: liShiGua, wuHuang: wuHuangGua, taiSui: taiSuiGua, suiPo: suiPoGua }
        }
    };
};

// =========================================================================
// PART B: 視圖組件 (UI Views)
// =========================================================================
// 商戰彈窗 (保持不變)
const CommercialView = ({ isOpen, onClose, sittingMt, facingMt }) => {
    const [shopSector, setShopSector] = useState(null); 
    const [shopTotal, setShopTotal] = useState(10); 
    const [shopIndex, setShopIndex] = useState(1);
    
    if (!isOpen) return null;

    const handleTotalChange = (e) => {
        const val = e.target.value;
        if (val === '') { setShopTotal(''); return; }
        const newTotal = parseInt(val, 10);
        if (isNaN(newTotal) || newTotal < 1) return;
        setShopTotal(newTotal);
        if (typeof shopIndex === 'number' && shopIndex > newTotal) setShopIndex(newTotal);
    };

    const handleIndexChange = (e) => {
        const val = e.target.value;
        if (val === '') { setShopIndex(''); return; }
        const newIndex = parseInt(val, 10);
        if (isNaN(newIndex) || newIndex < 1) return;
        const currentTotal = Number(shopTotal) || 1;
        setShopIndex(newIndex > currentTotal ? currentTotal : newIndex);
    };

    const safeTotal = Number(shopTotal) || 0;
    const safeIndex = Number(shopIndex) || 0;
    const mallElement = POSTERIOR_ELEMENTS[sittingMt.gua];
    const sectorElement = shopSector ? HE_TU_ELEMENTS[shopSector] : null; 
    const mallRelation = (mallElement && sectorElement) ? getFiveElementRelation(sectorElement, mallElement) : null;
    const hasValidInput = safeTotal > 0 && safeIndex > 0;
    const myNumKey = safeIndex > 0 ? safeIndex % 10 || 10 : 0; 
    const myElementText = SHOP_NUM_ELEMENTS[myNumKey] || '-';
    const corridorVal = safeTotal - safeIndex + 1;
    const corridorKey = corridorVal > 0 ? corridorVal % 10 || 10 : 0;
    const corridorElementText = SHOP_NUM_ELEMENTS[corridorKey] || '-';
    const corridorRelation = (hasValidInput && myElementText !== '-' && corridorElementText !== '-') ? getFiveElementRelation(myElementText, corridorElementText) : null;
    const guas = ['巽', '離', '坤', '震', '中', '兌', '艮', '坎', '乾'];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }} onClick={onClose}>
            <div style={{ background: '#f5f5f5', width: '100%', maxWidth: '450px', borderRadius: '16px', padding: '20px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:'1px solid #ddd', paddingBottom:'10px'}}>
                    <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'8px', color:'#333'}}><Briefcase size={20}/> 商戰揀舖要訣</h3>
                    <button onClick={onClose} style={{border:'none', background:'none', cursor:'pointer'}}><X size={24} color="#666"/></button>
                </div>
                <div style={{background:'white', borderRadius:'10px', padding:'16px', marginBottom:'16px'}}>
                    <div style={{fontSize:'15px', fontWeight:'bold', marginBottom:'12px', color:'#096dd9'}}>大廈坐向 vs 舖位宮位</div>
                    <div style={{marginBottom:'10px', fontSize:'14px'}}>大廈坐{sittingMt.name}向{facingMt.name}</div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', marginBottom:'12px'}}>
                        {guas.map(g => (
                            <button key={g} onClick={() => setShopSector(g)} style={{ padding:'12px', borderRadius:'6px', border:`1px solid ${shopSector === g ? '#096dd9' : '#ddd'}`, background: shopSector === g ? '#e6f7ff' : 'white', color: shopSector === g ? '#096dd9' : '#333', cursor:'pointer', fontWeight: shopSector === g ? 'bold' : 'normal', fontSize: '16px' }}>{g}</button>
                        ))}
                    </div>
                    {mallRelation && (
                        <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'6px', borderLeft:`4px solid ${mallRelation.color}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontSize:'13px'}}>此舖宮位</div><div style={{fontWeight:'bold', color:mallRelation.color, fontSize:'16px'}}>{mallRelation.text}</div>
                        </div>
                    )}
                </div>
                <div style={{background:'white', borderRadius:'10px', padding:'16px', marginBottom:'16px'}}>
                    <div style={{fontSize:'15px', fontWeight:'bold', marginBottom:'12px', color:'#722ed1'}}>舖位序號</div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'16px'}}>
                        <div><label style={{display:'block', fontSize:'12px', color:'#666', marginBottom:'4px'}}>總舖位數</label><input type="number" min="1" value={shopTotal} onChange={handleTotalChange} style={{width:'100%', padding:'12px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'16px', boxSizing: 'border-box'}}/></div>
                        <div><label style={{display:'block', fontSize:'12px', color:'#666', marginBottom:'4px'}}>心儀舖位序號</label><input type="number" min="1" max={safeTotal} value={shopIndex} onChange={handleIndexChange} style={{width:'100%', padding:'12px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'16px', boxSizing: 'border-box'}}/></div>
                    </div>
                    {hasValidInput && corridorRelation && (
                        <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'6px', borderLeft:`4px solid ${corridorRelation.color}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontSize:'13px'}}>此舖位數</div><div style={{fontWeight:'bold', color:corridorRelation.color, fontSize:'16px'}}>{corridorRelation.text}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 詳情彈窗
const DetailModal = ({ isOpen, onClose, data, facingDaGua }) => {
    if (!isOpen || !data) return null;

    const { mt, face, base, annual, monthly, guaName, combination, baZhaiStar } = data;
    const baZhaiDetail = baZhaiStar ? BA_ZHAI_INFO[baZhaiStar] : null;

    const palaceMountains = MOUNTAINS.filter(m => m.gua === guaName);

    const getDaGuaRelations = (targetGua, refGua) => {
        const rels = [];
        if (targetGua.y === refGua.y) rels.push({t:'同元一氣', c:'#722ed1'});
        if (targetGua.q + refGua.q === 10) rels.push({t:'卦氣合十', c:'#c41d7f'});
        if (targetGua.y + refGua.y === 10) rels.push({t:'卦運合十', c:'#eb2f96'});
        if (Math.abs(targetGua.q - refGua.q) === 5) rels.push({t:'卦氣生成', c:'#13c2c2'});
        return rels;
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px',
                padding: '24px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                maxHeight: '70vh', overflowY: 'auto', overscrollBehavior: 'contain' // 修改 3: 防止滑動時帶動到底層頁面
            }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer'}}>
                    <X size={24} color="#666"/>
                </button>

                <h3 style={{marginTop: 0, fontSize: '20px', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px'}}>
                    {guaName}宮詳解
                </h3>

                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', alignItems:'center'}}>
                    <div style={{textAlign: 'center', position:'relative'}}>
                        <div style={{fontSize: '12px', color: '#666'}}>山星</div>
                        <div style={{fontSize: '32px', fontWeight: 'bold', color: '#333'}}>{mt}</div>
                         <div style={{fontSize: '14px', fontWeight: 'bold', color: '#722ed1', marginTop: '-4px'}}>
                           (年{annual})
                        </div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '12px', color: '#666'}}>運星</div>
                        <div style={{fontSize: '24px', fontWeight: 'bold', color: '#999', marginTop: '-4px'}}>{PERIOD_MAP_CHART[base]}</div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '12px', color: '#666'}}>向星</div>
                        <div style={{fontSize: '32px', fontWeight: 'bold', color: '#d32f2f'}}>{face}</div>
                        <div style={{fontSize: '14px', fontWeight: 'bold', color: '#fa8c16', marginTop: '-4px'}}>
                           (月{monthly})
                        </div>
                    </div>
                </div>

                <div style={{background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                    <div style={{fontSize: '16px', fontWeight: 'bold', color: '#096dd9', marginBottom: '4px'}}>
                        🚀 玄空飛星：{combination.title}
                    </div>
                    <div style={{fontSize: '14px', lineHeight: '1.5', color: '#333', marginBottom: '10px'}}>
                        {combination.text}
                    </div>
                    <div style={{fontSize: '12px', color: '#888', fontStyle: 'italic', borderTop: '1px dashed #ddd', paddingTop: '8px'}}>
                        📖 {combination.source}
                    </div>
                </div>

                {baZhaiDetail && (
                    <div style={{background: '#fff0f6', padding: '16px', borderRadius: '8px', border: `1px solid ${baZhaiDetail.color}`, marginBottom: '16px'}}>
                        <div style={{fontSize: '16px', fontWeight: 'bold', color: baZhaiDetail.color, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            🏠 八宅法：{baZhaiStar} <span style={{fontSize: '12px', background: baZhaiDetail.color, color: 'white', padding: '2px 6px', borderRadius: '4px'}}>{baZhaiDetail.star}</span>
                        </div>
                        <div style={{fontSize: '14px', lineHeight: '1.5', color: '#333'}}>
                            {baZhaiDetail.desc}
                        </div>
                    </div>
                )}

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px'}}>
                     <div style={{background: '#fff7e6', padding: '12px', borderRadius: '8px', border: '1px solid #ffd591'}}>
                        <div style={{fontSize: '14px', fontWeight: 'bold', color: '#d46b08', marginBottom: '8px'}}>
                            ⛰️ 收山出煞
                        </div>
                        <div style={{display: 'flex', flexDirection:'column', gap: '4px'}}>
                            {palaceMountains.map(pm => {
                                const type = SHOU_SHAN_CHU_SHA[pm.name];
                                const isShou = type === '收山';
                                return (
                                    <div key={pm.name} style={{fontSize:'12px', display:'flex', justifyContent:'space-between'}}>
                                        <span>{pm.name}山</span>
                                        <span style={{fontWeight:'bold', color: isShou ? '#874d00' : '#096dd9'}}>
                                            {type} ({isShou ? '宜收藏' : '宜張揚'})
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{background: '#f0f5ff', padding: '12px', borderRadius: '8px', border: '1px solid #adc6ff'}}>
                        <div style={{fontSize: '14px', fontWeight: 'bold', color: '#1d39c4', marginBottom: '8px'}}>
                            🌊 坤壬乙訣
                        </div>
                        <div style={{display: 'flex', flexDirection:'column', gap: '4px'}}>
                            {palaceMountains.map(pm => {
                                const kry = KUN_REN_YI[pm.name];
                                return (
                                    <div key={pm.name} style={{fontSize:'12px', display:'flex', justifyContent:'space-between'}}>
                                        <span>{pm.name}山</span>
                                        <span style={{fontWeight:'bold', color: kry.color}}>{kry.star}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{background: '#f6ffed', padding: '16px', borderRadius: '8px', border: '1px solid #b7eb8f'}}>
                    <div style={{fontSize: '16px', fontWeight: 'bold', color: '#389e0d', marginBottom: '8px'}}>
                        ☯️ 玄空大卦：坐向剋應
                    </div>
                    <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>
                         向首({facingDaGua.n})：氣{facingDaGua.q} / 運{facingDaGua.y}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                        {palaceMountains.map(pm => {
                            const mountainGua = getDaGua(pm.angle);
                            const relations = getDaGuaRelations(mountainGua, facingDaGua);
                            return (
                                <div key={pm.name} style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px dashed #d9d9d9', paddingBottom:'4px'}}>
                                    <div style={{fontWeight:'bold', color:'#333', fontSize:'14px', minWidth:'50px'}}>{pm.name}山</div>
                                    <div style={{fontSize:'12px', color:'#555'}}>{mountainGua.n}(氣{mountainGua.q}/運{mountainGua.y})</div>
                                    <div style={{display:'flex', gap:'2px'}}>
                                        {relations.length > 0 ? relations.map((r, idx) => (
                                            <span key={idx} style={{fontSize:'10px', background:r.c, color:'white', padding:'1px 3px', borderRadius:'3px'}}>{r.t}</span>
                                        )) : <span style={{fontSize:'10px', color:'#999'}}>無</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '16px'}}>
                    * 點擊遮罩層即可關閉
                </div>
            </div>
        </div>
    );
};

// 羅庚 (羅盤) - 修正版
const CompassView = ({ heading, setHeading, isFrozen, setIsFrozen, onAnalyze }) => {
    const isFrozenRef = React.useRef(isFrozen);
    useEffect(() => { isFrozenRef.current = isFrozen; }, [isFrozen]);

    const handleOrientation = React.useCallback((e) => {
        if (isFrozenRef.current) return;
        let compass = e.webkitCompassHeading || (e.alpha ? 360 - e.alpha : 0);
        setHeading(prev => Math.abs(compass - prev) > 0.2 ? compass : prev);
    }, [setHeading]);

    const requestAccess = () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => { if (response === 'granted') window.addEventListener('deviceorientation', handleOrientation); })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    };

    useEffect(() => { return () => window.removeEventListener('deviceorientation', handleOrientation); }, [handleOrientation]);
    
    const facingMt = getMountain(heading);
    const sittingMt = getMountain(heading + 180);

    return (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#fff', position: 'relative', overflow: 'hidden', height: '100%', width: '100%'}}>
            
            {/* 羅庚與十字星 */}
            <div style={{ position: 'relative', width: '85vw', maxWidth: '350px', aspectRatio: '1 / 1', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
                <div style={{ position:'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', height: '20%', width: '2px', background:'red', zIndex: 20, boxShadow: '0 0 2px rgba(255,0,0,0.8)' }}></div>
                <div style={{ position:'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20%', height: '2px', background:'red', zIndex: 20, boxShadow: '0 0 2px rgba(255,0,0,0.8)' }}></div>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '6px solid #8B4513', background: '#e0c38c', transform: `rotate(${-heading}deg)`, transition: isFrozen ? 'none' : 'transform 0.1s linear', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', boxSizing: 'border-box' }}>
                     {MOUNTAINS.map((m, i) => (
                        <div key={i} style={{ position: 'absolute', top: '10px', left: '50%', height: '45%', width: '1px', transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${m.angle}deg)` }}>
                            <span style={{display:'block', fontSize:'14px', color:'#333', fontWeight:'bold', transform:'rotate(180deg)', whiteSpace:'nowrap'}}>{m.name}</span>
                        </div>
                     ))}
                     <div style={{ width:'20%', height:'20%', background:'white', borderRadius:'50%', border:'2px solid red', boxSizing: 'border-box' }}></div>
                </div>
            </div>

            {/* 底部數據與控制 */}
            <div style={{textAlign:'center', zIndex: 10, marginTop: '10px'}}>
                <div style={{fontSize:'14px', color:'#aaa'}}>{isFrozen ? '已定格' : '請轉動手機對準方位'}</div>
                <div style={{fontSize:'48px', fontWeight:'bold', fontFamily:'monospace', color: '#ffd700'}}>{heading.toFixed(1)}°</div>
                <div style={{fontSize: '24px', fontWeight:'bold', marginTop:'5px'}}>{sittingMt.gua}卦 - {sittingMt.name}山{facingMt.name}向</div>
                
                {/* 按鈕區 */}
                <div style={{display:'flex', gap:'16px', justifyContent:'center', marginTop:'20px'}}>
                    <button onClick={() => setIsFrozen(!isFrozen)} style={{padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', background: isFrozen ? THEME.red : THEME.blue, color:'white'}}>
                        {isFrozen ? <Unlock size={18}/> : <Lock size={18}/>} {isFrozen ? "解鎖" : "定格"}
                    </button>
                    
                    {/* ★ 修改 1: 啟用羅庚按鈕移至此處 */}
                    {!isFrozen && (
                        <button onClick={requestAccess} style={{padding: '12px 24px', borderRadius: '30px', border: '1px solid white', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', background: 'transparent', color:'white'}}>
                            <Compass size={18}/> 啟用羅庚
                        </button>
                    )}

                    {isFrozen && (
                        <button onClick={onAnalyze} style={{padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', background: THEME.green, color:'white'}}>
                            <RefreshCw size={18}/> 排盤
                        </button>
                    )}
                </div>
                {!isFrozen && <input type="range" min="0" max="360" value={heading} onChange={e=>setHeading(Number(e.target.value))} style={{marginTop:'20px', width:'200px', opacity: 0.5}}/>}
            </div>
        </div>
    );
};

// 排盤視圖
const ChartView = ({ heading, period, setPeriod, year, setYear, month, setMonth, onSave, chartMode = 'traditional' }) => {
    const [selectedSector, setSelectedSector] = useState(null);
    const [naQiDoor, setNaQiDoor] = useState(null); 
    const [showAnnual, setShowAnnual] = useState(true);
    const [showMonthly, setShowMonthly] = useState(true);
    const [showCommercial, setShowCommercial] = useState(false);
    const [isRound, setIsRound] = useState(false);
    const naQiRow1 = ['坎', '坤', '震', '巽'];
    const naQiRow2 = ['乾', '兌', '艮', '離'];
    
    const data = useMemo(() => {
        try { return calculateEverything(heading, period, year, month); } catch (e) { return null; }
    }, [heading, period, year, month]);

    useEffect(() => { if (data) setNaQiDoor(data.facing.gua); }, [data]);

    if (!data) return <div style={{padding:20, color:'red'}}>資料計算異常。</div>;

    // ★ 修改 3: 現代模式下，方盤需要完全倒轉 (上北下南，左西右東)
    // 傳統 (左東): 巽(0), 離(1), 坤(2) ... (南在上)
    const gridOrderTraditional = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    // 現代 (北在上): 乾(8), 坎(7), 艮(6) ... (完全 180 度反轉傳統盤)
    const gridOrderModern = [8, 7, 6, 5, 4, 3, 2, 1, 0];
    
    const gridOrder = chartMode === 'modern' ? gridOrderModern : gridOrderTraditional;
    const dirNames = ["巽", "離", "坤", "震", "中", "兌", "艮", "坎", "乾"];
    const getDirDisplayName = (name) => {
        const dir = GUA_TO_DIR[name];
        
        if (!dir) return name;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.1' }}>
                <span>{name}</span>
                <span style={{ fontSize: '10px', fontWeight: 'normal' }}>({dir})</span>
            </div>
        );
    };
    const naQiGuas = ["坎", "坤", "震", "巽", "乾", "兌", "艮", "離"];
    const cardStyle = { background: THEME.white, borderRadius:'12px', padding:'16px', marginBottom:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' };
    const sectionTitle = { fontSize:'15px', fontWeight:'bold', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px', color:'#333', borderBottom:'2px solid #f0f0f0', paddingBottom:'6px' };
    const tagStyle = { fontSize:'10px', padding:'2px 4px', borderRadius:'4px', color:'#fff', fontWeight:'bold', whiteSpace:'nowrap', lineHeight: '1' };

    const getGridTags = (idx) => {
        const dirGua = dirNames[idx]; 
        if (dirGua === '中') return []; 
        const tags = [];
        const { advanced } = data;
        if (dirGua === advanced.waterMethod.early) tags.push({ text: '先天水', color: '#096dd9' }); 
        if (dirGua === advanced.waterMethod.late) tags.push({ text: '後天水', color: '#389e0d' }); 
        if (dirGua === advanced.chengMen.main) tags.push({ text: '正城門', color: '#fa8c16' }); 
        if (dirGua === advanced.chengMen.sub) tags.push({ text: '副城門', color: '#fa8c16' }); 
        
        const mtDragons = advanced.mountainDragon.mountains;
        const mtMatches = mtDragons.filter(m => getGuaFromStr(m) === dirGua);
        if (mtMatches.length > 0) {
            tags.push({ text: `山龍: ${mtMatches.join('')}`, color: '#c41d7f' });
        }

        const waterDragons = advanced.waterDragon.mountains;
        const waterMatches = waterDragons.filter(m => getGuaFromStr(m) === dirGua);
        if (waterMatches.length > 0) {
            tags.push({ text: `水龍: ${waterMatches.join('')}`, color: '#096dd9' });
        }

        if (advanced.sha8 && advanced.sha8 !== '無') {
            const shaGua = getGuaFromStr(advanced.sha8);
            if (shaGua === dirGua) tags.push({ text: `曜煞: ${advanced.sha8}`, color: '#cf1322' }); 
        }

        if (advanced.huangQuan) {
            const hqArr = advanced.huangQuan.split('/');
            hqArr.forEach(hq => {
                const hqGua = getGuaFromStr(hq);
                if (hqGua === dirGua) tags.push({ text: `黃泉: ${hq}`, color: '#cf1322' });
            });
        }
        return tags;
    };

    const handleSectorClick = (idx) => {
        const guaName = dirNames[idx];
        if (guaName === '中') return; 
        setSelectedSector({
            mt: data.mtGrid[idx], face: data.faceGrid[idx], base: data.baseGrid[idx],
            annual: data.annualGrid[idx], monthly: data.monthlyGrid[idx],
            guaName: guaName, combination: getStarCombination(data.mtGrid[idx], data.faceGrid[idx]),
            baZhaiStar: data.advanced.baZhaiMap[guaName]
        });
    };

    const getBaZhaiDisplay = (idx) => {
        const guaName = dirNames[idx];
        const starName = data.advanced.baZhaiMap[guaName];
        return starName ? { name: starName, color: BA_ZHAI_INFO[starName].color } : null;
    };

    const getYearlyBadges = (idx) => {
        if (!showAnnual) return [];
        const guaName = dirNames[idx];
        const { yearlyAfflictions } = data.advanced;
        const badges = [];
        if (yearlyAfflictions.wuHuang === guaName) badges.push('五黃');
        if (yearlyAfflictions.sanSha === guaName) badges.push('三煞');
        if (yearlyAfflictions.liShi === guaName) badges.push('力士');
        if (yearlyAfflictions.taiSui === guaName) badges.push('太歲');
        if (yearlyAfflictions.suiPo === guaName) badges.push('歲破');
        return badges;
    };

    const naQiResult = naQiDoor ? calculateNaQi(period, naQiDoor) : null;
    const btnStyle = { 
        padding: '6px 12px', 
        backgroundColor: THEME.bgGray,
        borderRadius: '20px', 
        border: `1px solid ${THEME.border}`, 
        color: THEME.black, 
        fontSize: '12px', 
        fontWeight: 'bold', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        whiteSpace: 'nowrap' 
    };

    const handleSaveClick = () => {
        const locationName = window.prompt("請輸入地點", "");
        if (locationName === null) return; 

        onSave({
            id: Date.now(), 
            sitting: data.sitting, 
            facing: data.facing, 
            period: period, 
            year: year,
            location: locationName || '' 
        });
    };

    // ★ 修改 3: 圓盤佈局更新 (現代模式需正確對應八方)
    const isModern = chartMode === 'modern';
    // 現代地圖方位: 北在上, 南在下, 東在右, 西在左
    const roundPositionMap = {
        4: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, // 中
        
        // 南 (離-1): 傳統在頂, 現代在底
        1: isModern ? { bottom: '2%', left: '50%', transform: 'translateX(-50%)' } 
                    : { top: '2%', left: '50%', transform: 'translateX(-50%)' },
        
        // 北 (坎-7): 傳統在底, 現代在頂
        7: isModern ? { top: '2%', left: '50%', transform: 'translateX(-50%)' } 
                    : { bottom: '2%', left: '50%', transform: 'translateX(-50%)' },
        
        // 東 (震-3): 傳統在左, 現代在右
        3: isModern ? { top: '50%', right: '2%', transform: 'translateY(-50%)' } 
                    : { top: '50%', left: '2%', transform: 'translateY(-50%)' },
                    
        // 西 (兌-5): 傳統在右, 現代在左
        5: isModern ? { top: '50%', left: '2%', transform: 'translateY(-50%)' } 
                    : { top: '50%', right: '2%', transform: 'translateY(-50%)' },
        
        // 東南 (巽-0): 傳統左上, 現代右下
        0: isModern ? { bottom: '15%', right: '15%' } : { top: '15%', left: '15%' },
        
        // 西南 (坤-2): 傳統右上, 現代左下
        2: isModern ? { bottom: '15%', left: '15%' } : { top: '15%', right: '15%' },
        
        // 東北 (艮-6): 傳統左下, 現代右上
        6: isModern ? { top: '15%', right: '15%' } : { bottom: '15%', left: '15%' },
        
        // 西北 (乾-8): 傳統右下, 現代左上
        8: isModern ? { top: '15%', left: '15%' } : { bottom: '15%', right: '15%' }
    };

    const sitDir = GUA_TO_DIR ? GUA_TO_DIR[data.sitting.gua] : '';
    const faceDir = GUA_TO_DIR ? GUA_TO_DIR[data.facing.gua] : '';

    const years = []; 
    for (let y = 1900; y <= 2100; y++) {
        years.push(y);
    }
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    return (
        <div style={{padding:'16px', paddingBottom:'80px'}}>
             <div style={cardStyle}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <div style={{fontWeight:'bold', fontSize:'18px'}}>
                        {data.sitting.name}山{data.facing.name}向下卦
                        <span style={{fontSize:'14px', color:'#666', fontWeight:'normal'}}> (坐{sitDir}向{faceDir})</span>
                    </div>
                    
                    <button onClick={handleSaveClick} style={btnStyle}>
                        <Save size={14}/> 保存
                    </button>
                </div>
                
                <div style={{display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px'}}>
                    <label style={{fontSize:'14px'}}>
                        運: 
                        <select 
                            value={period} 
                            onChange={e => setPeriod(Number(e.target.value))} 
                            style={{border:'1px solid #ddd', marginLeft:'4px', padding: '2px'}}
                        >
                            {[1,2,3,4,5,6,7,8,9].map(n => (
                                <option key={n} value={n}>{PERIOD_MAP_CHART[n]}運</option>
                            ))}
                        </select>
                    </label>

                    {/* ★ 流年：下拉式選單 (1900-2100) */}
                    <label style={{fontSize:'14px'}}>
                        年: 
                        <select 
                            value={year} 
                            onChange={e => setYear(Number(e.target.value))} 
                            style={{border:'1px solid #ddd', padding: '2px'}}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </label>

                    {/* ★ 流月：下拉式選單 (1-12) */}
                    <label style={{fontSize:'14px'}}>
                        月: 
                        <select 
                            value={month} 
                            onChange={e => setMonth(Number(e.target.value))} 
                            style={{border:'1px solid #ddd', padding: '2px'}}
                        >
                            {months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div style={{display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap'}}>
                     <button onClick={() => setShowAnnual(!showAnnual)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', border: '1px solid #722ed1', background: showAnnual ? '#f9f0ff' : 'white', color: '#722ed1'}}>{showAnnual ? <Eye size={12}/> : <EyeOff size={12}/>} 流年</button>
                     <button onClick={() => setShowMonthly(!showMonthly)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', border: '1px solid #fa8c16', background: showMonthly ? '#fff7e6' : 'white', color: '#fa8c16'}}>{showMonthly ? <Eye size={12}/> : <EyeOff size={12}/>} 流月</button>
                     
                     {/* ★ 新增：方盤/圓盤切換按鈕 */}
{/*}                     <button onClick={() => setIsRound(!isRound)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', border: '1px solid #333', background: 'white', color: '#333', display: 'flex', alignItems: 'center', gap: '4px'}}>
                        {isRound ? <Grid size={12}/> : <Circle size={12}/>} 
                        {isRound ? '方盤' : '圓盤'}
                     </button>
*/}
                     <button onClick={() => setShowCommercial(true)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', background: '#333', color: 'white', border:'none', marginLeft:'auto'}}><Briefcase size={12}/> 商戰</button>
                </div>
            </div>

            {/* ★ 排盤顯示區域 (支援方盤與圓盤) */}
            <div style={{
                ...cardStyle, 
                padding:'4px', 
                background: isRound ? 'transparent' : '#8B4513', 
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{
                    // 根據 isRound 決定佈局
                    display: isRound ? 'block' : 'grid', 
                    gridTemplateColumns: isRound ? 'none' : 'repeat(3, 1fr)', 
                    gap: isRound ? '0' : '2px', 
                    aspectRatio: '1/1',
                    width: '100%',
                    maxWidth: isRound ? '350px' : '100%', // 圓盤限制最大寬度以保持美觀
                    position: isRound ? 'relative' : 'static',
                    borderRadius: isRound ? '50%' : '0',
                    backgroundColor: isRound ? '#e0c38c' : 'transparent', // 圓盤背景色 (羅庚土黃)
                    border: isRound ? '4px solid #8B4513' : 'none',
                    boxShadow: isRound ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                }}>
                    {/* ★ 使用 gridOrder 渲染格子 */}
                    {gridOrder.map((idx) => {
                        const tags = getGridTags(idx);
                        const baZhai = getBaZhaiDisplay(idx); 
                        const yearlyBadges = getYearlyBadges(idx);
                        
                        // 圓盤模式下的定位樣式
                        const posStyle = isRound ? {
                            position: 'absolute',
                            width: '30%', // 每個宮位的大小
                            height: '30%',
                            ...roundPositionMap[idx] // 套用方位坐標
                        } : {
                            position: 'relative' // 方盤模式
                        };

                        return (
                            <div key={idx} onClick={() => handleSectorClick(idx)} style={{ 
                                background: isRound ? 'transparent' : '#fffcf5', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                overflow: isRound ? 'visible' : 'hidden', 
                                cursor: 'pointer', 
                                transition: 'background 0.2s',
                                ...posStyle // 合併定位樣式
                            }}>
                                {/* Tags 移到上方 */}
                                {!isRound && tags.length > 0 && (
                                    <div style={{
                                        position:'absolute',
                                        bottom: '30px', // 置於運星上方
                                        width:'100%',
                                        display:'flex', gap:'2px', flexWrap:'wrap', justifyContent:'center',
                                        zIndex: 2
                                    }}>
                                        {tags.map((t, i) => (
                                            <span key={i} style={{...tagStyle, background: t.color}}>{t.text}</span>
                                        ))}
                                    </div>
                                )}

                                <div style={{position:'absolute', top: isRound ? '-5px' : '4px', left: isRound ? '0' : '6px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                    {/* 山星 (阿拉伯) */}
                                    <div style={{fontSize: isRound ? '16px' : '20px', fontWeight:'900', color:'#ff0000ff', lineHeight:'1'}}>{data.mtGrid[idx]}</div>
                                    {/* 流年 (阿拉伯) */}
                                    {showAnnual && <div style={{fontSize: isRound ? '11px' : '14px', fontWeight:'bold', color:'#722ed1'}}>{data.annualGrid[idx]}</div>}
                                </div>
                                <div style={{position:'absolute', top: isRound ? '-5px' : '4px', right: isRound ? '0' : '6px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                    {/* 向星 (阿拉伯) */}
                                    <div style={{fontSize: isRound ? '16px' : '20px', fontWeight:'900', color:'#1500ffff', lineHeight:'1'}}>{data.faceGrid[idx]}</div>
                                    {/* 流月 (阿拉伯) */}
                                    {showMonthly && <div style={{fontSize: isRound ? '11px' : '14px', fontWeight:'bold', color:'#fa8c16'}}>{data.monthlyGrid[idx]}</div>}
                                </div>
                                
                                {/* ★ 運星 (中文，底部置中) */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: isRound ? '0px' : '4px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: isRound ? '24px' : '24px',
                                    fontWeight: 'bold',
                                    color: isRound ? '#555' : '#e0e0e0',
                                    lineHeight: 1,
                                    zIndex: 1
                                }}>
                                    {PERIOD_MAP_CHART[data.baseGrid[idx]]}
                                </div>

                                {idx !== 4 && (
                                        <>
                                            {/* 流年凶煞標籤 */}
                                            {yearlyBadges.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: isRound ? '22%' : '2px', // 圓盤稍微往下挪一點點
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    gap: '3px', // 增加間距
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexWrap: 'wrap',
                                                    zIndex: 10,
                                                    width: '100%', // 使用全寬配合 padding 防止擠壓
                                                    padding: '0 4px', // 左右留白
                                                    pointerEvents: 'none' // 防止擋住點擊
                                                }}>
                                                    {yearlyBadges.map(b => (
                                                        <span key={b} style={{
                                                            fontSize: '10px', // 字體稍微加大一點 (視需求可改回 9px)
                                                            background: b === '五黃' || b === '三煞' || b === '歲破' ? '#cf1322' : '#d48806',
                                                            color: 'white',
                                                            padding: '2px 4px', // 增加內距，讓標籤更飽滿
                                                            borderRadius: '3px',
                                                            lineHeight: '1.2', // 增加行高，防止文字上下壓扁
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0, // ★ 關鍵：防止 flex 擠壓變形
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)' // 增加一點立體感
                                                        }}>
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* ★ 宮位名稱 (底部靠左) */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: isRound ? '-15px' : '4px',
                                                left: isRound ? '-5px' : '4px',
                                                fontSize: '12px',
                                                color: isRound ? '#333' : '#888',
                                                fontWeight: 'bold',
                                                zIndex: 5
                                            }}>
                                                {getDirDisplayName(dirNames[idx])}
                                            </div>
                                        </>
                                    )}

                                    {idx === 4 && (
                                        <div style={{
                                            position:'absolute', bottom: isRound ? '35px' : '30px', fontSize:'10px', fontWeight:'bold', 
                                            background:'rgba(83, 29, 171, 0.1)', padding:'2px 6px', borderRadius:'4px', color: '#531dab', whiteSpace: 'nowrap'
                                        }}>
                                            {data.chartType}
                                        </div>
                                    )}
                                {baZhai && <div style={{position: 'absolute', bottom: isRound ? '-15px' : '4px', right: isRound ? '-10px' : '4px', fontSize: '11px', fontWeight: 'bold', color: baZhai.color, background: 'rgba(255,255,255,0.8)', padding: '1px 3px', borderRadius: '4px'}}>{baZhai.name}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={cardStyle}>
                <div style={{...sectionTitle, color:'#c41d7f'}}>⚠️ 凶煞警示</div>
                <div style={{fontSize:'14px', display:'flex', flexDirection:'column', gap:'4px'}}>
                     {showAnnual && <div style={{color:'#cf1322'}}>流年凶方: 五黃({data.advanced.yearlyAfflictions.wuHuang}) / 三煞({data.advanced.yearlyAfflictions.sanSha})</div>}
                     <div>龍上八煞: 忌{data.advanced.sha8}方</div>
                     <div>八路黃泉: {data.advanced.huangQuan ? `忌${data.advanced.huangQuan}方` : '無'}</div>
                </div>
            </div>

            <div style={cardStyle}>
                <div style={{...sectionTitle, color:'#096dd9'}}>💨 三元納氣</div>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', marginBottom:'4px'}}>
                    {naQiRow1.map(gua => (
                        <button key={gua} onClick={() => setNaQiDoor(gua)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid #ddd', background: naQiDoor === gua ? '#1890ff' : 'white', color: naQiDoor === gua ? 'white' : '#333', cursor:'pointer' }}>{gua}</button>
                    ))}
                </div>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', marginBottom:'12px'}}>
                    {naQiRow2.map(gua => (
                        <button key={gua} onClick={() => setNaQiDoor(gua)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid #ddd', background: naQiDoor === gua ? '#1890ff' : 'white', color: naQiDoor === gua ? 'white' : '#333', cursor:'pointer' }}>{gua}</button>
                    ))}
                </div>

                {/* 結果顯示框 */}
                {naQiResult && (
                    <div style={{ background: naQiResult.type === '凶' ? '#fff1f0' : (naQiResult.type === '平' ? '#fff7e6' : '#f6ffed'), border: `1px solid ${naQiResult.color}`, borderRadius:'8px', padding:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                            <div style={{fontSize:'12px', color:'#666'}}>
                                納氣：<span style={{fontWeight:'bold'}}>{naQiDoor}</span> ({naQiResult.sub})
                            </div>
                            <div style={{fontSize:'18px', fontWeight:'bold', color: naQiResult.color}}>
                                {naQiResult.text}
                            </div>
                        </div>
                        <DoorOpen size={24} color={naQiResult.color}/>
                    </div>
                )}
            </div>

            <Adsterra />

            <CommercialView isOpen={showCommercial} onClose={() => setShowCommercial(false)} sittingMt={data.sitting} facingMt={data.facing} />
            <DetailModal isOpen={!!selectedSector} onClose={() => setSelectedSector(null)} data={selectedSector} facingDaGua={data.advanced.daGua.face} />
        </div>
    );
};

// 5. 設定頁 (SettingsView) - 更新版
const SettingsView = ({ bookmarks, setBookmarks, chartMode, setChartMode }) => {
    const APP_INFO = { 
        appName: APP_NAME, 
        version: APP_VERSION, 
        about: "本程式旨在提供專業風水排盤，輔助使用者進行理氣分析，巒頭剋應尚需專業地師實地堪察。" 
    };

    const handleModeChange = (mode) => {
        setChartMode(mode);
        Preferences.set({ key: 'fengshui_chart_mode', value: mode });
    };
    
    return (
        <div style={{ padding: '16px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2>
            </div>

            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black, marginBottom: '12px' }}>排盤模式</div>
                <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '20px', padding: '2px' }}>
                    <button 
                        onClick={() => handleModeChange('traditional')} 
                        style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '18px', backgroundColor: chartMode === 'traditional' ? THEME.blue : 'transparent', color: chartMode === 'traditional' ? 'white' : THEME.gray, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                    >
                        風水羅庚盤
                    </button>
                    <button 
                        onClick={() => handleModeChange('modern')} 
                        style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '18px', backgroundColor: chartMode === 'modern' ? THEME.blue : 'transparent', color: chartMode === 'modern' ? 'white' : THEME.gray, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                    >
                        現代指南針
                    </button>
                </div>
                <div style={{ fontSize: '11px', color: THEME.gray, marginTop: '8px', paddingLeft: '4px' }}>
                    * 風水羅庚盤為天南地北，左東右西。<br/>
                    * 現代指南針為上北下南，左西右東。
                </div>
            </div>
            
            <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="FENGSHUI_BACKUP" />
            <AppInfoCard info={APP_INFO} />
            <BuyMeCoffee />
            
            <div style={{ marginTop: '24px' }}>
                      <button onClick={() => { if(window.confirm('還原預設?')) { setChartMode('traditional'); } }} style={{ width: '100%', padding: '12px', backgroundColor: THEME.bgGray, color: THEME.red, border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <RefreshCw size={16} /> 還原預設值
                      </button>
                  </div>
        </div>
    );
};

// =========================================================================
// PART C: 主程式 Shell
// =========================================================================

export default function FengShuiApp() {
    // 全局啟用保護機制
    const isAuthorized = useProtection([]);
    if (!isAuthorized) return null;

    const [view, setView] = useState('input'); 
    const [bookmarks, setBookmarks] = useState([]);
    
    // 風水狀態
    const [heading, setHeading] = useState(180); 
    const [isFrozen, setIsFrozen] = useState(false);
    const [period, setPeriod] = useState(9);
    const [year, setYear] = useState(new Date().getFullYear()); 
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    // ★ 新增：排盤方位模式狀態 ('traditional' 或 'modern')
    const [chartMode, setChartMode] = useState('traditional');

    const tabs = [
        { id: 'input', label: '羅庚', icon: Compass },
        { id: 'bookmarks', label: '紀錄', icon: Bookmark },
        { id: 'booking', label: '預約', icon: CalendarCheck },
        { id: 'settings', label: '設定', icon: Settings },
    ];

    useEffect(() => {
        const loadData = async () => {
            const { value: savedBk } = await Preferences.get({ key: 'fengshui_bookmarks' });
            if (savedBk) setBookmarks(JSON.parse(savedBk));
            
            // ★ 讀取方位設定 (若無則預設 'traditional')
            const { value: savedMode } = await Preferences.get({ key: 'fengshui_chart_mode' });
            if (savedMode) setChartMode(savedMode);
            else setChartMode('traditional');
        };
        loadData();
    }, []);

    // 4. 動作處理
    const handleAnalyze = () => {
        setPeriod(9);
        setYear(new Date().getFullYear());
        setMonth(new Date().getMonth() + 1);
        setView('result');
    };

    const saveBookmark = async (data) => {
        const dataToSave = {
            id: data.id,
            name: data.location || `${data.sitting.name}山${data.facing.name}向`,
            solarDate: new Date().toISOString().split('T')[0],
            period: data.period,
            mountain: data.sitting.name,
            facing: data.facing.name,
            gwaType: '下卦',
            address: data.location,
            rawConfig: { 
                period: data.period, 
                year: data.year,
                sitting: data.sitting, 
                facing: data.facing 
            }
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
        await Preferences.set({ key: 'fengshui_bookmarks', value: JSON.stringify(newBk) });
    };

    const deleteBookmark = async (id) => {
        if(window.confirm('確定要刪除這條紀錄嗎？')) {
            const newBk = bookmarks.filter(b => b.id !== id);
            setBookmarks(newBk);
            await Preferences.set({ key: 'fengshui_bookmarks', value: JSON.stringify(newBk) });
        }
    };

    const openBookmark = (item) => {
        const raw = item.rawConfig;
        if (raw && raw.sitting) {
            let h = raw.sitting.angle - 180;
            if (h < 0) h += 360;
            
            setHeading(h); 
            setPeriod(raw.period);
            setYear(raw.year);
            setView('result');
        } else {
            alert('無法讀取舊格式資料');
        }
    };

    return (
        <div style={COMMON_STYLES.fullScreen}>
            {/* Header */}
            {view === 'input' ? (
                <div style={{position:'absolute', top:0, left:0, width:'100%', zIndex:20}}>
                     <AppHeader title={APP_NAME} logoChar={{ main: '風', sub: '水' }} />
                </div>
            ) : (
                 <AppHeader title={APP_NAME} logoChar={{ main: '風', sub: '水' }} />
            )}

            <div style={{...COMMON_STYLES.contentArea, background: view === 'input' ? '#222' : THEME.bg}}>
                {view === 'input' && (
                    <CompassView 
                        heading={heading} 
                        setHeading={setHeading} 
                        isFrozen={isFrozen} 
                        setIsFrozen={setIsFrozen} 
                        onAnalyze={handleAnalyze} 
                    />
                )}

                {view === 'result' && (
                    <>
                        <div style={{
                            position: 'relative', padding:'10px 16px', background: THEME.white, 
                            borderBottom:`1px solid ${THEME.border}`, display:'flex', alignItems:'center', justifyContent: 'center', height: '44px'
                        }}>
                            <button onClick={() => setView('input')} style={{
                                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                                background:'none', border:'none', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer', color: THEME.blue, zIndex: 1
                            }}>
                                <ChevronLeft size={20}/>
                            </button>
                            <span style={{fontWeight:'bold', color: THEME.black, fontSize: '16px'}}>排盤分析</span>
                        </div>

                        <ChartView 
                            heading={heading} setHeading={setHeading}
                            period={period} setPeriod={setPeriod}
                            year={year} setYear={setYear}
                            month={month} setMonth={setMonth}
                            onSave={saveBookmark}
                            chartMode={chartMode} 
                        />
                    </>
                )}

                {view === 'bookmarks' && (
                    <div style={{ padding: '16px', paddingBottom: '100px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                            <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的堪察紀錄</h2>
                        </div>
                        <BookmarkList bookmarks={bookmarks} onSelect={openBookmark} onDelete={deleteBookmark} />
                        <div style={{ marginTop: '20px' }}><Adsterra /></div>
                    </div>
                )}

                {view === 'booking' && <BookingSystem apiUrl={API_URL} onNavigate={() => setView('input')} />}

                {view === 'settings' && (
                    <SettingsView 
                        bookmarks={bookmarks} 
                        setBookmarks={setBookmarks}
                        chartMode={chartMode} 
                        setChartMode={setChartMode} 
                    />
                )}
            </div>

            <InstallGuide />
            
            <BottomTabBar 
                tabs={tabs} 
                currentTab={view === 'result' ? 'input' : view} 
                onTabChange={(id) => setView(id)} 
            />
        </div>
    );
}