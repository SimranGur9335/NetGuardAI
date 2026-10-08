import { useEffect, useState, useCallback } from 'react';
import { getTrafficEvents } from '../services/traffic';
import { TrafficEvent, TrafficQueryParams, PaginatedResponse, ThreatCategory, Protocol } from '../types';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { TableSkeleton } from '../components/ui/Skeleton';

export function TrafficPage() {
  const [data, setData] = useState<PaginatedResponse<TrafficEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<TrafficQueryParams>({
    page: 1,
    limit: 25,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  const loadTraffic = useCallback(async () => {
    try {
      setError(null);
      const result = await getTrafficEvents(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load traffic');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadTraffic();
  }, [loadTraffic]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTraffic();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadTraffic]);

  function handleFilterChange(key: keyof TrafficQueryParams, value: string) {
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
    return <ErrorState message={error} onRetry={loadTraffic} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Classification</label>
            <select
              value={params.classification || ''}
              onChange={(e) => handleFilterChange('classification', e.target.value)}
              className="block w-40 rounded-md border-gray-300 text-sm"
            >
              <option value="">All</option>
              {Object.values(ThreatCategory).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Protocol</label>
            <select
              value={params.protocol || ''}
              onChange={(e) => handleFilterChange('protocol', e.target.value)}
              className="block w-32 rounded-md border-gray-300 text-sm"
            >
              <option value="">All</option>
              {Object.values(Protocol).map((proto) => (
                <option key={proto} value={proto}>{proto}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="IP address..."
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

      {/* Traffic Table */}
      <Card>
        {!data || data.items.length === 0 ? (
          <EmptyState
            title="No traffic events"
            description="No traffic events match the current filters."
          />
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
                  <th>Port</th>
                  <th>Size</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((event) => (
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
                    <td className="text-xs text-gray-500">{event.destinationPort}</td>
                    <td className="text-xs text-gray-500">{event.packetSize}B</td>
                    <td className="text-xs text-gray-500">{event.flags.join(', ')}</td>
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
