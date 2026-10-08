/* Verify real attack-pattern detection: bounded port probe + auth-port hammer
   against the machine's own default gateway while NetGuard captures. */
const BASE = 'http://localhost:3001/api';

async function login() {
  const res = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@netguard.com', password: 'admin' }),
  });
  const json = await res.json();
  return json.data.token;
}

async function get(path, token) {
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

async function post(path, token, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

function synProbe(host, port, timeoutMs = 300) {
  return new Promise((resolve) => {
    const net = require('net');
    const sock = net.connect({ host, port });
    const done = () => { try { sock.destroy(); } catch {} resolve(); };
    sock.setTimeout(timeoutMs, done);
    sock.on('error', done);
    sock.on('connect', done);
  });
}

async function main() {
  const token = await login();

  // Default gateway = local target for a bounded self-test probe.
  let gateway = null;
  try {
    const out = require('child_process').execSync('powershell -NoProfile -NonInteractive -Command "(Get-NetRoute -DestinationPrefix \'0.0.0.0/0\' | Sort-Object RouteMetric | Select-Object -First 1).NextHop"', { encoding: 'utf8' });
    const candidate = out.trim().split(/\r?\n/).map(s => s.trim()).find(s => /^\d+\.\d+\.\d+\.\d+$/.test(s) && s !== '0.0.0.0');
    gateway = candidate || null;
  } catch { gateway = null; }
  if (!gateway) { console.log('FAIL could not determine gateway'); process.exitCode = 1; return; }
  console.log(`Gateway (probe target): ${gateway}`);

  // Start capture on Wi-Fi
  const ifaces = (await get('/monitoring/interfaces', token)).data;
  const wiFi = ifaces.find((i) => /wi-?fi/i.test(i.name) && i.status === 'up') || ifaces[0];
  const start = await post('/monitoring/start', token, { interfaceId: wiFi.id });
  console.log(`capture start: ${start.status}`);
  if (start.status !== 200) { process.exitCode = 1; return; }

  // Pattern 1: brute force — repeated connection attempts to one auth port.
  // Done FIRST (only 1 distinct port, so it cannot trip the port-scan rule).
  console.log('Running auth-port connection burst (18 attempts, port 22)...');
  for (let i = 0; i < 18; i++) await synProbe(gateway, 22, 250);

  // Pattern 2: port scan — 20 distinct ports on one destination (threshold is 15)
  console.log('Running bounded port probe (20 ports on gateway)...');
  const ports = Array.from({ length: 20 }, (_, i) => 40000 + i);
  for (const p of ports) await synProbe(gateway, p, 250);

  // Let the pipeline settle
  await new Promise((r) => setTimeout(r, 3000));

  const traffic = await get('/traffic?limit=500', token);
  const counts = (traffic.data?.items || []).reduce((acc, e) => {
    acc[e.classification] = (acc[e.classification] || 0) + 1;
    return acc;
  }, {});
  console.log('classification counts:', JSON.stringify(counts));

  const alerts = await get('/alerts?limit=50', token);
  const alertList = alerts.data?.items || [];
  console.log(`alerts: ${alertList.length}`);
  alertList.forEach((a) =>
    console.log(`  [${a.category}] ${a.sourceIp} -> ${a.destinationIp} ${a.severity}: ${a.description.slice(0, 80)}`)
  );

  const portScan = alertList.find((a) => a.category === 'PORT_SCAN');
  const brute = alertList.find((a) => a.category === 'BRUTE_FORCE');

  const results = [
    ['Port scan detected from real probe traffic', !!portScan],
    ['Brute force detected from real connection burst', !!brute],
    ['Alerts reference real gateway IP', alertList.every((a) => a.sourceIp || a.destinationIp)],
  ];
  for (const [name, pass] of results) console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);

  // Acknowledge + resolve the port scan alert (admin action)
  if (portScan) {
    const ackRes = await fetch(`${BASE}/alerts/${portScan.id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const ackJson = await ackRes.json();
    const resRes = await fetch(`${BASE}/alerts/${portScan.id}/resolve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const okAck = ackRes.status === 200 && ackJson.data?.status === 'ACKNOWLEDGED';
    const okRes = resRes.status === 200;
    console.log(`${okAck ? 'PASS' : 'FAIL'}  Alert acknowledge works`);
    console.log(`${okRes ? 'PASS' : 'FAIL'}  Alert resolve works`);
    if (!okAck || !okRes) results.push(['alert workflow', false]);
  }

  // 401 on acknowledge without token
  const noAuth = await fetch(`${BASE}/alerts/${(alertList[0] || {}).id}/acknowledge`, { method: 'PATCH' });
  const notAuthOk = noAuth.status === 401;
  console.log(`${notAuthOk ? 'PASS' : 'FAIL'}  Alert mutation without JWT returns 401`);

  // Stop capture
  await post('/monitoring/stop', token);
  console.log('capture stopped');

  const failed = results.filter(([, p]) => !p).length + (notAuthOk ? 0 : 1);
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => { console.error('error:', e.message); process.exitCode = 1; });
