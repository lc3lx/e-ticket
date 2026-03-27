enum MTNPaymentAPIS {
  CREATEINVOICE = 'https://cashmobile.mtnsyr.com:9000/pos_web/invoice/create',
  GETINVOICE = 'https://cashmobile.mtnsyr.com:9000/pos_web/invoice/get',
  INITPAYMENT = 'https://cashmobile.mtnsyr.com:9000/pos_web/payment_phone/initiate',
  CONFIRMPAYMENT = 'https://cashmobile.mtnsyr.com:9000/pos_web/payment_phone/confirm',
  INITREFUND = 'https://cashmobile.mtnsyr.com:9000/pos_web/invoice/refund/initiate',
  CONFIRMREFUND = 'https://cashmobile.mtnsyr.com:9000/pos_web/invoice/refund/confirm',
  CANCELREFUND = 'https://cashmobile.mtnsyr.com:9000/pos_web/invoice/refund/cancel',
}

export default MTNPaymentAPIS;
