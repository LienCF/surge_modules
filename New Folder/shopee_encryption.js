
// Shopee Farm 加密實現 - 完整版
// 從IC_icon文件生成的密鑰
const keyBytes = new Uint8Array([47, 47, 47, 118, 57, 47, 47, 114, 47, 51, 118, 49, 51, 90, 82, 51]);

/**
 * transformText實現 - Method 3 (Shopee Farm)
 * @param {{text: string, method: number}} params 
 * @returns {{result: string, frameworkVersion: string}}
 */
function transformText(params) {
  try {
    // 參數檢查
    const text = params.text;
    const method = parseInt(params.method);
    
    if (!text || text.length === 0) {
      return createErrorResponse("invalid text");
    }
    
    if (method !== 3) {
      return createErrorResponse("method not supported");
    }
    
    // 執行AES-CBC加密
    const result = encryptAESCBC(text, keyBytes);
    
    return {
      result: result,
      frameworkVersion: "1.0.0"
    };
  } catch (error) {
    return createErrorResponse(error.message || "encryption failed");
  }
}

/**
 * AES-CBC加密實現
 * @param {{string}} text 要加密的文本
 * @param {{Uint8Array}} key AES密鑰
 * @returns {{string}} Base64編碼的加密結果
 */
async function encryptAESCBC(text, key) {
  try {
    // 1. 轉換輸入文本為字節數組
    const textEncoder = new TextEncoder();
    const inputBytes = textEncoder.encode(text);
    
    // 2. 添加PKCS#7填充
    const blockSize = 16;
    const padLength = blockSize - (inputBytes.length % blockSize);
    const paddedData = new Uint8Array(inputBytes.length + padLength);
    paddedData.set(inputBytes);
    
    // 填充字節
    for (let i = inputBytes.length; i < paddedData.length; i++) {
      paddedData[i] = padLength;
    }
    
    // 3. 初始化向量(IV) - 與原生代碼中使用的常量
    const iv = new Uint8Array([
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 
      0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F
    ]);
    
    // 4. 導入AES密鑰
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw", 
      key,
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );
    
    // 5. 執行AES-CBC加密
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv
      },
      cryptoKey,
      paddedData
    );
    
    // 6. 添加16字節標頭(IV)
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const resultWithHeader = new Uint8Array(iv.length + encryptedBytes.length);
    resultWithHeader.set(iv, 0);
    resultWithHeader.set(encryptedBytes, iv.length);
    
    // 7. 轉換為Base64
    return arrayBufferToBase64(resultWithHeader);
    
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * 將ArrayBuffer轉換為Base64字符串
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
 * 創建錯誤響應
 */
function createErrorResponse(message) {
  return {
    error: true,
    errorMessage: message
  };
}
