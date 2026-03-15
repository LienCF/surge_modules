// 在所有 shopee API 回應中搜尋 sap_rules / network_interceptor
(function() {
  const body = $response.body;
  const url = $request.url;
  if (!body || body.length < 10) { $done({}); return; }

  const keywords = ['sap_rules', 'network_interceptor', 'sap_rule', 'interceptor_rule'];

  for (const kw of keywords) {
    if (body.includes(kw)) {
      console.log('🎯 FOUND "' + kw + '" in: ' + url);
      console.log('🎯 Body: ' + body.substring(0, 5000));
      $persistentStore.write(url, 'ShopeeSapRulesURL');
      $persistentStore.write(body.substring(0, 50000), 'ShopeeSapRulesFound');
      $notification.post('🎯 SAP Rules!', url, body.substring(0, 200));
      $done({});
      return;
    }
  }
  $done({});
})();
