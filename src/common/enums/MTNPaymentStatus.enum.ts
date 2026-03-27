enum MTNPaymentStatus {
  InvoiceStatusCanceled = '0 Invoice was canceled by the terminal',
  InvoiceStatusActive = '1 Invoice waits auth token',
  InvoiceStatusProcessing = '5 Authorisation in processing',
  InvoiceStatusSuccess = '9 Invoice paid successfully',
  InvoiceStatusFail = '8 Operation ended fail',
}

export default MTNPaymentStatus;
