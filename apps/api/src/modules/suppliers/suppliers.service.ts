import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { suppliers } from "../../database/schema/index.js";
import type { CreateSupplierInput, UpdateSupplierInput } from "./suppliers.schema.js";

@Injectable()
export class SuppliersService {
  findAll() {
    return db.select().from(suppliers).orderBy(asc(suppliers.name));
  }

  async findOne(id: string) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    if (!supplier) throw new NotFoundException("Supplier not found");
    return supplier;
  }

  async create(input: CreateSupplierInput) {
    const [existing] = await db.select().from(suppliers).where(eq(suppliers.code, input.code));
    if (existing) throw new ConflictException("A supplier with this code already exists");

    const [supplier] = await db.insert(suppliers).values(input).returning();
    return supplier;
  }

  async update(id: string, input: UpdateSupplierInput) {
    await this.findOne(id);
    const [supplier] = await db
      .update(suppliers)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  async remove(id: string) {
    await this.findOne(id);
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }
}
