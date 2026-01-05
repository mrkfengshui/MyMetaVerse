// packages/ui/theme.js
export const COLORS = {
  jia: '#006400', yi: '#90EE90', bing: '#ff0000ff', ding: '#FF6347', wu: '#8B4513',
  ji: '#D2B48C', geng: '#FFA500', xin: '#FFD700', ren: '#00008B', gui: '#87CEEB',
};

export const THEME = {
  red: '#ff4d4f', blue: '#1890ff', teal: '#13c2c2', orange: '#fa8c16',
  purple: '#722ed1', black: '#262626', gray: '#8c8c8c', lightGray: '#d1d5db',
  bg: '#f0f2f5', white: '#ffffff', bgGray: '#f9fafb', border: '#e8e8e8',
  bgRed: '#fff1f0', bgBlue: '#e6f7ff', bgOrange: '#fff7e6', vermillion: '#ce0000',
  green: '#52c41a',

  fonts: {
    heading: "'MyMetaFont', sans-serif",
    main: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  
  layout: {
    headerHeight: '50px',
    tabBarHeight: '60px',
  }
};

export const COMMON_STYLES = {
  fullScreen: { 
    height: '100vh', 
    display: 'flex', 
    flexDirection: 'column', 
    backgroundColor: THEME.bg, 
    width: '100vw', 
    overflow: 'hidden',
    position: 'fixed', // 防止 iOS 彈性滾動效果影響佈局
    top: 0, left: 0
  },
  // 內容滾動區
  contentArea: { 
    flex: 1, 
    overflowY: 'auto', 
    WebkitOverflowScrolling: 'touch', // iOS 順滑滾動
    width: '100%',
    paddingBottom: '10px' 
  },
};