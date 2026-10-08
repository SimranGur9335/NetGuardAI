import { Prediction } from '../../models';

export interface IPredictionRepository {
  findAll(limit?: number): Promise<Prediction[]>;
  findById(id: string): Promise<Prediction | null>;
  save(prediction: Prediction): Promise<Prediction>;
  findRecent(limit: number): Promise<Prediction[]>;
  clear(): Promise<void>;
}
