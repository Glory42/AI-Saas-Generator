import { isDatabaseReachable } from "../../infrastructure/database/db";

export class HealthService {
  static isDatabaseUp(): Promise<boolean> {
    return isDatabaseReachable();
  }
}
