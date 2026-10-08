import { useEffect, useState } from 'react';
import { getSystemStatus, getHealth } from '../services/system';
import { SystemStatus } from '../types';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';
import { StatusIndicator } from '../components/ui/StatusIndicator';

type StatusType = 'operational' | 'active' | 'unavailable' | 'ready' | 'not_configured' | 'error';

export function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [health, setHealth] = useState<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      setLoading(true);
      setError(null);
      const [statusData, healthData] = await Promise.all([
        getSystemStatus(),
        getHealth(),
      ]);
      setStatus(statusData);
      setHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system status');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading system status..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadStatus} />;
  }

  const getStatusType = (componentStatus: string): StatusType => {
    switch (componentStatus) {
      case 'Operational': return 'operational';
      case 'Active': return 'active';
      case 'Unavailable': return 'unavailable';
      case 'Ready': return 'ready';
      case 'Not Configured': return 'not_configured';
      default: return 'error';
    }
  };

  const capture = status?.capture;
  const monitoringMode = status?.monitoringMode;

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      {health && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">API Status</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-normal-500" />
                <span className="text-sm font-medium text-gray-900 capitalize">{health.status}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Environment</div>
              <div className="text-sm font-medium text-gray-900 capitalize">{health.environment}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Uptime</div>
              <div className="text-sm font-medium text-gray-900">
                {Math.floor(health.uptime / 60)}m {Math.floor(health.uptime % 60)}s
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Last Check</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(health.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Packet Capture Status */}
      <Card title="Packet Capture">
        {capture && !capture.available ? (
          <div className="bg-critical-50 border border-critical-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-critical-700">Packet Capture: Unavailable</div>
            <p className="text-xs text-critical-600 mt-1">
              {capture.reason ||
                'Npcap or another supported capture mechanism is not installed.'}
            </p>
            <p className="text-xs text-critical-600 mt-2">
              Setup: install Npcap from https://npcap.com/ (enable "Install Npcap in WinPcap
              API-compatible Mode") and Wireshark/tshark from https://www.wireshark.org/, then
              restart the backend. Monitoring cannot start and no traffic data will be produced
              until capture is available.
            </p>
          </div>
        ) : capture ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <StatusIndicator
                status={capture.running ? 'active' : 'ready'}
                label={capture.running ? 'Capturing' : 'Ready (idle)'}
              />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Capture Method</div>
              <div className="text-sm font-medium text-gray-900">{capture.method}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Interface</div>
              <div className="text-sm font-medium text-gray-900">
                {capture.interfaceName || '—'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Packets Captured</div>
              <div className="text-sm font-medium text-gray-900">{capture.packetsCaptured}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Capture status unavailable.</p>
        )}
      </Card>

      {/* Component Status */}
      <Card title="Component Status">
        <div className="space-y-4">
          {status?.components.map((component: { name: string; status: string; details: string }) => (
            <div
              key={component.name}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="pr-4">
                <div className="text-sm font-medium text-gray-900">{component.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{component.details}</div>
              </div>
              <StatusIndicator status={getStatusType(component.status)} label={component.status} />
            </div>
          ))}
        </div>
      </Card>

      {/* Monitoring Configuration */}
      <Card title="Monitoring Configuration">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Monitoring Mode</span>
            <span className="text-sm font-medium text-gray-900">
              {monitoringMode === 'LIVE' ? 'Live Network Capture' : 'Offline (not capturing)'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Packet Capture</span>
            <span
              className={`text-sm font-medium ${
                capture?.available
                  ? capture.running
                    ? 'text-normal-600'
                    : 'text-gray-900'
                  : 'text-critical-600'
              }`}
            >
              {!capture?.available
                ? 'Unavailable'
                : capture.running
                  ? `Active on ${capture.interfaceName || 'interface'}`
                  : 'Ready (not running)'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Detection Engine</span>
            <span className="text-sm font-medium text-gray-900">
              Development Detection Engine (Rule-Based — Not Trained ML)
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">ML Models</span>
            <span className="text-sm font-medium text-warning-600">Not Trained / Not Available</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Data Persistence</span>
            <span className="text-sm font-medium text-gray-500">In-Memory Only (No Database)</span>
          </div>
        </div>
      </Card>

      {/* Architecture Info */}
      <Card title="System Architecture">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            The system captures real network packets through Npcap via tshark, normalizes them,
            extracts traffic features, runs them through the development detection engine and
            rule-based threat classifier, and raises alerts only from real captured traffic.
            Trained ML models (Random Forest, XGBoost) can be integrated later without changing
            the API or frontend layers.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Current Data Flow (Real Capture)
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Npcap / tshark Capture</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Packet Normalization</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Feature Extraction</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Detection Engine</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Threat Classification</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Alert Engine</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">In-Memory Repository</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">REST API</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
