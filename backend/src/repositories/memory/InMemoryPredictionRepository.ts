import { IPredictionRepository } from '../interfaces/IPredictionRepository';
import { Prediction } from '../../models';

export class InMemoryPredictionRepository implements IPredictionRepository {
  /** Retained in-memory predictions — oldest are dropped beyond this bound. */
  private static readonly MAX_PREDICTIONS = 20_000;
  private predictions: Prediction[] = [];

  async findAll(limit = 100): Promise<Prediction[]> {
    return [...this.predictions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async findById(id: string): Promise<Prediction | null> {
    return this.predictions.find((p) => p.id === id) || null;
  }

  async save(prediction: Prediction): Promise<Prediction> {
    this.predictions.push(prediction);
    if (this.predictions.length > InMemoryPredictionRepository.MAX_PREDICTIONS) {
      this.predictions.splice(0, this.predictions.length - InMemoryPredictionRepository.MAX_PREDICTIONS);
    }
    return prediction;
  }

  async findRecent(limit: number): Promise<Prediction[]> {
    return [...this.predictions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async clear(): Promise<void> {
    this.predictions = [];
  }
}
