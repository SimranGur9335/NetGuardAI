import { useEffect, useState, useCallback } from 'react';
import { getDashboardSummary } from '../services/dashboard';
import { getSimulationStatus, startSimulation, stopSimulation } from '../services/simulation';
import { DashboardSummary, SimulationStatus } from '../types';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/ErrorState';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { TableSkeleton } from '../components/ui/Skeleton';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [simStatus, setSimStatus] = useState<SimulationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadSimStatus = useCallback(async () => {
    try {
      const status = await getSimulationStatus();
      setSimStatus(status);
    } catch {
      // Silently fail for status check
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSummary();
    loadSimStatus();
  }, [loadSummary, loadSimStatus]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSummary();
      loadSimStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadSummary, loadSimStatus]);

  async function handleStartSimulation() {
    try {
      const status = await startSimulation();
      setSimStatus(status);
      // Refresh data immediately
      setTimeout(loadSummary, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
    }
  }

  async function handleStopSimulation() {
    try {
      const status = await stopSimulation();
      setSimStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop simulation');
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
      {/* Simulation Control Banner */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${simStatus?.running ? 'bg-normal-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-900">
              {simStatus?.running ? 'Simulation Running' : 'Simulation Stopped'}
            </span>
            <span className="text-sm text-gray-500">
              — Development Simulation
            </span>
          </div>
          <div className="flex items-center gap-2">
            {simStatus?.running ? (
              <button
                onClick={handleStopSimulation}
                className="px-3 py-1.5 text-sm font-medium text-white bg-critical-600 rounded hover:bg-critical-700 transition-colors"
              >
                Stop Simulation
              </button>
            ) : (
              <button
                onClick={handleStartSimulation}
                className="px-3 py-1.5 text-sm font-medium text-white bg-normal-600 rounded hover:bg-normal-700 transition-colors"
              >
                Start Simulation
              </button>
            )}
          </div>
        </div>
        {simStatus?.running && (
          <div className="mt-2 text-xs text-gray-500">
            Generating events every {simStatus.interval / 1000}s — No live network traffic capture connected
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
                      : component.status === 'Simulation'
                      ? 'simulation'
                      : component.status === 'Ready'
                      ? 'ready'
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
          <p className="text-sm text-gray-500">No recent events</p>
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
