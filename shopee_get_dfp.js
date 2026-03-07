const dfp = $request.headers['x-dfp'] || $request.headers['X-DFP'] || $request.headers['X-Dfp'] || '';
if (dfp) {
  const string = $persistentStore.read('ShopeeInfo');
  const shopeeInfo = !string || string.length === 0 ? {} : JSON.parse(string);
  shopeeInfo.xDfp = dfp;
  $persistentStore.write(JSON.stringify(shopeeInfo, null, 4), 'ShopeeInfo');
  console.log('ℹ️ 已擷取 X-DFP');
}
$done({});
