/**
 * Shopee Security SDK MitM — capture df.infra.shopee.tw traffic
 *
 * Use with Surge:
 * 1. Put this .js file in iCloud Drive/Surge/Scripts/
 * 2. Install the .sgmodule
 * 3. Enable MitM and trust Surge CA cert
 * 4. Open Shopee app — all requests to df.infra.shopee.tw will be logged
 */

const isRequest = typeof $request !== 'undefined' && typeof $response === 'undefined';
const isResponse = typeof $response !== 'undefined';

if (isRequest) {
    const url = $request.url;
    const method = $request.method;
    const headers = JSON.stringify($request.headers, null, 2);
    const body = $request.body || "(no body)";

    // Log to notification
    const title = `[REQ] ${method} ${url}`;
    const bodyPreview = typeof body === 'string' ? body.substring(0, 200) : "(binary)";

    console.log(`=== SHOPEE SEC REQUEST ===`);
    console.log(`URL: ${url}`);
    console.log(`Method: ${method}`);
    console.log(`Headers: ${headers}`);
    console.log(`Body: ${body}`);

    // Save to persistent store for later retrieval
    const existing = $persistentStore.read("shopee_mitm_log") || "";
    const timestamp = new Date().toISOString();
    const entry = `\n--- REQ ${timestamp} ---\nURL: ${url}\nMethod: ${method}\nHeaders: ${headers}\nBody(${typeof body === 'string' ? body.length : '?'}): ${bodyPreview}\n`;
    $persistentStore.write(existing + entry, "shopee_mitm_log");

    $notification.post("Shopee SEC [REQ]", method + " " + url.replace("https://df.infra.shopee.tw", ""), bodyPreview);

    $done({});
} else if (isResponse) {
    const url = $request.url;
    const status = $response.status;
    const headers = JSON.stringify($response.headers, null, 2);
    const body = $response.body || "(no body)";

    console.log(`=== SHOPEE SEC RESPONSE ===`);
    console.log(`URL: ${url}`);
    console.log(`Status: ${status}`);
    console.log(`Headers: ${headers}`);
    console.log(`Body: ${body}`);

    // For binary body, try hex encoding
    let bodyLog = "";
    if (typeof body === 'string') {
        bodyLog = body.substring(0, 2000);
    } else {
        bodyLog = "(binary response)";
    }

    const existing = $persistentStore.read("shopee_mitm_log") || "";
    const timestamp = new Date().toISOString();
    const entry = `\n--- RESP ${timestamp} ---\nURL: ${url}\nStatus: ${status}\nHeaders: ${headers}\nBody(${typeof body === 'string' ? body.length : '?'}): ${bodyLog}\n`;
    $persistentStore.write(existing + entry, "shopee_mitm_log");

    $notification.post("Shopee SEC [RESP]", status + " " + url.replace("https://df.infra.shopee.tw", ""),
        typeof body === 'string' ? body.substring(0, 100) : "(binary)");

    $done({});
} else {
    $done({});
}
