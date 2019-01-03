import { IState } from '@src/app/store/reducer';
import { connect } from 'react-redux';
import { EntityLink, EntityQuery, EntityQueryField, ERModel, ScalarAttribute } from 'gdmn-orm';
import { createRecordSet, IDataRow, RecordSet, RecordSetAction, TFieldType } from 'gdmn-recordset';
import { createGrid, GridAction } from 'gdmn-grid';
import { ThunkDispatch } from 'redux-thunk';
import { TTaskActionNames } from '@gdmn/server-api';
import { List } from 'immutable';
import { TGdmnActions } from '../../gdmn/actions';
import { EntityDataView, IEntityDataViewProps } from './EntityDataView';
import { bindDataViewDispatch } from '@src/app/components/bindDataViewDispatch';
import { apiService } from '@src/app/services/apiService';
import { withRouter } from 'react-router';
import { attr2fd } from './utils';

export const EntityDataViewContainer = connect(
  (state: IState, ownProps: Partial<IEntityDataViewProps>) => {
    const entityName = ownProps.match ? ownProps.match.params.entityName : '';
    return {
      data:
        {
          rs: state.recordSet[entityName],
          gcs: state.grid[entityName]
        },
      erModel: state.gdmnState.erModel,
      viewTabs: state.gdmnState.viewTabs
    };
  },

  (dispatch: ThunkDispatch<IState, never, TGdmnActions | RecordSetAction | GridAction>, ownProps: Partial<IEntityDataViewProps>) => ({
    ...bindDataViewDispatch(dispatch),
    loadFromERModel: (erModel: ERModel) => {

      const entityName = ownProps.match ? ownProps.match.params.entityName : '';

      console.log('[GDMN] LOADING ' + entityName);

      const entity = erModel.entities['Folder'];

      if (!entity) return;

      const q = new EntityQuery(new EntityLink(
        entity,
        'z',
        Object.values(entity.attributes).filter( attr => attr instanceof ScalarAttribute ).map( attr => new EntityQueryField(attr) )
      ));

      apiService
        .getData({
          payload: {
            action: TTaskActionNames.QUERY,
            payload: q.inspect()
          }
        })
        .subscribe( value => {
          if (value.error) {
            console.log(value.error.message);
          } else if (value.payload.result) {
            console.log('QUERY response result: ', JSON.stringify(value.payload.result.data));
            console.log('QUERY response result: ', JSON.stringify(value.payload.result.aliases));
            console.log('QUERY response result: ', JSON.stringify(value.payload.result.info));

            const fieldDefs = Object.entries(value.payload.result.aliases).map( ([fieldAlias, data]) => {
              const attr = entity.attributes[data.attribute];
              if (!attr) {
                throw new Error(`Unknown attribute ${data.attribute}`);
              }
              return attr2fd(fieldAlias, entity, attr);
            });

            const rs = RecordSet.createWithData(
              entity.name,
              fieldDefs,
              List(value.payload.result.data as IDataRow[])
            );

            dispatch(createRecordSet({ name: rs.name, rs }));

            dispatch(createGrid({
              name: rs.name,
              columns: rs.fieldDefs.map( fd => (
                {
                  name: fd.fieldName,
                  caption: [fd.caption || fd.fieldName],
                  fields: [{...fd}],
                  width: fd.dataType === TFieldType.String && fd.size ? fd.size * 10 : undefined
                })),
              leftSideColumns: 0,
              rightSideColumns: 0,
              hideFooter: true
            }));
          }
        });
    }
  }),

  (stateProps, dispatchProps) => {
    const { erModel } = stateProps;
    const { loadFromERModel } = dispatchProps;
    return {
      ...stateProps,
      ...dispatchProps,
      loadData: () => {
        if (erModel && Object.entries(erModel.entities).length) {
          loadFromERModel(erModel);
        }
      }
    }
  }
)(withRouter(EntityDataView));

