import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw, Download, Unlock } from 'lucide-react';

// --- 姓名學 81 格大吉數及短評 (原封不動搬過來) ---
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
    25: "【英邁俊敏卦】有才傲物，天資英敏；集天時地利於一身 (吉)",
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

// --- AiBaziAnalysis (已從主程式抽出) ---
export const AiBaziAnalysis = ({ data, utils, THEME }) => {
  // 從主程式接收必要的排盤變數與輔助函式
  const { WUXING_MAP, ZHI_HIDDEN, getShiShen, getShenSha, TIANGAN, DIZHI } = utils;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isPaid, setIsPaid] = useState(data.isPaid || false);
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [customWuxing, setCustomWuxing] = useState([]);
  const [customStroke1, setCustomStroke1] = useState('');
  const [customStroke2, setCustomStroke2] = useState('');
  const [customChar1, setCustomChar1] = useState('');
  const [customChar2, setCustomChar2] = useState('');

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

  const generateLongReport = (isAdmin = false, overrideWuxing = null, opts = {}) => {
    const { bazi, genderText } = data;
    const wx = getCounts();
    const liJiRule = data.meta?.liJiRule || 'day';
    const dm = liJiRule === 'year' ? bazi.yearGan : bazi.dayGan;
    const refName = liJiRule === 'year' ? '年干' : '日元';
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
    
    report += `閣下為**【${dm}${dmWuxing}】**${refName}，生於${season}${bazi.monthZhi}月。\n`;
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
    
    if (totalSelfPower >= 5.5 || (isMonthFavorable && totalSelfPower >= 4.5)) {
        report += `從原局能量來看，閣下八字屬於明顯的**「身旺」**之局。依據五行生剋原理，日元氣勢強旺，需引導宣洩或適當雕琢。\n`;
    } else if (totalSelfPower <= 2.5 || (!isMonthFavorable && totalSelfPower <= 3.5)) {
        report += `從原局能量來看，閣下八字屬於明顯的**「身弱」**之局。依據五行生剋原理，日元根氣較弱，急需生扶與滋補。\n`;
    } else {
        report += `從原局能量來看，閣下八字五行氣場較為平和，**日元能量適中，並無極端之過旺或過弱**。或是局中雖有生扶之神，但受牽制而處於動態平衡。依據五行中庸之道，此類命格之喜用，當視大運與流年之進退來靈活調候。\n`;
    }
    
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

    let geJuAnalysis = '';
    const checkHuaQiGrid = () => {
        const neighborGans = [bazi.monthGan, bazi.timeGan]; 
        if ((dm === '甲' && neighborGans.includes('己')) || (dm === '己' && neighborGans.includes('甲'))) {
            if (monthZhiWuxing === '土' || wx['土'] >= 3) return '【甲己化土格】';
        }
        if ((dm === '乙' && neighborGans.includes('庚')) || (dm === '庚' && neighborGans.includes('乙'))) {
            if (monthZhiWuxing === '金' || wx['金'] >= 3) return '【乙庚化金格】';
        }
        if ((dm === '丙' && neighborGans.includes('辛')) || (dm === '辛' && neighborGans.includes('丙'))) {
            if (monthZhiWuxing === '水' || wx['水'] >= 3) return '【丙辛化水格】';
        }
        if ((dm === '丁' && neighborGans.includes('壬')) || (dm === '壬' && neighborGans.includes('丁'))) {
            if (monthZhiWuxing === '木' || wx['木'] >= 3) return '【丁壬化木格】';
        }
        if ((dm === '戊' && neighborGans.includes('癸')) || (dm === '癸' && neighborGans.includes('戊'))) {
            if (monthZhiWuxing === '火' || wx['火'] >= 3) return '【戊癸化火格】';
        }
        return null;
    };

    const huaQiName = checkHuaQiGrid();

    if (huaQiName) {
        geJuAnalysis = `屬於特別格局中的**化氣格**，具體為**${huaQiName}**。這代表日主與貼近之天干達成天作之合，原局氣勢已被誘導轉向化神五行。此命格之人往往極具協調能力，行運最喜見化神及生扶化神之運，最忌爭合與逆其化神之氣。`;
    } 
    else if (!isStrong && totalSelfPower <= 1.5) {
        const enemyWuxings = [rel.produce, rel.control, rel.controlledBy]; 
        let maxEnemy = enemyWuxings[0];
        enemyWuxings.forEach(e => { if (wx[e] > wx[maxEnemy]) maxEnemy = e; });

        if (maxEnemy === rel.control) {
            geJuAnalysis = `屬於特別格局中的**從格**，具體為**【從財格】**。因日主極度弱勢，且局中財星氣勢滔天。日主自知無法自立，故「棄命從財」。此命格者對商機、財富極具天賦，行運最喜行財旺、食傷旺地，最忌印比生扶拔根破局。`;
        } else if (maxEnemy === rel.controlledBy) {
            geJuAnalysis = `屬於特別格局中的**從格**，具體為**【從殺格】**（或從官格）。因局中官殺肆虐、孤立無援，日主選擇全心臣服於官殺之威勢。行運喜官殺、財星，大忌印比運引發戰局。`;
        } else {
            geJuAnalysis = `屬於特別格局中的**從格**，具體為**【從兒格】**（即從食傷格）。古書云：「從兒不管身強弱，只要吾兒又見兒」。此局傷食大旺，才華橫溢，行運喜食傷、財星（兒又見兒），最忌官殺與印星破壞流暢之氣。`;
        }
    }
    else if (isStrong && totalSelfPower >= 6.5) {
        let zhuanWangName = '專旺格';
        if (dmWuxing === '木') zhuanWangName = '曲直仁壽格';
        if (dmWuxing === '火') zhuanWangName = '炎上格';
        if (dmWuxing === '土') zhuanWangName = '稼穡格';
        if (dmWuxing === '金') zhuanWangName = '從革格';
        if (dmWuxing === '水') zhuanWangName = '潤下格';
        geJuAnalysis = `屬於特別格局中的**專旺格**（一行得氣格），具體為**【${zhuanWangName}】**。局中同類與印星能量高度凝聚，日主氣勢沖天，不可逆其鋒芒。行運喜順其氣勢之印比與食傷，大忌逆勢之官殺運。`;
    }
    else {
        let normalName = `${monthTenGodFullName}格`;
        if (monthTenGod === '比') normalName = '建祿格';
        if (monthTenGod === '劫') normalName = '月劫格（建祿月劫常格）';
        geJuAnalysis = `屬於普通八格中的**正格**，具體為**【${normalName}】**。此格局行事遵循傳統子平常理，最重視原局五行的中庸、抑扶與流通，需依據日元強弱，尋求財官印食的制衡配合，行運喜中和，不喜大起大落。`;
    }

    report += `- **命局格局判定：** 經綜合原局能量分布、天干五合與月令氣勢，閣下之命局${geJuAnalysis}\n`;
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

        const parseChars = (arr) => arr.map(str => {
            const [c, s, t, p] = str.split('|');
            return { c, s: Number(s), t, p };
        });

        const CHARS = {
            // (為節省空間，請自行從原程式碼複製 CHARS 金水木火土 完整字典內容至此)
        };

        const getCharDetail = (char) => {
            if (!char) return null;
            for (const wx in CHARS) {
                const match = CHARS[wx].find(item => item.c === char);
                if (match) return { ...match, wx };
            }
            return null;
        };

        let missingChars = [];
        let c1Fixed = null;
        let c2Fixed = null;

        if (opts.char1) {
            c1Fixed = getCharDetail(opts.char1);
            if (!c1Fixed) missingChars.push(opts.char1);
        }
        if (opts.char2) {
            c2Fixed = getCharDetail(opts.char2);
            if (!c2Fixed) missingChars.push(opts.char2);
        }

        if (missingChars.length > 0) {
            report += `\n⚠️ **系統提示**：您輸入的自定義字 **「${missingChars.join('、')}」** 目前不在內建的《康熙字典》精選詩詞字庫中。\n請手動將其加入程式碼的 \`CHARS\` 變數內（請確實標明筆劃、平仄與出處），方可進行五格與音律分析。\n\n💡 **添加範例格式**：\n\`'${missingChars[0]}|筆劃|平(或仄)|詩詞出處 (作者《書名》)'\`\n\n`;
            return report; 
        }

        if (overrideWuxing && overrideWuxing.length > 0) {
            report += `根據您手動設定之需求，五行鎖定為**【${namingWuxing.join('、')}】**。\n`;
        } else {
            report += `根據八字喜忌，閣下之喜用神為**【${namingWuxing.join('、')}】**。\n`;
        }

        let conditionsDesc = [];
        if (opts.char1) conditionsDesc.push(`首字指定「${opts.char1}」`);
        if (opts.char2) conditionsDesc.push(`尾字指定「${opts.char2}」`);
        if (opts.stroke1) conditionsDesc.push(`首字限定 ${opts.stroke1} 畫`);
        if (opts.stroke2) conditionsDesc.push(`尾字限定 ${opts.stroke2} 畫`);

        if (conditionsDesc.length > 0) {
            report += `您已套用進階篩選條件：${conditionsDesc.join('、')}。\n`;
        } else {
            report += `以下為您推薦符合康熙字典五行、三才五格大吉，且蘊含古典詩詞之美的精選好名。\n`;
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

        const AUSPICIOUS = Object.keys(EIGHTY_ONE_ATTR)
            .filter(k => EIGHTY_ONE_ATTR[k].includes('(吉)') || EIGHTY_ONE_ATTR[k].includes('(大吉)'))
            .map(Number);
        const ALLOWED_TONES = ['平平仄', '平仄平', '仄仄平', '仄平仄', '平平平', '仄平平', '平仄仄'];

        let recommendations = [];
        let pool = [];
        namingWuxing.forEach(wx => { if (CHARS[wx]) pool = pool.concat(CHARS[wx].map(item => ({...item, wx}))); });

        let pool1 = c1Fixed ? [c1Fixed] : pool.filter(c => opts.stroke1 ? c.s === Number(opts.stroke1) : true);
        let pool2 = c2Fixed ? [c2Fixed] : pool.filter(c => opts.stroke2 ? c.s === Number(opts.stroke2) : true);
        const hasCustomConstraints = opts.char1 || opts.char2 || opts.stroke1 || opts.stroke2;

        for (let i = 0; i < pool1.length; i++) {
            for (let j = 0; j < pool2.length; j++) {
                const c1 = pool1[i];
                const c2 = pool2[j];
                if (c1.c === c2.c) continue; 
                
                const renGe = surnameStrokes + c1.s;
                const diGe = c1.s + c2.s;
                const zongGe = surnameStrokes + c1.s + c2.s;
                const waiGe = c2.s + 1;
                const tonePattern = `${surnameTone}${c1.t}${c2.t}`;

                const isAuspicious = AUSPICIOUS.includes(renGe) && 
                                     AUSPICIOUS.includes(diGe) && 
                                     AUSPICIOUS.includes(zongGe) && 
                                     AUSPICIOUS.includes(waiGe);
                
                const isGoodTone = ALLOWED_TONES.includes(tonePattern);

                if (hasCustomConstraints || (isAuspicious && isGoodTone)) {
                    recommendations.push({
                        name1: c1.c, name2: c2.c, s1: c1.s, s2: c2.s,
                        renGe, diGe, zongGe, waiGe, tonePattern, p1: c1.p, p2: c2.p,
                        isAuspicious: isAuspicious
                    });
                }
            }
        }

        if (recommendations.length > 0) {
            recommendations.sort(() => 0.5 - Math.random()); 
            
            if (hasCustomConstraints) {
                recommendations.sort((a, b) => {
                    const aScore = (AUSPICIOUS.includes(a.renGe)?1:0) + (AUSPICIOUS.includes(a.diGe)?1:0) + (AUSPICIOUS.includes(a.zongGe)?1:0) + (AUSPICIOUS.includes(a.waiGe)?1:0);
                    const bScore = (AUSPICIOUS.includes(b.renGe)?1:0) + (AUSPICIOUS.includes(b.diGe)?1:0) + (AUSPICIOUS.includes(b.zongGe)?1:0) + (AUSPICIOUS.includes(b.waiGe)?1:0);
                    return bScore - aScore;
                });
            }
            
            const top = [];
            const usedChars = new Set(); 
            
            for (let k = 0; k < recommendations.length; k++) {
                const rec = recommendations[k];
                if (c1Fixed || c2Fixed || (!usedChars.has(rec.name1) && !usedChars.has(rec.name2) && rec.name1 !== rec.name2)) {
                    top.push(rec);
                    if (!c1Fixed) usedChars.add(rec.name1); 
                    if (!c2Fixed) usedChars.add(rec.name2); 
                }
                if (top.length === 10) break; 
            }
            
            if (hasCustomConstraints) {
                report += `\n- **【自訂條件分析結果】**：\n`;
                const hasPerfect = top.some(t => t.isAuspicious);
                
                if (c1Fixed && c2Fixed) {
                    if (!top[0].isAuspicious) report += `⚠️ **注意**：您自訂的組合五格數理並非全部大吉，吉凶詳見下方圖表之短評。\n`;
                } else if (!hasPerfect) {
                    report += `⚠️ **注意**：根據您指定的條件（筆劃或單字），無法組合出「完全大吉」的名字。以下列出符合您條件的組合，請參考五格圖表中標示的**凶數與短評**。\n`;
                } else {
                    report += `以下為符合您自訂條件，且盡量為您挑選出吉數的組合：\n`;
                }
            } else {
                report += `\n- **【精選大吉詩意組合】** (已過濾不雅音律與凶數)：\n`;
            }
            
            top.forEach(rec => {
                report += `[NAMECARD]:${surname}|${rec.name1}|${rec.name2}|${surnameStrokes}|${rec.s1}|${rec.s2}|${rec.tonePattern}|${rec.p1}|${rec.p2}\n`;
            });
            report += `\n*註：以上筆畫以康熙字典為準。*\n\n`;
        } else {
            report += `\n- ⚠️ **分析結果**：根據您的姓氏與設定條件，目前的精選詩詞字庫中暫無匹配之字元，建議放寬筆劃限制或清除條件重新嘗試。\n\n`;
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
                  setIsAdminUnlocked(true);
                  setAnalysisResult(generateLongReport(true)); 
                  alert("🔓 已為您手動開啟命書與【專屬改名建議】！");
              } catch (e) { console.error(e); } 
              finally { setIsAnalyzing(false); }
          }, 500);
      } else { alert("❌ 密碼錯誤，無法解鎖。"); }
  };

  const handleDownloadTxt = () => {
      if (!analysisResult) return;

      let textToSave = analysisResult
          .replace(/### /g, '\n■ ')
          .replace(/\*\*/g, '')
          .replace(/- /g, '• ');

      const lines = textToSave.split('\n');
      const cleanLines = lines.map(line => {
          if (line.startsWith('[NAMECARD]:')) {
              const dataStr = line.substring(11);
              const [sur, n1, n2, s0, s1, s2, tone, p1, p2] = dataStr.split('|');
              return `
【推薦好名】：${sur}${n1}${n2}
  - 姓名五格：天格(${Number(s0)+1})、人格(${Number(s0)+Number(s1)})、地格(${Number(s1)+Number(s2)})、總格(${Number(s0)+Number(s1)+Number(s2)})、外格(${Number(s2)+1})
  - 音律：${tone}
  - 詩詞尋源：
    「${n1}」：${p1}
    「${n2}」：${p2}
`;
          }
          return line;
      });

      textToSave = `【${data.name}】千字深度批命書\n生成時間：${new Date().toLocaleString()}\n\n` + cleanLines.join('\n');

      const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.name}_千字命書.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
             <button 
                 onClick={handleDownloadTxt}
                 style={{ 
                     display: 'flex', alignItems: 'center', gap: '6px', 
                     padding: '8px 16px', backgroundColor: THEME.black, color: THEME.white, 
                     border: 'none', borderRadius: '6px', fontSize: '14px', 
                     cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                 }}
             >
                 <Download size={16} />
                 下載命書 (TXT)
             </button>
          </div>

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
          
          {isAdminUnlocked && (
             <div style={{ marginTop: '16px', padding: '16px', backgroundColor: THEME.white, borderRadius: '8px', border: `1px dashed ${THEME.blue}` }}>
                 <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black, marginBottom: '8px' }}>⚙️ 手動設定命名條件</div>
                 
                 <div style={{ fontSize: '13px', color: THEME.gray, marginBottom: '8px' }}>1. 指定五行屬性 (選填)</div>
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

                 <div style={{ fontSize: '13px', color: THEME.gray, marginBottom: '8px' }}>2. 指定筆劃或特定字元 (選填)</div>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                     <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                         首字筆劃 <input type="number" value={customStroke1} onChange={e => setCustomStroke1(e.target.value)} placeholder="不限" style={{ width: '50px', marginLeft: '6px', padding: '4px', border: `1px solid ${THEME.border}`, borderRadius: '4px' }} />
                     </label>
                     <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                         尾字筆劃 <input type="number" value={customStroke2} onChange={e => setCustomStroke2(e.target.value)} placeholder="不限" style={{ width: '50px', marginLeft: '6px', padding: '4px', border: `1px solid ${THEME.border}`, borderRadius: '4px' }} />
                     </label>
                     <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                         指定首字 <input type="text" maxLength="1" value={customChar1} onChange={e => setCustomChar1(e.target.value)} placeholder="不限" style={{ width: '50px', marginLeft: '6px', padding: '4px', border: `1px solid ${THEME.border}`, borderRadius: '4px', textAlign: 'center' }} />
                     </label>
                     <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                         指定尾字 <input type="text" maxLength="1" value={customChar2} onChange={e => setCustomChar2(e.target.value)} placeholder="不限" style={{ width: '50px', marginLeft: '6px', padding: '4px', border: `1px solid ${THEME.border}`, borderRadius: '4px', textAlign: 'center' }} />
                     </label>
                 </div>

                 <button 
                     onClick={() => setAnalysisResult(generateLongReport(true, customWuxing, {
                         stroke1: customStroke1, stroke2: customStroke2,
                         char1: customChar1, char2: customChar2
                     }))}
                     style={{ width: '100%', padding: '10px 16px', backgroundColor: THEME.blue, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
                 >
                     套用條件並重新生成
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