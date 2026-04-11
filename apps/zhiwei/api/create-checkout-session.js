// 使用 require 引入最外層的處理器
const checkoutHandler = require('../../../api/create-checkout-session.js');

// 轉發請求
module.exports = async function handler(req, res) {
  return checkoutHandler(req, res);
};