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

export const AiBaziAnalysis = ({ data, utils, THEME, appType = 'bazi', onSave }) => {
  const { WUXING_MAP, ZHI_HIDDEN, getShiShen, getShenSha, TIANGAN, DIZHI } = utils || {};

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(data.aiReport || null);
  const [isPaid, setIsPaid] = useState(data.isPaid || !!data.aiReport || false);
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [customWuxing, setCustomWuxing] = useState([]);
  
  const [userToken, setUserToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGenerateAIReport = async (overrideWuxing = null) => {
      setIsAnalyzing(true);
      
      let prompt = `你現在是一位專業、親切且具備深厚玄學素養的風水命理大師。請根據以下資料，為我撰寫一份約 1000 字的專業命書。排版請使用 Markdown 格式，並且在結尾註明版權為【許甯博風水命理館】所有。\n\n`;
      
      prompt += `【基本資料】\n`;
      prompt += `姓名：${data.name || '未命名'}\n`;
      prompt += `性別：${data.genderText}\n`;
      prompt += `農曆出生：${data.lunarDateStr || data.lunarDate}\n`;
      
      if (appType === 'bazi' && data.bazi) {
          prompt += `八字四柱：${data.bazi.yearGan}${data.bazi.yearZhi} ${data.bazi.monthGan}${data.bazi.monthZhi} ${data.bazi.dayGan}${data.bazi.dayZhi} ${data.bazi.timeGan}${data.bazi.timeZhi}\n`;
          
          if (data.daYuns && data.daYuns.length > 0) {
              const currentYear = new Date().getFullYear();
              const currentDy = data.daYuns.find(dy => currentYear >= dy.startYear && currentYear <= (dy.startYear + 9));
              
              if (currentDy) {
                  prompt += `當前大運：【${currentDy.gan}${currentDy.zhi}】運 (起於西曆 ${currentDy.startYear} 年，虛歲 ${currentDy.startAge} 歲)\n`;
                  const lns = currentDy.liuNians.filter(ln => ln.year >= currentYear && ln.year <= currentYear + 1);
                  if (lns.length > 0) {
                      prompt += `近期流年：${lns.map(ln => `${ln.year}年(${ln.gan}${ln.zhi}年)`).join('、')}\n`;
                  }
              }
          }
          prompt += `\n⚠️ 【系統強制指令】：請務必嚴格使用上述提供的「當前大運」與「近期流年」干支與年份進行分析。絕對禁止自行重新推算起運歲數或大運干支，以免造成時間錯亂。\n`;

      } else if (appType === 'zwds' && data.mingGongStars) {
          prompt += `命宮主星：${data.mingGongStars}\n`;
          prompt += `五行局：${data.bureau}\n`;
          prompt += `命主：${data.mingZhu}，身主：${data.shenZhu}\n`;
          
          const currentYear = new Date().getFullYear();
          prompt += `當前流年：${currentYear} 年\n`;
          prompt += `\n⚠️ 【系統強制指令】：請務必嚴格使用上述提供的「當前流年」進行分析，絕對禁止自行推算流年干支。\n`;
      }

      prompt += `\n【報告要求段落】請按以下結構撰寫：\n`;
      prompt += `⚠️ 排版規定：請全部使用文字與列點 (Bullet points) 呈現，絕對不要使用表格 (Table)。\n`;
      prompt += `1. 原局總論與核心性格特質,他給別人的感覺及他真實的內心 (引述經典古籍如《滴天髓》、《千里命稿》、《窮通寶鑑》、《三命通會》、《子平真詮》、《淵海子平》、《神峰通考》或《紫微斗數全書》)\n`;
      prompt += `2. 人生頭30年曾/將會發生的3件大事，如沒有不要老作 (事件越具體越好,例如獲奬、傑出成就、車禍、先天疾病)\n`;
      prompt += `3. 天賦事業與財富格局分析 (從五行及變通星分析，給予具體的投資與創業建議)\n`;
      prompt += `4. 感情婚姻與伴侶特質\n`;
      prompt += `5. 疾厄與中醫五行養生建議\n`;
      prompt += `6. 當前十年大運與前後3年大勢詳述 (如果命主是小童, 不要提及未入大運或/及出世前的流年運勢)\n`;
      prompt += `7. 開運與幸運色/吉方建議，行為建議\n`;

      // 👇 修正：只有當管理員解鎖 (isAdminUnlocked 為 true) 時，才要求 AI 給出改名建議 👇
      if (isAdminUnlocked) {
          if (overrideWuxing && overrideWuxing.length > 0) {
              prompt += `\n8. 👑 專屬改名建議：客戶指定喜用神為【${overrideWuxing.join('、')}】，請推薦 3 個符合此五行的優雅中文字，並附上古典詩詞出處。\n`;
          } else {
              prompt += `\n8. 👑 專屬改名建議：請根據原局推算出的「喜用神」五行，推薦 3 個符合該五行的優雅中文字（男女適用需符合性別），並附上古典詩詞出處與寓意。\n`;
          }
      }

      try {
          const GAS_PROXY_URL = "https://script.google.com/macros/s/AKfycbyyTTv2RWkwSjogD8W46UFIGMNZMnn6tpAQTwhpfUwN5SeQ8NzQvThwY-AttTkClEII/exec"; 

          const response = await fetch(GAS_PROXY_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ prompt: prompt, token: userToken })
          });

          if (!response.ok) throw new Error(`網路請求失敗，狀態碼：${response.status}`);
          const result = await response.json();
          
          // 🛑 核心防線：如果後端 GAS 說 Token 無效，立刻拋出錯誤阻擋！
          if (result.result === "error") {
              throw new Error(result.message || "授權碼無效或已使用完畢");
          }
          if (!result.text) throw new Error("API 回傳成功，但內容為空。");
          
          // ✅ 只有當後端確實回傳了命書內容，才正式解鎖並存入手機
          setAnalysisResult(result.text);
          setIsPaid(true);

          data.aiReport = result.text;
          data.isPaid = true;
          data.paidAt = data.paidAt || Date.now();
          if (onSave) onSave(data, true);

      } catch (error) {
          console.error("AI 錯誤詳細資訊:", error);
          alert("❌ 命書生成失敗\n\n伺服器繁忙或網路連線異常，請稍後再試。");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handlePurchasePoints = () => {
      // window.open('https://your-stripe-payment-link.com', '_blank');
      alert("系統測試中，暫未開放購買。");
  };

  const handleTokenSubmit = () => {
      if (!userToken) return alert("請輸入您的授權碼 (Token)");
      
      // 暫時攔截 Token 提交，不發送給後端
      alert("系統測試中，暫停 Token 驗證服務。");
      
      // setShowTokenInput(false);
      // handleGenerateAIReport();
  };

  const handlePasswordUnlock = (e) => {
      e.stopPropagation(); 
      const password = prompt("請輸入後台授權解鎖密碼：");
      if (!password) return;
      if (password === "mrk888") {
          setIsPaid(true);
          // 👇 這裡設定為 true 後，接下來呼叫 handleGenerateAIReport 就會包含改名建議
          setIsAdminUnlocked(true); 
          
          data.isPaid = true;
          data.paidAt = Date.now();
          if (onSave) onSave(data, true); 
          
          // 注意：因為 setState 非同步，我們直接在 handleGenerateAIReport 內部判定可能抓不到最新的 isAdminUnlocked，
          // 所以這裡我們改用傳遞參數的方式，或者依賴下一次渲染。最簡單的做法是在生成時稍微等一下。
          setTimeout(() => handleGenerateAIReport(), 100); 
          
          alert("🔓 已為您手動開啟 AI 運算權限，且已自動保存狀態！");
      } else { 
          alert("❌ 密碼錯誤，無法解鎖。"); 
      }
  };

  const handleDownloadPdf = () => {
      if (!analysisResult) return;
      setIsGeneratingPdf(true);

      if (!window.html2pdf) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => executePdfGeneration();
          document.body.appendChild(script);
      } else {
          executePdfGeneration();
      }
  };

  const executePdfGeneration = () => {
      if (!analysisResult) return setIsGeneratingPdf(false);

      // 👇 修正：在最外層的 style 加上 text-align: justify; 讓文字左右切齊 👇
      let htmlContent = `
      <div style="font-family: 'PingFang TC', 'Microsoft JhengHei', 'Heiti TC', sans-serif; padding: 20px 10px; color: #222; line-height: 1.8; font-size: 15px; word-break: break-word; letter-spacing: 0.5px; text-align: justify;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 10px; page-break-inside: avoid; break-inside: avoid;">
              <h2 style="margin: 0 0 10px 0; color: #000;">【${data.name || '未命名'}】專屬深度命書</h2>
              <div style="font-size: 13px; color: #666;">生成時間：${new Date().toLocaleDateString()} | ©許甯博風水命理館</div>
          </div>
      `;

      analysisResult.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed === '---' || trimmed === '***' || trimmed === '___') return;
          
          let elementHtml = '';
          if (line.startsWith('###')) {
              elementHtml = `<h3 style="color: #000; margin-top: 24px; margin-bottom: 12px; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">${line.replace(/### /g, '')}</h3>`;
          } else if (line.startsWith('**▶')) {
              elementHtml = `<div style="font-weight: bold; color: #1890ff; margin-top: 16px; margin-bottom: 8px; font-size: 16px;">${line.replace(/\*\*/g, '')}</div>`;
          } else if (line.startsWith('**【') && line.endsWith('】**')) {
              elementHtml = `<div style="font-weight: bold; color: #008080; margin-top: 20px; margin-bottom: 10px; font-size: 17px; border-bottom: 2px dashed #008080; padding-bottom: 4px;">${line.replace(/\*\*/g, '')}</div>`;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
              const content = line.substring(2);
              const parts = content.split('**');
              let formatted = parts.map((part, idx) => idx % 2 === 1 ? `<b style="color: #333;">${part}</b>` : part).join('');
              elementHtml = `<div style="margin-left: 12px; margin-bottom: 8px;">• ${formatted}</div>`;
          } else {
              const boldParts = line.split('**');
              let formatted = boldParts.map((part, idx) => idx % 2 === 1 ? `<strong style="color: #d9363e;">${part}</strong>` : part).join('');
              elementHtml = `<div style="margin-bottom: 14px;">${formatted}</div>`; 
          }
          
          htmlContent += `<div style="page-break-inside: avoid; break-inside: avoid;">${elementHtml}</div>`;
      });

      htmlContent += `</div>`;

      const opt = {
          margin:       15, 
          filename:     `${data.name || '未命名'}_深度批命書.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true }, 
          pagebreak:    { mode: ['css', 'avoid-all'] }, 
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf().set(opt).from(htmlContent).save().then(() => {
          setIsGeneratingPdf(false);
      }).catch(err => {
          console.error('PDF 生成失敗', err);
          setIsGeneratingPdf(false);
      });
  };

  return (
    <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.teal}`, paddingLeft: '8px', fontSize: '15px' }}>
            AI 深度批命書
          </h4>
          {!isPaid && (
            <Lock 
              size={14} color={THEME.gray} 
              style={{ cursor: 'pointer', opacity: 0.6 }} 
              onClick={handlePasswordUnlock}
            />
          )}
        </div>
        {isPaid && <span style={{ fontSize: '11px', color: '#fff', backgroundColor: THEME.green || '#52c41a', padding: '2px 6px', borderRadius: '4px' }}>已解鎖</span>}
      </div>

      {isAnalyzing ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <RefreshCw size={36} color={THEME.teal} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto' }} />
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.teal, marginTop: '16px' }}>AI 大師正在為您測算命局...</div>
          <div style={{ fontSize: '13px', color: THEME.gray, marginTop: '8px' }}>請稍候，可能需要 4~5 分鐘，請先去泡杯咖啡</div>
        </div>
      ) : analysisResult ? (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
             <button 
                 onClick={handleDownloadPdf}
                 disabled={isGeneratingPdf}
                 style={{ 
                     display: 'flex', alignItems: 'center', gap: '6px', 
                     padding: '8px 16px', backgroundColor: isGeneratingPdf ? THEME.gray : THEME.black, 
                     color: THEME.white, border: 'none', borderRadius: '6px', 
                     fontSize: '14px', cursor: isGeneratingPdf ? 'wait' : 'pointer', 
                     fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                 }}
             >
                 {isGeneratingPdf ? <RefreshCw size={16} className="spin" /> : <Download size={16} />}
                 {isGeneratingPdf ? '處理中...' : '下載命書 (PDF)'}
             </button>
          </div>

          <div id="fatebook-content" style={{ 
            backgroundColor: THEME.bgGray, padding: '24px', borderRadius: '8px',
            fontSize: '15px', lineHeight: '1.8', color: '#222', textAlign: 'justify',
            border: `1px solid ${THEME.border}`, maxHeight: '700px', overflowY: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
                <h2 style={{ margin: '0 0 10px 0' }}>【{data.name || '未命名'}】專屬深度命書</h2>
                <div style={{ fontSize: '13px', color: '#666' }}>生成時間：{new Date().toLocaleDateString()} | ©許甯博風水命理館</div>
            </div>

            {analysisResult.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (trimmed === '---' || trimmed === '***' || trimmed === '___') return null;
              if (line.startsWith('###')) return <h3 key={i} style={{ color: THEME.black, marginTop: '24px', marginBottom: '12px', fontSize: '18px', borderBottom: `1px solid #ddd`, paddingBottom: '8px' }}>{line.replace(/### /g, '')}</h3>;
              if (line.startsWith('**▶')) return <div key={i} style={{ fontWeight: 'bold', color: THEME.blue, marginTop: '16px', marginBottom: '8px', fontSize: '16px' }}>{line.replace(/\*\*/g, '')}</div>;
              if (line.startsWith('**【') && line.endsWith('】**')) return <div key={i} style={{ fontWeight: 'bold', color: THEME.teal, marginTop: '20px', marginBottom: '10px', fontSize: '17px', borderBottom: `2px dashed ${THEME.teal}`, paddingBottom: '4px' }}>{line.replace(/\*\*/g, '')}</div>;
              
              if (line.startsWith('- ') || line.startsWith('* ')) {
                  const content = line.substring(2);
                  const parts = content.split('**');
                  if (parts.length > 1) return <div key={i} style={{ marginLeft: '12px', marginBottom: '8px' }}>• {parts.map((part, idx) => idx % 2 === 1 ? <b key={idx} style={{color: '#333'}}>{part}</b> : part)}</div>;
                  return <div key={i} style={{ marginLeft: '12px', marginBottom: '8px' }}>• {content}</div>;
              }
              const boldParts = line.split('**');
              if (boldParts.length > 1) return <p key={i} style={{ marginBottom: '14px' }}>{boldParts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: THEME.red || '#d9363e' }}>{part}</strong> : part)}</p>;
              return <p key={i} style={{ marginBottom: '14px' }}>{line}</p>;
            })}
          </div>
          
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
        </div>
      ) : isPaid ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #ccc' }}>
            <div style={{ fontWeight: 'bold', color: THEME.black, fontSize: '18px', marginBottom: '8px' }}>此命書已成功解鎖 🔓</div>
            <div style={{ fontSize: '14px', color: THEME.gray, marginBottom: '20px', lineHeight: '1.6' }}>
                若之前因伺服器繁忙未能顯示，或您尚未生成命書，<br/>請點擊下方按鈕開始運算（不會再次扣款）。
            </div>
            <button onClick={() => handleGenerateAIReport()} style={{ padding: '12px 32px', backgroundColor: THEME.blue, color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>開始生成 AI 命書</button>
        </div>
      ) : (
        <div style={{ padding: '10px 0' }}>
            <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: '12px', borderRadius: '8px', marginBottom: '16px', color: '#d46b08', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span><b>溫馨提示：</b>請先點擊畫面上方的「保存」按鈕將命盤存入紀錄，再進行解鎖。解鎖後系統將自動為您更新儲存狀態，確保資料不遺失。</span>
            </div>

            <div style={{ backgroundColor: '#fafafa', border: '1px dashed #ccc', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>解鎖 AI 深度命書，您將獲得：</div>
                <ul style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
                <li>由最先進 AI 語言模型為您客製化批命</li>
                <li>透視原局性格、財富格局與事業發展方向</li>
                <li>深度感情分析與伴侶特質解析</li>
                <li>**獨家剖析當前【十年大運】與【近期流年】大勢**</li>
                <li>每次生成需消耗 1 個點數 Token</li>
                <li>AI 論命或有錯漏失算，僅供娛樂</li>
                </ul>
            </div>
            
            {showTokenInput ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.3s ease' }}>
                    <input type="text" placeholder="請輸入您的授權碼 (Token)" value={userToken} onChange={(e) => setUserToken(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setShowTokenInput(false)} style={{ flex: 1, padding: '12px', backgroundColor: THEME.bgGray, color: THEME.gray, border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>取消</button>
                        <button onClick={handleTokenSubmit} style={{ flex: 2, padding: '12px', backgroundColor: THEME.blue, color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>確認扣點並生成</button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => setShowTokenInput(true)} style={{ width: '100%', padding: '12px', backgroundColor: THEME.black, color: '#FFD700', border: 'none', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Unlock size={18} /> 輸入 Token 扣點解鎖
                    </button>
                    <button onClick={handlePurchasePoints} style={{ width: '100%', padding: '12px', backgroundColor: THEME.white, color: THEME.blue, border: `1px solid ${THEME.blue}`, borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                        購買點數 (Buy Tokens)
                    </button>
                </div>
            )}
        </div>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } } 
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};