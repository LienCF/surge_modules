(async () => {
  console.log('ℹ️ CMoney 自動簽到 v20260308.2');

  const string = $persistentStore.read('CMoneyInfo');
  const info = !string || string.length === 0 ? {} : JSON.parse(string);

  if (!info.refreshToken) {
    console.log('❌ 沒有 refresh_token，請先手動開啟 app 一次');
    $notification.post('💰 CMoney 簽到', '簽到失敗 ‼️', '沒有 refresh_token，請先手動開啟 app 一次');
    return $done();
  }

  const ua = info.userAgent || 'ForumApp/20260303.0.100 CFNetwork/3860.400.51 Darwin/25.3.0';
  const traceCtx = info.traceContext || '{"osName":"iOS","appVersion":"2.55.1","manufacturer":"Apple","platform":1,"appId":18,"model":"iPhone16,2","osVersion":"26.3"}';

  // Step 1: Refresh token
  let accessToken;
  try {
    accessToken = await refreshAccessToken(info, ua, traceCtx);
    console.log('✅ 已刷新 access token');
  } catch (error) {
    console.log(`❌ 刷新 token 失敗: ${error}`);
    $notification.post('💰 CMoney 簽到', '刷新 token 失敗 ‼️', String(error));
    return $done();
  }

  // Step 2: Check in
  const request = {
    url: 'https://forumservice.cmoney.tw/api/LoginReward/CheckIn',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': ua,
      'cmoneyapi-trace-context': traceCtx,
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

function refreshAccessToken(info, ua, traceCtx) {
  return new Promise((resolve, reject) => {
    const body = `refresh_token=${encodeURIComponent(info.refreshToken)}&client_id=${encodeURIComponent(info.clientId || 'cmstockcommunity')}&grant_type=refresh_token`;
    const request = {
      url: 'https://auth.cmoney.tw/identity/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'User-Agent': ua,
        'cmoneyapi-trace-context': traceCtx,
        'Accept': '*/*',
        'Accept-Language': 'zh-TW,zh-Hant;q=0.9',
        'Accept-Encoding': 'gzip',
      },
      body: body,
    };

    $httpClient.post(request, function (error, response, data) {
      if (error) {
        return reject(`連線錯誤: ${error}`);
      }
      if (response.status === 200) {
        try {
          const obj = JSON.parse(data);
          if (obj.access_token) {
            // 更新 refresh_token（伺服器可能會輪換）
            if (obj.refresh_token) {
              info.refreshToken = obj.refresh_token;
              $persistentStore.write(JSON.stringify(info, null, 4), 'CMoneyInfo');
              console.log('ℹ️ 已更新 refresh_token');
            }
            return resolve(obj.access_token);
          } else {
            return reject(`回應中沒有 access_token: ${data}`);
          }
        } catch (e) {
          return reject(`解析回應失敗: ${data}`);
        }
      } else {
        return reject(`HTTP ${response.status}: ${data}`);
      }
    });
  });
}
