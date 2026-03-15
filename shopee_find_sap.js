// 搜尋 sap_rules 並記錄所有 CCMS node keys
(function() {
  const body = $response.body;
  if (!body || body.length < 10) { $done({}); return; }

  if (body.includes('sap_rules') || body.includes('network_interceptor')) {
    console.log('🎯 FOUND sap_rules!');
    console.log('🎯 Body: ' + body.substring(0, 5000));
    $persistentStore.write(body.substring(0, 50000), 'ShopeeSapRulesFound');
    $notification.post('🎯 SAP Rules 找到了！', '', body.substring(0, 200));
  }

  // 記錄所有 CCMS module 和 node_key
  try {
    const obj = JSON.parse(body);
    if (obj.data && obj.data.diff && obj.data.diff.modify) {
      const modules = obj.data.diff.modify;
      let allKeys = [];
      for (const mod of modules) {
        const nodeKeys = (mod.nodes && mod.nodes.mod || []).map(n => n.node_key);
        console.log('ℹ️ [CCMS] module: ' + mod.module_key + ' (' + nodeKeys.length + ' nodes): ' + nodeKeys.join(', '));
        allKeys = allKeys.concat(nodeKeys);
      }
      // 搜尋所有 node key 和 value 中是否有 sap 相關
      for (const mod of modules) {
        for (const node of (mod.nodes && mod.nodes.mod || [])) {
          const v = node.node_value || '';
          if (v.includes('sap') || v.includes('interceptor') || v.includes('header') || node.node_key.includes('sap') || node.node_key.includes('interceptor')) {
            console.log('🎯 POSSIBLE: ' + mod.module_key + '.' + node.node_key + ' = ' + v.substring(0, 500));
            $notification.post('🎯 Possible SAP', mod.module_key + '.' + node.node_key, v.substring(0, 200));
          }
        }
      }
    }
  } catch (e) {}
  $done({});
})();
