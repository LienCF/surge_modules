// 攔截 CCMS diff_v2 請求，修改 shopee_network-ios 的 version 為 0
// 這樣 CCMS 會回傳完整的 config（包含 network_interceptor_sap_rules）
(function() {
  const body = $request.body;
  if (!body) { $done({}); return; }

  try {
    const obj = JSON.parse(body);
    if (obj.data && obj.data.modules) {
      // 強制所有可能包含 sap_rules 的 module 回傳完整 config
      const targets = [
        'shopee_brizo-ios',       // Brizo = Shopee 安全 SDK
        'shopee_platform-ios',
        'shopee_apm-toggle-ios',
        'shopee_opt-ios',
        'shopee_network-ios',
        'shopee_dre-ios',
        'shopee_apm-ios',
      ];
      let modified = false;
      for (const m of obj.data.modules) {
        if (targets.includes(m.key) && m.version > 0) {
          console.log('ℹ️ [CCMS] 修改 ' + m.key + ' version: ' + m.version + ' → 0');
          m.version = 0;
          modified = true;
        }
      }
      if (modified) {
        const newBody = JSON.stringify(obj);
        console.log('ℹ️ [CCMS] 已修改請求 body');
        $done({ body: newBody });
        return;
      }
    }
  } catch (e) {
    console.log('⚠️ [CCMS] 解析失敗: ' + e);
  }
  $done({});
})();
