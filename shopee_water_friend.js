(function() {
  const VERSION = 'v20260316.3';

  // sortType → friendType 映射 (從遊戲 JS 逆向取得)
  // T={0:6, 1:3, 2:4, 3:7, 4:5}
  const FRIEND_TYPE_MAP = {0:6, 1:3, 2:4, 3:7, 4:5};

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

  async function waterFriend(friend, deviceId) {
    return new Promise((resolve, reject) => {
      const headers = getHeaders();
      if (!headers) return reject('沒有 waterHeaders');

      // s 和 encryptFID: native bridge 加密無法在 Surge 中重現
      // 遊戲 JS 中非 app 環境的 fallback 值為 "2"
      const friendType = FRIEND_TYPE_MAP[friend.sortType] || 4;

      const body = {
        friendId: friend.id,
        friendAvatar: friend.avatarUrl || '',
        cropId: 0,
        deviceId: deviceId,
        scenarioType: 2,
        friendName: friend.name,
        s: '2',
        encryptFID: '2',
        friendType: friendType,
        shareKey: '',
      };

      $httpClient.post({
        url: 'https://games.shopee.tw/farm/api/friend/v2/help',
        headers: headers,
        body: JSON.stringify(body),
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

      // 過濾：未澆過水 且 有作物 (cropState >= 0 且 < 100)
      const waterableFriends = friends.filter(f => !f.interactData.gaveWater && f.cropState >= 0 && f.cropState < 100);
      console.log('ℹ️ 可澆水好友: ' + waterableFriends.length);

      if (waterableFriends.length === 0) {
        console.log('ℹ️ 目前沒有可澆水的好友');
        $done();
        return;
      }

      const deviceId = getDeviceId();
      const results = [];
      const errors = [];

      // DEBUG: 只嘗試第一位好友
      const targetFriends = waterableFriends.slice(0, 1);
      for (const f of targetFriends) {
        try {
          await waterFriend(f, deviceId);
          console.log('✅ 已澆水: ' + f.name + ' (id: ' + f.id + ', sortType: ' + f.sortType + ', friendType: ' + (FRIEND_TYPE_MAP[f.sortType] || 4) + ')');
          results.push(f.name);
        } catch (e) {
          console.log('❌ ' + f.name + ' (sortType: ' + f.sortType + '): ' + e);
          errors.push(f.name + '(' + e + ')');
        }
        if (targetFriends.indexOf(f) < targetFriends.length - 1) {
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
