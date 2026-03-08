(function() {
  const body = $request.body;
  if (!body) {
    console.log('ℹ️ CMoney: 沒有 body，跳過');
    return $done({});
  }

  // 從 URL-encoded body 解析 refresh_token
  const params = new URLSearchParams(body);
  const refreshToken = params.get('refresh_token');
  const clientId = params.get('client_id');

  if (!refreshToken) {
    console.log('ℹ️ CMoney: 沒有 refresh_token，跳過');
    return $done({});
  }

  const headers = $request.headers;
  const string = $persistentStore.read('CMoneyInfo');
  const info = !string || string.length === 0 ? {} : JSON.parse(string);

  info.refreshToken = refreshToken;
  info.clientId = clientId || 'cmstockcommunity';

  const ua = headers['User-Agent'] || headers['user-agent'];
  if (ua) info.userAgent = ua;

  const traceCtx = headers['cmoneyapi-trace-context'] || headers['CmoneyApi-Trace-Context'];
  if (traceCtx) info.traceContext = traceCtx;

  const xTrace = headers['x-cmapi-trace-context'] || headers['X-Cmapi-Trace-Context'];
  if (xTrace) info.xTraceContext = xTrace;

  $persistentStore.write(JSON.stringify(info, null, 4), 'CMoneyInfo');
  console.log(`ℹ️ CMoney: 已擷取 refresh_token`);
  $done({});
})();
