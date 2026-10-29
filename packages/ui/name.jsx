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

          {isAdminUnlocked && (
             <div style={{ marginTop: '16px', padding: '16px', backgroundColor: THEME.white, borderRadius: '8px', border: `1px dashed ${THEME.blue}` }}>
                 <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black, marginBottom: '8px' }}>⚙️ 手動設定命名條件 (AI 重生)</div>
                 <div style={{ fontSize: '13px', color: THEME.gray, marginBottom: '8px' }}>指定五行喜用神：</div>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                     {['木', '火', '土', '金', '水'].map(wx => (
                         <label key={wx} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '14px' }}>
                             <input type="checkbox" checked={customWuxing.includes(wx)} 
                                 onChange={(e) => {
                                     let newWx = [...customWuxing];
                                     if (e.target.checked) newWx.push(wx);
                                     else newWx = newWx.filter(w => w !== wx);
                                     setCustomWuxing(newWx);
                                 }}
                                 style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                             /> {wx}
                         </label>
                     ))}
                 </div>
                 <button onClick={() => handleGenerateAIReport(customWuxing)} style={{ width: '100%', padding: '10px 16px', backgroundColor: THEME.blue, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}>套用條件並重新生成命書</button>
             </div>
          )}
