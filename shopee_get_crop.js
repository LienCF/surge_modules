function surgeNotify(subtitle = '', message = '') {
  $notification.post('🍤 蝦蝦果園作物資料', subtitle, message, { 'url': 'shopeetw://' });
};

function handleError(error) {
  if (Array.isArray(error)) {
    console.log(`❌ ${error[0]} ${error[1]}`);
    if (showNotification) {
      surgeNotify(error[0], error[1]);
    }
  } else {
    console.log(`❌ ${error}`);
    if (showNotification) {
      surgeNotify(error);
    }
  }
}

function isManualRun(checkRequest = false, checkResponse = false) {
  if (checkRequest) {
    return typeof $request === 'undefined' || ($request.body && JSON.parse($request.body).foo === 'bar');
  }
  if (checkResponse) {
    return typeof $response === 'undefined' || ($response.body && JSON.parse($response.body).foo === 'bar');
  }
  return false;
}

function getSaveObject(key) {
  const string = $persistentStore.read(key);
  return !string || string.length === 0 ? {} : JSON.parse(string);
}

async function getCropData() {
  return new Promise((resolve, reject) => {
    try {
      const body = JSON.parse($request.body);
      if (body && body.cropId && body.resourceId) {
        let shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
        shopeeFarmInfo.currentCrop = body;

        // 存下澆水需要的 headers 和完整 cookie
        const h = $request.headers;
        shopeeFarmInfo.waterHeaders = {
          'Cookie': h['Cookie'] || h['cookie'] || '',
          'User-Agent': h['User-Agent'] || h['user-agent'] || '',
          'Referer': h['Referer'] || h['referer'] || '',
          'Origin': h['Origin'] || h['origin'] || '',
          'Content-Type': h['Content-Type'] || h['content-type'] || 'application/json',
          'game-entrance': h['game-entrance'] || '',
          'game-operation-source': h['game-operation-source'] || '',
          'game-iframe-type': h['game-iframe-type'] || '',
          'fruit-version-type': h['fruit-version-type'] || '',
          'fruit-app-version': h['fruit-app-version'] || '',
          'games-app-version': h['games-app-version'] || '',
          'games-biz-version': h['games-biz-version'] || '',
          'games-runtime': h['games-runtime'] || '',
        };
        console.log('ℹ️ 已擷取澆水 headers');

        const save = $persistentStore.write(JSON.stringify(shopeeFarmInfo, null, 4), 'ShopeeFarmInfo');
        if (!save) {
          return reject(['保存失敗 ‼️', '無法儲存作物資料']);
        }
        return resolve();
      } else {
        return reject(['作物資料儲存失敗 ‼️', '請重新獲得 Cookie 後再嘗試']);
      }
    } catch (error) {
      return reject(['保存失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ 蝦蝦果園作物資料 v20230206.1');
  try {
    if (isManualRun(true, false)) {
      throw '請勿手動執行此腳本';
    }
    await getCropData();
    console.log('✅ 作物資料保存成功');
    surgeNotify(`作物資料保存成功 🌱`, '');

  } catch (error) {
    handleError(error);
  }
  $done({});
})();
