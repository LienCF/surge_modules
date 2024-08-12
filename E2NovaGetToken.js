function getToken() {
    console.log('Starting getToken function');
    if ($request.method === 'POST') {
        console.log('Request method is POST');
        const headers = $request.headers;
        console.log('Request headers:', JSON.stringify(headers));
        const authorization = headers['Authorization'] || headers['authorization'];
        
        if (authorization) {
            console.log('Authorization token found:', authorization);
            $persistentStore.write(authorization, 'e2nova_token');
            console.log('Token saved to persistent store');
//            $notification.post('E2Nova Token', 'Token successfully saved', authorization);
        } else {
            console.log('Authorization header not found');
            $notification.post('E2Nova Token', 'Failed to save token', 'Authorization header not found');
        }
    } else {
        console.log('Request method is not POST:', $request.method);
        $notification.post('E2Nova Token', 'Failed to save token', 'Request method is not POST');
    }
}

console.log('Calling getToken function');
getToken();

console.log('Script execution completed');
$done({});
