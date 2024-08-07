// E2NovaCheckIn.js
const URL_CHECKIN = "https://femashr-app-api.femascloud.com/e2nova/fsapi/V3/punch_card.json";
const URL_CHECK_EVENT = "https://femashr-app-api.femascloud.com/e2nova/fsapi/V3/calendar.json";
const METHOD = "POST";

function generateRandomString() {
    return Math.random().toString(36).substring(2, 25);
}

function getHeaders(randomString) {
    return {
        ":authority": "femashr-app-api.femascloud.com",
        "content-type": "application/json",
        "accept": "*/*",
        "authorization": $persistentStore.read('e2nova_token'),
        "x-client-version": "3.4.3",
        "x-client-device": "IOS",
        "content-language": "zh-tw",
        "accept-language": "zh-Hant-TW;q=1.0, en-TW;q=0.9",
        "user-agent": "FemasHR/3.4.3 (com.femascloud.femashr; build:5; iOS 17.6.0) Alamofire/5.8.0",
        "cookie": `e2nova=${randomString}`
    };
}

function getCheckInBody() {
    return JSON.stringify({
        beaconHwid: "",
        longitude: "121.56953",
        latitude: "25.08180",
        clockTime: `${(Date.now() / 1000).toFixed(6)}`,
        clockData: "9,1,S"
    });
}

function getCheckOutBody() {
    return JSON.stringify({
        beaconHwid: "",
        longitude: "121.56953",
        latitude: "25.08180",
        clockTime: `${(Date.now() / 1000).toFixed(6)}`,
        clockData: "9,1,E"
    });
}

const CHECK_EVENT_BODY = '{"eventIsNotOver":true,"type":"user"}';

function getCurrentTaipeiHour() {
    return new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei", hour: 'numeric', hour12: false});
}

function getBodyBasedOnTime(hour) {
    if (hour > 6 && hour < 8) {
        return getCheckInBody();
    } else if (hour > 16 && hour < 18) {
        return getCheckOutBody();
    } else {
        return null;
    }
}

function handleResponse(error, response, data) {
    if (error) {
        console.log('Error:', error);
        $done({});
    } else {
        console.log(`Response: ${JSON.stringify(data)}`);
        $notification.post('E2Nova 簽到', '打卡完成', '${JSON.stringify(data)}');
        $done({});
    }
}

function checkEvent(headers, callback) {
    $httpClient.post({
        url: URL_CHECK_EVENT,
        headers: headers,
        body: CHECK_EVENT_BODY,
        timeout: 50
    }, function(error, response, eventData) {
        if (error) {
            console.log('Error checking event:', error);
            callback(true);
        } else {
            console.log('Event data:', eventData);
            const parsedEventData = JSON.parse(eventData);
            const todayDate = new Date().toISOString().split('T')[0];
            const todayInfo = parsedEventData.response.datas[todayDate];

            if (todayInfo && !todayInfo.is_holiday) {
                if (todayInfo.has_events) {
                    let skipCheckInOut = false;
                    for (const event of todayInfo.events) {
                        const startTime = new Date(event.start_time);
                        const endTime = new Date(event.end_time);
                        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
                        const isWorkFromHome = event.event && event.event.toLowerCase().includes("work from home");
                        const isBusinessLeave = event.event && event.event.toLowerCase().includes("business leave");

                        if (isWorkFromHome || isBusinessLeave) {
                            console.log(`Found a ${isWorkFromHome ? 'Work From Home' : 'Business Leave'} event, proceeding with check-in/out`);
                            skipCheckInOut = false;
                            break;
                        } else if (durationHours > 9) {
                            console.log('Found an event longer than 9 hours and not Work From Home or Business Leave, skipping check-in/out');
                            skipCheckInOut = true;
                            break;
                        }
                    }

                    if (skipCheckInOut) {
                        callback(true);
                        return;
                    }
                }
                console.log('Not a holiday or Work From Home event, proceeding with check-in/out');
                callback(false);
            } else {
                console.log('Today is a holiday or no data available, skipping check-in/out');
                callback(true);
            }
        }
    });
}

function main() {
    const randomString = generateRandomString();
    console.log(`Random String: ${randomString}`);
    
    const headers = getHeaders(randomString);
    console.log(`Headers: ${JSON.stringify(headers)}`);

    const taipeiHour = getCurrentTaipeiHour();
    console.log(`Current Taipei hour: ${taipeiHour}`);
    
    const bodyToUse = getBodyBasedOnTime(taipeiHour);

    checkEvent(headers, function(skip) {
        if (skip) {
            $done({});
        } else {
            if (bodyToUse !== null) {
                $httpClient.post({url: URL_CHECKIN, headers: headers, body: bodyToUse, timeout: 50}, handleResponse);
            } else {
                console.log('Not in the check-in/out time, skipping check-in/out');
                $done({});
            }
        }
    });
}

main();
