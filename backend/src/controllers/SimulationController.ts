import { Request, Response } from 'express';
import { SimulationService } from '../services/SimulationService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class SimulationController {
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;
  private startedAt: string | null = null;
  private readonly intervalMs = 3000;

  constructor(private simulationService: SimulationService) {}

  async start(req: Request, res: Response): Promise<void> {
    try {
      if (this.running) {
        sendSuccess(res, {
          running: true,
          mode: 'development-simulation',
          interval: this.intervalMs,
          startedAt: this.startedAt,
          message: 'Simulation is already running',
        });
        return;
      }

      this.running = true;
      this.startedAt = new Date().toISOString();

      this.intervalId = setInterval(async () => {
        try {
          await this.simulationService.generateMixedBatch();
        } catch (error) {
          logger.error('Simulation batch error', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }, this.intervalMs);

      logger.info('Simulation started', { interval: this.intervalMs });

      sendSuccess(res, {
        running: true,
        mode: 'development-simulation',
        interval: this.intervalMs,
        startedAt: this.startedAt,
        message: 'Simulation started',
      });
    } catch (error) {
      sendError(res, 'SIMULATION_ERROR', 'Failed to start simulation', 500);
    }
  }

  async stop(req: Request, res: Response): Promise<void> {
    try {
      if (!this.running) {
        sendSuccess(res, {
          running: false,
          mode: 'development-simulation',
          message: 'Simulation is already stopped',
        });
        return;
      }

      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      this.running = false;
      const stoppedAt = new Date().toISOString();

      logger.info('Simulation stopped', { stoppedAt });

      sendSuccess(res, {
        running: false,
        mode: 'development-simulation',
        startedAt: this.startedAt,
        stoppedAt,
        message: 'Simulation stopped',
      });
      this.startedAt = null;
    } catch (error) {
      sendError(res, 'SIMULATION_ERROR', 'Failed to stop simulation', 500);
    }
  }

  async status(req: Request, res: Response): Promise<void> {
    sendSuccess(res, {
      running: this.running,
      mode: 'development-simulation',
      interval: this.intervalMs,
      startedAt: this.startedAt,
    });
  }
}
