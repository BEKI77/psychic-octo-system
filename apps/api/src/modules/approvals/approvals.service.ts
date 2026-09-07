/**
 * §66 Phase 8 Approvals — a generic pending-approval queue. Deliberately
 * NOT wired directly into each domain module's state machine (e.g.
 * ReturnsService doesn't import ApprovalsService's "complete a return"
 * logic into itself); instead each domain module that can produce an
 * approval-gated action registers a handler for its own `type` string via
 * `registerHandler`, and this service calls back into it once a reviewer
 * approves. That keeps the dependency direction one-way (domain module ->
 * ApprovalsModule) with no import cycle, and keeps this service ignorant of
 * what a "LARGE_RETURN" approval actually *does* when granted — see
 * ReturnsModule's `onModuleInit` for the one handler registered so far.
 */
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../database/db.js";
import { approvalRequests } from "../../database/schema/index.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import type { ApprovalFilters } from "./approvals.schema.js";

type ApprovalHandler = (entityId: string, approverId: string) => Promise<unknown>;

const WITH_RELATIONS = {
  requestedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
  reviewedByUser: { columns: { id: true, username: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class ApprovalsService {
  private readonly handlers = new Map<string, ApprovalHandler>();

  constructor(private readonly notificationsService: NotificationsService) {}

  /** Called once at module init by whichever domain module owns `type` (e.g. ReturnsModule for "LARGE_RETURN"). */
  registerHandler(type: string, handler: ApprovalHandler) {
    this.handlers.set(type, handler);
  }

  findAll(filters: ApprovalFilters = {}) {
    const conditions = [];
    if (filters.status) conditions.push(eq(approvalRequests.status, filters.status));
    if (filters.type) conditions.push(eq(approvalRequests.type, filters.type));
    if (filters.entityType) conditions.push(eq(approvalRequests.entityType, filters.entityType));
    if (filters.entityId) conditions.push(eq(approvalRequests.entityId, filters.entityId));

    return db.query.approvalRequests.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: WITH_RELATIONS,
      orderBy: desc(approvalRequests.createdAt),
    });
  }

  async findOne(id: string) {
    const request = await db.query.approvalRequests.findFirst({
      where: eq(approvalRequests.id, id),
      with: WITH_RELATIONS,
    });
    if (!request) throw new NotFoundException("Approval request not found");
    return request;
  }

  /** Returns an already-PENDING request for this entity+type if one exists, so re-triggering never duplicates it. */
  async findPendingFor(type: string, entityType: string, entityId: string) {
    return db.query.approvalRequests.findFirst({
      where: and(
        eq(approvalRequests.type, type),
        eq(approvalRequests.entityType, entityType),
        eq(approvalRequests.entityId, entityId),
        eq(approvalRequests.status, "PENDING"),
      ),
    });
  }

  async create(input: {
    type: string;
    entityType: string;
    entityId: string;
    requestedBy: string;
    reason?: string;
    payload?: unknown;
  }) {
    const existing = await this.findPendingFor(input.type, input.entityType, input.entityId);
    if (existing) return existing;

    const [created] = await db
      .insert(approvalRequests)
      .values({ ...input, payload: input.payload ?? null })
      .returning();

    await this.notificationsService.notifyByPermission("APPROVAL_REVIEW", {
      type: "APPROVAL_REQUESTED",
      title: "Approval requested",
      message: input.reason ?? `A ${input.type} request needs review.`,
      entityType: "approval_requests",
      entityId: created.id,
    });

    return created;
  }

  async approve(id: string, approverId: string, reviewNotes?: string) {
    const request = await this.findOne(id);
    if (request.status !== "PENDING") {
      throw new ConflictException(`Approval request is ${request.status}, not PENDING`);
    }

    const handler = this.handlers.get(request.type);
    if (!handler) throw new ConflictException(`No handler registered for approval type "${request.type}"`);

    // Run the real side effect first — if it throws, the request stays
    // PENDING (safe to retry) rather than being marked APPROVED for
    // something that never actually happened.
    await handler(request.entityId, approverId);

    await db
      .update(approvalRequests)
      .set({ status: "APPROVED", reviewedBy: approverId, reviewNotes, reviewedAt: new Date() })
      .where(eq(approvalRequests.id, id));

    await this.notificationsService.notify({
      userId: request.requestedBy,
      type: "APPROVAL_DECIDED",
      title: "Approval granted",
      message: `Your ${request.type} request was approved.`,
      entityType: request.entityType,
      entityId: request.entityId,
    });

    return this.findOne(id);
  }

  async reject(id: string, approverId: string, reviewNotes?: string) {
    const request = await this.findOne(id);
    if (request.status !== "PENDING") {
      throw new ConflictException(`Approval request is ${request.status}, not PENDING`);
    }

    await db
      .update(approvalRequests)
      .set({ status: "REJECTED", reviewedBy: approverId, reviewNotes, reviewedAt: new Date() })
      .where(eq(approvalRequests.id, id));

    await this.notificationsService.notify({
      userId: request.requestedBy,
      type: "APPROVAL_DECIDED",
      title: "Approval rejected",
      message: reviewNotes ? `Your ${request.type} request was rejected: ${reviewNotes}` : `Your ${request.type} request was rejected.`,
      entityType: request.entityType,
      entityId: request.entityId,
    });

    return this.findOne(id);
  }
}
