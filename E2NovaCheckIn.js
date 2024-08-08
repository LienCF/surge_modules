// E2NovaCheckIn.js
const URL_LOGIN = "https://www.femascloud.com/e2nova/Accounts/login";
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
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": `e2nova=${randomString}; CakeCookie[e2novalanguage]=Q2FrZQ%3D%3D.FFwdiDU%3D; CakeCookie[5][e2novalanguage]=Q2FrZQ%3D%3D.FFwdiDU%3D; setTopMenu=menu_3; menuBlock=16; menuItem=2; lifeTimePointe2nova=${currentTimePlus30Mins}; femasUid=E20003; femasRem=1`,
        "Origin": "https://www.femascloud.com",
        "Pragma": "no-cache",
        "Referer": "https://www.femascloud.com/e2nova/accounts/login",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "sec-ch-ua": "\"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
    };
}

const LOGIN_BODY = "data%5BAccount%5D%5Busername%5D=E20003&data%5BAccount%5D%5Bpasswd%5D=mQ8DYYgybsFHaE&data%5Bremember%5D=0&data%5Bremember%5D=1";
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
    console.log('Test: 1');
    const randomString = generateRandomString();
    const currentTimePlus30Mins = getCurrentTimePlus30Mins();
    console.log(`Random String: ${randomString}, Time Plus 30 Mins: ${currentTimePlus30Mins}`);
    
    const headers = getHeaders(randomString, currentTimePlus30Mins);
    console.log(`Headers: ${JSON.stringify(headers)}`);

    $httpClient.post({url: URL_LOGIN, headers: headers, body: LOGIN_BODY, timeout: 50}, function (error, response, data) {
        if (error) {
            handleResponse(error, response, data);
        } else {
            console.log(`Response: ${JSON.stringify(response)}`);
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
    });
}

main();