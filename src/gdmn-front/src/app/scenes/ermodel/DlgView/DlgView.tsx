import React, { Fragment } from 'react';
import { IDataRow, RecordSet } from 'gdmn-recordset';
import { IViewProps, View } from '@src/app/components/View';
import { ICommandBarItemProps, TextField } from 'office-ui-fabric-react';
import {
  BlobAttribute,
  EntityLink,
  EntityQuery,
  EntityQueryField,
  EntityQueryOptions,
  ERModel,
  ScalarAttribute,
  SequenceAttribute
} from 'gdmn-orm';
import { TTaskStatus } from '@gdmn/server-api';
import { apiService } from '@src/app/services/apiService';
import { attr2fd } from '../entityData/utils';
import { List } from 'immutable';

export enum DlgState {
  dsBrowse,
  dsInsert,
  dsEdit
}

export interface IDlgViewMatchParams {
  entityName: string;
  id: string;
}

export interface IDlgViewProps extends IViewProps<IDlgViewMatchParams> {
  src?: RecordSet;
  erModel: ERModel;
  dlgState: DlgState;
}

export interface IDlgViewState {
  rs?: RecordSet;
}

export class DlgView extends View<IDlgViewProps, IDlgViewState, IDlgViewMatchParams> {
  state: IDlgViewState = {};

  public getViewCaption(): string {
    if (this.props.match) {
      return this.props.match.params.entityName;
    } else {
      return '';
    }
  }

  public getCommandBarItems(): ICommandBarItemProps[] {
    return [
      {
        key: 'save',
        text: 'Save',
        iconProps: {
          iconName: 'Save'
        }
      },
      {
        key: 'cancel',
        text: 'Cancel',
        iconProps: {
          iconName: 'Cancel'
        }
      }
    ];
  }

  public async componentDidMount() {
    const { rs } = this.state;
    if (rs) return;

    const { entityName, id } = this.props.match.params;
    const { erModel } = this.props;

    // TODO tmp
    const result = await apiService.defineEntity({entity: erModel.entity(entityName).name, pkValues: [id]});
    const entity = erModel.entity(result.payload.result!.entity);
    if (entityName !== entity.name) {
      this.props.history.replace(this.props.match.url.replace(entityName, entity.name));
    }
    super.componentDidMount();

    const q = new EntityQuery(
      new EntityLink(
        entity,
        'z',
        Object.values(entity.attributes)
          .filter(
            attr =>
              (attr instanceof ScalarAttribute || attr instanceof SequenceAttribute) && !(attr instanceof BlobAttribute)
          )
          .map(attr => new EntityQueryField(attr))
      ),
      new EntityQueryOptions(undefined, undefined, [
        {
          equals: [
            {
              alias: 'z',
              attribute: entity.pk[0],
              value: id
            }
          ]
        }
      ])
    );

    const value = await apiService.query({
      query: q.inspect()
    });

    if (value.payload.status === TTaskStatus.SUCCESS) {
      if (!value.payload.result) throw new Error('No result in query response'); // todo conditional type

      console.log(value.payload.result);

      const fieldDefs = Object.entries(value.payload.result.aliases).map(([fieldAlias, data]) => {
        const attr = entity.attributes[data.attribute];
        if (!attr) {
          throw new Error(`Unknown attribute ${data.attribute}`);
        }
        return attr2fd(q!, fieldAlias, data);
      });

      const rs = RecordSet.create({
        name: `${entity.name}\\${id}`,
        fieldDefs,
        data: List(value.payload.result.data as IDataRow[]),
        eq: q
      });

      this.setState({ rs });
    }
  }

  public render() {
    const { rs } = this.state;

    if (!rs) {
      return this.renderLoading();
    }

    return this.renderWide(undefined,
      <div className="dlgView">
        {rs.fieldDefs.map((f, idx) => (
          <Fragment key={idx}>
            <span>{f.caption}</span>
            <TextField value={this.props.dlgState === DlgState.dsEdit ? rs.getString(0, f.fieldName, '') : ''} />
          </Fragment>
        ))}
      </div>
    );
  }
}
