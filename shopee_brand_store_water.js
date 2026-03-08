let showNotification = true;
let config = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('🍤 蝦蝦果園品牌商店水滴', subtitle, message, {
    'url': 'shopeetw://'
  });
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

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

let clientRequestSeq = 0;

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
      return reject(['檢查失敗 ‼️', '找不到 token']);
    }

    const shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
    if (isEmptyObject(shopeeFarmInfo)) {
      return reject(['檢查失敗 ‼️', '沒有蝦蝦果園資料']);
    }

    const fullCookie = shopeeFarmInfo.waterHeaders && shopeeFarmInfo.waterHeaders.Cookie
      ? shopeeFarmInfo.waterHeaders.Cookie
      : cookieToString(shopeeInfo.token);
    console.log(`ℹ️ 使用 ${shopeeFarmInfo.waterHeaders && shopeeFarmInfo.waterHeaders.Cookie ? '完整 waterHeaders' : 'shopeeInfo.token'} Cookie`);
    const shopeeHeaders = {
      'Cookie': fullCookie,
      'Content-Type': 'application/json',
      'User-Agent': 'iOS app iPhone Shopee appver=36931 language=zh-Hant app_type=1 platform=native_ios os_ver=26.3.0 Cronet/102.0.5005.61',
      'Referer': 'https://games.shopee.tw/',
      'x-api-source': 'rn',
      'x-shopee-client-timezone': 'Asia/Taipei',
    }

    // 加上 anti-fraud headers（優先從 ShopeeFarmInfo，fallback 到 ShopeeInfo）
    const afToken = shopeeFarmInfo.afToken || shopeeInfo.afToken || '';
    if (afToken) {
      shopeeHeaders['af-ac-enc-sz-token'] = afToken;
      console.log(`ℹ️ 已加入 af-ac-enc-sz-token (來源: ${shopeeFarmInfo.afToken ? 'FarmInfo' : 'ShopeeInfo'})`);
    } else {
      console.log('⚠️ 沒有 af-ac-enc-sz-token，請先在 app 中手動簽到一次');
    }
    const csrftoken = shopeeFarmInfo.csrftoken || shopeeInfo.csrftoken || '';
    if (csrftoken) {
      shopeeHeaders['x-csrftoken'] = csrftoken;
      console.log('ℹ️ 已加入 x-csrftoken');
    }
    config = {
      shopeeInfo: shopeeInfo,
      shopeeFarmInfo: shopeeFarmInfo,
      shopeeHeaders: shopeeHeaders,
    }
    return resolve();
  });
}

async function getBrandList() {
  return new Promise((resolve, reject) => {
    try {
      const getHeaders = { ...config.shopeeHeaders };
      delete getHeaders['Content-Type'];
      getHeaders['client-request-id'] = generateUUID() + '.' + (++clientRequestSeq);
      const request = {
        url: 'https://games.shopee.tw/gameplatform/api/v3/shop/ads/scenario/1001/shop/list?limit=10&offset=0',
        headers: getHeaders,
      };

      $httpClient.get(request, function (error, response, data) {
        if (error) {
          return reject(['取得品牌商店列表失敗 ‼️', '連線錯誤']);
        }
        console.log(`ℹ️ getBrandList 回應狀態: ${response.status}`);
        if (response.status === 200) {
          const obj = JSON.parse(data);
          console.log(`ℹ️ getBrandList 回應 code: ${obj.code}, 商店數: ${obj.data && obj.data.shops ? obj.data.shops.length : 'N/A'}`);
          if (obj.code === 0) {
            let brandStores = [];
            for (const entry of obj.data.shops) {
              console.log(`ℹ️ 商店: ${entry.shop.name}, shop_id: ${entry.shop.shop_id}, has_claims: ${entry.has_claims}`);
              if (!entry.has_claims) {
                brandStores.push({
                  'shop_id': entry.shop.shop_id,
                  'brandName': entry.shop.name,
                  'token': entry.token,
                  'ads_tracking_data': entry.ads_tracking_data,
                });
              }
            }
            if (!brandStores.length) {
              return reject(['取得品牌商店列表失敗 ‼️', '今天沒有品牌商店水滴活動']);
            } else {
              console.log(`ℹ️ 找到 ${brandStores.length} 間未領取的品牌商店`);
              return resolve(brandStores);
            }
          } else {
            return reject(['取得品牌商店列表失敗 ‼️', `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
          }
        } else {
          console.log(`ℹ️ getBrandList 回應 body: ${data}`);
          return reject(['取得品牌商店列表失敗 ‼️', response.status]);
        }
      });
    } catch (error) {
      return reject(['取得品牌商店列表失敗 ‼️', error]);
    }
  });
}

async function toBrandWater() {
  const brandStores = await getBrandList();

  let claimedCount = 0;
  for (const store of brandStores) {
    await claim(store);
    claimedCount++;
    await delay(1);
  }
  return claimedCount;
}

async function claim(store) {
  return new Promise((resolve, reject) => {
    try {
      const requestId = `__game_shop__${store.shop_id}_${config.shopeeInfo.token.SPC_U}_${Math.floor(new Date().getTime())}`;
      const claimPayload = {
        'sign': store.token,
        'shop_id': store.shop_id,
        'scenario_value': 1001,
        'custom_param': '',
        'request_id': requestId,
      };
      const claimHeaders = { ...config.shopeeHeaders };
      claimHeaders['client-request-id'] = generateUUID() + '.' + (++clientRequestSeq);
      const request = {
        url: 'https://games.shopee.tw/gameplatform/api/v3/shop/ads/scenario/1001/task/claim',
        headers: claimHeaders,
        body: JSON.stringify(claimPayload),
      };
      console.log(`ℹ️ claim ${store.brandName}: shop_id=${store.shop_id}, sign=${store.token ? store.token.substring(0, 20) + '...' : 'N/A'}`);
      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject([`取得品牌商店 ${store.brandName} 水滴失敗 ‼️`, '連線錯誤']);
        }
        console.log(`ℹ️ claim ${store.brandName} 回應狀態: ${response.status}`);
        if (response.status === 200) {
          const obj = JSON.parse(data);
          console.log(`ℹ️ claim ${store.brandName} 回應 code: ${obj.code}, msg: ${obj.msg}`);
          if (obj.code === 0) {
            console.log(`✅ 取得品牌商店 ${store.brandName} 水滴成功`);
            return resolve();
          } else if (obj.code === 409004) {
            return reject([`取得品牌商店 ${store.brandName} 水滴失敗 ‼️`, '作物狀態錯誤，請檢查是否已收成']);
          } else if (obj.code === 420101) {
            console.log(`❌ 取得品牌商店 ${store.brandName} 水滴失敗 ‼️ 今天已領過`);
            return resolve();
          } else {
            return reject([`取得 ${store.brandName} 水滴失敗 ‼️`, `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
          }
        } else {
          console.log(`ℹ️ claim ${store.brandName} 回應 body: ${data}`);
          return reject([`取得品牌商店 ${store.brandName} 水滴失敗 ‼️`, response.status]);
        }
      });
    } catch (error) {
      return reject([`取得品牌商店 ${store.brandName} 水滴失敗 ‼️`, error]);
    }
  });
}

async function delay(seconds) {
  console.log(`⏰ 等待 ${seconds} 秒`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  });
}

(async () => {
  console.log('ℹ️ 蝦蝦果園品牌商店水滴 v20260307.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');

    let claimedCount = await toBrandWater();
    if (claimedCount > 0) {
      surgeNotify(
        '領取成功 ✅',
        `本次共領取了 ${claimedCount} 間品牌商店水滴 💧`
      );
    } else {
      handleError(['取得品牌商店列表失敗 ‼️', '今天沒有品牌商店水滴活動'])
    }
  } catch (error) {
    handleError(error);
  }
  $done();
})();
