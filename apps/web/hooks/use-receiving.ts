import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CylinderType } from "./use-cylinder-types";
import type { ConditionStatus } from "./use-cylinders";
import type { Location, Warehouse } from "./use-warehouses";
import type { Supplier } from "./use-suppliers";

export type ReceiptStatus = "DRAFT" | "PENDING_APPROVAL" | "RECEIVED" | "CANCELLED";

interface ReceiptUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface ReceiptItem {
  id: string;
  receiptId: string;
  cylinderId: string;
  locationId: string | null;
  conditionStatus: ConditionStatus;
  notes: string | null;
  cylinder: {
    id: string;
    internalCode: string;
    serialNumber: string;
    availabilityStatus: string;
    conditionStatus: ConditionStatus;
    cylinderType: CylinderType;
  };
  location: Location | null;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  supplierId: string;
  warehouseId: string;
  supplierReference: string | null;
  receivedDate: string;
  status: ReceiptStatus;
  notes: string | null;
  supplier: Supplier;
  warehouse: Warehouse;
  createdByUser: ReceiptUser;
  approvedByUser: ReceiptUser | null;
  items: ReceiptItem[];
}

export interface CreateReceiptInput {
  supplierId: string;
  warehouseId: string;
  supplierReference?: string;
  receivedDate: string;
  notes?: string;
}

export interface AddReceiptItemInput {
  cylinderId?: string;
  newCylinder?: {
    cylinderTypeId: string;
    internalCode: string;
    serialNumber: string;
    qrCode?: string;
    barcode?: string;
  };
  locationId?: string;
  conditionStatus?: ConditionStatus;
  notes?: string;
}

export function useReceipts() {
  return useQuery({ queryKey: ["receipts"], queryFn: () => api.get<Receipt[]>("/receipts") });
}

export function useReceipt(id: string) {
  return useQuery({
    queryKey: ["receipts", id],
    queryFn: () => api.get<Receipt>(`/receipts/${id}`),
    enabled: Boolean(id),
  });
}

function invalidateReceipt(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["receipts"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["receipts", id] });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReceiptInput) => api.post<Receipt>("/receipts", input),
    onSuccess: () => invalidateReceipt(queryClient),
  });
}

export function useAddReceiptItem(receiptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddReceiptItemInput) => api.post<ReceiptItem>(`/receipts/${receiptId}/items`, input),
    onSuccess: () => invalidateReceipt(queryClient, receiptId),
  });
}

export function useRemoveReceiptItem(receiptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/receipts/${receiptId}/items/${itemId}`),
    onSuccess: () => invalidateReceipt(queryClient, receiptId),
  });
}

export function useConfirmReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Receipt>(`/receipts/${id}/confirm`),
    onSuccess: (_data, id) => {
      invalidateReceipt(queryClient, id);
      queryClient.invalidateQueries({ queryKey: ["cylinders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useCancelReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Receipt>(`/receipts/${id}/cancel`),
    onSuccess: (_data, id) => invalidateReceipt(queryClient, id),
  });
}
