export const THREAT_CATEGORIES = [
  { value: 'DOS_DDOS', label: 'DoS/DDoS' },
  { value: 'BRUTE_FORCE', label: 'Brute Force' },
  { value: 'PORT_SCAN', label: 'Port Scan' },
] as const;

export const SEVERITY_LEVELS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
] as const;

export const ALERT_STATUSES = [
  { value: 'NEW', label: 'New' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

export const PROTOCOLS = [
  { value: 'TCP', label: 'TCP' },
  { value: 'UDP', label: 'UDP' },
  { value: 'ICMP', label: 'ICMP' },
  { value: 'HTTP', label: 'HTTP' },
  { value: 'HTTPS', label: 'HTTPS' },
  { value: 'DNS', label: 'DNS' },
  { value: 'SSH', label: 'SSH' },
  { value: 'FTP', label: 'FTP' },
  { value: 'SMTP', label: 'SMTP' },
] as const;
