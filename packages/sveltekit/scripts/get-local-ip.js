#!/usr/bin/env node
/**
 * 获取本地 IP 地址
 * 用于跨设备访问开发服务器
 */

import { networkInterfaces } from 'os';

function getLocalIP() {
  const interfaces = networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // 跳过内部（即 127.0.0.1）和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address,
        });
      }
    }
  }

  return addresses;
}

const ips = getLocalIP();
if (ips.length > 0) {
  console.log('\n📱 本地网络访问地址：');
  ips.forEach(({ name, address }) => {
    console.log(`   ${name}: http://${address}:5173`);
  });
  console.log('');
} else {
  console.log('\n⚠️  未找到本地网络接口\n');
}





