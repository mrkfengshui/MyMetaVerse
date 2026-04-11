// 使用 import 引入外層的 CommonJS 處理器 (Node.js 完美支援這種混搭)
import checkoutHandler from '../../../api/create-checkout-session.js';

// 使用 export default 匯出
export default async function handler(req, res) {
  return checkoutHandler(req, res);
}