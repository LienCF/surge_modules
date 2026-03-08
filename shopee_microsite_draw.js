let showNotification = true;
let config = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('🎁 蝦皮寶箱', subtitle, message, { 'url': 'shopeetw://' });
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

function getSaveObject(key) {
  const string = $persistentStore.read(key);
  return !string || string.length === 0 ? {} : JSON.parse(string);
}

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object ? true : false;
}

function cookieToString(cookieObject) {
  let string = '';
  for (const [key, value] of Object.entries(cookieObject)) {
    string += `${key}=${value};`
  }
  return string;
}

async function preCheck() {
  return new Promise((resolve, reject) => {
    const shopeeInfo = getSaveObject('ShopeeInfo');
    if (isEmptyObject(shopeeInfo)) {
      return reject(['檢查失敗 ‼️', '沒有新版 token']);
    }
    const micrositeInfo = getSaveObject('ShopeeMicrositeInfo');
    if (isEmptyObject(micrositeInfo) || !micrositeInfo.activityId) {
      return reject(['檢查失敗 ‼️', '沒有活動資訊，請先手動開啟寶箱一次']);
    }
    config = {
      shopeeInfo: shopeeInfo,
      micrositeInfo: micrositeInfo,
    };
    return resolve();
  });
}

function getIdGameHeaders() {
  const shopeeInfo = config.shopeeInfo;
  const micrositeInfo = config.micrositeInfo;
  const headers = {
    'Cookie': cookieToString(shopeeInfo.token),
    'Content-Type': 'application/json',
    'User-Agent': micrositeInfo.userAgent || 'iOS appp iPhone Shopee appver=36931 language=zh-Hant app_type=1 Cronet/102.0.5005.61',
    'Referer': micrositeInfo.referer || `https://idgame.shopee.tw/newluckybox/iframe/${micrositeInfo.activityId}?mode=old_box&source=microsite`,
    'x-game-version': shopeeInfo.xGameVersion || '1011001',
    'x-game-mode': 'nold_lucky_box',
    'x-platform': '2',
    'x-device-platform': 'ios',
    'x-clienttype': '3',
    'x-useragenttype': '1',
    'x-user-id': shopeeInfo.xUserId || String(shopeeInfo.token.userid || shopeeInfo.token.SPC_U || ''),
    'x-app-version-name': shopeeInfo.xAppVersionName || String(shopeeInfo.token.shopee_app_version || ''),
    'x-dfp': shopeeInfo.xDfp,
  };
  // chaplin headers
  if (micrositeInfo.chaplinSign) {
    headers['x-chaplin-sign'] = micrositeInfo.chaplinSign;
    headers['x-chaplin-version'] = micrositeInfo.chaplinVersion || '1.0.3';
    headers['x-chaplin-appver'] = micrositeInfo.chaplinAppver || '0';
    headers['x-chaplin-timestamp'] = String(Date.now());
  }
  return headers;
}

async function checkChance() {
  return new Promise((resolve, reject) => {
    try {
      const activityId = config.micrositeInfo.activityId;
      const headers = getIdGameHeaders();
      delete headers['Content-Type'];
      const request = {
        url: `https://idgame.shopee.tw/api/luckydraw/nold/v1/events/${activityId}/chance?source=iframe`,
        headers: headers,
      };
      $httpClient.get(request, function (error, response, data) {
        if (error) {
          return reject(['查詢抽獎次數失敗 ‼️', '連線錯誤']);
        }
        if (response.status === 200) {
          const obj = JSON.parse(data);
          const totalBalance = obj.data && obj.data.total_balance;
          console.log(`ℹ️ 剩餘抽獎次數: ${totalBalance}`);
          if (totalBalance > 0) {
            return resolve(totalBalance);
          } else {
            showNotification = false;
            return reject(['無可用次數 ‼️', '今日已無抽獎機會']);
          }
        } else {
          return reject(['查詢抽獎次數失敗 ‼️', `${response.status}: ${data}`]);
        }
      });
    } catch (error) {
      return reject(['查詢抽獎次數失敗 ‼️', error]);
    }
  });
}

async function drawPrize() {
  return new Promise((resolve, reject) => {
    try {
      const activityId = config.micrositeInfo.activityId;
      const request = {
        url: `https://idgame.shopee.tw/api/luckydraw/nold/v1/events/${activityId}/draw-prize?source=iframe`,
        headers: getIdGameHeaders(),
        body: '{}',
      };
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['領取失敗 ‼️', '連線錯誤']);
        }
        if (response.status === 200) {
          const obj = JSON.parse(data);
          if (obj.code === 0 || obj.msg === 'success') {
            const prizeName = (obj.data && obj.data.prize_name) || (obj.data && obj.data.package_name) || JSON.stringify(obj.data);
            return resolve(prizeName);
          } else {
            return reject(['領取失敗 ‼️', `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
          }
        } else {
          return reject(['領取失敗 ‼️', response.status]);
        }
      });
    } catch (error) {
      return reject(['領取失敗 ‼️', error]);
    }
  });
}

async function drawAll(remaining) {
  const results = [];
  for (let i = 0; i < remaining; i++) {
    try {
      const reward = await drawPrize();
      console.log(`✅ 第 ${i + 1} 次抽獎：${reward}`);
      results.push(reward);
    } catch (error) {
      console.log(`❌ 第 ${i + 1} 次抽獎失敗`);
      handleError(error);
      break;
    }
    if (i < remaining - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  return results;
}

(async () => {
  console.log('ℹ️ 蝦皮寶箱 (微網站) v20260308.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    console.log(`ℹ️ 活動 ID: ${config.micrositeInfo.activityId}`);
    const remaining = await checkChance();
    console.log('✅ 有可用抽獎次數');
    const results = await drawAll(remaining);
    if (results.length > 0) {
      const summary = results.join(', ');
      console.log(`ℹ️ 共抽 ${results.length} 次，獲得：${summary}`);
      surgeNotify(
        `領取成功 ✅ (${results.length}次)`,
        `獲得 👉 ${summary}`
      );
    }
  } catch (error) {
    handleError(error);
  }
  $done();
})();
