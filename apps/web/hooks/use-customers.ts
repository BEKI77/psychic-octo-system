import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CylinderType } from "./use-cylinder-types";
import type { Location, Warehouse } from "./use-warehouses";

export const CUSTOMER_TYPES = ["INDIVIDUAL", "BUSINESS", "WHOLESALE", "DISTRIBUTOR", "RETAIL"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CUSTOMER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  customerType: CustomerType;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  creditLimit: number;
  creditEnabled: boolean;
  status: CustomerStatus;
}

export interface CustomerCredit {
  creditLimit: number;
  creditEnabled: boolean;
  currentCredit: number;
  availableCredit: number;
}

export interface CustomerHolding {
  id: string;
  internalCode: string;
  serialNumber: string;
  availabilityStatus: string;
  conditionStatus: string;
  cylinderType: CylinderType;
  currentWarehouse: Warehouse | null;
  currentLocation: Location | null;
}

export interface CustomerTransaction {
  id: string;
  transactionNumber: string;
  transactionType: string;
  transactionDate: string;
  cylinder: { id: string; internalCode: string; serialNumber: string };
  performedByUser: { id: string; username: string };
}

export type LedgerTransactionType =
  | "SALE"
  | "PAYMENT"
  | "RETURN"
  | "REFUND"
  | "ADJUSTMENT"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE";

export interface LedgerEntry {
  id: string;
  transactionType: LedgerTransactionType;
  referenceType: string | null;
  referenceId: string | null;
  debit: number;
  credit: number;
  balance: number;
  notes: string | null;
  transactionDate: string;
  createdByUser: { id: string; username: string };
}

export interface CustomerInput {
  customerCode?: string;
  name?: string;
  customerType?: CustomerType;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  creditLimit?: number;
  creditEnabled?: boolean;
  status?: CustomerStatus;
}

export function useCustomers() {
  return useQuery({ queryKey: ["customers"], queryFn: () => api.get<Customer[]>("/customers") });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCustomerCredit(id: string) {
  return useQuery({
    queryKey: ["customers", id, "credit"],
    queryFn: () => api.get<CustomerCredit>(`/customers/${id}/credit`),
    enabled: Boolean(id),
  });
}

export function useCustomerCylinders(id: string) {
  return useQuery({
    queryKey: ["customers", id, "cylinders"],
    queryFn: () => api.get<CustomerHolding[]>(`/customers/${id}/cylinders`),
    enabled: Boolean(id),
  });
}

export function useCustomerTransactions(id: string) {
  return useQuery({
    queryKey: ["customers", id, "transactions"],
    queryFn: () => api.get<CustomerTransaction[]>(`/customers/${id}/transactions`),
    enabled: Boolean(id),
  });
}

export function useCustomerLedger(id: string) {
  return useQuery({
    queryKey: ["customers", id, "ledger"],
    queryFn: () => api.get<LedgerEntry[]>(`/customers/${id}/ledger`),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => api.post<Customer>("/customers", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: CustomerInput & { id: string }) =>
      api.patch<Customer>(`/customers/${id}`, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", variables.id] });
    },
  });
}
