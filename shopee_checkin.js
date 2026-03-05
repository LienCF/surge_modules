let showNotification = true;
let config = null;
let sCounter = 1;

// ── AES-256-CBC for s parameter ──
const AES_SBOX = [0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];
const AES_RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];

function aesSubWord(w) {
  return (AES_SBOX[(w>>>24)&0xff]<<24) | (AES_SBOX[(w>>>16)&0xff]<<16) | (AES_SBOX[(w>>>8)&0xff]<<8) | AES_SBOX[w&0xff];
}

function aesKeyExpansion(keyBytes) {
  const Nk = 8, Nr = 14;
  const W = new Array(4 * (Nr + 1));
  for (let i = 0; i < Nk; i++) {
    W[i] = (keyBytes[4*i]<<24) | (keyBytes[4*i+1]<<16) | (keyBytes[4*i+2]<<8) | keyBytes[4*i+3];
  }
  for (let i = Nk; i < W.length; i++) {
    let t = W[i-1];
    if (i % Nk === 0) {
      t = aesSubWord(((t<<8)|(t>>>24)) >>> 0) ^ (AES_RCON[i/Nk-1]<<24);
    } else if (i % Nk === 4) {
      t = aesSubWord(t);
    }
    W[i] = (W[i-Nk] ^ t) >>> 0;
  }
  return W;
}

function aesEncryptBlock(block, W) {
  const Nr = 14;
  let s = new Uint8Array(16);
  for (let i = 0; i < 16; i++) s[i] = block[i];

  for (let c = 0; c < 4; c++) {
    const w = W[c];
    s[4*c] ^= (w>>>24)&0xff; s[4*c+1] ^= (w>>>16)&0xff;
    s[4*c+2] ^= (w>>>8)&0xff; s[4*c+3] ^= w&0xff;
  }

  for (let r = 1; r <= Nr; r++) {
    for (let i = 0; i < 16; i++) s[i] = AES_SBOX[s[i]];
    let t;
    t=s[1]; s[1]=s[5]; s[5]=s[9]; s[9]=s[13]; s[13]=t;
    t=s[2]; s[2]=s[10]; s[10]=t; t=s[6]; s[6]=s[14]; s[14]=t;
    t=s[15]; s[15]=s[11]; s[11]=s[7]; s[7]=s[3]; s[3]=t;
    if (r < Nr) {
      for (let c = 0; c < 4; c++) {
        const i = c*4;
        const a0=s[i], a1=s[i+1], a2=s[i+2], a3=s[i+3];
        const tmp = a0^a1^a2^a3;
        const xt = (v) => (v&0x80 ? (v<<1)^0x1b : v<<1) & 0xff;
        s[i]   = a0^tmp^xt(a0^a1);
        s[i+1] = a1^tmp^xt(a1^a2);
        s[i+2] = a2^tmp^xt(a2^a3);
        s[i+3] = a3^tmp^xt(a3^a0);
      }
    }
    for (let c = 0; c < 4; c++) {
      const w = W[4*r+c];
      s[4*c] ^= (w>>>24)&0xff; s[4*c+1] ^= (w>>>16)&0xff;
      s[4*c+2] ^= (w>>>8)&0xff; s[4*c+3] ^= w&0xff;
    }
  }
  return s;
}

function generateCheckinS(userId) {
  const partKey = 'f=1=9w3r/u//f+//';
  const builtInKey = '5Y2ZBE8ZZEQsQPqG';
  const keyStr = partKey + builtInKey;
  const keyBytes = [];
  for (let i = 0; i < keyStr.length; i++) keyBytes.push(keyStr.charCodeAt(i));
  const W = aesKeyExpansion(keyBytes);

  const plaintext = 'load=234567&method=Checkin&timestamp=' + Date.now() + '&uid=' + userId;
  const ptBytes = [];
  for (let i = 0; i < plaintext.length; i++) ptBytes.push(plaintext.charCodeAt(i));

  const padLen = 16 - (ptBytes.length % 16);
  for (let i = 0; i < padLen; i++) ptBytes.push(padLen);

  const iv = new Uint8Array(16);
  let prev = iv;
  const ciphertext = [];
  for (let i = 0; i < ptBytes.length; i += 16) {
    const block = new Uint8Array(16);
    for (let j = 0; j < 16; j++) block[j] = ptBytes[i+j] ^ prev[j];
    prev = aesEncryptBlock(block, W);
    for (let j = 0; j < 16; j++) ciphertext.push(prev[j]);
  }

  const output = new Uint8Array(16 + ciphertext.length);
  for (let i = 0; i < ciphertext.length; i++) output[16+i] = ciphertext[i];

  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let b64 = '';
  for (let i = 0; i < output.length; i += 3) {
    const a = output[i], b = output[i+1] || 0, c = output[i+2] || 0;
    b64 += B64[a>>2] + B64[((a&3)<<4)|(b>>4)] +
           (i+1 < output.length ? B64[((b&0xf)<<2)|(c>>6)] : '=') +
           (i+2 < output.length ? B64[c&0x3f] : '=');
  }
  return b64;
}

function shopeeNotify(subtitle = '', message = '') {
  $notification.post('🍤 蝦皮每日簽到', subtitle, message, { 'url': 'shopeetw://' });
};

function handleError(error) {
  if (Array.isArray(error)) {
    console.log(`❌ ${error[0]} ${error[1]}`);
    if (showNotification) {
      shopeeNotify(error[0], error[1]);
    }
  } else {
    console.log(`❌ ${error}`);
    if (showNotification) {
      shopeeNotify(error);
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
    const shopeeHeaders = {
      'User-Agent': 'iOS app iPhone Shopee',
      'Cookie': cookieToString(shopeeInfo.token),
      'Content-Type': 'application/json',
    }
    config = {
      shopeeInfo: shopeeInfo,
      shopeeHeaders: shopeeHeaders,
    }
    return resolve();
  });
}

async function checkin() {
  return new Promise((resolve, reject) => {
    try {
      if (!config.shopeeInfo.checkinPayload) {
        return reject(['簽到失敗 ‼️', '請先手動簽到一次']);
      }

      const userId = config.shopeeInfo.token.SPC_U || config.shopeeInfo.userId;
      const payload = JSON.parse(config.shopeeInfo.checkinPayload);
      payload.s = generateCheckinS(userId);

      const request = {
        url: 'https://games-dailycheckin.shopee.tw/mkt/coins/api/v2/checkin_new',
        headers: config.shopeeHeaders,
        body: JSON.stringify(payload),
      };

      $httpClient.post(request, function (error, response, data) {
        if (error) {
          return reject(['簽到失敗 ‼️', '連線錯誤']);
        } else {
          if (response.status === 200) {
            const obj = JSON.parse(data);
            if (obj.data.success) {
              return resolve({
                checkInDay: obj.data.check_in_day,
                coins: obj.data.increase_coins,
              });
            } else {
              showNotification = false;
              return reject(['簽到失敗 ‼️', '本日已簽到']);
            }
          } else {
            return reject(['簽到失敗 ‼️', response.status]);
          }
        }
      });
    } catch (error) {
      return reject(['簽到失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ 蝦皮每日簽到 v20231004.1');
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    const result = await checkin();
    console.log('✅ 簽到成功');
    console.log(`ℹ️ 目前已連續簽到 ${result.checkInDay} 天，今日已領取 ${result.coins}`);
    shopeeNotify(
      `簽到成功，目前已連續簽到 ${result.checkInDay} 天`,
      `今日已領取 ${result.coins} 💰💰💰`
    );
  } catch (error) {
    handleError(error);
  }
  $done();
})();
