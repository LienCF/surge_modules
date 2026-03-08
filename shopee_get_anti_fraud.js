const headers = $request.headers;
const afToken = headers['af-ac-enc-sz-token'] || headers['Af-Ac-Enc-Sz-Token'] || '';

if (afToken) {
  const string = $persistentStore.read('ShopeeInfo');
  const shopeeInfo = !string || string.length === 0 ? {} : JSON.parse(string);
  const changed = shopeeInfo.afToken !== afToken;
  shopeeInfo.afToken = afToken;

  const csrftoken = headers['x-csrftoken'] || headers['X-CSRFToken'] || headers['X-Csrftoken'] || '';
  if (csrftoken) {
    shopeeInfo.csrftoken = csrftoken;
  }

  // 存完整 headers（包含原生層注入的混淆 hex headers）
  const fullHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    fullHeaders[key] = value;
  }
  shopeeInfo.gameplatformHeaders = fullHeaders;

  if (changed) {
    console.log('ℹ️ 已更新 af-ac-enc-sz-token');
  }
  $persistentStore.write(JSON.stringify(shopeeInfo, null, 4), 'ShopeeInfo');
  console.log('ℹ️ 已儲存完整 gameplatform headers');
}
$done({});
