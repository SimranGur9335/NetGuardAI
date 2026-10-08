import { spawn, exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { NetworkInterface, CapturedPacket, CaptureStatus } from './CaptureTypes';
import { Protocol } from '../../models';
import { logger } from '../../utils/logger';

const execAsync = promisify(exec);

const TSHARK_FIELDS = [
  'frame.time_epoch',
  'ip.src',
  'ip.dst',
  'ipv6.src',
  'ipv6.dst',
  'tcp.srcport',
  'tcp.dstport',
  'udp.srcport',
  'udp.dstport',
  '_ws.col.Protocol',
  'frame.len',
  'tcp.flags.syn',
  'tcp.flags.ack',
  'tcp.flags.reset',
  'tcp.flags.fin',
  'ip.proto',
];

const NPCAP_PATHS = [
  'C:\\Windows\\System32\\Npcap\\wpcap.dll',
  'C:\\Windows\\System32\\wpcap.dll',
  'C:\\Windows\\SysWOW64\\wpcap.dll',
];

const TSHARK_CANDIDATES = [
  'C:\\Program Files\\Wireshark\\tshark.exe',
  'C:\\Program Files (x86)\\Wireshark\\tshark.exe',
];

/**
 * PacketCaptureService
 *
 * REAL packet capture on Windows using tshark (Wireshark CLI) over Npcap.
 *
 * - Capability detection: Npcap driver DLLs + tshark executable.
 * - Interface discovery: `tshark -D` (Npcap devices) enriched with
 *   Get-NetAdapter (link status, IPv4, MAC).
 * - Start/stop: spawns a real tshark capture process and parses its
 *   line-oriented field output into CapturedPacket records.
 *
 * NO simulation fallback. If capture cannot start, start() throws with the
 * exact error and the service reports "Packet Capture: Unavailable".
 */
export class PacketCaptureService {
  private running = false;
  private selectedInterfaceId: string | null = null;
  private selectedInterfaceName: string | null = null;
  private packetsCaptured = 0;
  private startedAt: string | null = null;
  private captureMethod = 'none';
  private captureAvailable = false;
  private captureReason: string | null = null;
  private captureProcess: ChildProcess | null = null;
  private stderrTail = '';
  private lineBuffer = '';
  private packetListeners: Array<(packet: CapturedPacket) => void> = [];

  private tsharkPath: string | null = null;

  constructor() {
    this.detectCaptureCapability();
  }

  // ------------------------------------------------------------------
  // Capability detection
  // ------------------------------------------------------------------

  private detectCaptureCapability(): void {
    const npcapFound = NPCAP_PATHS.some((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });

    this.tsharkPath = this.resolveTshark();

    if (this.tsharkPath && npcapFound) {
      this.captureAvailable = true;
      this.captureMethod = 'tshark+npcap';
      this.captureReason = null;
      logger.info('Packet capture capability detected', { method: this.captureMethod });
      return;
    }

    this.captureAvailable = false;
    this.captureMethod = 'none';

    const missing: string[] = [];
    if (!npcapFound) {
      missing.push(
        'Npcap driver is not installed (wpcap.dll not found in C:\\Windows\\System32). ' +
          'Install it from https://npcap.com/ (enable "Install Npcap in WinPcap API-compatible Mode").'
      );
    }
    if (!this.tsharkPath) {
      missing.push(
        'tshark executable not found. Install Wireshark (includes tshark) from https://www.wireshark.org/ ' +
          'or ensure tshark is on the PATH.'
      );
    }
    this.captureReason = `Packet Capture: Unavailable — ${missing.join(' ')}`;
    logger.warn('Packet capture unavailable', {
      npcap: npcapFound,
      tshark: !!this.tsharkPath,
    });
  }

  private resolveTshark(): string | null {
    // 1. PATH
    try {
      const cmd = process.platform === 'win32' ? 'where tshark' : 'which tshark';
      const out = require('child_process').execSync(cmd, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const first = out.split(/\r?\n/)[0]?.trim();
      if (first && fs.existsSync(first)) return first;
    } catch {
      // not on PATH
    }

    // 2. Standard install locations
    for (const candidate of TSHARK_CANDIDATES) {
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch {
        // ignore
      }
    }
    return null;
  }

  // ------------------------------------------------------------------
  // Interface discovery
  // ------------------------------------------------------------------

  async getInterfaces(): Promise<NetworkInterface[]> {
    if (!this.tsharkPath) return [];

    let raw: string;
    try {
      const { stdout } = await execAsync(`"${this.tsharkPath}" -D`, {
        timeout: 15000,
        windowsHide: true,
      });
      raw = stdout;
    } catch (error) {
      logger.error('Failed to enumerate capture interfaces', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }

    // Enrich with adapter link status / IPv4 / MAC (best effort).
    const adapterInfo = await this.getAdapterInfo();

    const interfaces: NetworkInterface[] = [];
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*\d+\.\s+(\S+)\s*(?:\((.*)\))?\s*$/);
      if (!match) continue;

      const device = match[1];
      const friendly = match[2]?.trim() || device;
      const info = adapterInfo.get(friendly.toLowerCase());

      interfaces.push({
        id: device,
        name: friendly,
        description: device,
        ipv4: info?.ipv4 ?? null,
        ipv6: null,
        mac: info?.mac ?? null,
        status: info ? (info.status === 'Up' ? 'up' : 'down') : 'up',
      });
    }
    return interfaces;
  }

  private async getAdapterInfo(): Promise<
    Map<string, { status: string; mac: string | null; ipv4: string | null }>
  > {
    const map = new Map<string, { status: string; mac: string | null; ipv4: string | null }>();
    try {
      const ps = [
        "$ErrorActionPreference='SilentlyContinue'",
        "$a=Get-NetAdapter | Select-Object Name,Status,MacAddress | ConvertTo-Json -Compress",
        "$i=Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {$_.IPAddress -notlike '169.254*'} | Select-Object InterfaceAlias,IPAddress | ConvertTo-Json -Compress",
        "Write-Output ('['+$a+','+$i+']')",
      ].join(';');
      const { stdout } = await execAsync(
        `powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`,
        { timeout: 15000, windowsHide: true }
      );
      const parsed = JSON.parse(stdout.trim()) as unknown[];
      const [adaptersRaw, ipsRaw] = parsed as [unknown, unknown];
      const adapters = (Array.isArray(adaptersRaw) ? adaptersRaw : adaptersRaw ? [adaptersRaw] : []) as Array<{
        Name: string;
        Status: string;
        MacAddress: string;
      }>;
      const ips = (Array.isArray(ipsRaw) ? ipsRaw : ipsRaw ? [ipsRaw] : []) as Array<{
        InterfaceAlias: string;
        IPAddress: string;
      }>;

      for (const a of adapters) {
        const ipv4 = ips.find((x) => x.InterfaceAlias === a.Name)?.IPAddress ?? null;
        map.set(a.Name.toLowerCase(), { status: a.Status, mac: a.MacAddress ?? null, ipv4 });
      }
    } catch {
      // Enrichment is optional — interface list still valid without it.
    }
    return map;
  }

  // ------------------------------------------------------------------
  // Packet listeners (wired into the detection pipeline by the container)
  // ------------------------------------------------------------------

  onPacket(listener: (packet: CapturedPacket) => void): void {
    this.packetListeners.push(listener);
  }

  // ------------------------------------------------------------------
  // Start / stop
  // ------------------------------------------------------------------

  async start(interfaceId: string): Promise<void> {
    if (!this.captureAvailable || !this.tsharkPath) {
      throw new Error(this.captureReason || 'Packet Capture: Unavailable');
    }
    if (this.running) {
      throw new Error('Packet capture is already running');
    }

    const interfaces = await this.getInterfaces();
    const selected = interfaces.find((i) => i.id === interfaceId);
    if (!selected) {
      throw new Error(`Network interface not found: ${interfaceId}`);
    }

    const args = [
      '-i', interfaceId,
      '-l',           // line-buffered stdout
      '-n',           // no name resolution
      '-T', 'fields',
      '-E', 'separator=/t',
      '-E', 'quote=n',
      '-E', 'occurrence=f',
    ];
    for (const f of TSHARK_FIELDS) args.push('-e', f);

    this.stderrTail = '';
    this.lineBuffer = '';
    this.packetsCaptured = 0;

    const child = spawn(this.tsharkPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.captureProcess = child;

    child.stdout?.setEncoding('utf-8');
    child.stdout?.on('data', (chunk: string) => this.handleStdout(chunk));

    child.stderr?.setEncoding('utf-8');
    child.stderr?.on('data', (chunk: string) => {
      this.stderrTail = (this.stderrTail + chunk).slice(-2000);
    });

    child.on('error', (err) => {
      logger.error('Capture process error', { error: err.message });
      this.running = false;
      this.captureReason = `Packet Capture failed to start: ${err.message}`;
    });

    child.on('exit', (code, signal) => {
      const wasRunning = this.running;
      this.running = false;
      this.captureProcess = null;
      if (wasRunning) {
        const detail = this.stderrTail.trim().split(/\r?\n/).slice(-3).join(' ');
        logger.warn('Capture process exited', { code, signal, detail });
        if (code !== 0 && code !== null) {
          this.captureReason = `Packet capture process exited (code ${code}): ${detail}`;
        }
      }
    });

    // Confirm the capture actually started: resolve on first packet data,
    // fail fast if tshark exits with an error (e.g. interface gone / no permission).
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        child.stdout?.off('data', onData);
        fn();
      };
      const timeout = setTimeout(() => finish(resolve), 2000);
      const onData = () => finish(resolve);
      child.stdout?.once('data', onData);
      child.once('exit', (code) => {
        finish(() =>
          reject(
            new Error(
              this.stderrTail.trim().split(/\r?\n/).slice(-3).join(' ') ||
                `tshark exited with code ${code} before capture started`
            )
          )
        );
      });
      child.once('error', (err) => finish(() => reject(err)));
    }).catch((err) => {
      this.captureProcess = null;
      this.running = false;
      throw err;
    });

    this.running = true;
    this.selectedInterfaceId = interfaceId;
    this.selectedInterfaceName = selected.name;
    this.startedAt = new Date().toISOString();

    logger.info('Packet capture started', {
      interface: selected.name,
      method: this.captureMethod,
    });
  }

  async stop(): Promise<void> {
    if (!this.captureProcess) {
      this.running = false;
      this.selectedInterfaceId = null;
      this.selectedInterfaceName = null;
      this.startedAt = null;
      return;
    }

    const child = this.captureProcess;
    this.running = false;

    // Kill the whole tree — tshark spawns dumpcap.exe underneath.
    await new Promise<void>((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
      killer.on('error', () => {
        try {
          child.kill();
        } catch {
          // already gone
        }
      });
      killer.on('exit', () => resolve());
      setTimeout(resolve, 3000);
    });

    this.captureProcess = null;
    this.selectedInterfaceId = null;
    this.selectedInterfaceName = null;
    this.startedAt = null;
    this.lineBuffer = '';
    logger.info('Packet capture stopped');
  }

  // ------------------------------------------------------------------
  // Status
  // ------------------------------------------------------------------

  async getStatus(): Promise<CaptureStatus> {
    return {
      running: this.running,
      interfaceId: this.selectedInterfaceId,
      interfaceName: this.selectedInterfaceName,
      packetsCaptured: this.packetsCaptured,
      startedAt: this.startedAt,
      captureMethod: this.captureMethod,
      available: this.captureAvailable,
      reason: this.captureAvailable ? this.captureReason : this.captureReason,
    };
  }

  isAvailable(): boolean {
    return this.captureAvailable;
  }

  getReason(): string | null {
    return this.captureReason;
  }

  // ------------------------------------------------------------------
  // Parsing: tshark field lines -> CapturedPacket
  // ------------------------------------------------------------------

  private handleStdout(chunk: string): void {
    this.lineBuffer += chunk;
    let idx: number;
    while ((idx = this.lineBuffer.indexOf('\n')) >= 0) {
      const line = this.lineBuffer.slice(0, idx).trim();
      this.lineBuffer = this.lineBuffer.slice(idx + 1);
      if (!line) continue;
      try {
        const packet = this.parseLine(line);
        if (packet) {
          this.packetsCaptured++;
          for (const listener of this.packetListeners) {
            try {
              listener(packet);
            } catch (err) {
              logger.error('Packet listener error', {
                error: err instanceof Error ? err.message : 'Unknown error',
              });
            }
          }
        }
      } catch (err) {
        // Never crash the capture loop on a malformed line.
        logger.debug?.('Skipped unparseable capture line');
      }
    }
  }

  private parseLine(line: string): CapturedPacket | null {
    const cols = line.split('\t');
    const [
      timeEpoch, ipSrc, ipDst, ipv6Src, ipv6Dst,
      tcpSport, tcpDport, udpSport, udpDport,
      displayProtocol, frameLen,
      tcpSyn, tcpAck, tcpRst, tcpFin,
      ipProto,
    ] = cols;

    const sourceIp = ipSrc || ipv6Src || null;
    const destinationIp = ipDst || ipv6Dst || null;
    // Non-IP frames (ARP, etc.) carry no addresses — not part of the IP pipeline.
    if (!sourceIp || !destinationIp) return null;

    const sourcePort = numOrNull(tcpSport) ?? numOrNull(udpSport);
    const destinationPort = numOrNull(tcpDport) ?? numOrNull(udpDport);
    const packetSize = numOrNull(frameLen) ?? 0;

    const flags: string[] = [];
    if (flagOn(tcpSyn)) flags.push('SYN');
    if (flagOn(tcpAck)) flags.push('ACK');
    if (flagOn(tcpRst)) flags.push('RST');
    if (flagOn(tcpFin)) flags.push('FIN');

    const protocol = mapProtocol(displayProtocol, sourcePort, destinationPort, ipProto, flags);

    const timestamp = timeEpoch
      ? new Date(Math.round(parseFloat(timeEpoch) * 1000)).toISOString()
      : new Date().toISOString();

    return {
      timestamp,
      sourceIp,
      destinationIp,
      sourcePort,
      destinationPort,
      protocol,
      packetSize,
      flags,
      interfaceId: this.selectedInterfaceId ?? 'unknown',
    };
  }
}

function numOrNull(v: string | undefined): number | null {
  if (v === undefined || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/** tshark renders flag fields as True/False (and occasionally 1/0). */
function flagOn(v: string | undefined): boolean {
  if (v === undefined) return false;
  const val = v.trim().toLowerCase();
  return val === 'true' || val === '1' || val === 'yes';
}

/** Map tshark's display protocol to the application's Protocol enum. */
function mapProtocol(
  display: string | undefined,
  sourcePort: number | null,
  destinationPort: number | null,
  ipProto: string | undefined,
  flags: string[]
): Protocol {
  const proto = (display || '').toUpperCase();
  const authPort = sourcePort ?? destinationPort;

  switch (proto) {
    case 'HTTP':
    case 'HTTP2':
    case 'HTTP3':
      return Protocol.HTTP;
    case 'TLS':
    case 'SSL':
    case 'QUIC':
      return Protocol.HTTPS;
    case 'DNS':
    case 'MDNS':
    case 'LLMNR':
      return Protocol.DNS;
    case 'SSH':
      return Protocol.SSH;
    case 'FTP':
    case 'FTPS':
      return Protocol.FTP;
    case 'SMTP':
    case 'SMTPS':
      return Protocol.SMTP;
    case 'ICMP':
    case 'ICMPV6':
      return Protocol.ICMP;
    case 'TCP':
      return Protocol.TCP;
    case 'UDP':
      return Protocol.UDP;
  }

  // Fall back to ports / IP protocol number.
  if (authPort === 22) return Protocol.SSH;
  if (authPort === 80 || authPort === 8080) return Protocol.HTTP;
  if (authPort === 443) return Protocol.HTTPS;
  if (authPort === 53) return Protocol.DNS;
  if (authPort === 21) return Protocol.FTP;
  if (authPort === 25 || authPort === 587) return Protocol.SMTP;
  if (ipProto === '1') return Protocol.ICMP;
  if (sourcePort !== null || destinationPort !== null || flags.length > 0 || ipProto === '6') {
    return Protocol.TCP;
  }
  return Protocol.UDP;
}
