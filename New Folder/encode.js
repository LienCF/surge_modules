// --- Module 79775: Environment Info ---
// Helper from 79775 to parse user agent
function _parseUserAgent(userAgent, locationHref) {
  function getAndroidVersion(ua) {
    var match = ua.toLocaleLowerCase().match(/android\s([0-9\.]*)/);
    return match ? match[1] : "";
  }
  function getIOSVersion(ua) {
    var match = ua.match(/OS ((\d+_?){2,3})\s/i);
    if (match && match.length && match[0]) {
      var parts = match[0].trim().split(/\\s/);
      if (parts && parts.length && parts[1]) {
        return parts[1].split("_").join(".");
      }
    }
    return "";
  }

  var info = {};
  var isShopeeApp = /Shopee/.test(userAgent); // Use regex for robustness
  var isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  var isAndroid = /Android/i.test(userAgent);
  var localeMatch = userAgent.match(/locale=([\w-]+)/); // Match locale format better
  var isLite = /lite\.(test\.|uat\.)?shopee/.test(locationHref);

  info.shopeeApp = !!isShopeeApp;
  info.ios = isIOS;
  info.android = isAndroid;
  info.mweb = (isIOS || isAndroid) && !isShopeeApp;
  info.pc = !isIOS && !isAndroid && !isShopeeApp;
  info.pcmall = info.pc && /scenario=1/.test(locationHref); // Use regex
  info.isShopeeLite = isLite;
  info.osVersion = isAndroid ? getAndroidVersion(userAgent) : "";
  info.mobileOsVersion = isAndroid ? getAndroidVersion(userAgent) : getIOSVersion(userAgent);
  if (localeMatch) {
    info.locale = localeMatch[1];
  }
  // Add the property checked by module 22454
  // We need the exact decoded key for ENV_CHECK_PROPERTY first
  // info[ENV_CHECK_PROPERTY] = ... based on some logic in 79775 ...
  // For now, we'll add a placeholder. This MUST be updated after decoding.
  // Example: Assuming m(586, "LTry") decodes to 'shopeeApp'
  // info['shopeeApp'] = !!isShopeeApp; // Already done

  return info;
}

function getEnvironmentInfo() {
  try {
    if (typeof window !== 'undefined' && window.navigator) {
      return _parseUserAgent(window.navigator.userAgent, window.location.href);
    } else {
      return { shopeeApp: false, ios: false, android: false, mweb: false, pc: true, pcmall: false, isShopeeLite: false, osVersion: '', mobileOsVersion: '', locale: 'unknown' };
    }
  } catch (e) {
    console.error("Error getting environment info:", e);
    return { shopeeApp: false, ios: false, android: false, mweb: false, pc: true, pcmall: false, isShopeeLite: false, osVersion: '', mobileOsVersion: '', locale: 'error' };
  }
}
const environmentInfo = getEnvironmentInfo(); // Represents d.Xh from 79775
const ENV_CHECK_PROPERTY = "shopeeApp"; // m(586, "LTry"); // Decode the property name needed

// --- Module 21632 --- (Function u.pm)
const PERF_METRIC_KEY = "perf_metric_key"; // m(518, "H8e9"); // Decode the URL parameter key
/**
 * Get performance metric (function pm from module 21632).
 */
function getPerformanceMetric() {
  try {
    if (typeof window === 'undefined' || !window.location) return "";
    const urlParams = new URLSearchParams(window.location.search);
    // Use the decoded key
    return urlParams.get(PERF_METRIC_KEY) || "";
  } catch (e) {
    console.error(`Error accessing URL params for key "${PERF_METRIC_KEY}":`, e);
    return "";
  }
}

// --- Module 50406 --- (Function l.Rc)
const MINI_FARM_PATH = "mini-farm.html"; // From module 55041
/**
 * Check if current path includes MINI_FARM_PATH (function Rc from module 50406).
 */
function checkIsMiniFarmPath() {
  try {
    if (typeof location === 'undefined') return false;
    return location.pathname.includes(MINI_FARM_PATH);
  } catch (e) {
    console.error("Error accessing location.pathname:", e);
    return false;
  }
}

// --- Combined System Flags Check --- (d.Xh[prop] && !l.Rc)
/**
 * Check system flags based on environment and path.
 */
function checkSystemFlags() {
  const featureRCEnabled = checkIsMiniFarmPath(); // !l.Rc means we negate this
  // Access the property from environmentInfo using the decoded key
  const featureXEnabled = !!environmentInfo[ENV_CHECK_PROPERTY];
  return {
    featureXEnabled: featureXEnabled,
    featureRCEnabled: featureRCEnabled, // Raw value, negation happens in processReport
  };
}

// --- Module 98048 & 37861 --- (Log Sending)
const LOG_MSG_PROCESSING = "Processing report";
/**
 * Sends log data via the loadingReportSDK.
 * Mirrors the logic of class f's static pushItem in module 98048,
 * which calls l.Z.loadingReportSDK.pushTrackStub in module 37861.
 * Note: l_module_37861 is a placeholder.
 */
function sendLog(logData, options = {}) {
  try {
    const formattedData = {
      type: "common", // Default type used in pushItem
      ...logData, // Original log data
      data: {
        ...(typeof logData.data === 'object' ? logData.data || {} : { value: logData.data }), // Ensure data is object
        page_origin: checkIsMiniFarmPath() ? "farm" : "main" // Logic from pushItem (d.aq likely decodes to 'farm')
      }
    };
    // Direct call to the (placeholder) SDK function
    // l_module_37861.Z.loadingReportSDK.pushTrackStub(formattedData, options);
    console.log("[Original Call would be l_module_37861.Z.loadingReportSDK.pushTrackStub]:", formattedData, options);
  } catch (e) {
    console.error("Error in sendLog (placeholder l_module_37861 missing?):", e);
  }
}

// --- Module 88263 & 86122 & Dependencies --- (Error Reporting)
/**
 * Custom error class (c.Z from module 86122).
 */
class CustomError extends Error {
  constructor(message, name = 'CustomError') {
    super(message);
    this.name = name;
  }
}

/**
 * Asynchronously gets additional data fields for error reporting.
 * Mirrors the logic of function g in module 88263.
 * Note: Uses placeholders for module dependencies.
 */
async function getErrorDataField() {
  try {
    const userId = getDeviceId(); // From s.n (58639) - already implemented
    const version = "farm-GAMES-FRUIT-v9.0-1"; // Hardcoded in g
    let deviceIdForError = "";
    if (!checkIsMiniFarmPath()) { // Check based on o.Rc (50406)
      try {
        // Attempt to call the logic from d.Zw (95102) which gets deviceID from l.BN (79775 -> getDeviceInfo)
        // const deviceInfo = await l_module_79775.BN(); // Placeholder call
        // deviceIdForError = deviceInfo?.deviceID || "";
        console.warn("Placeholder for d.Zw (module 95102) call to get deviceID, using empty string.");
        deviceIdForError = ""; // Keep it empty in placeholder
      } catch (zwError) {
        console.error("Error calling placeholder d.Zw:", zwError);
        deviceIdForError = "";
      }
    }
    return {
      user_id: userId,
      version: version,
      device_id: deviceIdForError
    };
  } catch (e) {
    console.error("Error in getErrorDataField:", e);
    return { user_id: 'error', version: 'error', device_id: 'error' };
  }
}

/**
 * Reports an error via the APM SDK.
 * Mirrors the logic of function _ / s.Tb which calls w and g in module 88263.
 * Note: Uses placeholders for module dependencies and SDK instance.
 */
async function reportError(error, context = {}) {
  try {
    // Get Scene Info (from p.E in module 32113)
    let sceneName = 'UnknownScene';
    let viewName = 'UnknownView';
    try {
      // const sceneInstance = p_placeholder.E.getInstance(); // Use placeholder
      // sceneName = sceneInstance.curSceneName();
      // viewName = sceneInstance.curViewName() || "";
      console.warn("Using placeholder scene info.");

    } catch (sceneError) {
      console.error("Error getting scene info from placeholder:", sceneError);
    }

    const scenePrefix = `[EgretH5][${sceneName}${viewName ? "-" + viewName : ""}]`;
    const formattedMessage = `${scenePrefix}${error.message}`;

    // Prepare data structure similar to function w in 88263
    const reportDataBase = {
      message: formattedMessage, // Used for top-level message in g
      data: {
        name: formattedMessage, // Also used as name inside data
        level: 'error', // Default level
        data_field: {}, // To be populated by getErrorDataField
        extra: { ...(context.extra || context || {}) }, // Merge extra context
        // Stack is not explicitly passed to g, but capture might add it
        stack: error.stack
      }
    };

    // Populate data_field asynchronously like function g in 88263
    const dataField = await getErrorDataField();
    reportDataBase.data.data_field = { ...dataField, ...(reportDataBase.data.data_field || {}) }; // Merge fields

    // Call the (placeholder) APM SDK capture method
    // apmSdkInstance.capture(reportDataBase);
    console.error("[Original Call would be apmSdkInstance.capture]:", reportDataBase);

  } catch (e) {
    console.error("Error in reportError function itself:", e);
  }
}

// --- Module 61721 --- (Constant a.Gh)
const ERROR_CODE_SIGN_FAILED = 0;

// --- Core Functions (Text Check - Unchanged) ---
function getCharLength(char) {
  return char.charCodeAt(0) > 127 ? 2 : 1;
}

function checkTextLength(text, limit) {
  if (!text || !limit) return text;
  const chars = text.split('');
  let totalLength = 0;
  for (let i = 0; i < chars.length; i++) {
    totalLength += getCharLength(chars[i]);
    if (totalLength > limit) {
      return text.substring(0, i);
    }
  }
  return text;
}

// --- Native Bridge Call (Replaced Simulation) ---
/**
 * Calls the native App bridge function 'transformText'.
 * Mirrors the core logic of l.pb / k in module 79775.
 * Assumes window.bridgeInit and window.bridgeCallHandler are provided by the environment.
 * Will fail if run outside the target native environment.
 * @param {string} text - Text to process.
 * @param {number} method - Method number (usually 3).
 * @returns {Promise} - Promise resolving with the bridge result.
 */
function callNativeBridge(text, method) {
  return new Promise((resolve, reject) => {
    try {
      // Directly attempt to initialize and call the bridge
      if (typeof window.bridgeInit !== 'function') {
        throw new Error("window.bridgeInit is not a function");
      }
      window.bridgeInit(function () {
        if (typeof window.bridgeCallHandler !== 'function') {
          throw new Error("window.bridgeCallHandler is not a function");
        }
        window.bridgeCallHandler("transformText", {
          text: text,
          method: method
        }, function (result) {
          resolve(result); // Resolve with the result from native
        });
      });
    } catch (bridgeError) {
      console.error("Native bridge call failed:", bridgeError);
      // Reject with a more specific error if possible
      reject(new Error(`Bridge Error: ${bridgeError.message || bridgeError}`));
    }
  });
}

/**
 * Processes text for encoding: checks length and calls the native bridge.
 * Mirrors f.HI / D logic from module 95102.
 * @param {string} reportString - String to encode.
 * @param {number} method - Method number.
 * @returns {Promise} - Promise from callNativeBridge.
 */
function encodeText(reportString, method) {
  const processedText = checkTextLength(reportString, 1500); // s.xv logic (module 30288)
  return callNativeBridge(processedText, method); // l.pb logic (module 79775)
}

// --- Module 58639 --- (Function h.n -> i)
/**
 * Get device ID (function i/n from module 58639).
 */
function getDeviceId() {
  try {
    if (typeof document === 'undefined' || !document.cookie) return '';
    const cookies = document.cookie.split('; ');
    const spcU = cookies.find(row => row.startsWith('SPC_U='))?.split('=')[1];
    if (spcU) return spcU;
    const userId = cookies.find(row => row.startsWith('userid='))?.split('=')[1];
    if (userId) return userId;
    return '';
  } catch (e) {
    console.error("Error reading cookies for Device ID:", e);
    return '';
  }
}

// --- Simple String Ops (y and w values) ---
/**
 * Get string value 1 (y value).
 * Mirrors the calculation for 'y' found directly within the main function (w/Q) of module 22454.
 * @returns {string} - String value (last 4 digits of timestamp).
 */
function getStringValue1() {
  return Date.now().toString().slice(-4);
}
/**
 * Get string value 2 (w value).
 * Mirrors the calculation for 'w' found directly within the main function (w/Q) of module 22454.
 * @returns {string} - Random string value.
 */
function getStringValue2() {
  return Math.random().toString(36).substring(2, 8);
}

// --- Module 95102 --- (Function f.rw -> j)
/**
 * Check if the environment is likely an emulator by calling the native bridge method "is3mu1at0r".
 * Mirrors the logic of function j (exported as rw) in module 95102.
 * Note: Assumes a bridge communication mechanism like module 10857's u.$ exists.
 * Will fail if run outside the target native environment.
 * @returns {Promise<boolean>} - Promise resolving with the result of the bridge call (true if likely emulator).
 */
async function checkIsEmulator() {
  // Original logic calls (0, u.$)("is3mu1at0r") where u is module 10857 (bridge helper)
  try {
    console.warn("[Original Call would be Bridge call u.$('is3mu1at0r')]");
    // Placeholder logic:
    return Promise.resolve(false);

  } catch (e) {
    console.error("Error during checkIsEmulator (bridge call 'is3mu1at0r'):", e);
    return Promise.resolve(false);
  }
}

// --- Module 22454: Main Logic (Function w/Q) ---
let counter = 1;

// Decode necessary keys/values from module 22454 using m()
const KEY_DEVICE_ID = "deviceId"; // m(584, "tH1q");
const KEY_VALUE_Y = "yValue"; // m(581, "5EI@");
const KEY_VALUE_W = "wValue"; // m(583, "5EI@");
const KEY_TIMESTAMP = "timestamp"; // m(616, "83Wy");
const KEY_FLAG = "flag"; // m(556, "My0U");

const ERR_MSG_FALLBACK = "Encryption failed"; // m(535, "ut3E"); // Fallback error message
const ERR_NAME_FALLBACK = "EncryptionError"; // m(564, "UgUX"); // Fallback error name

const SUCCESS_LOG_KEY = "success"; // m(618, "Uc(b"); // Key for success report data? ("success")
const SUCCESS_EVENT_NAME = "reportSuccess"; // m(524, "juUa"); // Event name for success report ("reportSuccess")
const SUCCESS_DATA_KEY = "value"; // m(554, "I(Qf"); // Key containing success data object ("value")

// Keys within the success data object
const SUCCESS_DATA_CODE = "code"; // m(527, "tH1q");
const SUCCESS_DATA_DEVICE_ID = "device_id"; // m(550, "4gYN");
const SUCCESS_DATA_Y = "y_value"; // m(571, "l8sD");
const SUCCESS_DATA_W = "w_value"; // m(504, "V!&H");
const SUCCESS_DATA_TIMESTAMP = "timestamp"; // m(590, "S!u)");

/**
 * Main function to collect data and trigger encoding (function w/Q from module 22454).
 */
async function processReport(initialTimestamp) {
  const startTime = initialTimestamp || Date.now();
  let reportStatus = '1'; // Default status "1"

  try {

    const deviceId = getDeviceId(); // h.n (58639)
    const valueY = Date.now().toString().slice(-4); // y (inline calc)
    const valueW = Math.random().toString(36).substring(2, 8); // w (inline calc)
    const timestamp = startTime;     // T (Date.now())
    const isEmulator = await checkIsEmulator(); // f.rw (95102) - Call renamed function
    const emulatorFlag = isEmulator ? 1 : 0;        // g - Rename flag variable

    // Log using actual SDK call simulation
    sendLog({
      message: LOG_MSG_PROCESSING, // "Processing report"
      timestamp: Date.now(),
      data: {
        [KEY_DEVICE_ID]: deviceId,     // "deviceId"
        [KEY_VALUE_Y]: valueY,         // "yValue"
        [KEY_VALUE_W]: valueW,         // "wValue"
        [KEY_TIMESTAMP]: timestamp,    // "timestamp"
        [KEY_FLAG]: emulatorFlag          // "flag"
      }
    }); // o.Z.pushItem (98048) -> pushTrackStub (37861)

    const reportString = [
      counter++, // k++
      valueY,
      valueW,
      timestamp,
      deviceId,
      emulatorFlag
    ].join('-'); // "-"

    // Calls l.pb (79775) which wraps the native bridge call
    const result = await encodeText(reportString, 3); // encodeText calls callNativeBridge

    // Process result
    if (result && result.code === ERROR_CODE_SIGN_FAILED) { // Compare code ("code") with 0
      reportStatus = result.sign || '1'; // Use sign ("sign") or fallback "1"
    } else if (result) {
      // Original Success Reporting (via window.reportLog ?)
      const successData = {
        [SUCCESS_DATA_CODE]: result.code || 'Success', // "code"
        [SUCCESS_DATA_DEVICE_ID]: deviceId,           // "device_id"
        [SUCCESS_DATA_Y]: valueY,                     // "y_value"
        [SUCCESS_DATA_W]: valueW,                     // "w_value"
        [SUCCESS_DATA_TIMESTAMP]: timestamp          // "timestamp"
      };
      try {
        if (typeof window.reportLog === 'function') {
          // window.reportLog(SUCCESS_EVENT_NAME, { [SUCCESS_LOG_KEY]: 'value', [SUCCESS_DATA_KEY]: successData }); // Original call? m(528, "(sS&") -> "reportLog"
          console.log("[Original Call would be window.reportLog]:", SUCCESS_EVENT_NAME, { [SUCCESS_LOG_KEY]: 'value', [SUCCESS_DATA_KEY]: successData });
        } else {
          console.warn("window.reportLog not found. Logging success data to console instead.");
          console.log("Success Data:", { [SUCCESS_LOG_KEY]: 'value', [SUCCESS_DATA_KEY]: successData });
        }
      } catch (logError) {
        console.error("Error during success reporting:", logError);
      }
      reportStatus = '1'; // Fallback "1"
    } else {
      // Original threw error here before catch block in some paths
      throw new Error('Encoding function returned unexpected result');
    }

    return reportStatus; // Return status "1", "2", or sign value

  } catch (error) {
    // Error reporting call chain (s.Tb -> w -> g -> apmSdkInstance.capture)
    const message = error.message || ERR_MSG_FALLBACK; // "Encryption failed"
    const name = error.name !== 'Error' ? error.name : ERR_NAME_FALLBACK; // "EncryptionError"
    const customError = new CustomError(message, name); // new CustomError(...)
    // Await the async reportError function
    await reportError(customError, { timestamp: Date.now(), context: 'processReport' }); // reportError(...) call

    return '1'; // Default return value "1" on error
  }
}

// --- Exports ---
module.exports = {
  // Core logic functions
  checkTextLength,
  getCharLength,
  callNativeBridge, // Now attempts direct bridge call
  encodeText,
  getDeviceId,
  getStringValue1,
  getStringValue2,
  checkIsEmulator, // Update exported function name
  processReport, // Now uses non-simulated calls internally where possible

  // Deobfuscation
  m,
  __v_array,

  // Environment/Config dependent functions
  getEnvironmentInfo,
  checkSystemFlags,
  getPerformanceMetric,
  checkIsMiniFarmPath,

  // Interface functions (now attempt real calls or use placeholders)
  sendLog,
  reportError, // Now async and attempts full reporting logic
  CustomError,
  ERROR_CODE_SIGN_FAILED,

  // Removed isBridgeReady
};

// Optional: Verification logs remain commented out
/*
// ... verification logs ...
*/