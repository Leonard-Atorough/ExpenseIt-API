export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  details?: Record<string, CheckResult>;
}

export interface CheckResult {
  status: "healthy" | "unhealthy";
  timestamp: string;
  message?: string;
}

export default class HealthcheckProvider {
  private checks: Map<string, () => Promise<CheckResult>>;
  private currentStatus: HealthStatus;
  private intervalMs: number;
  private intervalId?: NodeJS.Timeout;

  TIMEOUT_MS = 10000; // 10 seconds timeout for each check

  private statusHistory: HealthStatus[] = [];

  constructor(intervalMs: number = 30000) {
    this.checks = new Map<string, () => Promise<CheckResult>>();
    this.currentStatus = { status: "healthy", timestamp: new Date().toISOString(), details: {} };
    this.intervalMs = intervalMs;
  }

  withTimeout = (promise: Promise<CheckResult>, ms: number) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
    ]);

  registerCheck(name: string, checkFn: () => Promise<CheckResult>) {
    this.checks.set(name, checkFn);
  }

  async runChecks() {
    const results = await Promise.allSettled(
      Array.from(this.checks.entries()).map(([name, checkFn]) =>
        this.withTimeout(checkFn(), this.TIMEOUT_MS).catch((err) => ({
          status: "rejected",
          reason: { name, error: err instanceof Error ? err.message : String(err) },
        })),
      ),
    );

    const now = new Date().toISOString();
    const details: Record<string, CheckResult> = {};

    results.forEach((result, index) => {
      const checkName = Array.from(this.checks.keys())[index];
      if (result.status === "fulfilled") {
        details[checkName] = { status: "healthy", timestamp: now }; // TODO: fix the status masking issue here
      } else {
        details[checkName] = { status: "unhealthy", timestamp: now, message: result.reason.error };
      }
    });
    if (results.every((result) => result.status === "rejected")) {
      this.currentStatus = {
        status: "unhealthy",
        timestamp: now,
      };
    } else if (results.some((result) => result.status === "rejected")) {
      this.currentStatus = {
        status: "degraded",
        timestamp: now,
      };
    } else {
      this.currentStatus = {
        status: "healthy",
        timestamp: now,
      };
    }
    this.currentStatus = { ...this.currentStatus, details };

    this.statusHistory.push(this.currentStatus);
  }

  getHealthStatus() {
    return {
      ...this.currentStatus,
    };
  }

  startHealthChecks() {
    if (this.intervalId) {
      return; // Already running
    }

    this.runChecks();
    this.intervalId = setInterval(() => this.runChecks(), this.intervalMs);
  }

  stopHealthChecks() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
