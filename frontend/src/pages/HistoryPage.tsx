import { useEffect, useState } from 'react';
import { getAlerts } from '../services/alerts';
import { Alert, AlertQueryParams, PaginatedResponse, ThreatCategory, Severity } from '../types';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Badge } from '../components/ui/Badge';
import { AlertStatus } from '../types';

export function HistoryPage() {
  const [data, setData] = useState<PaginatedResponse<Alert> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<AlertQueryParams>({
    page: 1,
    limit: 25,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadHistory();
  }, [params]);

  async function loadHistory() {
    try {
      setLoading(true);
      setError(null);
      const result = await getAlerts(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
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
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadHistory} />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> History data is stored in memory for the current session only.
          Data will be reset when the application restarts. Persistent storage will be available
          after database integration.
        </p>
      </div>

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
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="Source or destination..."
              value={params.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-48 rounded-md border-gray-300 text-sm"
            />
          </div>
          <div className="ml-auto flex items-end">
            <div className="text-sm text-gray-500">
              {data?.total || 0} events
            </div>
          </div>
        </div>
      </Card>

      {/* History Table */}
      <Card>
        {!data || data.items.length === 0 ? (
          <EmptyState
            title="No historical events"
            description="No events match the current filters for this session."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Protocol</th>
                  <th>Status</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((alert) => (
                  <tr key={alert.id}>
                    <td className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <CategoryBadge category={alert.category} />
                    </td>
                    <td>
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="font-mono text-xs">{alert.sourceIp}</td>
                    <td className="font-mono text-xs">{alert.destinationIp}</td>
                    <td className="text-xs text-gray-500">{alert.protocol}</td>
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
                    <td className="text-xs text-gray-600 max-w-xs truncate">
                      {alert.description}
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
