import React from 'react';
import { DataView, IDataViewProps } from '@src/app/components/DataView';
import { ICommandBarItemProps } from 'office-ui-fabric-react';
import { SQLForm } from '@src/app/components/SQLForm';

export interface IEntityMatchParams {
  entityName: string
}

export interface IEntityDataViewProps extends IDataViewProps<IEntityMatchParams> { }

export interface IEntityDataViewState {
  showSQL: boolean
}

export class EntityDataView extends DataView<IEntityDataViewProps, IEntityDataViewState, IEntityMatchParams> {
  public state: IEntityDataViewState = {
    showSQL: false
  }

  private onCloseSQL = () => {
    this.setState({ showSQL: false });
  }

  public getDataViewKey() {
    return this.getRecordsetList()[0];
  }

  public getRecordsetList() {
    const entityName = this.props.match ? this.props.match.params.entityName : '';

    if (!entityName) {
      throw new Error('Invalid entity name');
    }

    return [entityName];
  }

  public getCommandBarItems(): ICommandBarItemProps[] {
    const items = super.getCommandBarItems();

    if (!items.length) {
      return items;
    }

    const { data } = this.props;

    if (!data || !data.rs || !data.rs.sql) {
      return items;
    }

    return [...items,
      {
        key: 'sql',
        text: 'Show SQL',
        iconProps: {
          iconName: 'FileCode'
        },
        onClick: () => {
          this.setState({ showSQL: true });
        }
      }
    ];
  }

  public getViewCaption(): string {
    return this.getDataViewKey();
  }

  public renderModal() {
    const { showSQL } = this.state;
    const { data } = this.props;

    if (showSQL && data && data!.rs && data!.rs!.sql) {
      return (
       <SQLForm
         rs={data!.rs!}
         onCloseSQL={this.onCloseSQL}
         />
      );
    }

    return super.renderModal();
  }
}
