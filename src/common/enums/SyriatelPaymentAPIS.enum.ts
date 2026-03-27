enum SyriatelPaymentAPIS {
  GETTOKEN = 'https://merchants.syriatel.sy:1443/ePayment_external_Json/rs/ePaymentExternalModule/getToken',
  PAYMENTREQUEST = 'https://merchants.syriatel.sy:1443/ePayment_external_Json/rs/ePaymentExternalModule/paymentRequest',
  PAYMENTCONFIRM = 'https://merchants.syriatel.sy:1443/ePayment_external_Json/rs/ePaymentExternalModule/paymentConfirmation',
  RESENDCODE = 'https://merchants.syriatel.sy:1443/ePayment_external_Json/rs/ePaymentExternalModule/resendOTP',
}

export default SyriatelPaymentAPIS;
