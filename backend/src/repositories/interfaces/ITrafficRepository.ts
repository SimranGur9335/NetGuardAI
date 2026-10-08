import { TrafficEvent, TrafficQueryParams, PaginatedResponse } from '../../models';

export interface ITrafficRepository {
  findAll(params?: TrafficQueryParams): Promise<PaginatedResponse<TrafficEvent>>;
  findById(id: string): Promise<TrafficEvent | null>;
  save(event: TrafficEvent): Promise<TrafficEvent>;
  saveMany(events: TrafficEvent[]): Promise<TrafficEvent[]>;
  count(): Promise<number>;
  countByClassification(): Promise<Record<string, number>>;
  findRecent(limit: number): Promise<TrafficEvent[]>;
  findActivityTimeline(): Promise<{ timestamp: string; normal: number; suspicious: number }[]>;
  clear(): Promise<void>;
}
