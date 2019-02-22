import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { compose } from 'recompose';
import { RouteComponentProps, withRouter } from 'react-router';

import { IState } from '@src/app/store/reducer';
import { TGdmnActions, gdmnActions } from '@src/app/scenes/gdmn/actions';
import { IViewTab } from '@src/app/scenes/gdmn/types';
import { IViewProps } from './View';

export const connectView = compose<any, IViewProps>(
  withRouter,
  connect(
    (state: IState, ownProps: RouteComponentProps<any>) => ({
      viewTab: state.gdmnState.viewTabs.find(vt => vt.url === ownProps.match.url)
    }),
    (dispatch: ThunkDispatch<IState, never, TGdmnActions>) => ({
      updateViewTab: (viewTab: IViewTab) => dispatch(gdmnActions.updateViewTab(viewTab))
    })
  )
);
