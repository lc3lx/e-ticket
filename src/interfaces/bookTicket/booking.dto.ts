class BookTicket {
  eventId!: number;
  userId!: number;
  // usernames!: [string];
  ticketsCount!: number;
  ticketOption!: string;
  discountCode?: string;
  isPaperCopy!: boolean;
  note?: string;
}

export default BookTicket;
