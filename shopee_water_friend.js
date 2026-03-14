(function() {
  const VERSION = 'v20260316.2';

  // ==================================================================
  // AES-256-CBC 加密（與 shopee_auto_water.js 共用邏輯）
  // ==================================================================
  const AESEncrypt = {
    SBOX: [
      0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
      0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
      0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
      0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
      0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
      0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
      0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
      0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
      0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
      0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
      0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
      0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
      0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
      0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
      0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
      0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
    ],
    RCON: [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36],
    keyExpansion: function(key) {
      const kw = [];
      for (let i = 0; i < key.length; i += 4)
        kw.push((key[i]<<24)|(key[i+1]<<16)|(key[i+2]<<8)|key[i+3]);
      const ks = kw.length, rounds = ks+6, eks = (rounds+1)*4;
      const ek = [...kw];
      for (let i = ks; i < eks; i++) {
        let t = ek[i-1];
        if (i%ks===0) {
          t = ((t<<8)|((t>>>24)&0xff))>>>0;
          t = (this.SBOX[(t>>>24)&0xff]<<24)|(this.SBOX[(t>>>16)&0xff]<<16)|(this.SBOX[(t>>>8)&0xff]<<8)|this.SBOX[t&0xff];
          t = t^(this.RCON[(i/ks)-1]<<24);
        } else if (ks>6&&i%ks===4) {
          t = (this.SBOX[(t>>>24)&0xff]<<24)|(this.SBOX[(t>>>16)&0xff]<<16)|(this.SBOX[(t>>>8)&0xff]<<8)|this.SBOX[t&0xff];
        }
        ek[i] = (ek[i-ks]^t)>>>0;
      }
      return ek;
    },
    subBytes: function(s) { for(let i=0;i<16;i++) s[i]=this.SBOX[s[i]]; },
    shiftRows: function(s) {
      let t=s[1];s[1]=s[5];s[5]=s[9];s[9]=s[13];s[13]=t;
      t=s[2];s[2]=s[10];s[10]=t;t=s[6];s[6]=s[14];s[14]=t;
      t=s[15];s[15]=s[11];s[11]=s[7];s[7]=s[3];s[3]=t;
    },
    gmul: function(a,b) {
      if(b===1) return a; if(b===2) return a<128?(a<<1):((a<<1)^0x1b); if(b===3) return this.gmul(a,2)^a; return 0;
    },
    mixColumns: function(s) {
      for(let i=0;i<16;i+=4){const a=s[i],b=s[i+1],c=s[i+2],d=s[i+3];
        s[i]=this.gmul(a,2)^this.gmul(b,3)^c^d;s[i+1]=a^this.gmul(b,2)^this.gmul(c,3)^d;
        s[i+2]=a^b^this.gmul(c,2)^this.gmul(d,3);s[i+3]=this.gmul(a,3)^b^c^this.gmul(d,2);}
    },
    addRoundKey: function(s,ks,r) {
      for(let i=0;i<4;i++){const kw=ks[r*4+i];s[i*4]^=(kw>>>24)&0xff;s[i*4+1]^=(kw>>>16)&0xff;s[i*4+2]^=(kw>>>8)&0xff;s[i*4+3]^=kw&0xff;}
    },
    pad: function(d) {
      const ps=16-(d.length%16),p=new Uint8Array(d.length+ps);p.set(d);for(let i=d.length;i<p.length;i++)p[i]=ps;return p;
    },
    encryptCBC: function(data,key,iv) {
      const pd=this.pad(data),ks=this.keyExpansion(key),rounds=Math.floor(key.length/4)+6,result=new Uint8Array(pd.length);
      let prev=new Uint8Array(iv);
      for(let off=0;off<pd.length;off+=16){
        const blk=new Uint8Array(16);for(let i=0;i<16;i++)blk[i]=pd[off+i]^prev[i];
        this.addRoundKey(blk,ks,0);for(let r=1;r<rounds;r++){this.subBytes(blk);this.shiftRows(blk);this.mixColumns(blk);this.addRoundKey(blk,ks,r);}
        this.subBytes(blk);this.shiftRows(blk);this.addRoundKey(blk,ks,rounds);
        for(let i=0;i<16;i++)result[off+i]=blk[i];prev=blk;
      }
      return result;
    },
    stringToBytes: function(s) { const b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i)&0xff;return b; },
    stringToUTF8Bytes: function(s) { return new TextEncoder().encode(s); },
    base64Encode: function(bytes) {
      const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let r='';
      for(let i=0;i<bytes.length;i+=3){const b1=bytes[i],b2=i+1<bytes.length?bytes[i+1]:0,b3=i+2<bytes.length?bytes[i+2]:0;
        const t=(b1<<16)|(b2<<8)|b3;r+=c[(t>>18)&0x3F];r+=c[(t>>12)&0x3F];
        r+=i+1<bytes.length?c[(t>>6)&0x3F]:'=';r+=i+2<bytes.length?c[t&0x3F]:'=';}
      return r;
    }
  };

  const AES_KEY = 'f=1=9w3r/u//f+//Rawym8a5Fwj4gZWT';
  const KEY_BYTES = AESEncrypt.stringToBytes(AES_KEY);
  const ZERO_IV = new Uint8Array(16); // 全零 IV

  // 加密後 prepend 16 bytes zero IV，再 base64
  function encryptWithZeroIV(plaintext) {
    const textBytes = AESEncrypt.stringToUTF8Bytes(plaintext);
    const encrypted = AESEncrypt.encryptCBC(textBytes, KEY_BYTES, ZERO_IV);
    const combined = new Uint8Array(16 + encrypted.length);
    // 前 16 bytes 保持 zero (IV)
    combined.set(encrypted, 16);
    return AESEncrypt.base64Encode(combined);
  }

  // ==================================================================
  // 主邏輯
  // ==================================================================
  function surgeNotify(subtitle, message) {
    $notification.post('🍤 蝦蝦果園好友澆水', subtitle || '', message || '', { 'url': 'shopeetw://' });
  }

  function getSaveObject(key) {
    const string = $persistentStore.read(key);
    return !string || string.length === 0 ? {} : JSON.parse(string);
  }

  function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
  }

  function getHeaders() {
    const shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
    if (isEmptyObject(shopeeFarmInfo) || !shopeeFarmInfo.waterHeaders) {
      return null;
    }
    return { ...shopeeFarmInfo.waterHeaders };
  }

  function getUserId() {
    const shopeeInfo = getSaveObject('ShopeeInfo');
    if (shopeeInfo && shopeeInfo.token) {
      return String(shopeeInfo.token.SPC_U || shopeeInfo.token.userid || '');
    }
    return '';
  }

  function getDeviceId() {
    const shopeeInfo = getSaveObject('ShopeeInfo');
    if (shopeeInfo && shopeeInfo.token && shopeeInfo.token.SPC_F) {
      return shopeeInfo.token.SPC_F;
    }
    return 'B798F6F0D3D944FC981C5C4373A2DF6F';
  }

  async function getFriendList() {
    return new Promise((resolve, reject) => {
      const deviceId = getDeviceId();
      const headers = getHeaders();
      if (!headers) {
        return reject('沒有 waterHeaders，請先手動澆水一次自己的作物');
      }
      delete headers['Content-Type'];

      const url = `https://games.shopee.tw/farm/api/friend/v2/list?source=&offset=&need_recommend=true&device_id=${deviceId}&is_ban_contact=false`;
      $httpClient.get({ url: url, headers: headers }, function(error, response, data) {
        if (error) return reject('取得好友列表連線錯誤: ' + error);
        if (response.status !== 200) return reject('取得好友列表 HTTP ' + response.status);
        try {
          const obj = JSON.parse(data);
          if (obj.code !== 0) return reject('取得好友列表 API 錯誤: code=' + obj.code + ', msg=' + obj.msg);
          return resolve(obj.data);
        } catch (e) {
          return reject('取得好友列表 JSON 解析失敗: ' + e);
        }
      });
    });
  }

  async function waterFriend(friend, deviceId, userId) {
    return new Promise((resolve, reject) => {
      const headers = getHeaders();
      if (!headers) return reject('沒有 waterHeaders');

      const now = Date.now();
      const s = encryptWithZeroIV(now + '-' + userId);
      const encryptFID = encryptWithZeroIV(now + '-' + friend.id);

      const body = {
        friendId: friend.id,
        friendAvatar: friend.avatarUrl || '',
        cropId: 0,
        deviceId: deviceId,
        scenarioType: 2,
        friendName: friend.name,
        s: s,
        encryptFID: encryptFID,
        friendType: 3,
        shareKey: '',
      };

      const bodyStr = JSON.stringify(body);
      console.log('🔍 DEBUG waterFriend body: ' + bodyStr);
      console.log('🔍 DEBUG userId: ' + userId + ', friendId: ' + friend.id + ', timestamp: ' + now);
      console.log('🔍 DEBUG s plaintext: ' + now + '-' + userId);
      console.log('🔍 DEBUG encryptFID plaintext: ' + now + '-' + friend.id);

      $httpClient.post({
        url: 'https://games.shopee.tw/farm/api/friend/v2/help',
        headers: headers,
        body: bodyStr,
      }, function(error, response, data) {
        if (error) return reject('澆水連線錯誤: ' + error);
        if (response.status !== 200) return reject('澆水 HTTP ' + response.status);
        try {
          const obj = JSON.parse(data);
          if (obj.code === 0) {
            return resolve(obj.data);
          } else {
            return reject('澆水失敗 code=' + obj.code + ', msg=' + obj.msg);
          }
        } catch (e) {
          return reject('澆水 JSON 解析失敗: ' + e);
        }
      });
    });
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  (async () => {
    console.log('ℹ️ 蝦蝦果園好友澆水 ' + VERSION);
    try {
      const data = await getFriendList();
      const friends = data.friends || [];
      console.log('ℹ️ 好友數量: ' + friends.length);

      // 過濾：未澆過水 且 有作物 (cropState < 100)
      const waterableFriends = friends.filter(f => !f.interactData.gaveWater && f.cropState >= 0 && f.cropState < 100);
      console.log('ℹ️ 可澆水好友: ' + waterableFriends.length);

      if (waterableFriends.length === 0) {
        console.log('ℹ️ 目前沒有可澆水的好友');
        $done();
        return;
      }

      const deviceId = getDeviceId();
      const userId = getUserId();
      console.log('🔍 DEBUG deviceId: ' + deviceId + ', userId: ' + userId);
      const results = [];
      const errors = [];

      // DEBUG: 只嘗試第一位好友
      const debugFriends = waterableFriends.slice(0, 1);
      for (const f of debugFriends) {
        try {
          await waterFriend(f, deviceId, userId);
          console.log('✅ 已澆水: ' + f.name + ' (id: ' + f.id + ')');
          results.push(f.name);
        } catch (e) {
          console.log('❌ ' + f.name + ': ' + e);
          errors.push(f.name + '(' + e + ')');
        }
        // 每次澆水間隔 1.5 秒
        if (debugFriends.indexOf(f) < debugFriends.length - 1) {
          await delay(1500);
        }
      }

      if (results.length > 0) {
        surgeNotify(
          '已澆水 ' + results.length + '/' + waterableFriends.length + ' 位好友',
          results.join(', ')
        );
      }
      if (errors.length > 0) {
        console.log('⚠️ 失敗: ' + errors.join(', '));
      }

    } catch (error) {
      console.log('❌ ' + error);
      surgeNotify('失敗', String(error));
    }
    $done();
  })();
})();
