import { IState } from '@src/app/store/reducer';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { TGdmnActions } from '../../gdmn/actions';
import { withRouter } from 'react-router';
import { DlgView, IDlgViewProps } from './DlgView';
import { compose } from 'redux';

export const DlgViewContainer = compose(
  connect(
    (state: IState, ownProps: Partial<IDlgViewProps>) => {
      const entityName = ownProps.match ? ownProps.match.params.entityName : '';
      return {
        rs: state.recordSet[entityName],
        erModel: state.gdmnState.erModel
        //  viewTabs: state.gdmnState.viewTabs
      };
    },
    () => ({
      // saveRecord: () => thunkDispatch(gdmnActionsAsync.saveRecord()),
      // cancelRecord: () => thunkDispatch(gdmnActionsAsync.cancelRecord()),
    }),
  )
)(withRouter(DlgView));

