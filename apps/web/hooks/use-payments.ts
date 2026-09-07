import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaymentMethod } from "./use-sales";

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  amount: number;
  unallocatedAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber: string | null;
  notes: string | null;
  status: "COMPLETED" | "VOIDED";
  customer: { id: string; customerCode: string; name: string };
  receivedByUser: { id: string; username: string };
  allocations: {
    id: string;
    allocatedAmount: number;
    sale: { id: string; saleNumber: string; total: number; outstandingAmount: number };
  }[];
}

export interface CreatePaymentInput {
  customerId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
}

export interface AllocatePaymentInput {
  allocations: { saleId: string; amount: number }[];
}

export function usePayments(customerId?: string) {
  const query = customerId ? `?customerId=${customerId}` : "";
  return useQuery({
    queryKey: ["payments", { customerId }],
    queryFn: () => api.get<Payment[]>(`/payments${query}`),
  });
}

function invalidatePayments(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["payments"] });
  queryClient.invalidateQueries({ queryKey: ["sales"] });
  queryClient.invalidateQueries({ queryKey: ["customers"] });
  queryClient.invalidateQueries({ queryKey: ["reports"] });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => api.post<Payment>("/payments", input),
    onSuccess: () => invalidatePayments(queryClient),
  });
}

export function useAllocatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: AllocatePaymentInput & { id: string }) =>
      api.post<Payment>(`/payments/${id}/allocate`, input),
    onSuccess: () => invalidatePayments(queryClient),
  });
}

export function useVoidPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Payment>(`/payments/${id}/void`),
    onSuccess: () => invalidatePayments(queryClient),
  });
}
