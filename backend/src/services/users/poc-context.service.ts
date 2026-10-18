import { PocContextRepository } from "../../repositories/users/poc-context.repository.js";
import type { PocContextResponse } from "../../types/users/poc-context.types.js";

export class PocContextService {
  public constructor(
    private readonly repository: PocContextRepository =
      new PocContextRepository(),
  ) {}

  public async getContext(): Promise<PocContextResponse> {
    const context = await this.repository.getUsersAndDepartments();

    return {
      identityMechanism: "POC_X_USER_ID",
      warning:
        "Development-only identity selection. Production must use real authentication.",
      ...context,
    };
  }
}
