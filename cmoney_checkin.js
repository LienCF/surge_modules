(async () => {
  console.log('ℹ️ CMoney 自動簽到 v20260308.1');

  const string = $persistentStore.read('CMoneyInfo');
  const info = !string || string.length === 0 ? {} : JSON.parse(string);

  if (!info.authorization) {
    console.log('❌ 沒有 token，請先手動簽到一次');
    $notification.post('💰 CMoney 簽到', '簽到失敗 ‼️', '沒有 token，請先手動簽到一次');
    return $done();
  }

  const request = {
    url: 'https://forumservice.cmoney.tw/api/LoginReward/CheckIn',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': info.authorization,
      'User-Agent': info.userAgent || 'ForumApp/20260303.0.100 CFNetwork/3860.400.51 Darwin/25.3.0',
      'cmoneyapi-trace-context': info.traceContext || '{"osName":"iOS","appVersion":"2.55.1","manufacturer":"Apple","platform":1,"appId":18,"model":"iPhone16,2","osVersion":"26.3"}',
      'Accept': '*/*',
      'Accept-Language': 'zh-TW,zh-Hant;q=0.9',
      'Accept-Encoding': 'gzip',
    },
    body: '{}',
  };

  $httpClient.post(request, function (error, response, data) {
    if (error) {
      console.log(`❌ 連線錯誤: ${error}`);
      $notification.post('💰 CMoney 簽到', '簽到失敗 ‼️', `連線錯誤: ${error}`);
      return $done();
    }
    console.log(`ℹ️ HTTP ${response.status}: ${data}`);
    if (response.status === 200) {
      let message = data;
      try {
        const obj = JSON.parse(data);
        message = obj.message || obj.msg || JSON.stringify(obj);
      } catch (e) {}
      console.log(`✅ 簽到成功: ${message}`);
      $notification.post('💰 CMoney 簽到', '簽到成功 ✅', message);
    } else {
      console.log(`❌ 簽到失敗: ${response.status}`);
      $notification.post('💰 CMoney 簽到', '簽到失敗 ‼️', `HTTP ${response.status}: ${data}`);
    }
    $done();
  });
})();
