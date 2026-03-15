(function() {
  const url = $request.url;
  const body = typeof $response !== 'undefined' ? $response.body : null;

  if (!body) {
    console.log('ℹ️ [capture] request: ' + url);
    $done({});
    return;
  }

  console.log('ℹ️ [capture] response for: ' + url);

  // 搜尋 network_interceptor_sap_rules 配置
  if (body.includes('network_interceptor_sap_rules') || body.includes('sap_rules')) {
    $persistentStore.write(body, 'ShopeeSapRules');
    console.log('✅ 找到 sap_rules！');
    $notification.post('🔐 SAP Rules', '已擷取 network_interceptor_sap_rules', '');
  }

  // 記錄所有 JSON response
  try {
    const obj = JSON.parse(body);
    const bodyStr = JSON.stringify(obj, null, 2);
    // 只記錄前 2000 字元避免 log 爆炸
    console.log('ℹ️ [capture] body: ' + bodyStr.substring(0, 2000));

    // 存儲特定 API 回應
    if (url.includes('algorithm') || url.includes('seed') || url.includes('token') || url.includes('risk')) {
      const key = 'ShopeeCapture_' + url.split('/').pop().split('?')[0];
      $persistentStore.write(body, key);
      console.log('✅ 已儲存 ' + key);
      $notification.post('🔐 Shopee Capture', key, url);
    }
  } catch (e) {
    // 非 JSON，可能是 protobuf 或其他格式
    console.log('ℹ️ [capture] non-JSON body (' + body.length + ' bytes)');
    // 搜尋 sap_rules 在非 JSON 資料中
    if (body.includes('sap_rules') || body.includes('interceptor')) {
      console.log('⚠️ Found sap_rules in non-JSON response!');
      $persistentStore.write(body.substring(0, 5000), 'ShopeeSapRulesRaw');
      $notification.post('🔐 SAP Rules (raw)', '在非 JSON 回應中找到', url);
    }
  }
  $done({});
})();
