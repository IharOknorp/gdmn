import { StompDemoView } from "./StompDemoView";
import { bindActionCreators } from "redux";
import { withRouter, RouteComponentProps } from "react-router";
import { connectView } from "@src/app/components/connectView";
import { connect } from "react-redux";
import { IState } from "@src/app/store/reducer";
import { selectGdmnState } from "@src/app/store/selectors";
import { gdmnActionsAsync } from "../actions";
import { rootActions } from "../../root/actions";
import { compose } from "recompose";

export const StompDemoViewContainer = compose<any, RouteComponentProps<any>>(
  connectView,
  connect(
    (state: IState) => ({
      erModel: selectGdmnState(state).erModel
    }),
    dispatch => ({
      apiPing: bindActionCreators(gdmnActionsAsync.apiPing, dispatch),
      onError: bindActionCreators(rootActions.onError, dispatch)
    })
  )
)(withRouter(StompDemoView));