enum BookTicketStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REJECTEDBYSYSTEMADMIN = 'rejected by system admin',
  CANCELLED = 'cancelled',
  AUTOCANCELLED = 'cancelled automatically',
}

export default BookTicketStatus;
