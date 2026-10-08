import { useEffect, useState, useCallback } from 'react';
import { getDashboardSummary } from '../services/dashboard';
import { getCaptureStatus, startMonitoring, stopMonitoring, getInterfaces } from '../services/monitoring';
import { DashboardSummary, CaptureStatus, NetworkInterface } from '../types';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/ErrorState';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { TableSkeleton } from '../components/ui/Skeleton';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setError(null);
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCaptureStatus = useCallback(async () => {
    try {
      const status = await getCaptureStatus();
      setCaptureStatus(status);
    } catch {
      // Silently fail for status check
    }
  }, []);

  const loadInterfaces = useCallback(async () => {
    try {
      const data = await getInterfaces();
      setInterfaces(data);
      if (data.length > 0 && !selectedInterface) {
        // Prefer an active interface that actually has an IPv4 address,
        // then any active interface, then anything listed.
        const active =
          data.find((i) => i.status === 'up' && i.ipv4) ||
          data.find((i) => i.status === 'up') ||
          data[0];
        setSelectedInterface(active.id);
      }
    } catch {
      // Silently fail for interfaces
    }
  }, [selectedInterface]);

  // Initial load
  useEffect(() => {
    loadSummary();
    loadCaptureStatus();
    loadInterfaces();
  }, [loadSummary, loadCaptureStatus, loadInterfaces]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSummary();
      loadCaptureStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadSummary, loadCaptureStatus]);

  async function handleStartMonitoring() {
    try {
      setActionError(null);
      if (!selectedInterface) {
        setActionError('Please select a network interface first');
        return;
      }
      const status = await startMonitoring(selectedInterface);
      setCaptureStatus(status);
      // Refresh data immediately
      setTimeout(loadSummary, 1000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start monitoring');
    }
  }

  async function handleStopMonitoring() {
    try {
      setActionError(null);
      const status = await stopMonitoring();
      setCaptureStatus(status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to stop monitoring');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <TableSkeleton rows={5} />
          </Card>
          <Card>
            <TableSkeleton rows={5} />
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadSummary}
      />
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Monitoring Control Banner */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${captureStatus?.running ? 'bg-normal-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-900">
              {captureStatus?.running ? 'Monitoring Active' : 'Monitoring Inactive'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!captureStatus?.running && (
              <select
                value={selectedInterface}
                onChange={(e) => setSelectedInterface(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
              >
                {interfaces.map((iface) => (
                  <option key={iface.id} value={iface.id}>
                    {iface.name} ({iface.ipv4 || 'No IP'})
                  </option>
                ))}
              </select>
            )}
            {captureStatus?.running ? (
              <button
                onClick={handleStopMonitoring}
                className="px-3 py-1.5 text-sm font-medium text-white bg-critical-600 rounded hover:bg-critical-700 transition-colors"
              >
                Stop Monitoring
              </button>
            ) : (
              <button
                onClick={handleStartMonitoring}
                disabled={!captureStatus?.available}
                className="px-3 py-1.5 text-sm font-medium text-white bg-normal-600 rounded hover:bg-normal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Monitoring
              </button>
            )}
          </div>
        </div>
        {actionError && (
          <div className="mt-2 text-xs text-critical-600 bg-critical-50 border border-critical-200 rounded px-2 py-1.5">
            {actionError}
          </div>
        )}
        {captureStatus && !captureStatus.available && (
          <div className="mt-2 text-xs text-critical-600 bg-critical-50 border border-critical-200 rounded px-2 py-1.5">
            <span className="font-semibold">Packet Capture: Unavailable.</span>{' '}
            {captureStatus.reason || 'Npcap or another supported capture mechanism is not installed.'}
          </div>
        )}
        {captureStatus?.running && (
          <div className="mt-2 text-xs text-gray-500">
            Capturing real packets on {captureStatus.interfaceName || 'selected interface'} — {captureStatus.packetsCaptured} packets captured ({captureStatus.captureMethod})
          </div>
        )}
        {captureStatus && captureStatus.available && !captureStatus.running && (
          <div className="mt-2 text-xs text-gray-500">
            Capture ready. Select a network interface and start monitoring to capture real packets.
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-500 mb-1">Total Events</div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalEvents}</div>
          <div className="text-xs text-gray-400 mt-1">This session</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 mb-1">Suspicious Events</div>
          <div className="text-2xl font-bold text-suspicious-600">{summary.suspiciousEvents}</div>
          <div className="text-xs text-gray-400 mt-1">
            {summary.totalEvents > 0
              ? `${((summary.suspiciousEvents / summary.totalEvents) * 100).toFixed(1)}% of total`
              : 'No events'}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 mb-1">Active Alerts</div>
          <div className="text-2xl font-bold text-critical-600">{summary.activeAlerts}</div>
          <div className="text-xs text-gray-400 mt-1">Requires attention</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500 mb-1">Resolved Alerts</div>
          <div className="text-2xl font-bold text-normal-600">{summary.resolvedAlerts}</div>
          <div className="text-xs text-gray-400 mt-1">Handled this session</div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution */}
        <Card title="Threat Distribution">
          {summary.threatDistribution.length === 0 ? (
            <p className="text-sm text-gray-500">No threat data available</p>
          ) : (
            <div className="space-y-3">
              {summary.threatDistribution.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <CategoryBadge category={item.category} />
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Severity Distribution */}
        <Card title="Alert Severity">
          {summary.severityDistribution.length === 0 ? (
            <p className="text-sm text-gray-500">No alerts generated yet</p>
          ) : (
            <div className="space-y-3">
              {summary.severityDistribution.map((item) => (
                <div key={item.severity} className="flex items-center justify-between">
                  <SeverityBadge severity={item.severity} />
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* System Health */}
        <Card title="System Health">
          <div className="space-y-3">
            {summary.systemHealth.map((component) => (
              <div key={component.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{component.name}</span>
                <StatusIndicator
                  status={
                    component.status === 'Operational'
                      ? 'operational'
                      : component.status === 'Active'
                      ? 'operational'
                      : component.status === 'Ready'
                      ? 'ready'
                      : component.status === 'Unavailable'
                      ? 'error'
                      : component.status === 'Not Configured'
                      ? 'not_configured'
                      : 'error'
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Events */}
      <Card title="Recent Security Events">
        {summary.recentEvents.length === 0 ? (
          <p className="text-sm text-gray-500">
            {captureStatus?.running
              ? 'No network traffic captured yet — waiting for packets on the selected interface.'
              : 'No network traffic captured yet. Start monitoring to capture real packets.'}
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Classification</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.recentEvents.slice(0, 8).map((event) => (
                  <tr key={event.id}>
                    <td className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <CategoryBadge category={event.classification} />
                    </td>
                    <td className="font-mono text-xs">{event.sourceIp}</td>
                    <td className="font-mono text-xs">{event.destinationIp}</td>
                    <td className="text-xs text-gray-500">{event.protocol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
