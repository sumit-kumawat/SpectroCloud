// RUN THIS FILE WITH: node server.js

import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = 3001;
const SPECTRO_API_KEY = "";
const API_BASE = "https://api.spectrocloud.com/v1";

const server = http.createServer((clientReq, clientRes) => {
  const origin = clientReq.headers.origin;
  
  // DYNAMIC CORS ALLOWANCE
  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, ApiKey, Authorization, Accept, X-Requested-With',
    'Access-Control-Allow-Private-Network': 'true',
    'Access-Control-Max-Age': '86400'
  };

  if (clientReq.method === 'OPTIONS') {
    clientRes.writeHead(204, headers);
    clientRes.end();
    return;
  }

  const protocol = 'http';
  const host = clientReq.headers.host || 'localhost';
  const reqUrl = new URL(clientReq.url, `${protocol}://${host}`);

  if (reqUrl.pathname === '/') {
    clientRes.writeHead(200, headers);
    clientRes.end('Spectro Proxy Active');
    return;
  }

  let upstreamPath = '';
  if (reqUrl.pathname === '/spectro/users') {
    upstreamPath = '/users';
  } else if (reqUrl.pathname === '/spectro/roles') {
    upstreamPath = '/roles';
  } else if (reqUrl.pathname === '/spectro/teams') {
    upstreamPath = '/teams/summary';
  }

  if (upstreamPath) {
    const targetUrl = new URL(API_BASE + upstreamPath);
    
    // Forward params
    reqUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    const options = {
      hostname: targetUrl.hostname,
      port: 443,
      path: targetUrl.pathname + targetUrl.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'ApiKey': SPECTRO_API_KEY,
        'User-Agent': 'SpectroBackend/1.0'
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      const responseHeaders = { ...headers, ...proxyRes.headers };
      // Strip upstream CORS to prevent duplicates
      delete responseHeaders['access-control-allow-origin'];
      delete responseHeaders['access-control-allow-methods'];
      
      clientRes.writeHead(proxyRes.statusCode || 500, responseHeaders);
      proxyRes.pipe(clientRes);
    });

    proxyReq.on('error', (e) => {
      console.error(`Upstream Error: ${e.message}`);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, headers);
        clientRes.end(JSON.stringify({ error: 'Backend Connection Failed', details: e.message }));
      }
    });

    proxyReq.end();
    return;
  }

  clientRes.writeHead(404, headers);
  clientRes.end('Endpoint Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
