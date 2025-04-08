/**
 * Shopee Farm transformText方法3加密實現
 * @param {Object} params 參數對象
 * @param {string} params.text 要加密的文本
 * @param {number} params.method 加密方法編號 (3)
 * @returns {Object} 加密結果
 */
async function transformText(params) {
  try {
    // 獲取參數
    const text = params.text;
    const method = parseInt(params.method);

    // 檢查參數有效性
    if (!text || text.length === 0) {
      return createErrorResponse("invalid text");
    }

    // 只支持method 3
    if (method !== 3) {
      return createErrorResponse("method not supported");
    }

    // 1. 獲取密鑰 (應從IC_icon文件生成)
    const partKey = new Uint8Array([47, 47, 47, 118, 57, 47, 47, 114, 47, 51, 118, 49, 51, 90, 82, 51]);


    // 2. 轉換輸入為字節數組
    const textBytes = stringToUTF8Bytes(text);

    // 3. 執行AES-CBC加密
    const result = await encryptAESCBC(textBytes, partKey);

    return {
      result: result,
      frameworkVersion: "1.0.0"
    };
  } catch (error) {
    return createErrorResponse(error.message || "encryption failed");
  }
}

/**
 * AES-CBC加密
 */
async function encryptAESCBC(inputBytes, keyBytes) {
  try {
    // 1. 準備數據 - 確保16字節對齊
    const paddingSize = 16;
    const padLength = paddingSize - (inputBytes.length % paddingSize);
    const paddedData = new Uint8Array(inputBytes.length + padLength);

    // 2. 複製原始數據
    paddedData.set(inputBytes);

    // 3. 添加PKCS#7填充
    for (let i = inputBytes.length; i < paddedData.length; i++) {
      paddedData[i] = padLength;
    }

    // 4. 從原生代碼提取的初始向量
    const iv = new Uint8Array([
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F
    ]);

    // 5. 處理密鑰 (調整為適合AES的長度)
    const cryptoKey = await createAESKey(keyBytes);

    // 6. 使用Web Crypto API執行AES-CBC加密
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv
      },
      cryptoKey,
      paddedData
    );

    // 7. 添加16字節標頭 (常量 + IV)
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const resultWithHeader = new Uint8Array(encryptedBytes.length + 16);

    // 8. 設置標頭
    resultWithHeader.set(iv, 0);
    resultWithHeader.set(encryptedBytes, 16);

    // 9. 轉換為Base64
    return arrayBufferToBase64(resultWithHeader);

  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * 創建AES密鑰
 */
async function createAESKey(keyBytes) {
  // 從密鑰數據創建適合AES的密鑰

  // 處理密鑰長度 (需為16、24或32字節)
  let keySize = 16; // AES-128
  if (keyBytes.length >= 32) {
    keySize = 32; // AES-256
  } else if (keyBytes.length >= 24) {
    keySize = 24; // AES-192
  }

  // 準備適當長度的密鑰
  const processedKey = new Uint8Array(keySize);

  // 填充密鑰 (與原生代碼的密鑰處理邏輯相似)
  const minLength = Math.min(keyBytes.length, keySize);
  for (let i = 0; i < minLength; i++) {
    processedKey[i] = keyBytes[i];
  }

  // 如果原始密鑰較短，填充剩餘部分
  if (keyBytes.length < keySize) {
    for (let i = keyBytes.length; i < keySize; i++) {
      processedKey[i] = 0x36 ^ (i & 0xFF);
    }
  }

  // 使用Web Crypto API導入密鑰
  return window.crypto.subtle.importKey(
    "raw",
    processedKey,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
}

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

/**
 * 字符串轉換為UTF-8字節數組
 */
function stringToUTF8Bytes(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * 創建錯誤響應
 */
function createErrorResponse(message) {
  return {
    error: true,
    errorMessage: message
  };
}
