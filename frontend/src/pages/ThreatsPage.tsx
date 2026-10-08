import { useEffect, useState } from 'react';
import { getThreatCategories } from '../services/threats';
import { ThreatCategoryInfo } from '../services/threats';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';

export function ThreatsPage() {
  const [categories, setCategories] = useState<ThreatCategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const data = await getThreatCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threat categories');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading threat categories..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadCategories} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-informational-50 border border-informational-200 rounded-lg px-4 py-3">
        <p className="text-sm text-informational-700">
          NetGuard AI currently supports detection and classification of the following threat categories.
          Additional categories will be added as the system evolves.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.category}>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {category.category.replace(/_/g, '/')}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  {category.category}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-700">{category.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Detection Behavior
                </h4>
                <p className="text-sm text-gray-700">{category.behavior}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
