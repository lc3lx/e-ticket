enum SyriatelPaymentTestAPIS {
  GETTOKEN = 'https://merchants.syriatel.sy:1443/ePayment_external_Json_test/rs/ePaymentExternalModule/getToken',
  PAYMENTREQUEST = 'https://merchants.syriatel.sy:1443/ePayment_external_Json_test/rs/ePaymentExternalModule/paymentRequest',
  PAYMENTCONFIRM = 'https://merchants.syriatel.sy:1443/ePayment_external_Json_test/rs/ePaymentExternalModule/paymentConfirmation',
  RESENDCODE = 'https://merchants.syriatel.sy:1443/ePayment_external_Json_test/rs/ePaymentExternalModule/resendOTP',
}

export default SyriatelPaymentTestAPIS;
