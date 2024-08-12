// E2NovaCheckIn.js
const URL_CHECKIN = "https://femashr-app-api.femascloud.com/e2nova/fsapi/V3/punch_card.json";
const URL_CHECK_EVENT = "https://femashr-app-api.femascloud.com/e2nova/fsapi/V3/calendar.json";
const METHOD = "POST";

function generateRandomString() {
    const randomString = Math.random().toString(36).substring(2, 25);
    console.log(`Generated random string: ${randomString}`);
    return randomString;
}

function getHeaders(randomString) {
    const token = $persistentStore.read('e2nova_token');
    console.log(`Retrieved token from persistent store: ${token}`);
    return {
        ":authority": "femashr-app-api.femascloud.com",
        "content-type": "application/json",
        "accept": "*/*",
        "authorization": token,
        "x-client-version": "3.4.3",
        "x-client-device": "IOS",
        "content-language": "zh-tw",
        "accept-language": "zh-Hant-TW;q=1.0, en-TW;q=0.9",
        "user-agent": "FemasHR/3.4.3 (com.femascloud.femashr; build:5; iOS 17.6.0) Alamofire/5.8.0",
        "cookie": `e2nova=${randomString}`
    };
}

function getCheckBody(isCheckIn) {
    const body = JSON.stringify({
        beaconHwid: "",
        longitude: "121.56953",
        latitude: "25.08180",
        clockTime: `${(Date.now() / 1000).toFixed(6)}`,
        clockData: isCheckIn ? "9,1,S" : "9,1,E"
    });
    console.log(`${isCheckIn ? 'Check-in' : 'Check-out'} body: ${body}`);
    return body;
}

const CHECK_EVENT_BODY = '{"eventIsNotOver":true,"type":"user"}';

function getCurrentTaipeiTime() {
    const taipeiTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" });
    const taipeiDate = new Date(taipeiTime);
    console.log(`Current Taipei time: ${taipeiDate.toLocaleString("en-US", { timeZone: "Asia/Taipei" })}`);
    return taipeiDate;
}

function isExecutionTime(taipeiDate) {
    const hour = taipeiDate.getHours();
    const minute = taipeiDate.getMinutes();
    return (hour === 7) || (hour === 17);
}

function getBodyBasedOnTime(taipeiDate) {
    const hour = taipeiDate.getHours();
    if (hour === 7) {
        console.log('Time for check-in');
        return getCheckBody(true);
    } else if (hour === 17) {
        console.log('Time for check-out');
        return getCheckBody(false);
    } else {
        console.log('Not within check-in or check-out time');
        return null;
    }
}

function handleResponse(error, response, data) {
    if (error) {
        console.error(`Error in handleResponse: ${error}`);
    } else {
        console.log(`Response received: ${JSON.stringify(data)}`);
        $notification.post('E2Nova 簽到', '打卡完成', JSON.stringify(data));
    }
    $done({});
}

function checkEvent(headers) {
    return new Promise((resolve, reject) => {
        console.log('Starting event check...');
        $httpClient.post({
            url: URL_CHECK_EVENT,
            headers: headers,
            body: CHECK_EVENT_BODY,
            timeout: 50
        }, function (error, response, eventData) {
            if (error) {
                console.error(`Error checking event: ${error}`);
                reject(error);
            } else {
                console.log(`Event data received: ${eventData}`);
                const parsedEventData = JSON.parse(eventData);
                const todayDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }).split(',')[0];
                console.log(`Checking events for date: ${todayDate}`);
                const todayInfo = parsedEventData.response.datas[todayDate];

                if (todayInfo && !todayInfo.is_holiday) {
                    if (todayInfo.has_events) {
                        for (const event of todayInfo.events) {
                            const startTime = new Date(event.start_time);
                            const endTime = new Date(event.end_time);
                            const durationHours = (endTime - startTime) / (1000 * 60 * 60);
                            const isWorkFromHome = event.event && event.event.toLowerCase().includes("work from home");
                            const isBusinessLeave = event.event && event.event.toLowerCase().includes("business leave");

                            console.log(`Event: ${event.event}, Duration: ${durationHours} hours`);

                            if (isWorkFromHome || isBusinessLeave) {
                                console.log(`Found a ${isWorkFromHome ? 'Work From Home' : 'Business Leave'} event, proceeding with check-in/out`);
                                resolve(false);
                                return;
                            } else if (durationHours > 9) {
                                console.log('Found an event longer than 9 hours and not Work From Home or Business Leave, skipping check-in/out');
                                resolve(true);
                                return;
                            }
                        }
                    }
                    console.log('Not a holiday or Work From Home event, proceeding with check-in/out');
                    resolve(false);
                } else {
                    console.log('Today is a holiday or no data available, skipping check-in/out');
                    resolve(true);
                }
            }
        });
    });
}

async function main() {
    console.log('Starting main function...');
    const taipeiDate = getCurrentTaipeiTime();

    if (!isExecutionTime(taipeiDate)) {
        console.log('Not the designated execution time (7 AM or 5 PM Taipei time). Exiting.');
        $done({});
        return;
    }

    const randomString = generateRandomString();
    const headers = getHeaders(randomString);
    console.log(`Headers prepared: ${JSON.stringify(headers)}`);

    const bodyToUse = getBodyBasedOnTime(taipeiDate);

    try {
        const skip = await checkEvent(headers);
        if (skip) {
            console.log('Skipping check-in/out based on event check');
            $done({});
        } else if (bodyToUse !== null) {
            console.log('Proceeding with check-in/out');
            $httpClient.post({ url: URL_CHECKIN, headers: headers, body: bodyToUse, timeout: 50 }, handleResponse);
        } else {
            console.log('Unexpected state: bodyToUse is null at execution time');
            $done({});
        }
    } catch (error) {
        console.error(`Error in main function: ${error}`);
        $done({});
    }
}

main();
