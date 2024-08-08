function getToken() {
    if ($request.method === 'POST') {
        const headers = $request.headers;
        const authorization = headers['Authorization'] || headers['authorization'];
        
        if (authorization) {
            $persistentStore.write(authorization, 'e2nova_token');
            $notification.post('E2Nova Token', 'Token successfully saved', authorization);
        } else {
            $notification.post('E2Nova Token', 'Failed to save token', 'Authorization header not found');
        }
    } else {
        $notification.post('E2Nova Token', 'Failed to save token', 'Request method is not POST');
    }
}

getToken();

$done({});
