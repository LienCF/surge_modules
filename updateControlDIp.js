$httpClient.get('https://dns.controld.com/er3xe8ecp8?dns=q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB', function(error, response, data){
    $notification.post('ControlD IP Update', data.split(';'));
    $done({});
});
