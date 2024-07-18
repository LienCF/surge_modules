const $ = new Env('BaoLiao Treasure Box');

// Helper function for HTTP requests
const request = (method, url, headers, body) => {
  return new Promise((resolve, reject) => {
    const cacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };
    headers = { ...headers, ...cacheHeaders };

    $httpClient[method.toLowerCase()]({ url, headers, body }, (error, response, data) => {
      error ? reject(error) : resolve(data);
    });
  });
};

// Step 1: Get the token
async function getToken() {
  const url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyDoKoPqooppAyMIMbXDrLGrY7RoDu8W3nI';
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-Version': 'iOS/FirebaseSDK/10.22.0/FirebaseCore-iOS',
    'X-Firebase-AppCheck': 'eyJraWQiOiJNbjVDS1EiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxOjkzODI1MDc2NTIzMjppb3M6NTA3NTFhZjIzYzcwMTZiZSIsImF1ZCI6WyJwcm9qZWN0c1wvOTM4MjUwNzY1MjMyIiwicHJvamVjdHNcL2JjM3RzLWNlNGRkIl0sInByb3ZpZGVyIjoiZGV2aWNlX2NoZWNrX2FwcF9hdHRlc3QiLCJpc3MiOiJodHRwczpcL1wvZmlyZWJhc2VhcHBjaGVjay5nb29nbGVhcGlzLmNvbVwvOTM4MjUwNzY1MjMyIiwiZXhwIjoxNzIwNTg5MzU0LCJpYXQiOjE3MjA1ODU3NTQsImp0aSI6IkF6ZHFoZEJLVHhBT0s2MFNsTHVnVE1acUV4a1BOSDd2VFlYRlBBbjlEdW8ifQ.K_Hsp8X6cVD4j-0HQTPxF2_hCcHTNejejzaQ86zZgotLmmKgc31-SKlMI7iPdNfGwciqNKLzEGL5w_taek8mGIrE5bSEDE7tLtWU2sMFUy0USharjl0jkrDJl5RamThMoUgaJHDlxEUcw176LAOSOE4kukoFgjTA2T2vygRNmG1blQvG7NXPCcp1Cmb6_p11cWb8nV2rtSI9gZ9nCaCD9-YXaX4aiM06fvjPuv6HPPvRiRH9zXxL0BNfmJ-a4FhoiUD3s4hKpW68HnpClFNaaRLRYyatRGmkxkFQg1JE4oMRdCnbXyu_wYr-FD4JKuB1btBVUI0xwpvRxHKOl1ubDA6BYQ_ADJ4Owye6qcNEShGa-W2acUL5zdHczeJTmVCoIoXL9-UVB9qmgby_sVK1Amd2y9t8UBC6C5BQhYxnUFV5DcEWAMVMyKGbzSxMArPKnORrXNz0HY3XZqVilGUy_XSSGyj-CsNPmDDUd8ZWFqMQMSmw2uxT5eYo2XgFZ2QE',
    'X-iOS-Bundle-Identifier': 'com.bc3ts.baoliao',
    'User-Agent': 'FirebaseAuth.iOS/10.22.0 com.bc3ts.baoliao/9.6.1 iPhone/17.5.1 hw/iPhone16_2',
    'X-Firebase-GMPID': '1:938250765232:ios:50751af23c7016be'
  };
  const body = JSON.stringify({
    "email": "liencf@gmail.com",
    "password": "daKgx%!TS8Fe",
    "clientType": "CLIENT_TYPE_IOS",
    "returnSecureToken": true
  });

  const data = await request('POST', url, headers, body);
  return JSON.parse(data).idToken;
}

// Step 2: Get treasure box status
async function getTreasureStatus(token) {
  const url = 'https://app.bc3ts.net/treasure/status';
  const headers = {
    'apikey': '3fvij@w.go+/Hd!wl21f923-$^fGv%mk=',
    'app_version': '9.6.1',
    'version': '2.0.0',
    'token': token
  };

  const data = await request('GET', url, headers);
  return JSON.parse(data).data;
}

// Step 3: Open treasure box
async function openTreasureBox(token) {
  const url = 'https://app.bc3ts.net/treasure/open';
  const headers = {
    'apikey': '3fvij@w.go+/Hd!wl21f923-$^fGv%mk=',
    'app_version': '9.6.1',
    'version': '2.0.0',
    'token': token
  };

  const data = await request('POST', url, headers);
  return JSON.parse(data);
}

// Step 4: Get post list
async function getPostList(token) {
  const url = 'https://app.bc3ts.net/post/list/v2?group_id=2&limits=20&sort_type=1';
  const headers = {
    'authority': 'app.bc3ts.net',
    'apikey': '3fvij@w.go+/Hd!wl21f923-$^fGv%mk=',
    'app_version': '9.6.1',
    'accept': '*/*',
    'if-none-match': 'W/"ca5d-8c4LZ9tzTDwZB0Coyw8nad760dM"',
    'version': '2.0.0',
    'user-agent': 'BaoLiao/9.6.1 (com.bc3ts.baoliao; build:20240618002; iOS 17.5.1) Alamofire/5.2.2',
    'accept-language': 'zh-Hant-TW;q=1.0, en-TW;q=0.9',
    'token': token
  };

  const data = await request('GET', url, headers);
  return JSON.parse(data).data;
}

// Step 5: Like a post
async function likePost(token, postId) {
  const url = 'https://app.bc3ts.net/post/like';
  const headers = {
    'apikey': '3fvij@w.go+/Hd!wl21f923-$^fGv%mk=',
    'app_version': '9.6.1',
    'version': '2.0.0',
    'token': token,
    'Content-Type': 'application/json'
  };
  const body = JSON.stringify({ post_id: postId });

  const data = await request('PUT', url, headers, body);
  return JSON.parse(data);
}

// Step 6: Process posts
async function processPosts(token) {
  const posts = await getPostList(token);
  const likePromises = posts
    .filter(post => post.like === 0)
    .map(post => likePost(token, post.id)
      .then(result => $.log(`Liked post ${post.id}. Result: ${JSON.stringify(result)}`))
      .catch(error => $.log(`Error liking post ${post.id}: ${error.message}`))
    );
  await Promise.all(likePromises);
}

// Step 7: Get daily mission list
async function getDailyMissionList(token) {
  const url = 'https://app.bc3ts.net/mission/list';
  const headers = {
    'authority': 'app.bc3ts.net',
    'apikey': '3fvij@w.go+/Hd!wl21f923-$^fGv%mk=',
    'app_version': '9.6.1',
    'accept': '*/*',
    'user-agent': 'BaoLiao/9.6.1 (com.bc3ts.baoliao; build:20240618002; iOS 17.5.1) Alamofire/5.2.2',
    'accept-language': 'zh-Hant-TW;q=1.0, en-TW;q=0.9',
    'token': token
  };

  const data = await request('GET', url, headers);
  return JSON.parse(data).data;
}

// Function to process missions
async function processMissions(token, missions) {
  const today = new Date().toDateString();
  const now = new Date();
  const taipeiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const hour = taipeiTime.getHours();

  const missionPromises = missions.map(async mission => {
    const missionKey = `baoliao_mission_${mission.id}_lastReceived`;
    const lastReceived = $persistentStore.read(missionKey);
    $.log(`Mission ${mission.id} last received: ${lastReceived}`);

    if (mission.done === mission.goals && lastReceived !== today) {
      let result;
      switch (mission.id) {
        case 3: // "按爆" mission
        case 4: // "開寶箱" mission
          if (hour < 7) {
            $.log(`Skipping "開寶箱" mission as it's before 7 AM in Taipei.`);
            break;
          }
        case 8: // "單篇文累積爆" mission
          result = await receiveMissionItem(token, mission.id);
          $.log(`Received mission item for mission ID ${mission.id}. Result: ${JSON.stringify(result)}`);
          if (result.code === 200) {
            $persistentStore.write(today, missionKey);
          }
          break;
        default:
          $.log(`No specific action defined for mission ID ${mission.id}`);
      }
    } else if (mission.done !== mission.goals) {
      $.log(`Mission "${mission.id} ${mission.name}" is not completed. Progress: ${mission.done}/${mission.goals}`);
    } else {
      $.log(`Mission item for mission ID ${mission.id} already received today.`);
    }
  });

  await Promise.all(missionPromises);
}

// Function to receive mission item
async function receiveMissionItem(token, missionId) {
  const url = 'https://app.bc3ts.net/mission/receive';
  const headers = {
    'authority': 'app.bc3ts.net',
    'content-type': 'application/json',
    'accept': '*/*',
    'version': '2.0.0',
    'app_version': '9.6.1',
    'accept-language': 'zh-Hant-TW;q=1.0, en-TW;q=0.9',
    'token': token,
    'apikey': '3fvij@w.go+/Hd!wl21f923-$^fGv%mk=',
    'user-agent': 'BaoLiao/9.6.1 (com.bc3ts.baoliao; build:20240618002; iOS 17.5.1) Alamofire/5.2.2'
  };
  const body = JSON.stringify({ mission_id: missionId });

  const data = await request('PUT', url, headers, body);
  return JSON.parse(data);
}

// Main function
async function main() {
  try {
    const token = await getToken();
    const status = await getTreasureStatus(token);

    if (status.remain_count > 0 && status.remain_time === 0) {
      const result = await openTreasureBox(token);
      $.log(`Treasure box opened successfully. Result: ${JSON.stringify(result)}`);
    } else {
      $.log(`Cannot open treasure box. Remaining count: ${status.remain_count}, Remaining time: ${status.remain_time}`);
    }

    await processPosts(token);

    const missionList = await getDailyMissionList(token);
    if (missionList && missionList.missions) {
      await processMissions(token, missionList.missions);
    }

    const now = new Date();
    const taipeiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const hour = taipeiTime.getHours();
    const lastPostDate = $persistentStore.read('baoliao_lastPostDate');
    const today = taipeiTime.toDateString();

    if (hour >= 6 && lastPostDate !== today) {
      await createDailyPost(token);
      $persistentStore.write(today, 'baoliao_lastPostDate');
    }
  } catch (error) {
    $.log(`Error occurred: ${error.message}`);
  } finally {
    $done();
  }
}

// Function to create a daily post
async function createDailyPost(token) {
  const url = 'https://app.bc3ts.net/post/add';
  const headers = {
    'authority': 'app.bc3ts.net',
    'content-type': 'application/json',
    'accept': '*/*',
    'version': '2.0.0',
    'app_version': '9.6.1',
    'accept-language': 'zh-Hant-TW;q=1.0, en-TW;q=0.9',
    'token': token,
    'apikey': '3fvij@w.go+/Hd!wl21f923-$^fGv%mk=',
    'user-agent': 'BaoLiao/9.6.1 (com.bc3ts.baoliao; build:20240618002; iOS 17.5.1) Alamofire/5.2.2'
  };
  const body = JSON.stringify({
    "who_can_read": 0,
    "comment_can_use_anonymous": 1,
    "title": "任務",
    "content": "大家早安，大家好",
    "group_id": 2,
    "media": [],
    "private_latitude": 24.983917236328125,
    "private_longitude": 121.56441571201455,
    "is_anonymous": false
  });

  try {
    const data = await request('POST', url, headers, body);
    $.log(`Daily post created successfully. Response: ${data}`);
  } catch (error) {
    $.log(`Error creating daily post: ${error.message}`);
  }
}

// Run the script
main();

// Env function (simplified version)
function Env(t) {
  this.name = t;
  this.log = (t) => console.log(`[${this.name}] ${t}`);
}