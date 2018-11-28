import React, { Component, Fragment } from 'react';
import { TextField, PrimaryButton, Spinner, SpinnerSize } from 'office-ui-fabric-react';
import { PasswordInput } from '@gdmn/client-core';

//  пока добавлено в global.css
//import '/src/styles/SignInBox.css';

export interface ISignInBoxData {
  userName: string;
  password: string;
}

export interface ISignInBoxProps {
  initialValues: ISignInBoxData;
  onSignIn: (data: ISignInBoxData) => void;
}

interface ISignInBoxState {
  activeTab: string;
  userName: string;
  password: string;
  connecting: boolean;
}

export class SignInBox extends Component<ISignInBoxProps, ISignInBoxState> {
  state: ISignInBoxState = {
    ...this.props.initialValues,
    activeTab: 'Вход',
    connecting: false
  };

  render() {
    const { userName, password, activeTab, connecting } = this.state;
    const { onSignIn } = this.props;

    const tabs = ['Вход', 'Регистрация'];

    return (
      <div className="SignInBackground">
        <div className="SignInForm">
          <div className="SignInFormTabs">
            {tabs.map(t =>
              t === activeTab ? (
                <Fragment key={t}>
                  <div className="SignInFormTab" onClick={() => connecting || this.setState({ activeTab: t })}>
                    <div className="SignInFormActiveColor" />
                    <div className="SignInFormTabText SignInFormActiveTab">{t}</div>
                  </div>
                  <div className="SignInFormTabSpace" />
                </Fragment>
              ) : (
                <Fragment key={t}>
                  <div className="SignInFormTab" onClick={() => connecting || this.setState({ activeTab: t })}>
                    <div className="SignInFormTabText SignInFormInactiveTab">{t}</div>
                    <div className="SignInFormInactiveShadow" />
                  </div>
                  <div className="SignInFormTabSpace" />
                </Fragment>
              )
            )}
            <div className="SignInFormRestSpace" />
          </div>
          <div className="SignInFormBody">
            {activeTab === 'Вход' ? (
              <>
                <TextField
                  label="Пользователь:"
                  disabled={connecting}
                  value={userName}
                  onBeforeChange={userName => this.setState({ userName })}
                />
                <PasswordInput
                  label="Пароль:"
                  disabled={connecting}
                  value={password}
                  onBeforeChange={password => this.setState({ password })}
                />
                <div className="SignInText">Забыли пароль?</div>
                <div className="SignInButtons">
                  <PrimaryButton
                    text="Войти"
                    disabled={connecting}
                    onRenderIcon={
                      connecting ? (_props, _defaultRenderer) => <Spinner size={SpinnerSize.xSmall} /> : undefined
                    }
                    onClick={() => {
                      this.setState({ connecting: true });
                      onSignIn({ userName, password });
                    }}
                  />
                </div>
              </>
            ) : (
              <div>Скоро будет...</div>
            )}
          </div>
        </div>
      </div>
    );
  }
}