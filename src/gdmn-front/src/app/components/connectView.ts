import { connect } from "react-redux";
import { IState } from "../store/reducer";
import { TGdmnActions, gdmnActions } from "../scenes/gdmn/actions";
import { IViewTab } from "../scenes/gdmn/types";
import { ThunkDispatch } from "redux-thunk";
import { RouteComponentProps } from "react-router";

export const connectView = connect(
  (state: IState, ownProps: RouteComponentProps<any>) => ({
    viewTab: state.gdmnState.viewTabs.find( vt => vt.url === ownProps.match.url )
  }),
  (dispatch: ThunkDispatch<IState, never, TGdmnActions>) => ({
    updateViewTab: (viewTab: IViewTab) => dispatch(gdmnActions.updateViewTab(viewTab))
  })
);