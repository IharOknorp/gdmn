import React from 'react';
import { ICommandBarItemProps, IComponentAsProps } from 'office-ui-fabric-react';
import { RecordSet, SortFields } from 'gdmn-recordset';
import { GDMNGrid, GridComponentState, IGridState, TLoadMoreRsData } from 'gdmn-grid';
import { Semaphore } from 'gdmn-internals';
import { ERModel } from 'gdmn-orm';

import { IViewProps, View } from './View';
import { disposeMutex, getMutex } from './dataViewMutexes';
import { LinkCommandBarButton } from './LinkCommandBarButton';

export interface IRSAndGCS {
  rs: RecordSet;
  gcs: GridComponentState;
  detail?: IRSAndGCS[];
}

export interface IDataViewProps<R> extends IViewProps<R> {
  data?: IRSAndGCS;
  erModel?: ERModel;
  createRs: (mutex: Semaphore) => void;
  loadMoreRsData?: TLoadMoreRsData;
  onCancelSortDialog: (gridName: string) => void;
  onApplySortDialog: (rs: RecordSet, gridName: string, sortFields: SortFields, gridRef?: GDMNGrid) => void;
  onColumnResize: (gridName: string, columnIndex: number, newWidth: number) => void;
  onColumnMove: (gridName: string, oldIndex: number, newIndex: number) => void;
  onSelectRow: (rs: RecordSet, idx: number, selected: boolean) => void;
  onSelectAllRows: (rs: RecordSet, value: boolean) => void;
  onSetCursorPos: (rs: RecordSet, gridName: string, cursorCol: number, cursorRow: number) => void;
  onSort: (rs: RecordSet, sortFields: SortFields, gridRef?: GDMNGrid) => void;
  onToggleGroup: (rs: RecordSet, rowIdx: number) => void;
}

export interface IGridRef {
  [name: string]: GDMNGrid | undefined;
}

export abstract class DataView<P extends IDataViewProps<R>, S, R = any> extends View<P, S, R> {
  private _gridRef: IGridRef = {};

  public abstract getDataViewKey(): string;

  public isDataLoaded(): boolean {
    const { data } = this.props;
    return !!(data && data.rs);
  }

  public componentDidMount() {
    if (!this.isDataLoaded()) {
      this.props.createRs(getMutex(this.getDataViewKey()));
    }

    super.componentDidMount();
  }

  public componentDidUpdate(prevProps: IDataViewProps<R>) {
    // todo
    if (this.props.loadMoreRsData) {
      if (!prevProps.erModel && this.props.erModel) {
        if (!this.isDataLoaded()) {
          this.props.createRs(getMutex(this.getDataViewKey()));
        }
      }
      return;
    }

    const { createRs } = this.props;
    if (!this.isDataLoaded()) {
      createRs(getMutex(this.getDataViewKey()));
    } else {
      const { data } = this.props;
      if (data && data.rs && data.detail && data.detail.length) {
        const masterLink = data.detail[0].rs.masterLink!;
        const detailValue = masterLink.values[0].value;
        const masterValue = data.rs.getValue(data.rs.currentRow, masterLink.values[0].fieldName);
        if (detailValue !== masterValue) {
          createRs(getMutex(this.getDataViewKey()));
        }
      }
    }
  }

  public componentWillUnmount() {
    disposeMutex(this.getDataViewKey());

    // TODO

    const { updateViewTab, viewTab } = this.props;

    if (viewTab) {
      const savedState = Object.entries(this._gridRef).reduce((p, [name, g]) => {
        if (g) {
          return { ...p, [name]: g.state };
        } else {
          return p;
        }
      }, {});

      updateViewTab({ ...viewTab, savedState });
    }
  }

  public getCommandBarItems(): ICommandBarItemProps[] {
    if (!this.isDataLoaded()) {
      return [];
    }

    const { data, match } = this.props;

    // console.log(data!.rs.fieldDefs);

    if (!data!.rs.fieldDefs.find( fd => fd.fieldName === 'ID' )) {
      return [];
    }

    const btn = (link: string, supText?: string) => (props: IComponentAsProps<ICommandBarItemProps>) => {
      return <LinkCommandBarButton {...props} link={link} supText={supText} />;
    };

    return [
      {
        key: `add`,
        text: 'Add',
        iconProps: {
          iconName: 'Add'
        },
        commandBarButtonAs: btn(`${match!.url}/add`)
      },
      {
        key: `edit`,
        text: 'Edit',
        iconProps: {
          iconName: 'Edit'
        },
        commandBarButtonAs: btn(`${match!.url}/edit/${data!.rs.getString(data!.rs.currentRow, 'ID')}`)
      },
      {
        key: `delete`,
        text: 'Delete',
        iconProps: {
          iconName: 'Delete'
        }
      }
    ];
  }

  public getMasterSavedState() {
    const { viewTab, data } = this.props;
    const masterRS = data!.rs;

    if (viewTab && viewTab.savedState && viewTab.savedState[masterRS.name]) {
      return viewTab.savedState[masterRS.name] as IGridState;
    }

    return undefined;
  }

  public getDetailSavedState() {
    const { viewTab, data } = this.props;
    const detailRS = data!.detail![0].rs;

    if (viewTab && viewTab.savedState && viewTab.savedState[detailRS.name]) {
      return viewTab.savedState[detailRS.name] as IGridState;
    }

    return undefined;
  }

  public renderMD() {
    const {
      data,
      onCancelSortDialog,
      onApplySortDialog,
      onColumnResize,
      onColumnMove,
      onSelectRow,
      onSelectAllRows,
      onSetCursorPos,
      onSort,
      onToggleGroup,
      loadMoreRsData
    } = this.props;
    const masterRS = data!.rs;
    const detailRS = data!.detail![0].rs;
    const masterGridName = masterRS.name;
    const detailGridName = detailRS.name;

    return this.renderWide(
      <div className="ViewGridPlacement">
        <GDMNGrid
          {...data!.gcs}
          rs={masterRS}
          loadMoreRsData={loadMoreRsData}
          onCancelSortDialog={() => onCancelSortDialog(masterGridName)}
          onApplySortDialog={(sortFields: SortFields) =>
            onApplySortDialog(masterRS, masterGridName, sortFields, this._gridRef[masterGridName])
          }
          onColumnResize={(columnIndex: number, newWidth: number) =>
            onColumnResize(masterGridName, columnIndex, newWidth)
          }
          onColumnMove={(oldIndex: number, newIndex: number) => onColumnMove(masterGridName, oldIndex, newIndex)}
          onSelectRow={(idx: number, selected: boolean) => onSelectRow(masterRS, idx, selected)}
          onSelectAllRows={(value: boolean) => onSelectAllRows(masterRS, value)}
          onSetCursorPos={(cursorCol: number, cursorRow: number) =>
            onSetCursorPos(masterRS, masterGridName, cursorCol, cursorRow)
          }
          onSort={(rs: RecordSet, sortFields: SortFields) => onSort(rs, sortFields, this._gridRef[masterGridName])}
          onToggleGroup={(rowIdx: number) => onToggleGroup(masterRS, rowIdx)}
          ref={(grid: GDMNGrid) => grid && (this._gridRef[masterGridName] = grid)}
          savedState={this.getMasterSavedState()}
        />
        <GDMNGrid
          {...data!.detail![0].gcs}
          rs={detailRS}
          onCancelSortDialog={() => onCancelSortDialog(detailGridName)}
          onApplySortDialog={(sortFields: SortFields) =>
            onApplySortDialog(detailRS, detailGridName, sortFields, this._gridRef[detailGridName])
          }
          onColumnResize={(columnIndex: number, newWidth: number) =>
            onColumnResize(detailGridName, columnIndex, newWidth)
          }
          onColumnMove={(oldIndex: number, newIndex: number) => onColumnMove(detailGridName, oldIndex, newIndex)}
          onSelectRow={(idx: number, selected: boolean) => onSelectRow(detailRS, idx, selected)}
          onSelectAllRows={(value: boolean) => onSelectAllRows(detailRS, value)}
          onSetCursorPos={(cursorCol: number, cursorRow: number) =>
            onSetCursorPos(detailRS, detailGridName, cursorCol, cursorRow)
          }
          onSort={(rs: RecordSet, sortFields: SortFields) => onSort(rs, sortFields, this._gridRef[detailGridName])}
          onToggleGroup={(rowIdx: number) => onToggleGroup(detailRS, rowIdx)}
          ref={(grid: GDMNGrid) => grid && (this._gridRef[detailGridName] = grid)}
          savedState={this.getDetailSavedState()}
        />
      </div>
    );
  }

  public renderS() {
    const {
      data,
      onCancelSortDialog,
      onApplySortDialog,
      onColumnResize,
      onColumnMove,
      onSelectRow,
      onSelectAllRows,
      onSetCursorPos,
      onSort,
      onToggleGroup,
      loadMoreRsData
    } = this.props;
    const masterRS = data!.rs;
    const masterGridName = masterRS.name;

    return this.renderWide(
      <div className="ViewGridPlacement">
        <GDMNGrid
          {...data!.gcs}
          rs={masterRS}
          loadMoreRsData={loadMoreRsData}
          onCancelSortDialog={() => onCancelSortDialog(masterGridName)}
          onApplySortDialog={(sortFields: SortFields) =>
            onApplySortDialog(masterRS, masterGridName, sortFields, this._gridRef[masterGridName])
          }
          onColumnResize={(columnIndex: number, newWidth: number) =>
            onColumnResize(masterGridName, columnIndex, newWidth)
          }
          onColumnMove={(oldIndex: number, newIndex: number) => onColumnMove(masterGridName, oldIndex, newIndex)}
          onSelectRow={(idx: number, selected: boolean) => onSelectRow(masterRS, idx, selected)}
          onSelectAllRows={(value: boolean) => onSelectAllRows(masterRS, value)}
          onSetCursorPos={(cursorCol: number, cursorRow: number) =>
            onSetCursorPos(masterRS, masterGridName, cursorCol, cursorRow)
          }
          onSort={(rs: RecordSet, sortFields: SortFields) => onSort(rs, sortFields, this._gridRef[masterGridName])}
          onToggleGroup={(rowIdx: number) => onToggleGroup(masterRS, rowIdx)}
          ref={(grid: GDMNGrid) => grid && (this._gridRef[masterGridName] = grid)}
          savedState={this.getMasterSavedState()}
        />
      </div>
    );
  }

  public render() {
    if (!this.isDataLoaded()) {
      return this.renderLoading();
    }

    const { data } = this.props;

    if (data!.detail && data!.detail![0].rs) {
      if (!data!.gcs || !data!.detail![0].gcs) {
        return this.renderLoading();
      }

      return this.renderMD();
    } else {
      if (!data!.gcs) {
        return this.renderLoading();
      }

      return this.renderS();
    }
  }
}
