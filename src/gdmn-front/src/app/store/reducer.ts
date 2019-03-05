import { combineReducers, Reducer } from 'redux';
import { ActionType, createAction, getType } from 'typesafe-actions';
// @ts-ignore
import persistLocalStorage from 'redux-persist/lib/storage';
// @ts-ignore
import { PersistPartial, persistReducer } from 'redux-persist';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

import { recordSetReducer, RecordSetReducerState } from 'gdmn-recordset';
import { gridReducer, GridReducerState } from 'gdmn-grid';
import { TActions } from '@src/app/store/TActions';
import { IAuthState, reducer as authReducer } from '@src/app/scenes/auth/reducer';
import { IRootState, reducer as rootReducer } from '@src/app/scenes/root/reducer';
import { reducer as gdmnReducer, TGdmnState } from '@src/app/scenes/gdmn/reducer';
import { authActions } from '@src/app/scenes/auth/actions';
import { gdmnActions } from '@src/app/scenes/gdmn/actions';
import { EntityQuery } from 'gdmn-orm';

initializeIcons(/* optional base url */);

// RS-META

interface IRsMetaState {
  [rsName: string]: {
    taskKey: string;
    query: EntityQuery;
  };
}

const rsMetaActions = {
  setRsMeta: createAction('SET_RS_META', resolve => {
    return (rsName: string, rsMeta: { taskKey: string; query: EntityQuery }) => resolve({ rsName, rsMeta });
  }),
  deleteRsMeta: createAction('DELETE_RS_META', resolve => {
    return (rsName: string) => resolve(rsName);
  })
};

type TRsMetaActions = ActionType<typeof rsMetaActions>;

function rsMetaReducer(state: IRsMetaState = {}, action: TRsMetaActions) {
  if (action.type === getType(rsMetaActions.setRsMeta)) {
    return {
      ...state,
      [action.payload.rsName]: action.payload.rsMeta
    };
  }

  if (action.type === getType(rsMetaActions.deleteRsMeta)) {
    const newState = { ...state };
    delete newState[action.payload];
    return newState;
  }

  return state;
}

//

interface IState {
  readonly rootState: IRootState;
  readonly authState: IAuthState;
  readonly gdmnState: TGdmnState;
  readonly recordSet: RecordSetReducerState;
  readonly rsMeta: IRsMetaState;
  readonly grid: GridReducerState;
}

const authPersistConfig = {
  key: 'gdmn::root::authState',
  storage: persistLocalStorage,
  whitelist: ['authenticated', 'accessTokenPayload', 'refreshTokenPayload', 'accessToken', 'refreshToken']
};

function withReset(reducer: any) {
  return (state: any, action: any) =>
    reducer(
      action.type === getType(authActions.onSignOut) || action.type === getType(gdmnActions.onApiDeleteAccount)
        ? undefined /* reset state to initial*/
        : state,
      action
    );
}

const reducer = combineReducers<IState>({
  rootState: withReset(rootReducer),
  gdmnState: withReset(gdmnReducer),
  authState: persistReducer(authPersistConfig, withReset(authReducer)),
  recordSet: withReset(recordSetReducer),
  rsMeta: withReset(rsMetaReducer),
  grid: withReset(gridReducer)
});

type TReducer = Reducer<IState & PersistPartial, TActions>;

// tslint:disable-next-line no-default-export
export default reducer; // TODO test hmr require without default
export { TReducer, IState, rsMetaActions, TRsMetaActions, IRsMetaState };
