import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { warehouseLocations, warehouses } from "../../database/schema/index.js";
import type { CreateLocationInput, UpdateLocationInput } from "./warehouses.schema.js";

@Injectable()
export class LocationsService {
  async findOne(id: string) {
    const [location] = await db.select().from(warehouseLocations).where(eq(warehouseLocations.id, id));
    if (!location) throw new NotFoundException("Location not found");
    return location;
  }

  async create(warehouseId: string, input: CreateLocationInput) {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, warehouseId));
    if (!warehouse) throw new NotFoundException("Warehouse not found");

    const [existing] = await db
      .select()
      .from(warehouseLocations)
      .where(and(eq(warehouseLocations.warehouseId, warehouseId), eq(warehouseLocations.code, input.code)));
    if (existing) throw new ConflictException("A location with this code already exists in this warehouse");

    if (input.parentId) {
      const parent = await this.findOne(input.parentId);
      if (parent.warehouseId !== warehouseId) {
        throw new ConflictException("Parent location must belong to the same warehouse");
      }
    }

    const [location] = await db
      .insert(warehouseLocations)
      .values({ ...input, warehouseId })
      .returning();
    return location;
  }

  async update(id: string, input: UpdateLocationInput) {
    const current = await this.findOne(id);

    if (input.parentId) {
      if (input.parentId === id) {
        throw new ConflictException("A location cannot be its own parent");
      }
      const parent = await this.findOne(input.parentId);
      if (parent.warehouseId !== current.warehouseId) {
        throw new ConflictException("Parent location must belong to the same warehouse");
      }
    }

    const [location] = await db
      .update(warehouseLocations)
      .set(input)
      .where(eq(warehouseLocations.id, id))
      .returning();
    return location;
  }

  async remove(id: string) {
    await this.findOne(id);
    await db.delete(warehouseLocations).where(eq(warehouseLocations.id, id));
  }
}
