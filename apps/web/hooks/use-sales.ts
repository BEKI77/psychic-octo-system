import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CylinderType } from "./use-cylinder-types";
import type { Customer } from "./use-customers";
import type { Warehouse } from "./use-warehouses";

export type SaleStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";
export type SalePaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";
export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CARD", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

interface SaleUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  cylinderId: string;
  unitPrice: number;
  discount: number;
  subtotal: number;
  cylinder: {
    id: string;
    internalCode: string;
    serialNumber: string;
    availabilityStatus: string;
    conditionStatus: string;
    cylinderType: CylinderType;
  };
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  warehouseId: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: SalePaymentStatus;
  status: SaleStatus;
  customer: Customer;
  warehouse: Warehouse;
  createdByUser: SaleUser;
  approvedByUser: SaleUser | null;
  items: SaleItem[];
}

export interface CreateSaleInput {
  customerId: string;
  warehouseId: string;
  saleDate: string;
}

export interface AddSaleItemInput {
  cylinderId: string;
  unitPrice?: number;
  discount?: number;
}

export interface ConfirmSaleInput {
  discount?: number;
  tax?: number;
  payment?: {
    amount: number;
    method: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  };
  overrideCredit?: boolean;
}

export function useSales(filters: { customerId?: string; status?: SaleStatus } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();

  return useQuery({
    queryKey: ["sales", filters],
    queryFn: () => api.get<Sale[]>(`/sales${query ? `?${query}` : ""}`),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: () => api.get<Sale>(`/sales/${id}`),
    enabled: Boolean(id),
  });
}

function invalidateSale(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["sales"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["sales", id] });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => api.post<Sale>("/sales", input),
    onSuccess: () => invalidateSale(queryClient),
  });
}

export function useAddSaleItem(saleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddSaleItemInput) => api.post<SaleItem>(`/sales/${saleId}/items`, input),
    onSuccess: () => invalidateSale(queryClient, saleId),
  });
}

export function useRemoveSaleItem(saleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/sales/${saleId}/items/${itemId}`),
    onSuccess: () => invalidateSale(queryClient, saleId),
  });
}

export function useConfirmSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ConfirmSaleInput & { id: string }) =>
      api.post<Sale>(`/sales/${id}/confirm`, input),
    onSuccess: (_data, variables) => {
      invalidateSale(queryClient, variables.id);
      queryClient.invalidateQueries({ queryKey: ["cylinders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useCancelSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Sale>(`/sales/${id}/cancel`),
    onSuccess: (_data, id) => invalidateSale(queryClient, id),
  });
}
