import { ForbiddenException, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { userWarehouses } from "../../database/schema/index.js";

/**
 * §66 Phase 8 Multiple Warehouses — opt-in warehouse scoping. A user with
 * zero rows in user_warehouses is unrestricted (every user created before
 * this phase, including the bootstrap admin, has none), so this tightens
 * access only for users an admin has deliberately assigned to specific
 * warehouses — it never silently locks out an existing workflow.
 */
@Injectable()
export class WarehouseAccessService {
  async getAssignedWarehouseIds(userId: string): Promise<string[]> {
    const rows = await db
      .select({ warehouseId: userWarehouses.warehouseId })
      .from(userWarehouses)
      .where(eq(userWarehouses.userId, userId));
    return rows.map((row) => row.warehouseId);
  }

  async assertAccess(userId: string, warehouseId: string) {
    const assigned = await this.getAssignedWarehouseIds(userId);
    if (assigned.length > 0 && !assigned.includes(warehouseId)) {
      throw new ForbiddenException("You are not assigned to this warehouse");
    }
  }
}
