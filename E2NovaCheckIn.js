// E2NovaCheckIn.js
const URL_CHECKIN = "https://www.femascloud.com/e2nova/users/clock_listing";
const URL_CHECK_EVENT = "https://femashr-app-api.femascloud.com/e2nova/fsapi/V3/calendar.json";
const METHOD = "POST";

function generateRandomString() {
    return Math.random().toString(36).substring(2, 15);
}

function getCurrentTimePlus30Mins() {
    return Math.floor(Date.now() / 1000) + (30 * 60);
}

function getHeaders(randomString, currentTimePlus30Mins) {
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

const CHECKIN_BODY = "_method=POST&data%5BClockRecord%5D%5Buser_id%5D=4&data%5BAttRecord%5D%5Buser_id%5D=4&data%5BClockRecord%5D%5Bshift_id%5D=9&data%5BClockRecord%5D%5Bperiod%5D=1&data%5BClockRecord%5D%5Bclock_type%5D=S&data%5BClockRecord%5D%5Blatitude%5D=&data%5BClockRecord%5D%5Blongitude%5D=";
const CHECKOUT_BODY = "_method=POST&data%5BClockRecord%5D%5Buser_id%5D=4&data%5BAttRecord%5D%5Buser_id%5D=4&data%5BClockRecord%5D%5Bshift_id%5D=9&data%5BClockRecord%5D%5Bperiod%5D=1&data%5BClockRecord%5D%5Bclock_type%5D=E&data%5BClockRecord%5D%5Blatitude%5D=&data%5BClockRecord%5D%5Blongitude%5D=";
const CHECK_EVENT_BODY = '{"eventIsNotOver":true,"type":"user"}';

function getCurrentTaipeiHour() {
    return new Date().toLocaleString("en-US", {timeZone: "Asia/Taipei", hour: 'numeric', hour12: false});
}

function getBodyBasedOnTime(hour) {
    if (hour > 7 && hour < 8) {
        return CHECKIN_BODY;
    } else if (hour > 17 && hour < 18) {
        return CHECKOUT_BODY;
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
    const currentTimePlus30Mins = getCurrentTimePlus30Mins();
    console.log(`Random String: ${randomString}, Time Plus 30 Mins: ${currentTimePlus30Mins}`);
    
    const headers = getHeaders(randomString, currentTimePlus30Mins);
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