// packages/ui/BookingSystem.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // 引入日曆樣式
import { THEME } from './theme';
import { 
  ChevronLeft, Search, Check, House, LampDesk, Sparkles, Grid, Calendar as CalendarIcon 
} from 'lucide-react';

// --- 輔助函式 ---
const getLocalDateString = (date) => {
  if (!date || isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateBookingId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// --- 主組件 ---
export const BookingSystem = ({ apiUrl, onNavigate }) => {
  const [viewMode, setViewMode] = useState('book'); 
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({ service: null, date: null, time: null, name: '', phone: '', email: '', notes: '' });
  const [searchPhone, setSearchPhone] = useState('');
  const [searchId, setSearchId] = useState('');
  const [myBookings, setMyBookings] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineServices, setOnlineServices] = useState([]);
  const [scheduleData, setScheduleData] = useState({ fs: {}, general: {} }); 
  const [availableTimesForSelectedDate, setAvailableTimesForSelectedDate] = useState([]); 
  const [loadingData, setLoadingData] = useState(true);
  
  // 日期範圍設定 (未來 3 天 ~ 2 個月)
  const { minDate, maxDate } = useMemo(() => {
     const now = new Date();
     const min = new Date(); min.setDate(now.getDate() + 3);
     const max = new Date(); max.setMonth(now.getMonth() + 2); 
     max.setDate(new Date(max.getFullYear(), max.getMonth() + 1, 0).getDate()); 
     return { minDate: min, maxDate: max };
  }, []);

  // 讀取遠端資料
  const fetchLatestData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await fetch(`${apiUrl}?action=getServices`);
      const data = await response.json();
      
      if (data.services) {
         // 根據 ID 分配圖示
         const COLORS = { yi: '#90EE90', wu: '#8B4513', geng: '#FFA500' }; // 簡單定義顏色
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
  }, [bookingData.date, bookingData.service, apiUrl]);

  useEffect(() => { fetchLatestData(); }, [fetchLatestData]); 
  
  // 處理互動邏輯
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

  const handlePayment = async () => {
        setStep(4);
        try {
        const bId = generateBookingId();
        const payload = {
            bookingId: bId,
            name: bookingData.name,
            phone: bookingData.phone,
            email: bookingData.email,
            service: bookingData.service.name, 
            date: getLocalDateString(bookingData.date), 
            time: bookingData.time, 
            notes: bookingData.notes
        };
        const response = await fetch(apiUrl, { 
            method: "POST", 
            headers: { "Content-Type": "text/plain;charset=utf-8" }, 
            body: JSON.stringify(payload) 
        });
        
        const resultData = await response.json();
        if (resultData.result === 'success') {
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
            const response = await fetch(`${apiUrl}?action=getMyBookings&phone=${searchPhone}&id=${searchId}`);
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

  // --- Render Functions (UI) ---

  const renderCheckBookingView = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div style={{ backgroundColor: THEME.white, padding: '20px', borderRadius: '12px', border: `1px solid ${THEME.border}`, marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: THEME.black }}>身份驗證查詢</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="tel" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} placeholder="登記電話 (如: 85291234567)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px', boxSizing: 'border-box' }} />
                <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value.toUpperCase())} placeholder="預約代碼 (6位英文數字)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px', boxSizing: 'border-box' }} />
                <button onClick={handleCheckBooking} disabled={isSearching} style={{ width: '100%', padding: '12px', backgroundColor: THEME.black, color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
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

  const renderServiceStep = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: THEME.black }}>請選擇預約項目</h3>
      {loadingData ? ( <div style={{ textAlign: 'center', padding: '20px', color: THEME.gray }}>正在努力加載中...</div> ) : (
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
      <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'none', color: THEME.gray, marginBottom: '10px', padding: 0, cursor: 'pointer' }}><ChevronLeft size={16}/> 返回服務</button>
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
      <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'none', color: THEME.gray, marginBottom: '10px', padding: 0, cursor: 'pointer' }}><ChevronLeft size={16}/> 返回日期</button>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: THEME.black }}>填寫預約資料</h3>
      <div style={{ backgroundColor: THEME.white, padding: '16px', borderRadius: '12px', border: `1px solid ${THEME.border}`, marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: THEME.gray }}>聯絡姓名</label>
            <input type="text" placeholder="請輸入您的稱呼" value={bookingData.name} onChange={e => setBookingData({...bookingData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontSize: '16px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: THEME.gray }}>WhatsApp 電話 <span style={{fontSize:'12px', fontWeight:'normal'}}>(852 + 8位數字)</span></label>
            <input type="tel" placeholder="例如: 85291234567" value={bookingData.phone} onChange={e => handlePhoneChange(e.target.value)} maxLength={11} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontSize: '16px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: THEME.gray }}>Email <span style={{fontSize:'12px', fontWeight:'normal'}}>(接收確認信用)</span></label>
            <input type="email" placeholder="example@email.com" value={bookingData.email} onChange={e => setBookingData({...bookingData, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontSize: '16px', boxSizing: 'border-box' }} />
        </div>
        <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: THEME.gray }}>備註事項 (選填)</label>
            <textarea placeholder="例如：想問的問題、準確出生時間等..." rows={3} value={bookingData.notes} onChange={e => setBookingData({...bookingData, notes: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${THEME.border}`, fontSize: '16px', resize: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>
      <button onClick={validateAndSubmit} style={{ width: '100%', padding: '14px', backgroundColor: THEME.black, color: THEME.white, borderRadius: '30px', border: 'none', fontSize: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>前往支付 HK${bookingData.service?.deposit}</button>
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
      <div style={{ width: '100%', backgroundColor: THEME.white, padding: '20px', borderRadius: '12px', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
        <div style={{ borderBottom: `1px solid ${THEME.bg}`, paddingBottom: '12px', marginBottom: '12px', fontWeight: 'bold', fontSize: '16px' }}>預約明細</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: THEME.gray }}>服務項目</span><span>{bookingData.service?.name}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: THEME.gray }}>日期時間</span><span>{bookingData.date?.getMonth()+1}月{bookingData.date?.getDate()}日 {bookingData.time}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: THEME.gray }}>預約人</span><span>{bookingData.name}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '8px', backgroundColor: THEME.bgOrange, borderRadius: '4px' }}>
            <span style={{ color: THEME.gray, fontWeight: 'bold' }}>預約代碼 (請截圖保存)</span>
            <span style={{ fontWeight: 'bold', color: THEME.vermillion, fontSize: '18px' }}>{bookingData.currentBookingId}</span>
        </div>
      </div>
      <button onClick={onNavigate} style={{ marginTop: '30px', padding: '12px 32px', backgroundColor: THEME.blue, color: 'white', borderRadius: '24px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>返回首頁</button>
    </div>
  );

  return (
    // ✅ 這裡加上了 boxSizing: 'border-box' 和 overflowX: 'hidden'
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: THEME.bg, width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '8px 16px', backgroundColor: THEME.white, borderRadius: '8px' }}>
        <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0, fontSize: '20px' }}>
            {viewMode === 'book' ? '線上預約' : '我的預約'}
        </h2>
        <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '20px', padding: '2px' }}>
            <button onClick={() => setViewMode('book')} style={{ padding: '6px 12px', border: 'none', borderRadius: '18px', backgroundColor: viewMode === 'book' ? THEME.blue : 'transparent', color: viewMode === 'book' ? 'white' : THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>預約</button>
            <button onClick={() => setViewMode('check')} style={{ padding: '6px 12px', border: 'none', borderRadius: '18px', backgroundColor: viewMode === 'check' ? THEME.blue : 'transparent', color: viewMode === 'check' ? 'white' : THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>查詢</button>
        </div>
      </div>
      {viewMode === 'book' ? 
         <>{step === 1 && renderServiceStep()} {step === 2 && renderDateStep()} {step === 3 && renderInfoStep()} {step === 4 && renderPaymentLoading()} {step === 5 && renderSuccess()}</> 
         : renderCheckBookingView()
      }
    </div>
  );
};