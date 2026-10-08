import { useEffect, useState } from 'react';
import { getSystemStatus, getHealth } from '../services/system';
import { SystemStatus } from '../types';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';
import { StatusIndicator } from '../components/ui/StatusIndicator';

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

  const getStatusType = (status: string): 'operational' | 'simulation' | 'ready' | 'not_configured' | 'error' => {
    switch (status) {
      case 'Operational': return 'operational';
      case 'Simulation': return 'simulation';
      case 'Ready': return 'ready';
      case 'Not Configured': return 'not_configured';
      default: return 'error';
    }
  };

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

      {/* Component Status */}
      <Card title="Component Status">
        <div className="space-y-4">
          {status?.components.map((component: { name: string; status: string; details: string }) => (
            <div
              key={component.name}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{component.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{component.details}</div>
              </div>
              <StatusIndicator status={getStatusType(component.status)} label={component.status} />
            </div>
          ))}
        </div>
      </Card>

      {/* Monitoring Mode */}
      <Card title="Monitoring Configuration">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Traffic Source</span>
            <span className="text-sm font-medium text-gray-900">
              {status?.monitoringMode === 'SIMULATION' ? 'Development Simulation' : 'Network Capture'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Packet Capture</span>
            <span className="text-sm font-medium text-warning-600">Not Connected</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">ML Models</span>
            <span className="text-sm font-medium text-informational-600">Development Mode</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Data Persistence</span>
            <span className="text-sm font-medium text-gray-500">In-Memory Only</span>
          </div>
        </div>
      </Card>

      {/* Architecture Info */}
      <Card title="System Architecture">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            The current system architecture follows a modular design that separates concerns across
            traffic processing, detection, classification, and alert generation. This design allows
            for future integration of real packet capture (Wireshark/Scapy) and trained ML models
            (Random Forest, XGBoost) without requiring changes to the frontend or API layers.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Current Data Flow
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Simulation Service</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Detection Service</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Classification Service</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Alert Service</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">In-Memory Storage</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">REST API</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Future Data Flow (Planned)
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Wireshark/Scapy</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Detection Service</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Classification Service</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">Alert Service</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">MongoDB Storage</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-white border border-gray-200 rounded">REST API</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
