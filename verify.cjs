/* NetGuard AI — end-to-end verification script (development only). */
const BASE = 'http://localhost:3001/api';

const results = [];
function ok(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function call(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

async function main() {
  // 1. Health (public)
  const health = await call('GET', '/health');
  ok('GET /health public', health.status === 200 && health.json?.success === true);

  // 2. Protected endpoint WITHOUT token -> 401
  const noAuth = await call('GET', '/dashboard/summary');
  ok('Protected endpoint without JWT returns 401', noAuth.status === 401, `status=${noAuth.status}`);

  // 3. Invalid login -> error, no token
  const badLogin = await call('POST', '/auth/login', {
    body: { email: 'admin@netguard.com', password: 'wrong-password' },
  });
  ok('Invalid login rejected',
    badLogin.status === 401 && badLogin.json?.success === false && !badLogin.json?.data?.token,
    `status=${badLogin.status} msg=${badLogin.json?.error?.message ?? ''}`);

  const badUser = await call('POST', '/auth/login', {
    body: { email: 'nobody@x.com', password: 'x' },
  });
  ok('Unknown email rejected', badUser.status === 401 && badUser.json?.success === false);

  // 4. Valid login -> JWT
  const login = await call('POST', '/auth/login', {
    body: { email: 'admin@netguard.com', password: 'admin' },
  });
  const token = login.json?.data?.token;
  ok('Valid login returns JWT', login.status === 200 && !!token,
    `status=${login.status}`);
  if (!token) return finish();

  const exp = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).exp;
  ok('JWT has expiration (exp claim)', typeof exp === 'number' && exp > Math.floor(Date.now() / 1000),
    `exp=${exp}`);

  // 5. /auth/me with token
  const me = await call('GET', '/auth/me', { token });
  ok('GET /auth/me with JWT', me.status === 200 && me.json?.data?.user?.email === 'admin@netguard.com');

  // 6. Garbage token -> 401
  const garbage = await call('GET', '/auth/me', { token: 'not.a.valid.token' });
  ok('Invalid JWT rejected with 401', garbage.status === 401, `status=${garbage.status}`);

  // 7. Dashboard summary with JWT
  const dash = await call('GET', '/dashboard/summary', { token });
  ok('GET /dashboard/summary with JWT', dash.status === 200 && dash.json?.success === true);
  ok('Dashboard shows zeros before capture (no fake data)',
    dash.status === 200 && dash.json?.data?.totalEvents === 0 && dash.json?.data?.activeAlerts === 0,
    `totalEvents=${dash.json?.data?.totalEvents} activeAlerts=${dash.json?.data?.activeAlerts}`);

  // 8. Network interfaces
  const ifaces = await call('GET', '/monitoring/interfaces', { token });
  const ifaceList = ifaces.json?.data || [];
  ok('GET /monitoring/interfaces', ifaces.status === 200 && Array.isArray(ifaceList),
    `count=${ifaceList.length}`);
  if (ifaceList.length) {
    const wiFi = ifaceList.find(i => /wi-?fi/i.test(i.name));
    console.log('      interfaces: ' + ifaceList.map(i => `${i.name}(${i.status})`).join(', '));
    ok('Wi-Fi interface discovered', !!wiFi);
  }

  // 9. Capture status
  const cap = await call('GET', '/monitoring/status', { token });
  const capData = cap.json?.data;
  ok('GET /monitoring/status', cap.status === 200 && typeof capData?.available === 'boolean',
    `available=${capData?.available} method=${capData?.captureMethod} reason=${capData?.reason ?? 'none'}`);

  // 10. Simulation endpoint must NOT exist
  const sim = await call('POST', '/simulation/start', { token, body: {} });
  ok('Simulation endpoint removed (404)', sim.status === 404, `status=${sim.status}`);

  // 11. Start monitoring (admin)
  if (capData?.available && ifaceList.length) {
    const target =
      ifaceList.find(i => /wi-?fi/i.test(i.name) && i.status === 'up') ||
      ifaceList.find(i => i.status === 'up') ||
      ifaceList[0];

    const start = await call('POST', '/monitoring/start', { token, body: { interfaceId: target.id } });
    ok('POST /monitoring/start', start.status === 200 && start.json?.data?.running === true,
      `status=${start.status} msg=${start.json?.error?.message ?? ''} iface=${target.name}`);

    if (start.status === 200) {
      console.log('      Capturing for 10 seconds to observe real traffic...');
      await new Promise(r => setTimeout(r, 10000));

      const status2 = await call('GET', '/monitoring/status', { token });
      const s = status2.json?.data;
      ok('Capture running with real packet count', s.running === true, `packetsCaptured=${s.packetsCaptured}`);

      const traffic = await call('GET', '/traffic?limit=5', { token });
      const items = traffic.json?.data?.items || [];
      ok('Captured packets reached the detection pipeline',
        (traffic.json?.data?.total ?? 0) > 0 && items.length > 0,
        `storedEvents=${traffic.json?.data?.total}`);
      if (items.length) {
        const t = items[0];
        console.log(`      sample event: ${t.protocol} ${t.sourceIp}:${t.sourcePort} -> ${t.destinationIp}:${t.destinationPort} len=${t.packetSize} class=${t.classification}`);
        const realIps = items.every(i => i.sourceIp && i.destinationIp && i.sourceIp !== '0.0.0.0');
        ok('Events contain real IP addresses (not fabricated)', realIps);
        const timeRecent = Math.abs(Date.now() - new Date(items[0].timestamp).getTime()) < 60000;
        ok('Event timestamps are current (real capture)', timeRecent, `ts=${items[0].timestamp}`);
      }

      const dash2 = await call('GET', '/dashboard/summary', { token });
      ok('Dashboard reflects captured traffic', dash2.json?.data?.totalEvents > 0,
        `totalEvents=${dash2.json?.data?.totalEvents} monitoringMode=${dash2.json?.data?.monitoringMode}`);
      ok('monitoringMode=LIVE while capturing', dash2.json?.data?.monitoringMode === 'LIVE');

      const sys = await call('GET', '/system/status', { token });
      ok('System status shows capture Active', sys.json?.data?.components?.some(c => c.name === 'Packet Capture' && c.status === 'Active'),
        JSON.stringify(sys.json?.data?.components?.find(c => c.name === 'Packet Capture')));

      // 12. Stop monitoring
      const stop = await call('POST', '/monitoring/stop', { token });
      ok('POST /monitoring/stop', stop.status === 200 && stop.json?.data?.running === false,
        `status=${stop.status}`);
    }
  } else {
    console.log('SKIP  Start/stop capture test — capture unavailable on this machine');
    if (capData?.reason) console.log(`      reason: ${capData.reason}`);
  }

  // 13. Alerts endpoint (auth)
  const alerts = await call('GET', '/alerts', { token });
  ok('GET /alerts with JWT', alerts.status === 200);

  // 14. Models honesty
  const models = await call('GET', '/models', { token });
  const modelList = models.json?.data || [];
  const evals = await call('GET', '/models/evaluation', { token });
  const evalData = evals.json?.data;
  ok('No fabricated ML metrics (accuracy null / status Not Trained)',
    modelList.some(m => m.status === 'Not Trained') &&
      (evalData?.evaluations || []).every(e => e.metrics?.accuracy === null && e.status === 'Not Trained'),
    `overall=${evalData?.overallStatus}`);

  finish();
}

function finish() {
  const passed = results.filter(r => r.pass).length;
  console.log(`\n===== ${passed}/${results.length} checks passed =====`);
  const failed = results.filter(r => !r.pass);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach(f => console.log(`  - ${f.name} ${f.detail}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Verification script error:', err.message);
  process.exitCode = 1;
});
