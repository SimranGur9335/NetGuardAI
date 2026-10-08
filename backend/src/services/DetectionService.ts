import { ThreatCategory, TrafficEvent } from '../models';
import { generatePredictionId } from '../utils/idGenerator';
import { IPredictionRepository } from '../repositories/interfaces/IPredictionRepository';
import { Prediction } from '../models';

/**
 * DetectionModel interface - abstraction for detection engines.
 * Future implementations can use trained ML models (Random Forest, XGBoost).
 */
export interface DetectionModel {
  predict(event: TrafficEvent): Promise<{
    classification: ThreatCategory;
    confidence: number;
  }>;
  getModelInfo(): {
    name: string;
    type: string;
    status: string;
  };
}

interface TimedEvent {
  dst: string;
  dstPort: number;
  t: number;
}

/**
 * FlowBasedDetectionModel
 *
 * "Development Detection Engine" — flow/rule-based heuristics over REAL
 * captured traffic. This is NOT a trained ML model and reports no ML metrics.
 *
 * Rules (stateful, sliding-window):
 *  - PORT_SCAN:   >=15 SYN-scanned ports on one destination, or >=25 distinct
 *                 destination ports from one source within 10s.
 *  - DOS_DDOS:    >=80 SYN packets from one source to one destination within 1s
 *                 (SYN-flood signature).
 *  - BRUTE_FORCE: >=15 connection attempts to the same auth-service port on one
 *                 destination within 30s (SSH/RDP/SMB/FTP/etc.).
 *  - NORMAL:      everything else.
 *
 * Only SYN (connection-attempt) packets feed the scan/flood/brute counters,
 * so normal handshakes, downloads and streaming are not misclassified.
 */
export class FlowBasedDetectionModel implements DetectionModel {
  private static readonly SCAN_WINDOW_MS = 10_000;
  private static readonly SCAN_PORTS_PER_TARGET = 15;
  private static readonly SCAN_PORTS_TOTAL = 25;
  private static readonly SYN_FLOOD_WINDOW_MS = 1_000;
  private static readonly SYN_FLOOD_THRESHOLD = 80;
  private static readonly AUTH_WINDOW_MS = 30_000;
  private static readonly AUTH_ATTEMPT_THRESHOLD = 15;
  private static readonly AUTH_PORTS = new Set([
    21, 22, 23, 25, 110, 143, 3389, 445, 1433, 3306, 5432, 5985, 5986,
  ]);
  private static readonly MAX_TRACKED_KEYS = 5000;
  private static readonly MAX_EVENTS_PER_KEY = 3000;
  private static readonly PRUNE_INTERVAL_MS = 2000;

  /** SYN packets per source: used for port-scan detection. */
  private synBySource = new Map<string, TimedEvent[]>();
  /** SYN packet timestamps per source→destination pair: SYN-flood detection. */
  private synByPair = new Map<string, number[]>();
  /** SYN attempts per source→destination:authPort: brute-force detection. */
  private authByTarget = new Map<string, number[]>();

  private lastPrune = 0;

  async predict(event: TrafficEvent): Promise<{
    classification: ThreatCategory;
    confidence: number;
  }> {
    const now = Date.now();
    this.prune(now);

    const flags = event.flags || [];
    const isSynOnly = flags.includes('SYN') && !flags.includes('ACK');
    const src = event.sourceIp;
    const dst = event.destinationIp;
    const dstPort = event.destinationPort;

    // Track connection attempts (SYN only) — the signal used by all three rules.
    if (isSynOnly) {
      this.pushEvent(this.synBySource, src, { dst, dstPort, t: now });
      this.pushTimestamp(this.synByPair, `${src}->${dst}`, now);
      if (FlowBasedDetectionModel.AUTH_PORTS.has(dstPort)) {
        this.pushTimestamp(this.authByTarget, `${src}->${dst}:${dstPort}`, now);
      }
    }

    // ---- Rule 1: Port scan ------------------------------------------
    // Only connection attempts (SYN) can be part of a scan, and the current
    // packet must itself belong to the scanned pattern — either the same
    // destination being probed, or a broad multi-port sweep by this source.
    // This prevents unrelated browsing traffic from being mislabeled.
    if (isSynOnly) {
      const syns = this.synBySource.get(src);
      if (syns && syns.length >= FlowBasedDetectionModel.SCAN_PORTS_PER_TARGET) {
        const portsForThisTarget = new Set<number>();
        const allPorts = new Set<number>();
        for (const s of syns) {
          if (now - s.t > FlowBasedDetectionModel.SCAN_WINDOW_MS) continue;
          allPorts.add(s.dstPort);
          if (s.dst === dst) portsForThisTarget.add(s.dstPort);
        }

        if (
          portsForThisTarget.size >= FlowBasedDetectionModel.SCAN_PORTS_PER_TARGET ||
          allPorts.size >= FlowBasedDetectionModel.SCAN_PORTS_TOTAL
        ) {
          const distinct = Math.max(portsForThisTarget.size, allPorts.size);
          return {
            classification: ThreatCategory.PORT_SCAN,
            confidence: Math.min(0.95, 0.55 + distinct / 60),
          };
        }
      }
    }

    // ---- Rule 2: DoS/DDoS (SYN flood) --------------------------------
    const pairSyns = this.synByPair.get(`${src}->${dst}`);
    if (pairSyns && pairSyns.length >= FlowBasedDetectionModel.SYN_FLOOD_THRESHOLD) {
      return {
        classification: ThreatCategory.DOS_DDOS,
        confidence: Math.min(0.95, 0.6 + pairSyns.length / 500),
      };
    }

    // ---- Rule 3: Brute force ----------------------------------------
    if (isSynOnly && FlowBasedDetectionModel.AUTH_PORTS.has(dstPort)) {
      const attempts = this.authByTarget.get(`${src}->${dst}:${dstPort}`);
      if (attempts && attempts.length >= FlowBasedDetectionModel.AUTH_ATTEMPT_THRESHOLD) {
        return {
          classification: ThreatCategory.BRUTE_FORCE,
          confidence: Math.min(0.95, 0.6 + attempts.length / 100),
        };
      }
    }

    return { classification: ThreatCategory.NORMAL, confidence: 0.9 };
  }

  getModelInfo() {
    return {
      name: 'Development Detection Engine',
      type: 'Rule-based flow analysis (not a trained ML model)',
      status: 'Operational',
    };
  }

  // ------------------------------------------------------------------
  // State helpers
  // ------------------------------------------------------------------

  private pushEvent(map: Map<string, TimedEvent[]>, key: string, value: TimedEvent): void {
    let arr = map.get(key);
    if (!arr) {
      if (map.size >= FlowBasedDetectionModel.MAX_TRACKED_KEYS) {
        // Evict oldest-inserted key to bound memory.
        const first = map.keys().next().value;
        if (first !== undefined) map.delete(first);
      }
      arr = [];
      map.set(key, arr);
    }
    arr.push(value);
    if (arr.length > FlowBasedDetectionModel.MAX_EVENTS_PER_KEY) {
      arr.splice(0, arr.length - FlowBasedDetectionModel.MAX_EVENTS_PER_KEY);
    }
  }

  private pushTimestamp(map: Map<string, number[]>, key: string, t: number): void {
    let arr = map.get(key);
    if (!arr) {
      if (map.size >= FlowBasedDetectionModel.MAX_TRACKED_KEYS) {
        const first = map.keys().next().value;
        if (first !== undefined) map.delete(first);
      }
      arr = [];
      map.set(key, arr);
    }
    arr.push(t);
    if (arr.length > FlowBasedDetectionModel.MAX_EVENTS_PER_KEY) {
      arr.splice(0, arr.length - FlowBasedDetectionModel.MAX_EVENTS_PER_KEY);
    }
  }

  private prune(now: number): void {
    if (now - this.lastPrune < FlowBasedDetectionModel.PRUNE_INTERVAL_MS) return;
    this.lastPrune = now;

    const pruneNums = (map: Map<string, number[]>, window: number) => {
      for (const [key, arr] of map) {
        const filtered = arr.filter((t) => now - t <= window);
        if (filtered.length === 0) map.delete(key);
        else map.set(key, filtered);
      }
    };
    const pruneTimed = (map: Map<string, TimedEvent[]>, window: number) => {
      for (const [key, arr] of map) {
        const filtered = arr.filter((e) => now - e.t <= window);
        if (filtered.length === 0) map.delete(key);
        else map.set(key, filtered);
      }
    };

    pruneTimed(this.synBySource, FlowBasedDetectionModel.SCAN_WINDOW_MS);
    pruneNums(this.synByPair, FlowBasedDetectionModel.SYN_FLOOD_WINDOW_MS);
    pruneNums(this.authByTarget, FlowBasedDetectionModel.AUTH_WINDOW_MS);
  }
}

/**
 * DetectionService
 * Processes traffic events through the detection pipeline.
 * Saves predictions for audit and evaluation.
 */
export class DetectionService {
  private model: DetectionModel;

  constructor(
    private predictionRepository: IPredictionRepository,
    model?: DetectionModel
  ) {
    this.model = model || new FlowBasedDetectionModel();
  }

  async detect(event: TrafficEvent): Promise<{
    classification: ThreatCategory;
    confidence: number;
    prediction: Prediction;
  }> {
    const result = await this.model.predict(event);

    const prediction: Prediction = {
      id: generatePredictionId(),
      timestamp: new Date().toISOString(),
      trafficEventId: event.id,
      classification: result.classification,
      confidence: result.confidence,
      model: this.model.getModelInfo().name,
    };

    await this.predictionRepository.save(prediction);

    return {
      classification: result.classification,
      confidence: result.confidence,
      prediction,
    };
  }

  getModelInfo() {
    return this.model.getModelInfo();
  }
}
