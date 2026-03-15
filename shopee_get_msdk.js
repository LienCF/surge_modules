(function() {
  const url = $request.url;
  const headers = $request.headers;

  // 擷取 response（需要 requires-body=false 用 http-response）
  // 這裡先擷取 request 的資訊
  const body = typeof $response !== 'undefined' ? $response.body : null;

  if (!body) {
    // http-request mode: 記錄 request headers
    console.log('ℹ️ msdk request: ' + url);
    console.log('ℹ️ msdk headers: ' + JSON.stringify(headers, null, 2));
    $done({});
    return;
  }

  // http-response mode: 記錄 response body
  try {
    const obj = JSON.parse(body);
    console.log('ℹ️ msdk response for: ' + url);
    console.log('ℹ️ msdk response body: ' + JSON.stringify(obj, null, 2));

    // 存儲 algorithm info
    if (url.includes('algorithm') || url.includes('matched')) {
      $persistentStore.write(body, 'ShopeeMsdkAlgorithmInfo');
      console.log('✅ 已儲存 algorithm info');
      $notification.post('🔐 Shopee msdk', '已擷取 algorithm info', url);
    }

    // 存儲 plant_seed / soft_token 回應
    if (url.includes('seed') || url.includes('token') || url.includes('risk')) {
      const key = 'ShopeeMsdk_' + url.split('/').pop().split('?')[0];
      $persistentStore.write(body, key);
      console.log('✅ 已儲存 ' + key);
      $notification.post('🔐 Shopee msdk', '已擷取 ' + key, url);
    }
  } catch (e) {
    console.log('ℹ️ msdk response (non-JSON): ' + (body || '').substring(0, 500));
  }
  $done({});
})();
