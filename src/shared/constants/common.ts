import { ReplicationMode } from 'typeorm';

export const REQUEST_ID_TOKEN_HEADER = 'x-request-id';
export const FORWARDED_FOR_TOKEN_HEADER = 'x-forwarded-for';

export const VALIDATION_PIPE_OPTIONS = { transform: true, whitelist: true };

export const MOCK_KEY_LENGTH = 32;
export const MOCK_HASH_LENNGTH = 64;
export const MOCK_ADDRESS_LENGTH = 42;
export const MOCK_UNSIGNED_LENGTH = 256;
export const MOCK_SIGNED_LENGTH = 512;
export const SEED_PHARSE_WORDS_COUNT = 12;

export const FIVE_SECONDS = 5 * 1000;
export const TEN_SECONDS = 10 * 1000;
export const ONE_MINUTE = 60 * 1000;
export const MUMBAI_TESTNET_CHAINID = '80001';
export const EURUS_TESTNET_CHAINID = '1984';

export const DISPLAY_ON_MY_SELF = 'You';
export const MAX_MEMBER_PER_GROUP = 100;

export const CHAT_ROOM_STATUS = {
  CREATED: 'created',
  DEPLOYED: 'deployed',
  PAUSED: 'paused',
  FAILED: 'failed',
  CANCEL: 'cancel',
  BLOCKED: 'blocked',
};

export const MEMBER_IN_ROOM_STATUS = {
  JOINED: 'joined',
  PENDING_APPROVAL: 'pending_approval',
  INVITED: 'invited',
  CANCEL: 'cancel',
  OUT: 'out',
};

export const NOT_MEMBER_IN_ROOM_STATUS = {
  CANCEL: 'cancel',
  OUT: 'out',
};

export const MEMBER_IN_ROOM_ROLE = {
  MEMBER: 'member',
  ADMIN: 'admin',
  OWNER: 'owner',
};

export const MESSAGE_TYPE = {
  TEXT: 'text',
  ATTACHMENTS: 'attachments',
  IMAGE: 'image',
  VIDEO: 'video',
  VOICE_RECORD: 'voice_record',
  SEND_TOKEN: 'send_token',
  ROOM_NOTIFICATION: 'room_notification',
  ROOM_ACTION: 'room_action',
  SYSTEM: 'system',
  FILE: 'file',
};

export const MESSAGE_FILE_TYPE = [
  MESSAGE_TYPE.ATTACHMENTS,
  MESSAGE_TYPE.IMAGE,
  MESSAGE_TYPE.VIDEO,
  MESSAGE_TYPE.VOICE_RECORD,
  MESSAGE_TYPE.FILE,
];

export const MESSAGE_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  HIDDEN: 'hidden',
  // RETRIEVE: 'retrieve',
  PENDING_RETRY: 'pending_retry',
  RETRYING: 'retrying',
};

export const GAS_FEE_LEVEL = {
  SLOW: 'slow',
  MEDIUM: 'medium',
  FAST: 'fast',
};

export const MAX_MESSAGE_LENGTH = 20 * 1000;
export const SOCKET_TYPE = {
  TRANSACTION_UPDATE: 'transaction_update',
  NEW_MESSAGE: 'new_message',
  MESSAGE_STATUS_CHANGED: 'message_status_changed',
  ROOM_CHANGED: 'room_changed',
  MEMBER_IN_ROOM_CHANGED: 'member_in_room_changed',
  ROOM_INVITATION: 'room_invitation',
  PIN_MESSAGE: 'pin_message',
  MESSAGE_RETRIEVE: 'message_retrieve',
};

export const BLOCKCHAINTX_REFTABLE = {
  TRANSACTION: 'transaction',
  MESSAGE: 'message',
};

export const HISTORY_TITLE = {
  RECIVED: 'Received',
  SENT: 'Sent',
  RECIVE: 'Receive', // update design
  SEND: 'Send', // update design
  ADD_MEMBER: 'Add member',
  REMOVE_MEMBER: 'Remove member',
  LEAVE_GROUP: 'Leave Group',
  REMOVE_ADMIN: 'Remove admin',
  SET_ADMIN: 'Set admin',
  CREATE_GROUP_CHAT: 'Create group chat',
  CHANGE_GROUP_NAME: 'Change group name',
  SEND_MESSAGE: 'Send Message',
  SEND_ATTACHMENT: 'Send attachment',
  SEND_IMAGE: 'Send image',
  SEND_VIDEO: 'Send video',
  SEND_VOICE_RECORD: 'Send voice record',
  SEND_MULTIMEDIA: 'Send Multimedia',
  SEND_RED_PACKET: 'Send red packet',
};

export const IN_CHAT_NOTIFICATION_MID_CONTENT = {
  CREATED_THE_GROUP: 'created the group',
  CHANGED_GROUP_NAME_TO: 'changed group name to',
  JOINED_THE_GROUP: 'joined the group',
  LEFT_THE_GROUP: 'left the group',
  REMOVED: 'removed',
  SET_ADMIN_ROLE_TO: 'set admin role to',
  REMOVED_ADMIN_ROLE_FROM: 'removed admin role from',
};

export const TRANSACTION_TYPES = {
  CREATE_GROUP_CHAT: 'CREATE_GROUP_CHAT',
  CHANGE_GROUP_NAME: 'CHANGE_GROUP_NAME',
  SEND_MESSAGE_TO_GROUP: 'SEND_MESSAGE_TO_GROUP',
  ACCEPT_JOIN_GROUP: 'ACCEPT_JOIN_GROUP',
  ADD_MEMBERS: 'ADD_MEMBERS',
  REMOVE_MEMBERS: 'REMOVE_MEMBERS',
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  REJECT_JOIN_GROUP: 'REJECT_JOIN_GROUP',
  SET_ADMIN: 'SET_ADMIN',
  REMOVE_ADMIN: 'REMOVE_ADMIN',
  SEND_MESSSAGE_TO_PEER: 'SEND_MESSSAGE_TO_PEER',
  SEND_TOKEN: 'SEND_TOKEN',
};

export const CHAT_TRANSACTION_METHODS = {
  CREATE_GROUP_CHAT: 'CreateGroupChat',
  CHANGE_GROUP_NAME: 'ChangeGroupName',
  ADD_MEMBERS: 'AddMembers',
  REMOVE_MEMBERS: 'RemoveMembers',
  ACCEPT_JOIN_GROUP: 'AcceptJoinGroup',
  LEAVE_ROOM: 'LeaveGroup',
};

export const MAX_RETRY_COUNT = 5;
export const MAX_KEEP_FAILED_JOB_COUNT = 1000;

export const MAX_KEPT_FAILED_JOB_COUNT = 1000;
export const JOB_OPTIONS = {
  attempts: MAX_RETRY_COUNT,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: MAX_KEPT_FAILED_JOB_COUNT,
};

export const MIN_REMAINING_TOKEN_AMOUNT = 0.01;

export const CHECK_SUFFICIENT_FUND_MSG = {
  INSUFFICIENT_BALANCE: 'Insufficient balance',
};

export const REPLICATION_MODE: {
  [key: string]: ReplicationMode;
} = {
  SLAVE: 'slave',
  MASTER: 'master',
};

export const SUPPORTED_FILE_TYPE = ['image/jpg', 'image/jpeg', 'image/png'];

export const BALANCE_DECIMAL_PLACES = 6;
export const WALLET_HD_PATH = "m/44'/60'/0'/0/";

export const SPAM_REPORT_STATUS = {
  CREATED: 'created',
};

export const SPAM_REPORT_TYPE = {
  SPAM: 'spam',
};

export const BLOCKCHAIN_TX_STATUS = {
  UNVERIFIED: 'unverified',
  VERIFIED: 'verified',
};
