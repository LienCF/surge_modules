(function() {
  const url = $request.url;
  const headers = $request.headers;

  const re = /\/events\/([^/]+)\/draw-prize/;
  const found = url.match(re);
  if (!found) {
    console.log('ℹ️ 非 draw-prize 請求，跳過');
    return $done({});
  }

  // 只攔截 microsite 來源的請求
  const referer = headers['Referer'] || headers['referer'] || '';
  if (!referer.includes('source=microsite')) {
    console.log('ℹ️ 非 microsite 來源，跳過');
    return $done({});
  }

  const activityId = found[1];
  const string = $persistentStore.read('ShopeeMicrositeInfo');
  const micrositeInfo = !string || string.length === 0 ? {} : JSON.parse(string);

  micrositeInfo.activityId = activityId;
  micrositeInfo.referer = referer;

  // Capture chaplin headers
  const chaplinMap = {
    'chaplinSign': ['x-chaplin-sign', 'X-Chaplin-Sign'],
    'chaplinVersion': ['x-chaplin-version', 'X-Chaplin-Version'],
    'chaplinAppver': ['x-chaplin-appver', 'X-Chaplin-Appver'],
  };

  for (const [key, names] of Object.entries(chaplinMap)) {
    for (const name of names) {
      if (headers[name]) {
        micrositeInfo[key] = headers[name];
        break;
      }
    }
  }

  // Capture user agent
  const ua = headers['User-Agent'] || headers['user-agent'];
  if (ua) {
    micrositeInfo.userAgent = ua;
  }

  $persistentStore.write(JSON.stringify(micrositeInfo, null, 4), 'ShopeeMicrositeInfo');
  console.log(`ℹ️ 已擷取微網站寶箱資訊，活動 ID: ${activityId}`);
  $done({});
})();
