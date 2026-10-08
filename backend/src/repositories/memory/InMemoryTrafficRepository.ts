import { ITrafficRepository } from '../interfaces/ITrafficRepository';
import { TrafficEvent, TrafficQueryParams, PaginatedResponse, ThreatCategory } from '../../models';

export class InMemoryTrafficRepository implements ITrafficRepository {
  /** Retained in-memory events — oldest are dropped beyond this bound. */
  private static readonly MAX_EVENTS = 20_000;
  private events: TrafficEvent[] = [];

  async findAll(params?: TrafficQueryParams): Promise<PaginatedResponse<TrafficEvent>> {
    let filtered = [...this.events];

    if (params?.classification) {
      filtered = filtered.filter((e) => e.classification === params.classification);
    }
    if (params?.protocol) {
      filtered = filtered.filter((e) => e.protocol === params.protocol);
    }
    if (params?.isSuspicious !== undefined) {
      filtered = filtered.filter((e) => e.isSuspicious === params.isSuspicious);
    }
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.sourceIp.includes(search) ||
          e.destinationIp.includes(search) ||
          e.description?.toLowerCase().includes(search)
      );
    }

    const sortBy = params?.sortBy || 'timestamp';
    const sortOrder = params?.sortOrder || 'desc';
    filtered.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy];
      const bVal = (b as unknown as Record<string, unknown>)[sortBy];
      if (aVal == null || bVal == null) return 0;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }

  async findById(id: string): Promise<TrafficEvent | null> {
    return this.events.find((e) => e.id === id) || null;
  }

  async save(event: TrafficEvent): Promise<TrafficEvent> {
    this.events.push(event);
    if (this.events.length > InMemoryTrafficRepository.MAX_EVENTS) {
      this.events.splice(0, this.events.length - InMemoryTrafficRepository.MAX_EVENTS);
    }
    return event;
  }

  async saveMany(events: TrafficEvent[]): Promise<TrafficEvent[]> {
    this.events.push(...events);
    if (this.events.length > InMemoryTrafficRepository.MAX_EVENTS) {
      this.events.splice(0, this.events.length - InMemoryTrafficRepository.MAX_EVENTS);
    }
    return events;
  }

  async count(): Promise<number> {
    return this.events.length;
  }

  async countByClassification(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const event of this.events) {
      counts[event.classification] = (counts[event.classification] || 0) + 1;
    }
    return counts;
  }

  async findRecent(limit: number): Promise<TrafficEvent[]> {
    return [...this.events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async findActivityTimeline(): Promise<{ timestamp: string; normal: number; suspicious: number }[]> {
    const buckets = new Map<string, { normal: number; suspicious: number }>();
    for (const event of this.events) {
      const minute = event.timestamp.slice(0, 16);
      if (!buckets.has(minute)) {
        buckets.set(minute, { normal: 0, suspicious: 0 });
      }
      const bucket = buckets.get(minute)!;
      if (event.isSuspicious) {
        bucket.suspicious++;
      } else {
        bucket.normal++;
      }
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, data]) => ({ timestamp, ...data }));
  }

  async clear(): Promise<void> {
    this.events = [];
  }

  getAll(): TrafficEvent[] {
    return [...this.events];
  }
}
