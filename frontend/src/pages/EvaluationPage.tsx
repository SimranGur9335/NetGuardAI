import { useEffect, useState } from 'react';
import { getEvaluationStatus } from '../services/models';
import { EvaluationResult } from '../types';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function EvaluationPage() {
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluation();
  }, []);

  async function loadEvaluation() {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvaluationStatus();
      setEvaluations(data.evaluations);
      setOverallStatus(data.overallStatus);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evaluation data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading evaluation data..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadEvaluation} />;
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Evaluation Status: {overallStatus}
            </h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </div>

      {/* Model Evaluations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {evaluations.map((evaluation) => (
          <Card key={evaluation.modelId}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{evaluation.modelName}</h3>
                <Badge variant="warning">{evaluation.status}</Badge>
              </div>

              {/* Metrics */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Accuracy</div>
                    <div className="text-sm font-medium text-gray-400">Not evaluated</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Precision</div>
                    <div className="text-sm font-medium text-gray-400">Not evaluated</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Recall</div>
                    <div className="text-sm font-medium text-gray-400">Not evaluated</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">F1-Score</div>
                    <div className="text-sm font-medium text-gray-400">Not evaluated</div>
                  </div>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Confusion Matrix
                </h4>
                {evaluation.confusionMatrix.values === null ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">
                      Confusion matrix data not available. The matrix structure includes:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                      {evaluation.confusionMatrix.labels.map((label) => (
                        <span
                          key={label}
                          className="px-2 py-1 text-xs bg-white border border-gray-200 rounded"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-left text-gray-500"></th>
                          {evaluation.confusionMatrix.labels.map((label) => (
                            <th key={label} className="px-2 py-1 text-center text-gray-500">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {evaluation.confusionMatrix.values.map((row, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1 font-medium text-gray-700">
                              {evaluation.confusionMatrix.labels[i]}
                            </td>
                            {row.map((val, j) => (
                              <td key={j} className="px-2 py-1 text-center text-gray-600">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
