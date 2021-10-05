var dns_object = {
  url: "https://ultralow.dns2.nextdns.io/56b924/DNS_Update?dns=q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQABw",
    headers: {
    "Content-Type": "application/dns-message"
    },
  body: "{}"
}
// $httpClient.get('https://ultralow.dns2.nextdns.io/56b924/DNS_Update?dns=q80BAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB', function(error, response, data){
$httpClient.get(dns_object, function(error, response, data){
    $notification.post('ControlD IP Update', data.split(';'));
    $done({});
});
