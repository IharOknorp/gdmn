import { connect } from 'react-redux';
import { IState, rsMetaActions } from '@src/app/store/reducer';
import { IViewTab } from '@src/app/scenes/gdmn/types';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { IViewTabsProps, ViewTabs } from './ViewTabs';
import { gdmnActions } from '@src/app/scenes/gdmn/actions';
import { deleteRecordSet } from 'gdmn-recordset';

export const ViewTabsContainer = connect(
  (state: IState) => ({
    recordSet: state.recordSet,
    rsMeta: state.rsMeta,
    viewTabs: state.gdmnState.viewTabs
  }),
  dispatch => ({
    dispatch
  }),
  (stateProps, dispatchProps, ownProps: RouteComponentProps<any>): IViewTabsProps => ({
    ...stateProps,
    ...dispatchProps,
    onClose: async (vt: IViewTab) => {
      const { history, location } = ownProps;
      const { viewTabs, rsMeta, recordSet } = stateProps;
      const { dispatch } = dispatchProps;

      const foundIdx = viewTabs.findIndex( t => t === vt );

      if (foundIdx === -1) return;

      let nextPath = '';

      if (location.pathname === vt.url) {
        if (viewTabs.length === 1) {
          nextPath = '/spa/gdmn';
        } else {
          nextPath = foundIdx > 0 ? viewTabs[foundIdx - 1].url : viewTabs[foundIdx + 1].url;
        }
      }

      if (nextPath) {
        history.push(nextPath);
      }

      dispatch(gdmnActions.deleteViewTab(vt));

      if (vt.rs) {
        vt.rs
          .filter(name => rsMeta[name])
          .map(name => dispatch(rsMetaActions.deleteRsMeta(name)));
        vt.rs
          .filter(rsName => recordSet[rsName])
          .forEach(rsName => dispatch(deleteRecordSet({name: rsName})));
      }
    }
  })
)(withRouter(ViewTabs));
