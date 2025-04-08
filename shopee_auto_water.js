// ==================================================================
// 輕量級 AES 加密實現，替代 CryptoJS 庫
// ==================================================================
const AESEncrypt = {
  // AES S-box
  SBOX: [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
  ],

  // Rcon values
  RCON: [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36],

  // Key expansion
  keyExpansion: function (key) {
    const keyWords = [];
    for (let i = 0; i < key.length; i += 4) {
      keyWords.push(
        (key[i] << 24) | (key[i + 1] << 16) | (key[i + 2] << 8) | key[i + 3]
      );
    }

    const keySize = keyWords.length;
    const expandedKeyWords = [...keyWords];
    const rounds = keySize + 6;
    const expandedKeySize = (rounds + 1) * 4;

    for (let i = keySize; i < expandedKeySize; i++) {
      let temp = expandedKeyWords[i - 1];

      if (i % keySize === 0) {
        // RotWord
        temp = ((temp << 8) | ((temp >>> 24) & 0xff)) >>> 0;

        // SubWord
        temp = (
          (this.SBOX[(temp >>> 24) & 0xff] << 24) |
          (this.SBOX[(temp >>> 16) & 0xff] << 16) |
          (this.SBOX[(temp >>> 8) & 0xff] << 8) |
          this.SBOX[temp & 0xff]
        );

        // XOR with Rcon
        temp = temp ^ (this.RCON[(i / keySize) - 1] << 24);
      }

      expandedKeyWords[i] = (expandedKeyWords[i - keySize] ^ temp) >>> 0;
    }

    return expandedKeyWords;
  },

  // Substitute bytes
  subBytes: function (state) {
    for (let i = 0; i < 16; i++) {
      state[i] = this.SBOX[state[i]];
    }
  },

  // Shift rows
  shiftRows: function (state) {
    // Row 1: shift 1 byte
    let temp = state[1];
    state[1] = state[5];
    state[5] = state[9];
    state[9] = state[13];
    state[13] = temp;

    // Row 2: shift 2 bytes
    temp = state[2];
    state[2] = state[10];
    state[10] = temp;
    temp = state[6];
    state[6] = state[14];
    state[14] = temp;

    // Row 3: shift 3 bytes
    temp = state[15];
    state[15] = state[11];
    state[11] = state[7];
    state[7] = state[3];
    state[3] = temp;
  },

  // Mix columns
  mixColumns: function (state) {
    for (let i = 0; i < 16; i += 4) {
      const a = state[i];
      const b = state[i + 1];
      const c = state[i + 2];
      const d = state[i + 3];

      state[i] = this.gmul(a, 2) ^ this.gmul(b, 3) ^ c ^ d;
      state[i + 1] = a ^ this.gmul(b, 2) ^ this.gmul(c, 3) ^ d;
      state[i + 2] = a ^ b ^ this.gmul(c, 2) ^ this.gmul(d, 3);
      state[i + 3] = this.gmul(a, 3) ^ b ^ c ^ this.gmul(d, 2);
    }
  },

  // Galois field multiplication
  gmul: function (a, b) {
    if (b === 1) return a;
    if (b === 2) return a < 128 ? a << 1 : (a << 1) ^ 0x1b;
    if (b === 3) return this.gmul(a, 2) ^ a;
    return 0;
  },

  // Add round key
  addRoundKey: function (state, keySchedule, round) {
    for (let i = 0; i < 4; i++) {
      const keyWord = keySchedule[round * 4 + i];
      state[i * 4] ^= (keyWord >>> 24) & 0xff;
      state[i * 4 + 1] ^= (keyWord >>> 16) & 0xff;
      state[i * 4 + 2] ^= (keyWord >>> 8) & 0xff;
      state[i * 4 + 3] ^= keyWord & 0xff;
    }
  },

  // PKCS#7 padding
  pad: function (data) {
    const blockSize = 16;
    const padSize = blockSize - (data.length % blockSize);
    const padded = new Uint8Array(data.length + padSize);
    padded.set(data);

    for (let i = data.length; i < padded.length; i++) {
      padded[i] = padSize;
    }

    return padded;
  },

  // AES-CBC encryption
  encryptCBC: function (data, key, iv) {
    // Ensure data is padded
    const paddedData = this.pad(data);
    const keySchedule = this.keyExpansion(key);
    const rounds = Math.floor(key.length / 4) + 6;
    const result = new Uint8Array(paddedData.length);

    // Process each block
    let prevBlock = new Uint8Array(iv);

    for (let offset = 0; offset < paddedData.length; offset += 16) {
      // XOR with previous ciphertext or IV
      const block = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        block[i] = paddedData[offset + i] ^ prevBlock[i];
      }

      // Apply AES encryption
      this.encryptBlock(block, keySchedule, rounds);

      // Copy to result
      for (let i = 0; i < 16; i++) {
        result[offset + i] = block[i];
      }

      // Set previous block
      prevBlock = block;
    }

    return result;
  },

  // AES block encryption
  encryptBlock: function (block, keySchedule, rounds) {
    // Initial round key addition
    this.addRoundKey(block, keySchedule, 0);

    // Main rounds
    for (let round = 1; round < rounds; round++) {
      this.subBytes(block);
      this.shiftRows(block);
      this.mixColumns(block);
      this.addRoundKey(block, keySchedule, round);
    }

    // Final round (no mixColumns)
    this.subBytes(block);
    this.shiftRows(block);
    this.addRoundKey(block, keySchedule, rounds);
  },

  // Converts string to Uint8Array
  stringToBytes: function (str) {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
  },

  // Converts UTF-8 string to Uint8Array
  stringToUTF8Bytes: function (str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  },

  // Base64 encoding
  base64Encode: function (bytes) {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';

    for (let i = 0; i < bytes.length; i += 3) {
      const byte1 = bytes[i];
      const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

      const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

      result += base64Chars[(triplet >> 18) & 0x3F];
      result += base64Chars[(triplet >> 12) & 0x3F];

      if (i + 1 < bytes.length) {
        result += base64Chars[(triplet >> 6) & 0x3F];
      } else {
        result += '=';
      }

      if (i + 2 < bytes.length) {
        result += base64Chars[triplet & 0x3F];
      } else {
        result += '=';
      }
    }

    return result;
  }
};

/**
 * ArrayBuffer轉Base64
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Main encode function
function encodeText(encode_text) {
  // Key and IV for AES-CBC encryption
  const key = new Uint8Array([
    0x2f, 0x2f, 0x2f, 0x76, 0x39, 0x2f, 0x2f, 0x72,
    0x2f, 0x33, 0x76, 0x31, 0x33, 0x5a, 0x52, 0x33
  ]);

  // 使用與原始程式相同的 IV
  const iv = new Uint8Array([
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);

  // Convert input string to UTF-8 bytes
  const textBytes = AESEncrypt.stringToUTF8Bytes(encode_text);

  // Encrypt using AES-CBC
  const encrypted = AESEncrypt.encryptCBC(textBytes, key, iv);

  // 創建帶 IV 標頭的結果
  const resultWithHeader = new Uint8Array(encrypted.length + 16);
  resultWithHeader.set(iv, 0);
  resultWithHeader.set(encrypted, 16);


  // Base64 編碼完整結果
  return arrayBufferToBase64(resultWithHeader);
}

let showNotification = true;
let config = null;
let counter = 1; // 初始化為 1，避免每次從 0 開始

function surgeNotify(subtitle = '', message = '') {
  $notification.post('🍤 蝦蝦果園自動澆水', subtitle, message, { 'url': 'shopeetw://' });
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
      return reject(['檢查失敗 ‼️', '找不到 token']);
    }

    const shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
    if (isEmptyObject(shopeeFarmInfo)) {
      return reject(['檢查失敗 ‼️', '沒有蝦蝦果園資料']);
    }

    const shopeeHeaders = {
      'Cookie': cookieToString(shopeeInfo.token),
      'Content-Type': 'application/json',
    }
    config = {
      shopeeInfo: shopeeInfo,
      shopeeFarmInfo: shopeeFarmInfo,
      shopeeHeaders: shopeeHeaders,
    }
    return resolve();
  });
}

async function deleteOldData() {
  return new Promise((resolve, reject) => {
    try {
      $persistentStore.write(null, 'ShopeeAutoCropName');
      $persistentStore.write(null, 'ShopeeCrop');
      $persistentStore.write(null, 'ShopeeCropState');
      $persistentStore.write(null, 'ShopeeCropName');
      $persistentStore.write(null, 'ShopeeCropToken');
      $persistentStore.write(null, 'ShopeeGroceryStoreToken');

      let shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
      delete shopeeFarmInfo['autoCropSeedName'];
      const save = $persistentStore.write(JSON.stringify(shopeeFarmInfo, null, 4), 'ShopeeFarmInfo');
      if (!save) {
        return reject(['保存失敗 ‼️', '無法更新作物資料']);
      } else {
        return resolve();
      }

      return resolve();
    } catch (error) {
      return reject(['刪除舊資料發生錯誤 ‼️', error]);
    }
  });
}

function updateSToken(crop) {
  const deviceId = config.shopeeInfo.token.SPC_U; //   .deviceId; // h.n (58639)
  const valueY = Date.now().toString().slice(-4); // y (inline calc)
  const valueW = Math.random().toString(36).substring(2, 8); // w (inline calc)
  const timestamp = Date.now();     // T (Date.now())
  const emulatorFlag = 0;        // g - Rename flag variable      
  counter = 1;

  const reportString = [
    counter++, // k++
    valueY,
    valueW,
    timestamp,
    deviceId,
    emulatorFlag
  ].join('-'); // "-"

  console.log(reportString);
  const result = encodeText(reportString);
  console.log(`${result}`);

  // 直接返回加密後的字符串
  return result;
}

async function water() {
  return new Promise((resolve, reject) => {
    try {
      if (!config.shopeeFarmInfo.currentCrop || config.shopeeFarmInfo.currentCrop.cropId === 0) {
        showNotification = false;
        return reject(['澆水失敗 ‼️', '目前沒有作物']);
      }

      // 獲取加密後的 token 字符串
      const sToken = updateSToken(config.shopeeFarmInfo.currentCrop);

      // 更新 currentCrop 的 s 屬性
      config.shopeeFarmInfo.currentCrop.s = sToken;

      const waterRequest = {
        url: 'https://games.shopee.tw/farm/api/orchard/crop/water',
        headers: config.shopeeHeaders,
        body: JSON.stringify(config.shopeeFarmInfo.currentCrop),
      };

      $httpClient.post(waterRequest, function (error, response, data) {
        if (error) {
          return reject(['澆水失敗 ‼️', '連線錯誤']);
        } else {
          if (response.status === 200) {
            const obj = JSON.parse(data);
            if (obj.code === 0) {
              const useNumber = obj.data.useNumber;
              const state = obj.data.crop.state;
              const exp = obj.data.crop.exp;
              const levelExp = obj.data.crop.meta.config.levelConfig[state.toString()].exp;
              const remain = levelExp - exp;
              return resolve({
                state: state,
                useNumber: useNumber,
                remain: remain,
              });
            } else if (obj.code === 409000) {
              showNotification = false;
              return reject(['澆水失敗 ‼️', '水壺目前沒水']);
            } else if (obj.code === 403005) {
              return reject(['澆水失敗 ‼️', '作物狀態錯誤，請先手動澆水一次']);
            } else if (obj.code === 409004) {
              return reject(['澆水失敗 ‼️', '作物狀態錯誤，請檢查是否已收成']);
            } else {
              return reject(['澆水失敗 ‼️', `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
            }
          } else {
            return reject(['澆水失敗 ‼️', response.status]);
          }
        }
      });
    } catch (error) {
      return reject(['澆水失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log(`ℹ️ 蝦蝦果園自動澆水 v20230210.1`);
  try {
    await preCheck();
    console.log('✅ 檢查成功');
    await deleteOldData();
    console.log('✅ 刪除舊資料成功');
    const result = await water();
    console.log('✅ 澆水成功');

    if (result.state === 3) {
      console.log(`本次澆了： ${result.useNumber} 滴水 💧，剩餘 ${result.remain} 滴水收成`);
    } else {
      console.log(`本次澆了： ${result.useNumber} 滴水 💧，剩餘 ${result.remain} 滴水成長至下一階段`);
    }

    if (result.remain === 0) {
      surgeNotify(
        '澆水成功 ✅',
        '種植完畢，作物可以收成啦 🌳'
      );
    }
  } catch (error) {
    handleError(error);
  }
  $done();
})();