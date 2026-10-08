import { useEffect, useState } from 'react';
import { getModels } from '../services/models';
import { ModelInfo } from '../types';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function ModelsPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    try {
      setLoading(true);
      setError(null);
      const data = await getModels();
      setModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading model information..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadModels} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-sm text-gray-600">
          NetGuard AI uses machine learning models for intrusion detection and threat classification.
          The following models are available for integration. Evaluation results will be populated
          after experimental testing is completed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((model) => (
          <Card key={model.id}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                  <p className="text-sm text-gray-500">{model.type}</p>
                </div>
                <Badge variant="informational">{model.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Detection Stage
                  </h4>
                  <p className="text-sm text-gray-700">{model.detectionStage}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Classification Stage
                  </h4>
                  <p className="text-sm text-gray-700">{model.classificationStage}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Evaluation Status</span>
                  <Badge variant="warning">{model.evaluationStatus}</Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Development Detection Model">
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            During development, a rule-based detection model is used to simulate the detection pipeline.
            This model applies simple heuristics to classify traffic and generate alerts for demonstration purposes.
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> This is not a real machine learning model. It will be replaced by
              trained Random Forest and XGBoost models once the dataset is prepared and model training is complete.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
