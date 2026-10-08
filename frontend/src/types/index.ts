// ============================================================
// NetGuard AI - Frontend Types
// These types mirror the backend API contracts.
// ============================================================

export enum ThreatCategory {
  NORMAL = 'NORMAL',
  DOS_DDOS = 'DOS_DDOS',
  BRUTE_FORCE = 'BRUTE_FORCE',
  PORT_SCAN = 'PORT_SCAN',
}

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum AlertStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

export enum Protocol {
  TCP = 'TCP',
  UDP = 'UDP',
  ICMP = 'ICMP',
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
  DNS = 'DNS',
  SSH = 'SSH',
  FTP = 'FTP',
  SMTP = 'SMTP',
}

export enum MonitoringMode {
  SIMULATION = 'SIMULATION',
  LIVE = 'LIVE',
}

// ---------- Traffic Event ----------

export interface TrafficEvent {
  id: string;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: Protocol;
  packetSize: number;
  flags: string[];
  classification: ThreatCategory;
  isSuspicious: boolean;
  severity?: Severity;
  description?: string;
}

// ---------- Alert ----------

export interface Alert {
  id: string;
  timestamp: string;
  category: ThreatCategory;
  severity: Severity;
  sourceIp: string;
  destinationIp: string;
  protocol: Protocol;
  status: AlertStatus;
  description: string;
  prediction?: string;
  detectionSource: string;
}

// ---------- Prediction ----------

export interface Prediction {
  id: string;
  timestamp: string;
  trafficEventId: string;
  classification: ThreatCategory;
  confidence: number;
  model: string;
}

// ---------- Model Info ----------

export interface ModelInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  detectionStage: string;
  classificationStage: string;
  evaluationStatus: string;
}

// ---------- Evaluation ----------

export interface EvaluationMetrics {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
}

export interface ConfusionMatrix {
  labels: string[];
  values: number[][] | null;
}

export interface EvaluationResult {
  modelId: string;
  modelName: string;
  status: string;
  metrics: EvaluationMetrics;
  confusionMatrix: ConfusionMatrix;
  message: string;
}

// ---------- System Status ----------

export interface SystemComponent {
  name: string;
  status: string;
  details: string;
}

export interface SystemStatus {
  components: SystemComponent[];
  monitoringMode: string;
  timestamp: string;
}

// ---------- Dashboard ----------

export interface ThreatDistribution {
  category: ThreatCategory;
  count: number;
}

export interface SeverityDistribution {
  severity: Severity;
  count: number;
}

export interface DashboardSummary {
  totalEvents: number;
  suspiciousEvents: number;
  normalEvents: number;
  activeAlerts: number;
  resolvedAlerts: number;
  threatDistribution: ThreatDistribution[];
  severityDistribution: SeverityDistribution[];
  recentEvents: TrafficEvent[];
  monitoringMode: MonitoringMode;
  systemHealth: SystemComponent[];
}

export interface TrafficActivityPoint {
  timestamp: string;
  normal: number;
  suspicious: number;
}

// ---------- API Response Envelope ----------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// ---------- Query Parameters ----------

export interface TrafficQueryParams {
  classification?: ThreatCategory;
  protocol?: Protocol;
  isSuspicious?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AlertQueryParams {
  category?: ThreatCategory;
  severity?: Severity;
  status?: AlertStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------- Simulation ----------

export interface SimulationStatus {
  running: boolean;
  mode: string;
  interval: number;
  startedAt: string | null;
  message?: string;
}
