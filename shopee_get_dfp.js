const headers = $request.headers;
const string = $persistentStore.read('ShopeeIdGameHeaders');
const idGameHeaders = !string || string.length === 0 ? {} : JSON.parse(string);
let updated = false;

const headerMap = {
  'xDfp': ['x-dfp', 'X-DFP', 'X-Dfp'],
  'xGameVersion': ['x-game-version', 'X-Game-Version'],
  'xAppVersionName': ['x-app-version-name', 'X-App-Version-Name'],
  'xUserId': ['x-user-id', 'X-User-Id', 'X-USER-ID'],
};

for (const [key, names] of Object.entries(headerMap)) {
  for (const name of names) {
    if (headers[name]) {
      idGameHeaders[key] = headers[name];
      updated = true;
      break;
    }
  }
}

if (updated) {
  $persistentStore.write(JSON.stringify(idGameHeaders, null, 4), 'ShopeeIdGameHeaders');
  console.log('ℹ️ 已擷取 idgame headers');
}
$done({});
