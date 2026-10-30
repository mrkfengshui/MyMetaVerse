import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw, Download, Unlock } from 'lucide-react';

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
      
      let isChildBeforeDaYun = false; 
      
      // 🌟 1. 動態切換大師人設
      const masterName = appType === 'zwds' ? '陳希夷' : '徐子平';
      let prompt = `你現在是一位專業、客觀且具備深厚玄學素養的${masterName}大師。\n`;
      prompt += `⚠️【大師論命核心原則（極重要）】：請保持中肯與平衡，內心推演的吉凶比例請拿捏在 7:3 或 6:4 之間，既不粉飾太平，也不要過度悲觀。若命局有凶險，請如實點出並給予避險建議與生機。請展現一代宗師的慈悲與智慧，給予真實的預測。（🛑 嚴格禁止：絕對不可在撰寫的命書中提及「吉凶比例」、「7:3」、「6:4」、「吉六凶四」等任何設定字眼，請將此原則無痕、自然地融入您的行文語氣中）。\n\n`;prompt += `請根據以下資料，為我撰寫一份約 5000 字的專業命書。排版請使用 Markdown 格式，並且在結尾註明版權為【©許甯博風水命理館】所有。\n\n`;

      prompt += `【基本資料】\n`;
      prompt += `姓名：${data.name || '未命名'}\n`;
      prompt += `性別：${data.genderText}\n`;
      prompt += `農曆出生：${data.lunarDateStr || data.lunarDate}\n`;
      
      if (appType === 'bazi' && data.bazi) {
          prompt += `八字四柱：${data.bazi.yearGan}${data.bazi.yearZhi} ${data.bazi.monthGan}${data.bazi.monthZhi} ${data.bazi.dayGan}${data.bazi.dayZhi} ${data.bazi.timeGan}${data.bazi.timeZhi}\n`;
          prompt += `\n【日元分析特別指引】：請根據日元五行特性進行深度剖析，例如甲木參天、乙木柔弱等，並結合生肖與節氣進行生動的描述。\n`;
          
          if (data.daYuns && data.daYuns.length > 0) {
              const currentYear = new Date().getFullYear();
              const birthYear = parseInt(data.rawDate.year);
              const firstYunYear = data.daYuns[0].startYear;

              if (currentYear < firstYunYear) {
                  isChildBeforeDaYun = true; 
                  prompt += `狀態：命主目前尚未入大運 (將於西曆 ${firstYunYear} 年起運)。\n`;
                  
                  const recentLns = [];
                  const targetStartYear = Math.max(currentYear, birthYear); 
                  for (let y = targetStartYear; y < targetStartYear + 4; y++) {
                      try {
                          const tempLunar = window.Solar.fromYmd(y, 6, 15).getLunar();
                          recentLns.push(`${y}年(${tempLunar.getYearInGanZhi()}年)`);
                      } catch(e){}
                  }
                  if (recentLns.length > 0) prompt += `近期流年：${recentLns.join('、')}\n`;
              } else {
                  const currentDy = data.daYuns.find(dy => currentYear >= dy.startYear && currentYear <= (dy.startYear + 9));
                  if (currentDy) {
                      prompt += `當前大運：【${currentDy.gan}${currentDy.zhi}】運 (起於西曆 ${currentDy.startYear} 年，虛歲 ${currentDy.startAge} 歲)\n`;
                      const lns = currentDy.liuNians.filter(ln => ln.year >= currentYear && ln.year <= currentYear + 3);
                      if (lns.length > 0) prompt += `近期流年：${lns.map(ln => `${ln.year}年(${ln.gan}${ln.zhi}年)`).join('、')}\n`;
                  }
              }
          }
          prompt += `\n⚠️ 【系統強制指令】：請務必嚴格使用上述提供的「當前大運」與「近期流年」干支與年份進行分析。絕對禁止自行重新推算起運歲數或大運干支。\n`;

      } else if (appType === 'zwds' && data.mingGongStars) {
          prompt += `命宮主星：${data.mingGongStars}\n`;
          prompt += `五行局：${data.bureau}\n`;
          prompt += `命主：${data.mingZhu}，身主：${data.shenZhu}\n`;
          
          if (data.grid) {
              prompt += `\n【完整十二宮星曜分佈】（請嚴格依據此排盤推算三方四正與相夾）：\n`;
              data.grid.forEach(p => {
                  const major = p.stars.map(s => s.name).join('');
                  const minor = p.minorStars.map(s => s.name).join('、');
                  const all = [major, minor].filter(Boolean).join('，') || '空宮';
                  const dx = p.daXian ? `大限 ${p.daXian}` : '無大限';
                  prompt += `- ${p.zhi}宮【${p.name}】(宮干:${p.gan})：${dx}，星曜：${all}\n`;
              });
              if (data.formations && data.formations.length > 0) {
                  prompt += `\n【命局特殊格局】：${data.formations.join('、')}\n`;
                  prompt += `⚠️ 請在「原局總論」中，詳細解析上述特殊格局對命主的影響。\n`;
              }
          }
          
          const currentYear = new Date().getFullYear();
          const birthYear = parseInt(data.rawDate.year);
          const currentAge = currentYear - birthYear + 1; 
          
          const bureauNumMap = { '水二局': 2, '木三局': 3, '金四局': 4, '土五局': 5, '火六局': 6 };
          const firstYunAge = bureauNumMap[data.bureau] || 2;

          // 🌟 提取用戶的大限四化設定 (用來強制統整前後30年的四化標準)
          const storedDaXianType = localStorage.getItem('zwds_rule_daxian_sihua') || 'book';
          const siHuaRuleText = storedDaXianType === 'book' ? '依紫微斗數全書(由命宮起干，男女順逆行)' : '依大限本宮之宮干';

          if (currentAge < firstYunAge) {
              isChildBeforeDaYun = true; 
              const firstYunYear = birthYear + firstYunAge - 1;
              prompt += `\n狀態：命主目前尚未入大限 (將於西曆 ${firstYunYear} 年，虛歲 ${firstYunAge} 歲起運)。\n`;
              
              if (data.grid) {
                  prompt += `【近期歲限(小限)星曜分佈】：\n`;
                  for (let i = 0; i < 3; i++) {
                      const targetAge = currentAge + i;
                      const xiaoXianPalace = data.grid.find(p => p.xiaoXian && p.xiaoXian.includes(targetAge));
                      if (xiaoXianPalace) {
                          const stars = xiaoXianPalace.stars.map(s => s.name).join('') || '空宮';
                          prompt += `- 虛歲 ${targetAge} 歲 (${currentYear + i}年)：走【${xiaoXianPalace.name}】，星曜為 ${stars}\n`;
                      }
                  }
              }
          } else {
              prompt += `\n當前流年(歲限)：${currentYear} 年 (虛歲 ${currentAge} 歲)\n`;
              
              if (data.grid) {
                  const currentDaXian = data.grid.find(p => {
                      if (!p.daXian) return false;
                      const [start, end] = p.daXian.split('-').map(Number);
                      return currentAge >= start && currentAge <= end;
                  });
                  
                  if (currentDaXian) {
                      const daXianStars = currentDaXian.stars.map(s => s.name).join('') || '空宮';
                      let daXianGan = currentDaXian.gan; 
                      
                      if (storedDaXianType === 'book') {
                          const mingPalace = data.grid.find(p => p.name === '命宮');
                          const bYearGan = data.lunarDateStr.charAt(0); 
                          const isMale = data.genderText === '男';
                          const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
                          const isClockwise = (isMale && (TIANGAN.indexOf(bYearGan) % 2 === 0)) || (!isMale && (TIANGAN.indexOf(bYearGan) % 2 !== 0));
                          const steps = isClockwise ? (currentDaXian.zhiIdx - mingPalace.zhiIdx + 12) % 12 : (mingPalace.zhiIdx - currentDaXian.zhiIdx + 12) % 12;
                          daXianGan = TIANGAN[(TIANGAN.indexOf(mingPalace.gan) + steps) % 10];
                      }

                      const sfIdx = [currentDaXian.zhiIdx, (currentDaXian.zhiIdx + 4) % 12, (currentDaXian.zhiIdx + 8) % 12, (currentDaXian.zhiIdx + 6) % 12];
                      const sfNames = sfIdx.map(idx => data.grid.find(p => p.zhiIdx === idx).name).join('、');

                      prompt += `當前大限：走【${currentDaXian.name}】(歲數 ${currentDaXian.daXian})，星曜：${daXianStars}\n`;
                      prompt += `當前大限四化天干：【${daXianGan}】\n`;
                      prompt += `大限三方四正宮位為：${sfNames}\n`;
                  }

                  const currentXiaoXian = data.grid.find(p => p.xiaoXian && p.xiaoXian.includes(currentAge));
                  if (currentXiaoXian) {
                      const xiaoXianStars = currentXiaoXian.stars.map(s => s.name).join('') || '空宮';
                      prompt += `當前歲限(小限)：走【${currentXiaoXian.name}】，星曜：${xiaoXianStars}\n`;
                  }
              }
          }
          
          // 🌟 3. 強制性防呆指令 (加入星曜聚焦與四化統一指令)
          prompt += `\n⚠️ 【紫微分析強制指引】：
1. 嚴格依據「十二宮星曜分佈」判斷三方四正、夾宮（如羊陀夾忌、雙祿夾等），切勿自行想像。
2. 【聚焦甲乙級星】：請集中火力分析甲級與乙級星曜（十四主星、六吉六煞、祿存天馬等），忽略丙級及以下之神煞小星，以免失焦。
3. 【大限四化統一法則】：推演「人生頭30年」與「當前未來」的所有大限時，請務必統一遵照「${siHuaRuleText}」來決定大限四化天干！絕對禁止前後邏輯不一。
4. 絕對禁止使用八字的「干支生剋」與「五行強弱」邏輯。
5. 若資料顯示某宮位「無大限」，請遵照該排盤事實。\n`;
      }

      prompt += `\n【報告要求段落】請按以下結構撰寫：\n`;
      prompt += `⚠️ 排版規定：請全部使用文字與列點 (Bullet points) 呈現，絕對不要使用表格 (Table)。\n`;

      if (appType === 'zwds') {
          prompt += `1. 原局總論 (包括命身格局、三方四正、左右宮夾忌結構) 與核心性格特質，他給別人的感覺及他真實的內心 (引述經典古籍如《紫微斗數全書》)\n`;
          prompt += `2. 人生頭30年曾/將會發生的3件大事。【重要：遵照「${siHuaRuleText}」來決定大限四化天干！】(事件越具體越好，例如獲奬、傑出成就、車禍、先天疾病，若是破產、重病、意外、學業失敗、父母離異等凶災，請如實寫出，絕不粉飾太平，並提供化解與心態建議)\n`;
          if (isChildBeforeDaYun) {
              prompt += `3. 天賦潛力與未來事業財富格局分析 (注意：命主尚且年幼，此段請務必將焦點放在「天賦潛能開發、才華發展與父母未來的栽培方向」)\n`;
              prompt += `4. 未來感情婚姻與伴侶特質\n`;
              prompt += `5. 疾厄與養生建議 (包含幼兒期體質與健康注意事項)\n`;
              prompt += `6. 近期歲限大勢詳述：由於命主尚未起運（處於童限），請將近期歲限（流年）的分析重點絕對集中於「學業發展、讀書運勢、童年成長經歷與父母教養注意事項」上，禁止提及職場升遷、事業投資等不符合年齡的內容。\n`;
              prompt += `7. 開運與幸運色/吉方建議，幼童適合的運動建議\n`;
          } else {
              prompt += `3. 天賦事業與財富格局分析，第一桶金如何獲得 (從三方四正、左右宮夾忌及四化引動分析，中肯評估格局，給予務實的投資與避險建議)\n`;
              prompt += `4. 感情婚姻與伴侶特質 (中肯評估，若有桃花或刑剋請直言，並提供相處解方)\n`;
              prompt += `5. 疾厄與養生建議\n`;
              prompt += `6. 當前大限與前後3年歲限(流年)運勢詳述。【重要：遵照「${siHuaRuleText}」來決定大限四化天干！】\n`;
              prompt += `7. 開運與幸運色/吉方建議，行為建議\n`;
          }
      } else {
          // 八字專屬段落
          prompt += `1. 原局總論 (包括生肖、喜用神、可以合作的生肖) 與核心性格特質,他給別人的感覺及他真實的內心 (引述經典古籍如《滴天髓》等)\n`;
          prompt += `2. 人生頭30年曾/將會發生的3件大事 (事件越具體越好，例如獲奬、傑出成就、車禍、先天疾病，若是破產、重病、意外、學業失敗、父母離異等凶災，請如實寫出，絕不粉飾太平，並提供化解與心態建議)\n`;
          if (isChildBeforeDaYun) {
              prompt += `3. 天賦潛力與未來事業財富格局分析 (注意：命主尚且年幼，此段請務必將焦點放在「天賦潛能開發、才華發展與父母未來的栽培方向」)\n`;
              prompt += `4. 未來感情婚姻與伴侶特質\n`;
              prompt += `5. 疾厄與中醫五行養生建議 (包含幼兒期體質與健康注意事項)\n`;
              prompt += `6. 近期流年大勢詳述：由於命主尚未起運（處於童限），請將近期流年的分析重點絕對集中於「學業發展、讀書運勢、童年成長經歷與父母教養注意事項」上，絕對禁止提及職場升遷、事業投資、婚姻家庭等不符合其年齡層的內容。\n`;
              prompt += `7. 開運與幸運色/吉方建議，幼童適合的運動建議\n`;
          } else {
              prompt += `3. 天賦事業與財富格局分析，第一桶金如何獲得 (從五行及變通星分析，中肯評估格局，給予務實的投資與避險建議)\n`;
              prompt += `4. 感情婚姻與伴侶特質 (中肯評估，若有桃花或刑剋請直言，並提供相處解方)\n`;
              prompt += `5. 疾厄與中醫五行養生建議\n`;
              prompt += `6. 當前十年大運與前後3年大勢詳述 (如果命主是小童, 不要提及未入大運或/及出世前的流年運勢)\n`;
              prompt += `7. 開運與幸運色/吉方建議，行為建議\n`;
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
          setIsPaid(true);if (!result.text) throw new Error("API 回傳成功，但內容為空。");
          
          // 🌟 核心新增：自動在命書最開頭注入「命造基本盤」資訊
          let chartHeader = `### 📜 命造基本盤\n\n`;
          chartHeader += `- **姓名**：${data.name || '未命名'} (${data.genderText})\n`;
          
          // 處理西曆字串，防呆處理
          let displaySolar = data.solarDateStr;
          if (!displaySolar && data.rawDate) displaySolar = `${data.rawDate.year}/${data.rawDate.month}/${data.rawDate.day} ${data.rawDate.hour}:${data.rawDate.minute}`;
          chartHeader += `- **西曆**：${displaySolar || '未提供'}\n`;
          chartHeader += `- **農曆**：${data.lunarDateStr || data.lunarDate}\n`;
          
          // 動態判斷八字或紫微，給予專屬的排盤摘要
          if (appType === 'bazi' && data.bazi) {
              chartHeader += `- **八字**：【年】${data.bazi.yearGan}${data.bazi.yearZhi} 【月】${data.bazi.monthGan}${data.bazi.monthZhi} 【日】${data.bazi.dayGan}${data.bazi.dayZhi} 【時】${data.bazi.timeGan}${data.bazi.timeZhi}\n`;
              if (data.daYuns && data.daYuns.length > 0) {
                  chartHeader += `- **起運**：西曆 ${data.daYuns[0].startYear} 年 (虛歲 ${data.daYuns[0].startAge} 歲)\n`;
              }
          } else if (appType === 'zwds' && data.grid) {
              chartHeader += `- **局數**：${data.bureau} (命主：${data.mingZhu} / 身主：${data.shenZhu})\n`;
              chartHeader += `- **命宮**：${data.mingGongStars}\n`;
              if (data.formations && data.formations.length > 0) {
                  chartHeader += `- **特殊格局**：${data.formations.join('、')}\n`;
              }
          }
          chartHeader += `\n`; // 換行區隔 AI 內文

          // 將基本盤與 AI 產生的內文結合
          const finalReport = chartHeader + result.text;
          
          // ✅ 只有當後端確實回傳了命書內容，才正式解鎖並存入手機
          setAnalysisResult(finalReport);
          setIsPaid(true);

          data.aiReport = finalReport;
          data.isPaid = true;
          data.paidAt = data.paidAt || Date.now();
          if (onSave) onSave(data, true);

      } catch (error) {
          console.error("AI 錯誤詳細資訊:", error);
          
          alert("⚠️ AI 伺服器目前大塞車！\n\n您的付款紀錄已經安全保存（已解鎖）。\n系統先為您提供【經典精華版命盤析論】，您可以稍後隨時點擊按鈕，免費重試生成完整的深度命書！");
          
          // ==========================================
          // 🌟 離線保底假 AI 命書 (精華版 Template)
          // ==========================================
          let fallbackText = `### ⚠️ 系統提示：AI 深度運算排隊中\n\n`;
          fallbackText += `*親愛的客戶，由於目前玄學 AI 伺服器運算量過大，深度命書正在塞車中。您的命盤已成功標記為【已付款解鎖】，請您稍後再點擊下方按鈕免費重新生成完整報告。*\n\n`;
          fallbackText += `*在此之前，系統先為您提供本地大數據萃取的**【經典精華版析論】**：*\n\n`;
          
          // 🌟 讓離線版也能顯示命造基本盤
          let chartHeader = `### 📜 命造基本盤\n\n`;
          chartHeader += `- **姓名**：${data.name || '未命名'} (${data.genderText})\n`;
          chartHeader += `- **農曆**：${data.lunarDateStr || data.lunarDate}\n`;
          if (appType === 'bazi' && data.bazi) {
              chartHeader += `- **八字**：【年】${data.bazi.yearGan}${data.bazi.yearZhi} 【月】${data.bazi.monthGan}${data.bazi.monthZhi} 【日】${data.bazi.dayGan}${data.bazi.dayZhi} 【時】${data.bazi.timeGan}${data.bazi.timeZhi}\n`;
          } else if (appType === 'zwds' && data.grid) {
              chartHeader += `- **格局**：${data.bureau} (命主：${data.mingZhu} / 身主：${data.shenZhu})\n`;
              chartHeader += `- **命宮**：${data.mingGongStars}\n`;
              if (data.formations && data.formations.length > 0) {
                  chartHeader += `- **特殊格局**：${data.formations.join('、')}\n`;
              }
          }
          fallbackText += chartHeader + `\n`;
          
          if (appType === 'bazi' && data.bazi) {
              const dayGan = data.bazi.dayGan;
              const wuxing = utils.WUXING_MAP[dayGan] || '';
              
              // 十干滴天髓古賦
              const poemMap = {
                  '甲': '甲木參天，脫胎要火。春不容金，秋不容土。火熾乘龍，水宕騎虎。地潤天和，植立千古。',
                  '乙': '乙木雖柔，刲羊解牛。懷丁抱丙，跨鳳乘猴。虛濕之地，騎馬亦憂。藤蘿繫甲，可春可秋。',
                  '丙': '丙火猛烈，欺霜侮雪。能煆庚金，逢辛反怯。土眾成慈，水猖顯節。虎馬犬鄉，甲木若來，必當焚滅。',
                  '丁': '丁火柔中，內性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不窮。如有嫡母，可秋可冬。',
                  '戊': '戊土固重，既中且正。靜翕動闢，萬物司命。水潤物生，火燥物病。若在艮坤，怕沖宜靜。',
                  '己': '己土卑濕，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜幫。',
                  '庚': '庚金帶煞，剛健為最。得水而清，得火而銳。土潤則生，土乾則脆。能贏甲兄，輸於乙妹。',
                  '辛': '辛金軟弱，溫潤而清。畏土之疊，樂水之盈。能扶社稷，能救生靈。熱則喜母，寒則喜丁。',
                  '壬': '壬水通河，能洩金氣。剛中之德，周流不滯。通根透癸，沖天奔地。化則有情，從則相濟。',
                  '癸': '癸水至弱，達於天津。得龍而運，功化斯神。不愁火土，不論庚辛。合戊見火，化象斯真。'
              };
              
              // 十干核心性格
              const traitMap = {
                  '甲': '如參天大樹，性格直爽、仁慈且有強烈的責任感與向上奮發的毅力，為人可靠，具備領導潛質。',
                  '乙': '如花草藤蔓，性格柔和、具備極強的環境適應力與韌性，心思細膩，善於交際與妥協。',
                  '丙': '如太陽之火，熱情開朗、慷慨大方，充滿活力與感染力，行事光明磊落，喜好照顧他人。',
                  '丁': '如燭光星火，心思細密、外柔內剛，具有敏銳的洞察力與奉獻精神，行事謹慎溫和。',
                  '戊': '如高山厚土，穩重誠實、守信重諾，包容力強，行事踏實，給人極大的安全感。',
                  '己': '如田園卑土，溫和柔順、蘊藏涵養，做事精細，多才多藝，具備極強的包容與孕育能力。',
                  '庚': '如刀劍之金，剛毅果決、重情重義，具備開創與突破的魄力，愛恨分明，行事果斷。',
                  '辛': '如珠寶首飾，溫潤秀氣、自尊心強，具備獨特的審美觀與細膩的心思，追求完美。',
                  '壬': '如江河之水，聰明機智、外向好動，適應力強且胸襟開闊，具備極佳的交際與開創能力。',
                  '癸': '如雨露之水，柔和內斂、心思細膩，直覺敏銳，具備極強的滲透力與靈活性，善於策劃。'
              };

              // 五行開運色
              const colorMap = {
                  '木': '黑色、藍色系（水生木）以及 綠色系（木比旺）',
                  '火': '綠色系（木生火）以及 紅色、紫色系（火比旺）',
                  '土': '紅色、紫色系（火生土）以及 黃色、大地色系（土比旺）',
                  '金': '黃色、大地色系（土生金）以及 白色、金色系（金比旺）',
                  '水': '白色、金色系（金生水）以及 黑色、藍色系（水比旺）'
              };

              fallbackText += `### 一、 原局總論與核心性格特質\n\n`;
              fallbackText += `**▶ 經典古籍解析**\n`;
              fallbackText += `古籍《滴天髓》評【${dayGan}${wuxing}】曰：「**${poemMap[dayGan] || ''}**」\n\n`;
              fallbackText += `**▶ 核心性格**\n`;
              fallbackText += `您的日元為「**${dayGan}${wuxing}**」。${traitMap[dayGan] || ''}\n\n`;
              
              // 🌟 判斷是否為童限，動態輸出精華版內容
              if (isChildBeforeDaYun) {
                  fallbackText += `### 二、 天賦潛能與學業發展\n\n`;
                  fallbackText += `日元${dayGan}${wuxing}之孩童，具備獨特的天賦與潛力。建議父母在教養上順應其「${wuxing}」屬性特質，給予適當的引導與栽培。在求學階段，五行相生之年將有利於學業發展與才華展現。\n\n`;

                  fallbackText += `### 三、 疾厄與幼兒養生建議\n\n`;
                  fallbackText += `幼兒時期需特別注意與「${wuxing}」相剋之五行對應的臟腑（木對肝膽、火對心血管、土對脾胃、金對呼吸道、水對腎與泌尿系統）。建議平時注意營養均衡與作息，增強基礎體質。\n\n`;
              } else {
                  fallbackText += `### 二、 天賦事業與財富格局\n\n`;
                  fallbackText += `日元${dayGan}${wuxing}之人，財星與官殺皆有其特定屬性。您在事業上具備穩紮穩打的潛力，適合能發揮您「${wuxing}」屬性特質的行業。建議在決策時保持理性，把握五行相生之年的機遇，將有助於財富的積累與社會地位的提升。\n\n`;

                  fallbackText += `### 三、 疾厄與中醫五行養生\n\n`;
                  fallbackText += `五行講究中庸之道。您的原局以「${dayGan}${wuxing}」為核心，需特別注意與之相剋之五行對應的臟腑（木對肝膽、火對心血管、土對脾胃、金對呼吸道、水對腎與泌尿系統）。建議平時作息規律，飲食均衡，保持情緒平穩。\n\n`;
              }

              fallbackText += `### 四、 開運與幸運色建議\n\n`;
              fallbackText += `- **幸運色彩**：推薦日常多穿搭或使用 ${colorMap[wuxing] || '相生之色'}，有助於生旺自身氣場。\n`;
              fallbackText += `- **行為建議**：隨時保持積極向上的心態。遇到困境時，不妨退一步海闊天空；順境時則應居安思危，廣結善緣。\n\n`;
              
          } else if (appType === 'zwds' && data.mingGongStars) {
              fallbackText += `### 一、 命宮主星解析\n\n`;
              fallbackText += `您的命宮主星為「**${data.mingGongStars}**」。\n\n`;
              fallbackText += `這代表您原局的命格基調受此星曜影響甚深。紫微斗數中，命宮乃全盤之樞紐，影響著一生的性格、才華與外在給人的感受。\n\n`;
              fallbackText += `### 二、 五行局與生命節奏\n\n`;
              fallbackText += `您的五行局為「**${data.bureau}**」，這決定了您大限起步的早晚與生命節奏。命主為「**${data.mingZhu}**」，身主為「**${data.shenZhu}**」，兩者相輔相成，影響著先天與後天的造化。\n\n`;
              
              if (isChildBeforeDaYun) {
                  fallbackText += `### 三、 天賦潛能與學業發展\n\n`;
                  fallbackText += `命主目前尚處於童限階段，主星的特質將逐漸顯露。建議父母可順應其命宮主星的特質，給予適當的啟發與栽培，有助於未來學業與才華的發展。\n\n`;
              } else {
                  fallbackText += `### 三、 事業格局與財富潛力\n\n`;
                  fallbackText += `根據紫微斗數的三方四正星曜分佈與四化引動，您在事業上具備特定的格局潛力。把握大限與歲限的轉換，順勢而為，將有助於財富的積累與社會地位的提升。\n\n`;
              }
          }
          
          fallbackText += `> 💡 **溫馨提醒**：以上為本地智能生成的精華版命書。關於您的詳細「一生大事」、「當前大限」及「歲限大勢」等深度分析，請於網路順暢時，再次點擊下方【開始生成 AI 命書】按鈕即可免費重新運算！\n`;

          // 🌟 將精華版顯示在畫面上，但不存入最終資料庫
          setAnalysisResult(fallbackText);
          
          // 標記為已付費，保留按鈕讓用戶日後能重按
          setIsPaid(true);
          data.isPaid = true;
          data.paidAt = data.paidAt || Date.now();
          if (onSave) onSave(data, true); 

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

      let htmlContent = `
      <div style="font-family: 'PingFang TC', 'Microsoft JhengHei', 'Heiti TC', sans-serif; padding: 0; color: #222; line-height: 1.8; font-size: 15px; word-break: break-word; letter-spacing: 0.5px; text-align: justify; width: 100%; box-sizing: border-box;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ccc; page-break-inside: avoid; break-inside: avoid; display: block; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #000;">【${data.name || '未命名'}】專屬深度流年批命書</h2>
              <div style="font-size: 13px; color: #666;">生成時間：${new Date().toLocaleDateString()} | ©許甯博風水命理館</div>
          </div>
      `;

      let h3Count = 0; // 🌟 用來追蹤大章節的數量

      analysisResult.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed === '---' || trimmed === '***' || trimmed === '___') return;
          
          // 🌟 核心防斬斷：使用 display: block 和 padding，徹底避免引擎高度計算錯誤
          let styleStr = "page-break-inside: avoid !important; break-inside: avoid !important; display: block; width: 100%; box-sizing: border-box; ";
          let contentHtml = '';
          
          if (line.startsWith('## ')) {
              h3Count++;
              // 🌟 智能換頁：遇到第二個以上的「大章節(##)」時，自動強制從新的一頁開始！
              if (h3Count > 1) {
                  styleStr += "page-break-before: always; break-before: page; ";
              }
              // 將 margin 改為 padding
              styleStr += "color: #000; padding-top: 24px; padding-bottom: 12px; font-size: 18px; border-bottom: 1px solid #ddd; font-weight: bold;";
              contentHtml = line.replace(/^#{2,3}\s/, '');
          } else if (line.startsWith('**▶')) {
              styleStr += "font-weight: bold; color: #1890ff; padding-top: 16px; padding-bottom: 8px; font-size: 16px;";
              contentHtml = line.replace(/\*\*/g, '');
          } else if (line.startsWith('**【') && line.endsWith('】**')) {
              styleStr += "font-weight: bold; color: #008080; padding-top: 20px; padding-bottom: 10px; font-size: 17px; border-bottom: 2px dashed #008080;";
              contentHtml = line.replace(/\*\*/g, '');
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
              const content = line.substring(2);
              const parts = content.split('**');
              let formatted = parts.map((part, idx) => idx % 2 === 1 ? `<b style="color: #333;">${part}</b>` : part).join('');
              styleStr += "padding-left: 12px; padding-bottom: 8px;";
              contentHtml = `• ${formatted}`;
          } else {
              const boldParts = line.split('**');
              let formatted = boldParts.map((part, idx) => idx % 2 === 1 ? `<strong style="color: #d9363e;">${part}</strong>` : part).join('');
              styleStr += "padding-bottom: 14px;";
              contentHtml = formatted; 
          }
          
          htmlContent += `<div style="${styleStr}">${contentHtml}</div>`;
      });

      htmlContent += `</div>`;

      const opt = {
          // 🌟 [上, 右, 下, 左]：明確給予底部 20mm 的安全區，確保引擎提早換頁
          margin:       [15, 15, 20, 15], 
          filename:     `${data.name || '未命名'}_深度流年批命書.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true }, 
          // 🌟 單純依賴 css 斷頁指令與 avoid-all
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
            AI 深度流年批命書
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
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: THEME.teal, marginTop: '16px' }}>
              {appType === 'zwds' ? '希夷仰觀天上星，作為斗數推人命...' : '子平造化察元機，五行生剋論枯榮...'}
          </div>
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
                <h2 style={{ margin: '0 0 10px 0' }}>【{data.name || '未命名'}】專屬深度流年命書</h2>
                <div style={{ fontSize: '13px', color: '#666' }}>生成時間：{new Date().toLocaleDateString()} | ©許甯博風水命理館</div>
            </div>

            {analysisResult.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (trimmed === '---' || trimmed === '***' || trimmed === '___') return null;
              if (line.startsWith('### ') || line.startsWith('## ')) return <h3 key={i} style={{ color: THEME.black, marginTop: '24px', marginBottom: '12px', fontSize: '18px', borderBottom: `1px solid #ddd`, paddingBottom: '8px' }}>{line.replace(/^#{2,3}\s/, '')}</h3>;
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
                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>解鎖 AI 深度流年命書，您將獲得：</div>
                <ul style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
                <li>由最先進 AI 語言模型為您客製化批命</li>
                <li>透視原局性格、財富格局與事業發展方向</li>
                <li>深層感情分析與伴侶特質解析</li>
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