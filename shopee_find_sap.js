// Lightweight script to find sap_rules in ANY API response
(function() {
  const body = $response.body;
  if (!body || body.length < 10) { $done({}); return; }
  
  if (body.includes('sap_rules') || body.includes('network_interceptor')) {
    const url = $request.url;
    console.log('🎯 FOUND sap_rules in: ' + url);
    console.log('🎯 Body preview: ' + body.substring(0, 3000));
    $persistentStore.write(body.substring(0, 10000), 'ShopeeSapRulesFound');
    $persistentStore.write(url, 'ShopeeSapRulesURL');
    $notification.post('🎯 SAP Rules 找到了！', url, body.substring(0, 200));
  }
  $done({});
})();
