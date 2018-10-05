const INTERBIT = 'interbit'
const CONFIG = 'config'
const CONSUMING = 'consuming'
const PROVIDING = 'providing'
const RECEIVING = 'receiving'
const CHAIN_ID = 'chainId'
const RECEIVED_ACTIONS = 'received-actions'
const SENT_ACTIONS = 'sent-actions'
const PENDING_ACTIONS = 'pending-actions'
const ACTION_STATUS = 'action-status'
const WRITE_JOIN_TASK_ID = 'write-join-task-id'
const PATHS = {
  CONSUMING: [INTERBIT, CONFIG, CONSUMING],
  PROVIDING: [INTERBIT, CONFIG, PROVIDING],
  RECEIVING: [INTERBIT, CONFIG, RECEIVING],
  RECEIVED_ACTIONS: [INTERBIT, RECEIVED_ACTIONS],
  SENT_ACTIONS: [INTERBIT, SENT_ACTIONS],
  WRITE_JOIN_TASK_ID: [INTERBIT, WRITE_JOIN_TASK_ID],
  CHAIN_ID: [INTERBIT, CHAIN_ID]
}

module.exports = {
  PATHS,
  PENDING_ACTIONS,
  ACTION_STATUS
}
