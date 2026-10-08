import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function generateAlertId(): string {
  return `ALT-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function generateEventId(): string {
  return `EVT-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function generatePredictionId(): string {
  return `PRED-${randomUUID().slice(0, 8).toUpperCase()}`;
}
