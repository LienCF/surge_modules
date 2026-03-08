(function() {
  const headers = $request.headers;
  const auth = headers['Authorization'] || headers['authorization'];
  if (!auth) {
    console.log('ℹ️ CMoney: 沒有 Authorization header，跳過');
    return $done({});
  }

  const string = $persistentStore.read('CMoneyInfo');
  const info = !string || string.length === 0 ? {} : JSON.parse(string);

  info.authorization = auth;

  const ua = headers['User-Agent'] || headers['user-agent'];
  if (ua) info.userAgent = ua;

  const traceCtx = headers['cmoneyapi-trace-context'] || headers['CmoneyApi-Trace-Context'];
  if (traceCtx) info.traceContext = traceCtx;

  $persistentStore.write(JSON.stringify(info, null, 4), 'CMoneyInfo');
  console.log('ℹ️ CMoney: 已擷取 token');
  $done({});
})();
