export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  SUCCESS: 'success',
  FAILED: 'failed',
  COMPLETED: 'completed',
  PENDING_RETRY: 'pending_retry', // status of send red packet 
  RETRYING: 'retrying', // status of send red packet 

};

export const TRANSACTION_TYPE = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  WITHDRAW_RED_PACKET: 'withdraw_red_packet'
};
