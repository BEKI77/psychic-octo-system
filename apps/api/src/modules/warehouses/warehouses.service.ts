import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { warehouses } from "../../database/schema/index.js";
import type { CreateWarehouseInput, UpdateWarehouseInput } from "./warehouses.schema.js";

@Injectable()
export class WarehousesService {
  findAll() {
    return db.query.warehouses.findMany({
      with: { locations: { orderBy: (t, { asc }) => asc(t.code) } },
      orderBy: asc(warehouses.name),
    });
  }

  async findOne(id: string) {
    const warehouse = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
      with: { locations: { orderBy: (t, { asc }) => asc(t.code) } },
    });
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    return warehouse;
  }

  async create(input: CreateWarehouseInput) {
    const [existing] = await db.select().from(warehouses).where(eq(warehouses.code, input.code));
    if (existing) throw new ConflictException("A warehouse with this code already exists");

    const [warehouse] = await db.insert(warehouses).values(input).returning();
    return this.findOne(warehouse.id);
  }

  async update(id: string, input: UpdateWarehouseInput) {
    await this.findOne(id);
    await db
      .update(warehouses)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(warehouses.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await db.delete(warehouses).where(eq(warehouses.id, id));
  }
}
