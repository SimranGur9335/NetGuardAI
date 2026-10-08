import { useEffect, useState, useCallback } from 'react';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../services/alerts';
import { Alert, AlertQueryParams, AlertStatus, PaginatedResponse, ThreatCategory, Severity } from '../types';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Badge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeleton';

export function AlertsPage() {
  const [data, setData] = useState<PaginatedResponse<Alert> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<AlertQueryParams>({
    page: 1,
    limit: 25,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  const loadAlerts = useCallback(async () => {
    try {
      setError(null);
      const result = await getAlerts(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  async function handleAcknowledge(id: string) {
    await acknowledgeAlert(id);
    loadAlerts();
  }

  async function handleResolve(id: string) {
    await resolveAlert(id);
    loadAlerts();
  }

  function handleFilterChange(key: keyof AlertQueryParams, value: string) {
    setParams((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <TableSkeleton rows={10} />
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAlerts} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={params.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="block w-40 rounded-md border-gray-300 text-sm"
            >
              <option value="">All</option>
              {Object.values(ThreatCategory).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Severity</label>
            <select
              value={params.severity || ''}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="block w-32 rounded-md border-gray-300 text-sm"
            >
              <option value="">All</option>
              {Object.values(Severity).map((sev) => (
                <option key={sev} value={sev}>{sev}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={params.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-36 rounded-md border-gray-300 text-sm"
            >
              <option value="">All</option>
              {Object.values(AlertStatus).map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="IP or description..."
              value={params.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-48 rounded-md border-gray-300 text-sm"
            />
          </div>
          <div className="ml-auto flex items-end">
            <div className="text-sm text-gray-500">
              {data?.total || 0} alerts
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts Table */}
      <Card>
        {!data || data.items.length === 0 ? (
          <EmptyState
            title="No security alerts"
            description="No alerts match the current filters. This is a good sign."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Time</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((alert) => (
                  <tr key={alert.id}>
                    <td className="font-mono text-xs">{alert.id}</td>
                    <td className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <CategoryBadge category={alert.category} />
                    </td>
                    <td>
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="font-mono text-xs">{alert.sourceIp}</td>
                    <td className="font-mono text-xs">{alert.destinationIp}</td>
                    <td>
                      <Badge
                        variant={
                          alert.status === AlertStatus.NEW
                            ? 'critical'
                            : alert.status === AlertStatus.ACKNOWLEDGED
                            ? 'warning'
                            : 'normal'
                        }
                      >
                        {alert.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {alert.status === AlertStatus.NEW && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="text-xs text-gray-600 hover:text-gray-900"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== AlertStatus.RESOLVED && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="text-xs text-normal-600 hover:text-normal-700"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}
              disabled={params.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {data.page} of {data.totalPages}
            </span>
            <button
              onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}
              disabled={params.page === data.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
