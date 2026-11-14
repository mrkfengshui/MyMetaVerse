import React, { useState } from 'react';
import { ChevronUp, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';

// =========================================================================
// 81 數理吉凶字典
// =========================================================================
const EIGHTY_ONE_ATTR = {
    1: "【萬象始起】旭日東升，能成大業 (大吉)", 2: "【混沌離亂】枝節橫生，缺乏判斷 (凶)",
    3: "【名利雙收】進退如意，可揚四海 (大吉)", 4: "【破壞滅裂】災厄凶變，暗淡破敗 (凶)",
    5: "【福壽雙美】家門榮昌，福祿壽全 (大吉)", 6: "【富裕平安】大富大貴，一生安穩 (大吉)",
    7: "【剛頑俊敏】決斷力超群，剛毅果斷 (吉)", 8: "【堅毅克己】意志堅定，努力發達 (吉)",
    9: "【貧苦逆惡】多成也多敗，盛盡轉衰 (凶)", 10: "【死滅凶惡】黯淡無光，境遇悲慘 (凶)",
    11: "【萬象更新】久旱逢甘霖，穩健踏實 (大吉)", 12: "【薄弱挫折】容易沉淪，有志難申 (凶)",
    13: "【奇才藝精】智慧超群，富有奇謀 (大吉)", 14: "【浮沈破敗】孤獨苦難，難享天倫 (凶)",
    15: "【慈祥有德】德高望重，福祿壽全 (大吉)", 16: "【宅心仁厚】領導力超群，多貴人 (大吉)", 
    17: "【剛健不屈】剛強倔強，突破萬難 (吉)", 18: "【掌權利達】有權望威勢，做事順利 (吉)", 
    19: "【挫敗不利】一生多挫折，缺少提拔 (凶)", 20: "【破滅衰亡】困難重重，多苦難挫折 (凶)",
    21: "【獨立權威】專心經營，善用智慧 (吉)", 22: "【秋草逢霜】災困不絕，晚景淒涼 (凶)",
    23: "【壯麗果敢】富貴沖天，克服萬難 (大吉)", 24: "【金錢豐惠】才略智謀超群，溫和勤儉 (大吉)", 
    25: "【英邁俊敏】有才傲物，天資英敏 (吉)", 26: "【波瀾重著】聰明機敏，變化萬端 (凶)",
    27: "【挫敗中折】人生跌宕起伏，易受攻擊 (凶)", 28: "【禍亂別離】災難頻至，生離死別 (凶)",
    29: "【貴重智謀】平步青雲，如龍得雲 (大吉)", 30: "【浮沈不安】成敗難定，絕處逢生 (凶)",
    31: "【和順圓滿】智仁勇俱全，名利雙收 (大吉)", 32: "【貴人多助】得貴人扶，風雲際會 (大吉)", 
    33: "【剛毅果斷】如日中天，處事剛毅 (吉)", 34: "【破家亡身】禍患無窮，人生孤苦 (凶)",
    35: "【保守平安】溫和保守，嚴謹有正義 (吉)", 36: "【波瀾萬丈】沉浮變動，波瀾不平 (凶)",
    37: "【慈祥忠實】權威赫赫，逢凶化吉 (吉)", 38: "【薄弱平凡】意志薄弱，半途而廢 (凶)",
    39: "【榮華富貴】榮華富貴，雲開見月 (吉)", 40: "【浮沉變化】生猛狂傲，投機冒險 (凶)",
    41: "【健全有德】德高望重，德望兼備 (大吉)", 42: "【博達多能】有藝術天賦，缺乏恆心 (凶)",
    43: "【薄弱散漫】信念不堅定，善弄權術 (凶)", 44: "【逆境煩悶】多受阻逆，晚景淒涼 (凶)",
    45: "【德量宏厚】順風揚帆，大業啓程 (吉)", 46: "【載寶沉舟】天羅地網，籠罩全身 (凶)",
    47: "【禎祥吉慶】開花結果，權威進達 (大吉)", 48: "【英邁德厚】足智多謀，智謀兼備 (吉)",
    49: "【變格為仁】吉中帶凶，凶中帶吉 (凶)", 50: "【孤寡離愁】曇花一現，短暫榮達 (凶)",
    51: "【先盛後衰】半世榮枯，先成後敗 (凶)", 52: "【卓識達智】深謀遠慮，先見之明 (吉)", 
    53: "【難苦內憂】日落西山，穩重可保 (凶)", 54: "【衰頹未達】多災多難，苟且殘喘 (凶)",
    55: "【外榮內衰】華而不實，吉極生凶 (凶)", 56: "【凶敗不立】缺乏恆心，挫折不斷 (凶)",
    57: "【成就犯險】堅忍不拔，最大榮昌 (吉)", 58: "【先苦後甜】前運挫折，晚年榮華 (吉)",
    59: "【意志退敗】缺乏信念，六神無主 (凶)", 60: "【無謀失著】心神不定，缺乏主見 (凶)",
    61: "【榮華繁達】名利雙收，富貴雙全 (吉)", 62: "【雪上加霜】根基不穩，信用薄弱 (凶)",
    63: "【富達貴重】順和如意，子孫繁昌 (大吉)", 64: "【沉悶平凡】沉浮不定，骨肉離散 (凶)",
    65: "【名財兼得】福祿滿堂，萬事無阻 (大吉)", 66: "【退守自在】信用喪失，內外不和 (凶)",
    67: "【自我增進】白手起家，利路亨通 (吉)", 68: "【霸氣成仁】忠厚守信，集眾信達 (吉)", 
    69: "【沉淪難成】坐立難安，心浮氣躁 (凶)", 70: "【破滅敗身】病弱難愈，極端不幸 (凶)",
    71: "【吉凶參半】枕戈待旦，才可成事 (吉)", 72: "【外祥中凶】先甜後苦，應早防範 (凶)",
    73: "【志大才疏】志向遠大，力不從心 (凶)", 74: "【沉淪逆害】智能欠乏，碌碌無為 (凶)",
    75: "【英邁退安】動輒得咎，保守可保 (吉)", 76: "【病災難危】信譽地位，破巢之卵 (凶)",
    77: "【半憂半喜】前運辛苦，後半生幸 (吉)", 78: "【勤行智達】前運理想，晚景孤獨 (吉)",
    79: "【內外要祥】有勇無謀，缺周全計 (凶)", 80: "【波瀾萬丈】一生辛苦，宜積德行善 (凶)",
    81: "【春風怡人】大尊大貴，還本歸元 (大吉)"
};

const isLucky = (strokes) => {
    const desc = EIGHTY_ONE_ATTR[strokes] || "";
    return desc.includes("(吉)") || desc.includes("(大吉)");
};

const getWxLabel = (num) => {
    const d = num % 10;
    if (d === 1 || d === 2) return '木';
    if (d === 3 || d === 4) return '火';
    if (d === 5 || d === 6) return '土';
    if (d === 7 || d === 8) return '金';
    return '水';
};

// =========================================================================
// 姓名學卡片元件 (直接讀取 GAS 回傳的物件結構)
// =========================================================================
export const NameCardLayout = ({ surname, surnameStrokes, c1Data, c2Data, THEME }) => {
    if (!c1Data || !c2Data) return null;

    const char1 = c1Data.char;
    const char2 = c2Data.char;
    const s0 = Number(surnameStrokes) || 10;
    const s1 = Number(c1Data.strokes) || 10;
    const s2 = Number(c2Data.strokes) || 10;

    const tian = s0 + 1;
    const ren = s0 + s1;
    const di = s1 + s2;
    const wai = s2 + 1;
    const zong = s0 + s1 + s2;

    const isOverallLucky = isLucky(ren) && isLucky(zong) && isLucky(di);
    
    const green = THEME?.green || "#27ae60"; 
    const blue = THEME?.blue || "#0984e3";  
    const red = THEME?.red || "#d63031";

    return (
        <div style={{
            border: isOverallLucky ? '2px solid #b7eb8f' : `1px solid ${THEME.border}`,
            padding: '20px', borderRadius: '12px', backgroundColor: '#fafafa', marginBottom: '16px'
        }}>
            {isOverallLucky && (
                <div style={{ background:'#f6ffed', color:'#52c41a', fontWeight:'bold', fontSize:'13px', padding:'4px 8px', borderRadius:'4px', marginBottom:'12px', display:'inline-block' }}>
                    🌟 三才五格俱佳組合
                </div>
            )}
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ position: 'relative', width: '220px', height: '200px', margin: '0 auto' }}>
                    <svg width="220" height="200" style={{ position: 'absolute', top: 0, left: 0 }}>
                        <path d="M 75 25 Q 55 25 55 85 Q 55 145 75 145" fill="transparent" stroke={green} strokeWidth="1" />
                        <path d="M 105 25 Q 125 25 125 45 Q 125 65 105 65" fill="transparent" stroke={green} strokeWidth="1" />
                        <path d="M 105 65 Q 125 65 125 85 Q 125 105 105 105" fill="transparent" stroke={green} strokeWidth="1" />
                        <path d="M 105 105 Q 125 105 125 125 Q 125 145 105 145" fill="transparent" stroke={green} strokeWidth="1" />
                        <line x1="30" y1="165" x2="190" y2="165" stroke={green} strokeWidth="1" />
                    </svg>
                    
                    <div style={{ position: 'absolute', left: '10px', top: '75px', textAlign: 'center', width: '40px' }}>
                        <div style={{ fontSize: '11px', color: '#000' }}>外格 <span style={{color: red}}>{wai}</span></div>
                        <div style={{ fontSize: '13px', color: green, marginTop: '2px' }}>{getWxLabel(wai)}</div>
                    </div>
                    <div style={{ position: 'absolute', left: '85px', top: '15px', fontSize: '12px', color: red }}>1</div>
                    <div style={{ position: 'absolute', left: '80px', top: '48px', fontSize: '20px', color: blue, fontWeight: 'bold' }}>{surname}</div>
                    <div style={{ position: 'absolute', left: '105px', top: '56px', fontSize: '11px', color: red }}>{s0}</div>
                    <div style={{ position: 'absolute', left: '80px', top: '88px', fontSize: '20px', color: blue, fontWeight: 'bold' }}>{char1}</div>
                    <div style={{ position: 'absolute', left: '105px', top: '96px', fontSize: '11px', color: red }}>{s1}</div>
                    <div style={{ position: 'absolute', left: '80px', top: '128px', fontSize: '20px', color: blue, fontWeight: 'bold' }}>{char2}</div>
                    <div style={{ position: 'absolute', left: '105px', top: '136px', fontSize: '11px', color: red }}>{s2}</div>

                    <div style={{ position: 'absolute', left: '130px', top: '35px', width: '60px' }}>
                        <div style={{ fontSize: '11px', color: '#000' }}>天格 <span style={{color: red}}>{tian}</span></div>
                        <div style={{ fontSize: '13px', color: green, marginTop: '2px' }}>{getWxLabel(tian)}</div>
                    </div>
                    <div style={{ position: 'absolute', left: '130px', top: '75px', width: '60px' }}>
                        <div style={{ fontSize: '11px', color: '#000' }}>人格 <span style={{color: red}}>{ren}</span></div>
                        <div style={{ fontSize: '13px', color: green, marginTop: '2px' }}>{getWxLabel(ren)}</div>
                    </div>
                    <div style={{ position: 'absolute', left: '130px', top: '115px', width: '60px' }}>
                        <div style={{ fontSize: '11px', color: '#000' }}>地格 <span style={{color: red}}>{di}</span></div>
                        <div style={{ fontSize: '13px', color: green, marginTop: '2px' }}>{getWxLabel(di)}</div>
                    </div>
                    <div style={{ position: 'absolute', left: 0, top: '175px', width: '220px', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#000' }}><span style={{color: red}}>{zong}</span> 總格</div>
                        <div style={{ fontSize: '14px', color: green }}>{getWxLabel(zong)}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', width: '100%' }}>
                    <div><strong style={{color: isLucky(ren)?blue:red}}>人格 ({ren}畫) 主運：</strong><br/><span style={{color: '#555'}}>{EIGHTY_ONE_ATTR[ren] || '待查'}</span></div>
                    <div><strong style={{color: isLucky(di)?blue:red}}>地格 ({di}畫) 前運：</strong><br/><span style={{color: '#555'}}>{EIGHTY_ONE_ATTR[di] || '待查'}</span></div>
                    <div><strong style={{color: isLucky(wai)?blue:red}}>外格 ({wai}畫) 輔運：</strong><br/><span style={{color: '#555'}}>{EIGHTY_ONE_ATTR[wai] || '待查'}</span></div>
                    <div><strong style={{color: isLucky(zong)?blue:red}}>總格 ({zong}畫) 後運：</strong><br/><span style={{color: '#555'}}>{EIGHTY_ONE_ATTR[zong] || '待查'}</span></div>
                </div>
            </div>

            {/* 字義與詩詞尋源 */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #ccc', fontSize: '13px', color: '#444', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: '#8e44ad', fontWeight: 'bold', fontSize: '15px' }}>📜 典籍字義與藏頭詩</span>
                    <span style={{ fontSize: '12px', backgroundColor: '#e8daef', color: '#8e44ad', padding: '2px 8px', borderRadius: '12px' }}>
                        補{c1Data.wuxing}、補{c2Data.wuxing}
                    </span>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <strong style={{color:'#000', fontSize:'15px'}}>「{char1}」</strong>
                    <span style={{color:'#888', fontSize:'12px'}}>（五行屬{c1Data.wuxing}{c1Data.tone ? ` · ${c1Data.tone}聲` : ''}）</span>：
                    {c1Data.desc}
                    {c1Data.selectedPoem && (
                        <div style={{color:'#000', marginTop:'4px'}}>
                            {c1Data.selectedPoem}
                        </div>
                    )}
                </div>
                <div>
                    <strong style={{color:'#000', fontSize:'15px'}}>「{char2}」</strong>
                    <span style={{color:'#888', fontSize:'12px'}}>（五行屬{c2Data.wuxing}{c2Data.tone ? ` · ${c2Data.tone}聲` : ''}）</span>：
                    {c2Data.desc}
                    {c2Data.selectedPoem && (
                        <div style={{color:'#000', marginTop:'4px'}}>
                            {c2Data.selectedPoem}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// =========================================================================
// 改名系統元件
// =========================================================================
export const NamingSystem = ({ data, THEME }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [wuxing, setWuxing] = useState([]);
    const [names, setNames] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const NAMING_API_URL = "https://script.google.com/macros/s/AKfycbymuvIeoUhfU7h9erh2yCaWQkFDG_2DpDGll-dcHuvrckYHTMt9O4nQtjitIoky2Qq9/exec";
    const greenColor = THEME?.green || '#27ae60';

    const toggleWuxing = (wx) => {
        if (wuxing.includes(wx)) setWuxing(wuxing.filter(w => w !== wx));
        else setWuxing([...wuxing, wx]);
    };

    const handleGenerate = async () => {
        if (!(data?.name) || data?.name === '未命名') {
            alert('請先在輸入頁填寫真實的姓氏！');
            return;
        }
        if (wuxing.length === 0) {
            alert('請至少選擇一個喜用神五行！');
            return;
        }

        setIsLoading(true);
        setNames([]);
        
        const surnameChar = (data?.name || '陳').charAt(0);
        // 傳遞性別給 GAS 過濾男女用字 (1=男, 0=女)
        const genderStr = data?.gender === '1' ? '男' : (data?.gender === '0' ? '女' : '');

        try {
            const response = await fetch(NAMING_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
                body: JSON.stringify({
                    action: 'generateNames',
                    surname: surnameChar,
                    wuxing: wuxing,
                    gender: genderStr
                })
            });
            
            const result = await response.json();
            
            if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
                setNames(result.data);
            } else {
                alert(result.message || '字典中符合條件的吉名組合太少，請嘗試多勾選幾個五行！');
            }
        } catch (error) {
            console.error("起名連線失敗:", error);
            alert('連線至起名伺服器失敗，請檢查網路或稍後再試。');
        } finally {
            setIsLoading(false);
        }
    };

    const displaySurname = (data?.name && data.name !== '未命名') ? data.name.charAt(0) : '陳';

    return (
        <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: '0', borderLeft: `4px solid ${greenColor}`, paddingLeft: '8px', fontSize: '15px' }}>
                        改名 (測試中,結果未必理想)
                    </h4>
                </div>
                {isOpen ? <ChevronUp size={20} color={THEME.gray} /> : <ChevronDown size={20} color={THEME.gray} />}
            </div>

            {isOpen && (
                <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ marginBottom: '16px', fontSize: '13px', color: THEME.gray }}>
                        請手動選擇喜用神五行，系統將從康熙字典中為「{displaySurname}」姓配對大吉名字。
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
                        {['金', '木', '水', '火', '土'].map(wx => (
                            <button 
                                key={wx} 
                                onClick={() => toggleWuxing(wx)} 
                                style={{ 
                                    padding: '6px 12px', borderRadius: '8px', fontSize: '14px', 
                                    border: `1px solid ${wuxing.includes(wx) ? greenColor : THEME.border}`, 
                                    backgroundColor: wuxing.includes(wx) ? '#f6ffed' : THEME.bg, 
                                    color: wuxing.includes(wx) ? greenColor : THEME.black, 
                                    fontWeight: wuxing.includes(wx) ? 'bold' : 'normal', 
                                    cursor: 'pointer' 
                                }}
                            >
                                {wx}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading}
                        style={{ 
                            width: '100%', padding: '12px', backgroundColor: greenColor, color: 'white', 
                            borderRadius: '30px', fontSize: '15px', fontWeight: 'bold', border: 'none', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                            cursor: isLoading ? 'not-allowed' : 'pointer' 
                        }}
                    >
                        {isLoading ? <RefreshCw size={18} className="spin" /> : <Sparkles size={18} />} 
                        {isLoading ? '配對中...' : '開始篩選吉名'}
                    </button>

                    {names.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: THEME.black }}>為您推薦：</h5>
                            {names.map((item, i) => (
                                <NameCardLayout 
                                    key={i}
                                    surname={item.surname || displaySurname}
                                    surnameStrokes={item.surnameStrokes || 10}
                                    c1Data={item.char1}
                                    c2Data={item.char2}
                                    THEME={THEME}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};