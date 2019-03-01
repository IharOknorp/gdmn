import {TTaskStatus} from "@gdmn/server-api";
import {connectDataView} from "@src/app/components/connectDataView";

import {TGdmnActions} from "@src/app/scenes/gdmn/actions";
import {apiService} from "@src/app/services/apiService";
import {IState, rsMetaActions, TRsMetaActions} from "@src/app/store/reducer";
import {createGrid, GridAction} from "gdmn-grid";
import {Semaphore} from "gdmn-internals";
import {BlobAttribute, EntityLink, EntityQuery, EntityQueryField, ScalarAttribute, SequenceAttribute} from "gdmn-orm";
import {
  createRecordSet,
  finishLoadingData,
  IDataRow,
  IRSSQLParams,
  RecordSet,
  RecordSetAction,
  startLoadingData,
  TFieldType
} from "gdmn-recordset";
import {List} from "immutable";
import {connect} from "react-redux";
import {RouteComponentProps} from "react-router";
import {IndexRange} from "react-virtualized";
import {compose} from "recompose";
import {ThunkDispatch} from "redux-thunk";
import {EntityDataView, IEntityDataViewProps, IEntityMatchParams} from "./EntityDataView";
import {attr2fd} from "./utils";

export const EntityDataViewContainer = compose<any, RouteComponentProps<IEntityMatchParams>>(
  connect(
    (state: IState, ownProps: Partial<IEntityDataViewProps>) => {
      const entityName = ownProps.match ? ownProps.match.params.entityName : "";
      return {
        rsMeta: state.rsMeta[entityName],
        erModel: state.gdmnState.erModel,
        data: {
          rs: state.recordSet[entityName],
          gcs: state.grid[entityName]
        }
      };
    },
    (thunkDispatch: ThunkDispatch<IState, never, TGdmnActions | RecordSetAction | GridAction | TRsMetaActions>) => ({
      dispatch: thunkDispatch
    }),
    ({rsMeta, ...stateProps}, {dispatch, ...dispatchProps}, ownProps) => {
      const mergeProps = {
        ...stateProps,
        ...dispatchProps,

        attachRs: (mutex?: Semaphore) => dispatch((dispatch, getState) => {
          console.log("createRs");
          // if (!mutex.permits) return;

          const erModel = getState().gdmnState.erModel;

          if (!erModel || !Object.keys(erModel.entities).length) return;
          const entityName = ownProps.match ? ownProps.match.params.entityName : "";
          const entity = erModel.entity(entityName);

          const q = new EntityQuery(
            new EntityLink(
              entity,
              "z",
              Object.values(entity.attributes)
                .filter(
                  attr =>
                    (attr instanceof ScalarAttribute || attr instanceof SequenceAttribute) &&
                    !(attr instanceof BlobAttribute)
                )
                .map(attr => new EntityQueryField(attr)
                  /*{
                    if (attr instanceof EntityAttribute) {

                      return new EntityQueryField(attr, new EntityLink(
                        attr.e
                      ))
                    } else {
                      return new EntityQueryField(attr)
                    }*/
                )
            )
          );

          apiService
            .prepareQuery({
              query: q.inspect()
            })
            .subscribe(value => {
              switch (value.payload.status) {
                case TTaskStatus.RUNNING: {
                  dispatch(
                    rsMetaActions.setRsMeta(entity.name, {
                      taskKey: value.meta!.taskKey!,
                      q
                    })
                  );

                  const rsMeta = getState().rsMeta[entityName];

                  apiService.fetchQuery({
                    rowsCount: 100,
                    taskKey: rsMeta.taskKey
                  })
                    .then((res) => {
                      switch (res.payload.status) {
                        case TTaskStatus.SUCCESS: {
                          const fieldDefs = Object.entries(res.payload.result!.aliases)
                            .map(([fieldAlias, data]) => {
                              const attr = entity.attributes[data.attribute];
                              if (!attr) {
                                throw new Error(`Unknown attribute ${data.attribute}`);
                              }
                              return attr2fd(rsMeta.q, fieldAlias, data);
                            });

                          const rs = RecordSet.createWithData(
                            entity.name,
                            fieldDefs,
                            List(res.payload.result!.data as IDataRow[]),
                            false,
                            undefined,
                            rsMeta.q,
                            {
                              select: res.payload.result!.info.select as string,
                              params: res.payload.result!.info.params as IRSSQLParams
                            }
                          );
                          dispatch(createRecordSet({name: rs.name, rs}));

                          dispatch(
                            createGrid({
                              name: rs.name,
                              columns: rs.fieldDefs.map(fd => ({
                                name: fd.fieldName,
                                caption: [fd.caption || fd.fieldName],
                                fields: [{...fd}],
                                width: fd.dataType === TFieldType.String && fd.size ? fd.size * 10 : undefined
                              })),
                              leftSideColumns: 0,
                              rightSideColumns: 0,
                              hideFooter: true
                            })
                          );
                        }
                      }
                    });
                  break;
                }
                default: {
                  console.log("rs close");

                  dispatch(rsMetaActions.deleteRsMeta(entity.name));
                }
              }
            });
        }),

        detachRs: () => dispatch(async (dispatch, getState) => {
          // const entityName = ownProps.match ? ownProps.match.params.entityName : "";
          //
          // const rsMeta = getState().rsMeta[entityName];
          // if (rsMeta) {
          //   await apiService.interruptTask({
          //     taskKey: rsMeta.taskKey
          //   });
          // }
          // dispatch(deleteRecordSet({name: stateProps.data.rs.name}));
        }),

        loadMoreRsData: async ({startIndex, stopIndex}: IndexRange) => {
          if (!rsMeta) {
            dispatch(
              startLoadingData({name: stateProps.data.rs.name})
            );
            dispatch(
              finishLoadingData({
                name: stateProps.data.rs.name,
                records: [],
                srcEoF: true
              })
            );
            return;
          }

          const fetchRecordCount = stopIndex - (stateProps.data.rs ? stateProps.data.rs.size : 0);

          console.log("startLoadingData", stopIndex - fetchRecordCount, stopIndex, rsMeta);

          dispatch(startLoadingData({name: stateProps.data.rs.name}));
          const res = await apiService.fetchQuery({
            rowsCount: fetchRecordCount,
            taskKey: rsMeta.taskKey
          });
          console.log("finishLoadingData", res);
          switch (res.payload.status) {
            case TTaskStatus.SUCCESS: {
              dispatch(
                finishLoadingData({
                  name: stateProps.data.rs.name,
                  records: res.payload.result!.data as IDataRow[]
                })
              );
              break;
            }
            default: {
              finishLoadingData({
                name: stateProps.data.rs.name,
                records: []
              });
              break;
            }
          }
        }
      };

      return mergeProps;
    }
  ),
  connectDataView
)(EntityDataView);
