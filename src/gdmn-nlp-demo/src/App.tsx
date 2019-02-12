import React, { Component } from 'react';
import './App.css';
import { Route, BrowserRouter, Switch, Link } from 'react-router-dom';
import { MorphBoxContainer } from './morphology/MorphBoxContainer';
import { CommandBar, ICommandBarItemProps, IComponentAsProps, CommandBarButton, BaseComponent, IButtonProps } from 'office-ui-fabric-react';
import { SyntaxBoxContainer } from './syntax/SyntaxBoxContainer';
import { ERModelBoxContainer } from './ermodel/ERModelBoxContainer';
import { Actions, State } from './store';
import { setERModelLoading, loadERModel } from './ermodel/actions';
import { ThunkDispatch } from 'redux-thunk';
import { deserializeERModel, ERModel, Entity, IntegerAttribute, StringAttribute } from 'gdmn-orm';
import { connect } from 'react-redux';
import { ChatBoxContainer } from './nlpdialog/NLPDialogBoxContainer';
import { IERModels } from './ermodel/reducer';

interface ILinkCommandBarButtonProps extends IComponentAsProps<ICommandBarItemProps> {
  link: string;
  supText?: string;
};

class LinkCommandBarButton extends BaseComponent<ILinkCommandBarButtonProps> {
  public render(): JSX.Element {
    const { defaultRender, link, supText, ...buttonProps } = this.props;

    const onRenderText = supText ? (props: IButtonProps) => <>{props.text}<sup>{supText}</sup></> : undefined;
    const DefaultRender = defaultRender ? defaultRender as any : CommandBarButton;

    return (
      <Link to={link}>
        <DefaultRender {...buttonProps} onRenderText={onRenderText} />
      </Link>
    );
  }
};

interface IAppProps {
  erModel: IERModels;
  onLoadERModel: (srcFile: string, name: string) => void;
  onLoadERModel2: (erModel: ERModel, name: string) => void;
};

class InternalApp extends Component<IAppProps, {}> {

  componentDidMount() {
    const { erModel, onLoadERModel, onLoadERModel2 } = this.props;

    if (!erModel['db']) {
      onLoadERModel('/data/ermodel.serialized.json', 'db');
    }

    const erm = new ERModel();

    const currency = new Entity({
      name: 'Currency',
      lName: {
        ru: {
          name: 'Валюта'
        }
      }
    });

    currency.add(
      new IntegerAttribute({
        name: 'Curr_ID',
        lName: {
          ru: {
            name: 'Идентификатор'
          }
        }
      })
    );

    currency.add(
      new StringAttribute({
        name: 'Curr_Abbreviation',
        lName: {
          ru: {
            name: 'Код'
          }
        },
        required: true,
        maxLength: 3,
        autoTrim: true
      })
    );

    currency.add(
      new StringAttribute({
        name: 'Curr_Name',
        lName: {
          ru: {
            name: 'Наименование'
          }
        },
        required: true,
        maxLength: 60,
        autoTrim: true
      })
    );

    erm.add(currency);

    onLoadERModel2(erm, 'nbrb');

    /*
    if (!erModel['nbrb']) {
      onLoadERModel('/data/nbrbmodel.serialized.json', 'nbrb');
    }
    */
  }

  render() {
    return (
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <>
          <CommandBar
            items={this.getItems()}
          />
          <div className="WorkArea">
            <Switch>
              <Route exact={false} path={`/morphology`} component={MorphBoxContainer} />
              <Route exact={false} path={`/syntax`} component={SyntaxBoxContainer} />
              <Route exact={false} path={`/ermodel/:name`} component={ERModelBoxContainer} />
              <Route exact={false} path={`/nlpdialog`} component={ChatBoxContainer} />
            </Switch>
          </div>
        </>
      </BrowserRouter>
    );
  }

  private getItems = (): ICommandBarItemProps[] => {
    const { erModel } = this.props;
    const btn = (link: string, supText?: string) => (props: IComponentAsProps<ICommandBarItemProps>) => {
      return <LinkCommandBarButton {...props} link={link} supText={supText} />;
    };

    return [
      {
        key: 'morphology',
        text: 'Morphology',
        commandBarButtonAs: btn('/morphology')
      },
      {
        key: 'syntax',
        text: 'Syntax',
        commandBarButtonAs: btn('/syntax')
      },
      ...Object.entries(erModel).map( ([name, m]) => (
        {
          key: `ermodel-${name}`,
          disabled: !m.erModel,
          text: m.loading ? 'Loading ER Model...' : `ERModel-${name}`,
          commandBarButtonAs: btn(`/ermodel/${name}`, m.erModel ? Object.entries(m.erModel.entities).length.toString() : undefined)
        }
      )),
      {
        key: 'nlpdialog',
        text: 'NLP Dialog',
        commandBarButtonAs: btn('/nlpdialog')
      }
    ];
  };
};

export default connect(
  (state: State) => {
    return {
      erModel: state.ermodel
    }
  },
  (dispatch: ThunkDispatch<State, never, Actions>) => ({
    onLoadERModel: (srcFile: string, name: string) => dispatch(
      (dispatch: ThunkDispatch<State, never, Actions>, _getState: () => State) => {
        dispatch(setERModelLoading({ name, loading: true }));
        fetch(`${process.env.PUBLIC_URL}${srcFile}`)
        .then( res => res.text() )
        .then( res => JSON.parse(res) )
        .then( res => dispatch(loadERModel({ name, erModel: deserializeERModel(res, true) })) )
        .then( _res => dispatch(setERModelLoading({ name, loading: false })) )
        .catch( err => {
          dispatch(setERModelLoading({ name, loading: false }));
          console.log(err);
         });
      }
    ),
    onLoadERModel2: (erModel: ERModel, name: string) => dispatch(loadERModel({ name, erModel }))
  })
)(InternalApp);

