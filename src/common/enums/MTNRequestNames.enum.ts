enum MTNRequestNames {
  CREATEINVOICE = 'pos_web/invoice/create',
  GETINVOICE = 'pos_web/invoice/get',
  INITPAYMENT = 'pos_web/payment_phone/initiate',
  CONFIRMPAYMENT = 'pos_web/payment_phone/confirm',
  INITREFUND = 'pos_web/invoice/refund/initiate',
  CONFIRMREFUND = 'pos_web/invoice/refund/confirm ',
  CANCELREFUND = 'pos_web/invoice/refund/cancel ',
}

export default MTNRequestNames;
