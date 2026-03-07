let showNotification = true;
let config = null;
let activityId = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('🍤 蝦幣寶箱', subtitle, message, { 'url': 'shopeetw://' });
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
    if (!shopeeInfo.xDfp) {
      return reject(['檢查失敗 ‼️', '沒有 X-DFP，請先在 app 內開啟蝦幣寶箱頁面一次']);
    }
    config = {
      shopeeInfo: shopeeInfo,
      shopeeHeaders: {
        'Cookie': cookieToString(shopeeInfo.token),
        'Content-Type': 'application/json',
        'User-Agent': 'iOS appp iPhone Shopee appver=31109 language=zh-Hant app_type=1 Cronet/102.0.5005.61',
      },
    }
    return resolve();
  });
}

async function getActivity() {
  return new Promise((resolve, reject) => {
    try {
      const request = {
        url: 'https://mall.shopee.tw/api/v4/market_coin/get_iframe_list?region=TW&offset=0&limit=10',
        headers: config.shopeeHeaders,
      };
      $httpClient.get(request, function (error, response, data) {
        if (error) {
          return reject(['無法取得活動列表 ‼️', '連線錯誤']);
        }
        if (response.status === 200) {
          const obj = JSON.parse(data);
          const iframeList = obj.data.iframe_list;
          for (const iframe of iframeList) {
            if ((iframe.title.includes('蝦幣')) && iframe.url.includes('newluckybox')) {
              const re = /(?:activity[/=]|iframe\/)([^?&/]+)/i;
              let found = iframe.url.match(re);
              activityId = found[1];
              console.log(`ℹ️ 找到蝦幣寶箱活動，活動名稱: ${iframe.title}，活動頁面 ID: ${activityId}`);
              return resolve();
            }
          }
          return reject(['無法取得活動列表 ‼️', '找不到蝦幣寶箱活動']);
        } else {
          return reject(['無法取得活動列表 ‼️', response.status]);
        }
      });
    } catch (error) {
      return reject(['無法取得活動列表 ‼️', error]);
    }
  });
}

function getIdGameHeaders() {
  const shopeeInfo = config.shopeeInfo;
  return {
    'Cookie': cookieToString(shopeeInfo.token),
    'Content-Type': 'application/json',
    'User-Agent': config.shopeeHeaders['User-Agent'],
    'Referer': `https://idgame.shopee.tw/newluckybox/iframe/${activityId}?mode=old_box&source=coins`,
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
}

async function coinCheckChance() {
  return new Promise((resolve, reject) => {
    try {
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

async function coinDrawPrize() {
  return new Promise((resolve, reject) => {
    try {
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

(async () => {
  console.log('ℹ️ 蝦幣寶箱 v20260307.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    await getActivity();
    console.log('✅ 取得活動列表');
    await coinCheckChance();
    console.log('✅ 有可用抽獎次數');
    const reward = await coinDrawPrize();
    console.log('✅ 領取成功');
    console.log(`ℹ️ 獲得 👉 ${reward} 💎`);
    surgeNotify(
      '領取成功 ✅',
      `獲得 👉 ${reward} 💎`
    );
  } catch (error) {
    handleError(error);
  }
  $done();
})();
