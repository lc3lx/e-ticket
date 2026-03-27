enum SyriatelEPaymentStatus {
  //From ME
  INIT = 'init',
  //From Syriatel
  SUCCESS = 'Success',
  INVALIDaMMOUNT = 'invalid Amount',
  INVALIDCUSTOMERMSISDN = 'Invalid Customer MSISDN',
  MARCHENTMSISDNNOTACTIVE = 'Merchant MSISDN is not Active',
  MARCHENTMSISDNOTHAVEMARCHENTWALLET = 'Merchant MSISDN does not have Merchant Wallet',
  EXPIREDTRANSACTION = 'Expired Transaction (10 Minutes Have been Passed)',
  PARAMETERNULL = 'one or more parameters are null',
  TECHNICALERROR = 'Technical Error',
  IPORMARCHENTMSISDNNOTDEFINED = 'the caller IP or merchant MSISDN is not defined',
  INACTIVEACCOUNT = 'Inactive Account',
  CUSTOMERGSMNOTALLOWDDURINGTEST = 'the customer GSM is not allowed to pay during test phase',
  INVALIDTOKEN = 'Invalid Token',
}

export default SyriatelEPaymentStatus;
