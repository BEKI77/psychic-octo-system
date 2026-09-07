import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "../../database/db.js";
import { cylinders, cylinderTypes, warehouseLocations, warehouses } from "../../database/schema/index.js";
import type { CreateCylinderInput, CylinderFilters, UpdateCylinderInput } from "./cylinders.schema.js";

const WITH_RELATIONS = {
  cylinderType: true,
  currentWarehouse: true,
  currentLocation: true,
  currentCustomer: true,
} as const;

@Injectable()
export class CylindersService {
  async findAll(filters: CylinderFilters) {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(cylinders.availabilityStatus, filters.status));
    if (filters.condition) conditions.push(eq(cylinders.conditionStatus, filters.condition));
    if (filters.type) conditions.push(eq(cylinders.cylinderTypeId, filters.type));
    if (filters.warehouse) conditions.push(eq(cylinders.currentWarehouseId, filters.warehouse));
    if (filters.location) conditions.push(eq(cylinders.currentLocationId, filters.location));
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(ilike(cylinders.internalCode, term), ilike(cylinders.serialNumber, term)) as SQL,
      );
    }

    return db.query.cylinders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: WITH_RELATIONS,
      orderBy: desc(cylinders.createdAt),
      limit: filters.limit ?? 100,
      offset: filters.offset ?? 0,
    });
  }

  async findOne(id: string) {
    const cylinder = await db.query.cylinders.findFirst({
      where: eq(cylinders.id, id),
      with: WITH_RELATIONS,
    });
    if (!cylinder) throw new NotFoundException("Cylinder not found");
    return cylinder;
  }

  async findByQr(code: string) {
    const cylinder = await db.query.cylinders.findFirst({
      where: eq(cylinders.qrCode, code),
      with: WITH_RELATIONS,
    });
    if (!cylinder) throw new NotFoundException("No cylinder with this QR code");
    return cylinder;
  }

  async findByBarcode(code: string) {
    const cylinder = await db.query.cylinders.findFirst({
      where: eq(cylinders.barcode, code),
      with: WITH_RELATIONS,
    });
    if (!cylinder) throw new NotFoundException("No cylinder with this barcode");
    return cylinder;
  }

  /**
   * §7 Universal Scan Experience — one endpoint for the scanner UI to hit
   * regardless of what kind of code it read (QR, barcode, or a manually
   * typed internal code), since the physical label on a cylinder may carry
   * any of the three. Tries them in the order a scanner is most likely to
   * produce a hit: qrCode -> barcode -> internalCode.
   */
  async lookup(code: string) {
    const cylinder = await db.query.cylinders.findFirst({
      where: or(eq(cylinders.qrCode, code), eq(cylinders.barcode, code), eq(cylinders.internalCode, code)),
      with: WITH_RELATIONS,
    });
    if (!cylinder) throw new NotFoundException("No cylinder matches this code");
    return cylinder;
  }

  private async assertCodesAvailable(input: {
    internalCode?: string;
    serialNumber?: string;
    qrCode?: string | null;
    barcode?: string | null;
  }, excludeId?: string) {
    const checks: Array<[string, string]> = [];
    if (input.internalCode) checks.push(["internal code", input.internalCode]);
    if (input.serialNumber) checks.push(["serial number", input.serialNumber]);
    if (input.qrCode) checks.push(["QR code", input.qrCode]);
    if (input.barcode) checks.push(["barcode", input.barcode]);

    for (const [label, value] of checks) {
      const column =
        label === "internal code"
          ? cylinders.internalCode
          : label === "serial number"
            ? cylinders.serialNumber
            : label === "QR code"
              ? cylinders.qrCode
              : cylinders.barcode;
      const [existing] = await db.select({ id: cylinders.id }).from(cylinders).where(eq(column, value));
      if (existing && existing.id !== excludeId) {
        throw new ConflictException(`A cylinder with this ${label} already exists`);
      }
    }
  }

  private async assertReferencesExist(input: {
    cylinderTypeId?: string;
    currentWarehouseId?: string | null;
    currentLocationId?: string | null;
  }) {
    if (input.cylinderTypeId) {
      const [type] = await db.select().from(cylinderTypes).where(eq(cylinderTypes.id, input.cylinderTypeId));
      if (!type) throw new NotFoundException("Cylinder type not found");
    }
    if (input.currentWarehouseId) {
      const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, input.currentWarehouseId));
      if (!warehouse) throw new NotFoundException("Warehouse not found");
    }
    if (input.currentLocationId) {
      const [location] = await db
        .select()
        .from(warehouseLocations)
        .where(eq(warehouseLocations.id, input.currentLocationId));
      if (!location) throw new NotFoundException("Location not found");
    }
  }

  async create(input: CreateCylinderInput) {
    await this.assertCodesAvailable(input);
    await this.assertReferencesExist(input);

    const [cylinder] = await db.insert(cylinders).values(input).returning();
    return this.findOne(cylinder.id);
  }

  async update(id: string, input: UpdateCylinderInput) {
    await this.findOne(id);
    await this.assertCodesAvailable(input, id);
    await this.assertReferencesExist(input);

    await db
      .update(cylinders)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(cylinders.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await db.delete(cylinders).where(eq(cylinders.id, id));
  }
}
