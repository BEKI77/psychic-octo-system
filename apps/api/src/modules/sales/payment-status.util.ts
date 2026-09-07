export type SalePaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";

/** Shared by SalesService (confirm), PaymentsService (void) and ReturnsService (complete). */
export function paymentStatusFor(paid: number, total: number): SalePaymentStatus {
  if (paid <= 0) return "UNPAID";
  if (paid < total) return "PARTIALLY_PAID";
  if (paid === total) return "PAID";
  return "OVERPAID";
}
