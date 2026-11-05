import { toAuthUser, toUserResponse } from "../../users/helpers/user-mapper.helper";
import type { UserRow } from "../../users/users.entity";
import type { UserUsage } from "../types/admin.types";

export const toAdminUserResponse = (row: UserRow, usage: UserUsage | undefined) => ({
  ...toUserResponse(toAuthUser(row)),
  imageCount: usage?.imageCount ?? 0,
  generationCount: usage?.generationCount ?? 0,
  totalCostUsd: usage?.totalCostUsd ?? 0,
});
