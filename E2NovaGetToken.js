function getToken() {
    console.log('Starting getToken function');
    if ($request.method !== 'POST') {
        console.log(`Request method is not POST: ${$request.method}`);
        $notification.post('E2Nova Token', 'Failed to save token', 'Request method is not POST');
        return;
    }

    const headers = $request.headers;
    const authorization = headers['Authorization'] || headers['authorization'];

    if (!authorization) {
        console.log('Authorization header not found');
        $notification.post('E2Nova Token', 'Failed to save token', 'Authorization header not found');
        return;
    }

    console.log(`Authorization token found: ${authorization}`);
    $persistentStore.write(authorization, 'e2nova_token');
    console.log(`Token saved to persistent store: ${authorization}`);
    // $notification.post('E2Nova Token', 'Token successfully saved', authorization);
}

getToken();
$done({});
