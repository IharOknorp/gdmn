import { IEntityInsertInspector, IEntityUpdateInspector, IEntityDeleteInspector, IEntityQueryInspector, IEntityQueryResponse, IERModel } from 'gdmn-orm';

import { IReceivedErrorMeta, TPublishMessageMeta, TReceivedMessageMeta } from './protocol';

export enum TGdmnTopic {
  TASK = '/task',
  TASK_STATUS = '/task/status',
  TASK_PROGRESS = '/task/progress'
}

// MESSAGES META

// type TGdmnActionType = TTaskActionNames;
export type TGdmnPublishMessageMeta = TPublishMessageMeta<TTaskActionNames>;
export type TGdmnReceivedMessageMeta = TReceivedMessageMeta<TTaskActionNames>;
export type TGdmnReceivedErrorMeta = IReceivedErrorMeta<TGdmnErrorCodes>;

// -- error
export const enum TGdmnErrorCodes {
  INTERNAL = '0',
  UNSUPPORTED = '1',
  UNAUTHORIZED = '2',
  INVALID = '3',
  NOT_FOUND = '4',
  NOT_UNIQUE = '5'
}
// -- task
export const enum TTaskActionNames {
  DEMO = 'DEMO',
  QUERY = 'QUERY',
  SQL_QUERY = 'SQL_QUERY',
  PREPARE_QUERY = 'PREPARE_QUERY',
  PREPARE_SQL_QUERY = 'PREPARE_SQL_QUERY',
  FETCH_QUERY = 'FETCH_QUERY',
  FETCH_SQL_QUERY = 'FETCH_SQL_QUERY',
  INTERRUPT = 'INTERRUPT',
  RELOAD_SCHEMA = 'RELOAD_SCHEMA',
  PING = 'PING',
  GET_SCHEMA = 'GET_SCHEMA',
  DEFINE_ENTITY = 'DEFINE_ENTITY',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  DELETE_APP = 'DELETE_APP',
  CREATE_APP = 'CREATE_APP',
  GET_APPS = 'GET_APPS'
}

// MESSAGES DATA

export interface IGdmnMessageData<TPayload = any> {
  payload: TPayload;
}

export interface IGdmnMessageReply<TResult = any, TPayload = any, TErrorCode = string> extends IGdmnMessageData<TPayload> {
  result: TResult;
  error: IGdmnMessageError<TErrorCode>;
}

export interface IGdmnMessageError<TErrorCode = string> {
  code: TErrorCode;
  message: string;
}

// -- TASK-ACTION
// pub: /task

export type TTaskActionMessageData<TActionName extends keyof TTaskActionPayloadTypes> = IGdmnMessageData<
  TTaskActionPayloadTypes[TActionName]
>;

export interface TTaskActionPayloadTypes {
  [TTaskActionNames.DEMO]: {
    withError: boolean;
  };
  [TTaskActionNames.QUERY]: {
    query: IEntityQueryInspector;
  };
  [TTaskActionNames.SQL_QUERY]: {
    select: string;
    params: {[alias: string]: any}
  };
  [TTaskActionNames.PREPARE_QUERY]: {
    query: IEntityQueryInspector;
  };
  [TTaskActionNames.PREPARE_SQL_QUERY]: {
    select: string;
    params: {[alias: string]: any}
  };
  [TTaskActionNames.FETCH_QUERY]: {
    taskKey: string;
    rowsCount: number;
  };
  [TTaskActionNames.FETCH_SQL_QUERY]: {
    taskKey: string;
    rowsCount: number;
  };
  [TTaskActionNames.INTERRUPT]: {
    taskKey: string;
  };
  [TTaskActionNames.RELOAD_SCHEMA]: {
    withAdapter: boolean;
  };
  [TTaskActionNames.PING]: {
    steps: number;
    delay: number;
    testChildProcesses: boolean
  };
  [TTaskActionNames.GET_SCHEMA]: {
    withAdapter: boolean;
  };
  [TTaskActionNames.DEFINE_ENTITY]: {
    entity: string;
    pkValues: any[];
  };
  [TTaskActionNames.INSERT]: {
    insert: IEntityInsertInspector;
  };
  [TTaskActionNames.UPDATE]: {
    update: IEntityUpdateInspector;
  };
  [TTaskActionNames.DELETE]: {
    delete: IEntityDeleteInspector;
  };
  [TTaskActionNames.CREATE_APP]: {
    alias: string;
    connectionOptions?: {
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      path?: string;
    };
  };
  [TTaskActionNames.DELETE_APP]: {
    uid: string;
  };
  [TTaskActionNames.GET_APPS]: undefined;
}

// -- TASK-RESULT
// sub: /task

export type TTaskResultMessageData<TActionName extends keyof TTaskActionResultTypes> = IGdmnMessageReply<
  TTaskActionResultTypes[TActionName],
  TTaskActionPayloadTypes[TActionName]
> & {
  status: TTaskStatus; // TTaskFinishStatus;
};

export interface TTaskActionResultTypes {
  [TTaskActionNames.DEMO]: undefined;
  [TTaskActionNames.QUERY]: IEntityQueryResponse;
  [TTaskActionNames.SQL_QUERY]: ISqlQueryResponse;
  [TTaskActionNames.PREPARE_QUERY]: undefined;
  [TTaskActionNames.PREPARE_SQL_QUERY]: undefined;
  [TTaskActionNames.FETCH_QUERY]: IEntityQueryResponse;
  [TTaskActionNames.FETCH_SQL_QUERY]: ISqlQueryResponse;
  [TTaskActionNames.INTERRUPT]: undefined;
  [TTaskActionNames.RELOAD_SCHEMA]: IERModel;
  [TTaskActionNames.PING]: undefined;
  [TTaskActionNames.GET_SCHEMA]: IERModel;
  [TTaskActionNames.DEFINE_ENTITY]: IDefinedEntity;
  [TTaskActionNames.INSERT]: undefined;
  [TTaskActionNames.UPDATE]: undefined;
  [TTaskActionNames.DELETE]: undefined;
  [TTaskActionNames.CREATE_APP]: IApplicationInfo;
  [TTaskActionNames.DELETE_APP]: undefined;
  [TTaskActionNames.GET_APPS]: any; // fixme: type in api.getApps IApplicationInfo[];
}

export interface ISqlQueryResponseDataItem {
  [alias: string]: any;
}

export enum Types {
  BIGINT,
  INTEGER,
  SMALLINT,

  BLOB,
  BOOLEAN,

  CHAR,
  VARCHAR,

  DATE,
  TIME,
  TIMESTAMP,

  DOUBLE,
  FLOAT,

  NULL,

  OTHER
}

export interface ISqlQueryResponseAliasesRdb {
  type: Types;
  field?: string;
  relation?: string;
}

export interface ISqlQueryResponseAliasesOrm {
  type: string;
  entity?: string;
}

export interface ISqlQueryResponseAliases {
  [alias: string]: {
    rdb: ISqlQueryResponseAliasesRdb;
    orm?: ISqlQueryResponseAliasesOrm;
  }
}

export interface ISqlQueryResponse {
  data: ISqlQueryResponseDataItem[];
  aliases: ISqlQueryResponseAliases;
}

export interface IDefinedEntity {
  entity: string;
}

export interface IApplicationInfo {
  uid: string;
  alias: string;
  creationDate: Date;
}

export const TTaskFinishStatus = [TTaskStatus.INTERRUPTED, TTaskStatus.FAILED, TTaskStatus.SUCCESS];

// -- TASK-STATUS
// sub: /task/status

export interface ITaskStatusMessageData<TActionName extends keyof TTaskActionPayloadTypes>
  extends TTaskActionMessageData<TActionName> {
  status: TTaskStatus;
}

export const enum TTaskStatus {
  RUNNING = 1,
  PAUSED = 2,
  INTERRUPTED = 3,
  FAILED = 4,
  SUCCESS = 5
}

// -- TASK-PROGRESS
// sub: /task/progress

export interface ITaskProgressMessageData<TActionName extends keyof TTaskActionPayloadTypes>
  extends TTaskActionMessageData<TActionName> {
  progress: ITaskProgress;
  status: TTaskStatus;
}

export interface ITaskProgress {
  min: number;
  max: number;
  value: number; // 0-100
  description: string;
}
