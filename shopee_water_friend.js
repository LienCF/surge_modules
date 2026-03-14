(function() {
  const VERSION = 'v20260316.1';

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
    const h = { ...shopeeFarmInfo.waterHeaders };
    delete h['Content-Type'];
    return h;
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

      const url = `https://games.shopee.tw/farm/api/friend/v2/list?source=&offset=&need_recommend=true&device_id=${deviceId}&is_ban_contact=false`;
      const request = { url: url, headers: headers };

      $httpClient.get(request, function(error, response, data) {
        if (error) {
          return reject('連線錯誤: ' + error);
        }
        if (response.status !== 200) {
          return reject('HTTP ' + response.status);
        }
        try {
          const obj = JSON.parse(data);
          if (obj.code !== 0) {
            return reject('API 錯誤: code=' + obj.code + ', msg=' + obj.msg);
          }
          return resolve(obj.data);
        } catch (e) {
          return reject('JSON 解析失敗: ' + e);
        }
      });
    });
  }

  (async () => {
    console.log('ℹ️ 蝦蝦果園好友澆水 ' + VERSION);
    try {
      const data = await getFriendList();

      // 先印出完整結構以了解 response 格式
      console.log('ℹ️ 好友列表回應: ' + JSON.stringify(data, null, 2));

      const friends = data.friends || data.list || data.friend_list || [];
      console.log('ℹ️ 好友數量: ' + friends.length);

      // 列出每位好友的澆水狀態
      const waterableFriends = [];
      for (const f of friends) {
        const name = f.username || f.nick_name || f.nickname || f.user_id || 'unknown';
        const canWater = f.can_water !== undefined ? f.can_water : (f.water_status !== undefined ? f.water_status === 0 : null);
        console.log('  - ' + name + ' (id: ' + (f.user_id || f.userid) + ') can_water: ' + canWater);
        if (canWater === true || canWater === 1) {
          waterableFriends.push(f);
        }
      }

      console.log('ℹ️ 可澆水好友: ' + waterableFriends.length + '/' + friends.length);

      if (waterableFriends.length > 0) {
        const names = waterableFriends.map(f => f.username || f.nick_name || f.nickname || f.user_id).join(', ');
        surgeNotify('可澆水好友: ' + waterableFriends.length + ' 位', names);
      } else {
        console.log('ℹ️ 目前沒有可澆水的好友');
      }

      // TODO: 之後加入自動澆水功能

    } catch (error) {
      console.log('❌ ' + error);
      surgeNotify('失敗', String(error));
    }
    $done();
  })();
})();
