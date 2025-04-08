#!/usr/bin/env python3
import sys
import base64
import os

def generate_key_from_ic_icon(ic_icon_path):
    """
    從IC_icon文件生成Shopee加密密鑰
    準確實現sub_10006D3CC的算法
    
    參數:
        ic_icon_path: IC_icon文件路徑
    
    返回:
        生成的密鑰(bytes)
    """
    # 檢查文件是否存在
    if not os.path.exists(ic_icon_path):
        print(f"錯誤: 找不到文件 {ic_icon_path}")
        sys.exit(1)
    
    # 讀取IC_icon文件
    try:
        with open(ic_icon_path, 'rb') as f:
            ic_data = f.read()
    except Exception as e:
        print(f"讀取文件錯誤: {str(e)}")
        sys.exit(1)
    
    # 分塊大小
    block_size = 16  # 0x10
    
    # 計算塊數
    num_blocks = len(ic_data) // block_size
    
    # 處理結果
    result = bytearray()
    
    # 對每個16字節塊進行處理
    for i in range(num_blocks):
        block_start = i * block_size
        block_end = block_start + block_size
        block = ic_data[block_start:block_end]
        
        # 獲取塊的第一個和最後一個字節
        first_byte = block[0]
        last_byte = block[-1]
        
        # 執行操作: (first_byte & last_byte)的按位取反
        processed_byte = ~(first_byte & last_byte) & 0xFF
        
        # 添加到結果
        result.append(processed_byte)
    
    # 將結果轉為bytes並進行Base64編碼
    base64_result = base64.b64encode(result).decode('ascii')
    
    # 從sub_10006D3CC的後半部分分析確定的字符串處理邏輯:
    key_length = 16  # X20值
    processed_string = ""
    
    # 處理前key_length個字符
    for i in range(min(key_length, len(base64_result))):
        processed_string += base64_result[i]
    
    # 處理額外的後續字符(如果需要)
    if len(processed_string) < key_length:
        for i in range(key_length - len(processed_string)):
            if len(base64_result) > 0:
                processed_string += base64_result[-1]
    
    # 轉回字節數組
    final_key = processed_string.encode('ascii')
    
    return final_key

def main():
    if len(sys.argv) < 2:
        print("用法: python generate_shopee_key.py <IC_icon文件路徑>")
        sys.exit(1)
    
    ic_icon_path = sys.argv[1]
    key = generate_key_from_ic_icon(ic_icon_path)
    
    # 輸出各種格式的密鑰
    print(f"生成的密鑰: {key.decode('ascii', errors='ignore')}")  
    print(f"生成的密鑰 (hex): {key.hex()}")
    print(f"生成的密鑰 (base64): {base64.b64encode(key).decode('ascii')}")
    print(f"生成的密鑰長度: {len(key)} 字節")
    
    # 寫入密鑰到文件
    with open("shopee_key.bin", "wb") as f:
        f.write(key)
    print(f"密鑰已保存到: shopee_key.bin")

    # 生成AES加密可用的密鑰
    # 如果密鑰長度不是16/24/32字節，則調整到適合AES的長度
    aes_key_size = 16  # AES-128
    if len(key) >= 32:
        aes_key_size = 32  # AES-256
    elif len(key) >= 24:
        aes_key_size = 24  # AES-192
    
    aes_key = bytearray(aes_key_size)
    
    # 複製原始密鑰
    for i in range(min(len(key), aes_key_size)):
        aes_key[i] = key[i]
    
    # 如果密鑰較短，填充剩餘部分
    for i in range(len(key), aes_key_size):
        aes_key[i] = 0x36 ^ (i & 0xFF)  # 使用標準填充方式
    
    # 產生JavaScript可用的格式
    js_array = "const keyBytes = new Uint8Array([" + ", ".join([str(b) for b in aes_key]) + "]);"
    with open("shopee_key.js", "w") as f:
        f.write(js_array)
    print(f"JavaScript格式密鑰已保存到: shopee_key.js")

    # 生成完整的JavaScript加密實現
    generate_js_implementation(aes_key)

def generate_js_implementation(key_bytes):
    """生成完整的JavaScript實現"""
    js_code = f"""
// Shopee Farm 加密實現 - 完整版
// 從IC_icon文件生成的密鑰
const keyBytes = new Uint8Array([{", ".join([str(b) for b in key_bytes])}]);

/**
 * transformText實現 - Method 3 (Shopee Farm)
 * @param {{{{text: string, method: number}}}} params 
 * @returns {{{{result: string, frameworkVersion: string}}}}
 */
function transformText(params) {{
  try {{
    // 參數檢查
    const text = params.text;
    const method = parseInt(params.method);
    
    if (!text || text.length === 0) {{
      return createErrorResponse("invalid text");
    }}
    
    if (method !== 3) {{
      return createErrorResponse("method not supported");
    }}
    
    // 執行AES-CBC加密
    const result = encryptAESCBC(text, keyBytes);
    
    return {{
      result: result,
      frameworkVersion: "1.0.0"
    }};
  }} catch (error) {{
    return createErrorResponse(error.message || "encryption failed");
  }}
}}

/**
 * AES-CBC加密實現
 * @param {{{{string}}}} text 要加密的文本
 * @param {{{{Uint8Array}}}} key AES密鑰
 * @returns {{{{string}}}} Base64編碼的加密結果
 */
async function encryptAESCBC(text, key) {{
  try {{
    // 1. 轉換輸入文本為字節數組
    const textEncoder = new TextEncoder();
    const inputBytes = textEncoder.encode(text);
    
    // 2. 添加PKCS#7填充
    const blockSize = 16;
    const padLength = blockSize - (inputBytes.length % blockSize);
    const paddedData = new Uint8Array(inputBytes.length + padLength);
    paddedData.set(inputBytes);
    
    // 填充字節
    for (let i = inputBytes.length; i < paddedData.length; i++) {{
      paddedData[i] = padLength;
    }}
    
    // 3. 初始化向量(IV) - 與原生代碼中使用的常量
    const iv = new Uint8Array([
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 
      0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F
    ]);
    
    // 4. 導入AES密鑰
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw", 
      key,
      {{ name: "AES-CBC" }},
      false,
      ["encrypt"]
    );
    
    // 5. 執行AES-CBC加密
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {{
        name: "AES-CBC",
        iv: iv
      }},
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
    
  }} catch (error) {{
    console.error("Encryption error:", error);
    throw new Error("Encryption failed");
  }}
}}

/**
 * 將ArrayBuffer轉換為Base64字符串
 */
function arrayBufferToBase64(buffer) {{
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {{
    binary += String.fromCharCode(bytes[i]);
  }}
  return btoa(binary);
}}

/**
 * 創建錯誤響應
 */
function createErrorResponse(message) {{
  return {{
    error: true,
    errorMessage: message
  }};
}}
"""
    with open("shopee_encryption.js", "w") as f:
        f.write(js_code)
    print(f"完整的JavaScript加密實現已保存到: shopee_encryption.js")
    
if __name__ == "__main__":
    main()

