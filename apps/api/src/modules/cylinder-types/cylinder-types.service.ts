import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { cylinderTypes } from "../../database/schema/index.js";
import type { CreateCylinderTypeInput, UpdateCylinderTypeInput } from "./cylinder-types.schema.js";

@Injectable()
export class CylinderTypesService {
  findAll() {
    return db.select().from(cylinderTypes).orderBy(asc(cylinderTypes.name));
  }

  async findOne(id: string) {
    const [type] = await db.select().from(cylinderTypes).where(eq(cylinderTypes.id, id));
    if (!type) throw new NotFoundException("Cylinder type not found");
    return type;
  }

  async create(input: CreateCylinderTypeInput) {
    const [existing] = await db.select().from(cylinderTypes).where(eq(cylinderTypes.code, input.code));
    if (existing) throw new ConflictException("A cylinder type with this code already exists");

    const [type] = await db.insert(cylinderTypes).values(input).returning();
    return type;
  }

  async update(id: string, input: UpdateCylinderTypeInput) {
    await this.findOne(id);
    const [type] = await db
      .update(cylinderTypes)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(cylinderTypes.id, id))
      .returning();
    return type;
  }

  async remove(id: string) {
    await this.findOne(id);
    await db.delete(cylinderTypes).where(eq(cylinderTypes.id, id));
  }
}
