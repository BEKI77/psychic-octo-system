import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CreditAgingRow {
  customerId: string;
  customerCode: string;
  customerName: string;
  bucket0to30: number;
  bucket31to60: number;
  bucket61to90: number;
  bucket90plus: number;
  total: number;
}

export interface CustomerBalanceRow {
  customerId: string;
  customerCode: string;
  customerName: string;
  creditLimit: number;
  creditEnabled: boolean;
  balance: number;
}

export interface SalesReport {
  summary: {
    count: number;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paidAmount: number;
    outstandingAmount: number;
  };
  byDay: { day: string; count: number; total: number }[];
}

export interface PaymentsReport {
  summary: { count: number; totalAmount: number };
  byMethod: { method: string; count: number; total: number }[];
}

export interface InventoryReportRow {
  cylinderTypeId: string;
  cylinderTypeCode: string;
  cylinderTypeName: string;
  total: number;
  available: number;
  customer: number;
  repair: number;
  damaged: number;
}

export interface CylinderAccountability {
  total: number;
  warehouse: number;
  customers: number;
  repair: number;
  inspection: number;
  scrap: number;
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
  customerId?: string;
}

function toQuery(filters: DateRangeFilter) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useCreditAgingReport() {
  return useQuery({
    queryKey: ["reports", "credit-aging"],
    queryFn: () => api.get<CreditAgingRow[]>("/reports/credit-aging"),
  });
}

export function useCustomerBalancesReport() {
  return useQuery({
    queryKey: ["reports", "customer-balances"],
    queryFn: () => api.get<CustomerBalanceRow[]>("/reports/customer-balances"),
  });
}

export function useSalesReport(filters: DateRangeFilter) {
  return useQuery({
    queryKey: ["reports", "sales", filters],
    queryFn: () => api.get<SalesReport>(`/reports/sales${toQuery(filters)}`),
  });
}

export function usePaymentsReport(filters: DateRangeFilter) {
  return useQuery({
    queryKey: ["reports", "payments", filters],
    queryFn: () => api.get<PaymentsReport>(`/reports/payments${toQuery(filters)}`),
  });
}

export function useInventoryReport() {
  return useQuery({
    queryKey: ["reports", "inventory"],
    queryFn: () => api.get<InventoryReportRow[]>("/reports/inventory"),
  });
}

export function useCylinderAccountabilityReport() {
  return useQuery({
    queryKey: ["reports", "cylinder-accountability"],
    queryFn: () => api.get<CylinderAccountability>("/reports/cylinder-accountability"),
  });
}
