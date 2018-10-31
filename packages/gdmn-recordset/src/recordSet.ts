import { List } from "immutable";
import { IDataRow, FieldDefs, SortFields, INamedField } from "./types";

export type Data<R extends IDataRow = IDataRow> = List<R>;

export type FilterFunc<R extends IDataRow = IDataRow> = (row: R, idx: number) => boolean;

export class RecordSet<R extends IDataRow = IDataRow> {
  readonly name: string;
  private _fieldDefs: FieldDefs;
  private _data: Data<R>;
  private _currentRow: number;
  private _sortFields: SortFields;
  private _allRowsSelected: boolean;
  private _selectedRows: boolean[];

  constructor (
    name: string,
    fieldDefs: FieldDefs,
    data: Data<R>,
    currentRow: number = 0,
    sortFields: SortFields = [],
    allRowsSelected: boolean = false,
    selectedRows: boolean[] = [])
  {
    if (!data.size && !currentRow) {
      throw new Error('For an empty record set currentRow must be 0');
    }

    if (currentRow < 0 || currentRow >= data.size) {
      throw new Error('Invalid currentRow value');
    }

    this.name = name;
    this._fieldDefs = fieldDefs;
    this._data = data;
    this._currentRow = currentRow;
    this._sortFields = sortFields;
    this._allRowsSelected = allRowsSelected;
    this._selectedRows = selectedRows;
  }

  get fieldDefs() {
    return this._fieldDefs;
  }

  get data() {
    return this._data;
  }

  get sortFields() {
    return this._sortFields;
  }

  get currentRow() {
    return this._currentRow;
  }

  get allRowsSelected() {
    return this._allRowsSelected;
  }

  get selectedRows() {
    return this._selectedRows;
  }

  private checkFields(fields: INamedField[]) {
    fields.forEach( f => {
      if (!this._fieldDefs.find( fd => fd.fieldName === f.fieldName )) {
        throw new Error(`Unknown field ${f.fieldName}`);
      }
    });
  }

  public sort(sortFields: SortFields): RecordSet<R> {
    this.checkFields(sortFields);

    if (!this._data.size) {
      return this;
    }

    const currentRowData = this._data.get(this._currentRow);
    const selectedRowsData = this._selectedRows.map( (sr, idx) => sr ? this._data.get(idx) : undefined );
    const sorted = this._data.sort(
      (a, b) => sortFields.reduce(
        (p, f) => p ? p : (a[f.fieldName]! < b[f.fieldName]! ? (f.asc ? -1 : 1) : (a[f.fieldName]! > b[f.fieldName]! ? (f.asc ? 1 : -1) : 0)),
      0)
    ).toList();

    return new RecordSet<R>(
      this.name,
      this._fieldDefs,
      sorted,
      sorted.findIndex( v => v === currentRowData ),
      sortFields,
      this.allRowsSelected,
      selectedRowsData.reduce(
        (p, srd) => {
          if (srd) {
            p[sorted.findIndex( v => v === srd )] = true;
          }
          return p;
        }, [] as boolean[]
      )
    );
  }

  public moveBy(delta: number): RecordSet<R> {
    if (!this._data.size) {
      return this;
    }

    let newCurrentRow = this._currentRow + delta;
    if (newCurrentRow >= this._data.size) newCurrentRow = this._data.size - 1;
    if (newCurrentRow < 0) newCurrentRow = 0;

    return this.setCurrentRow(newCurrentRow);
  }

  public setCurrentRow(currentRow: number): RecordSet<R> {
    if (!this._data.size || this._currentRow === currentRow) {
      return this;
    }

    if (currentRow < 0 || currentRow >= this._data.size) {
      throw new Error(`Invalid row index`);
    }

    return new RecordSet<R>(
      this.name,
      this._fieldDefs,
      this._data,
      currentRow,
      this._sortFields,
      this.allRowsSelected,
      this.selectedRows
    );
  }

  public setAllRowsSelected(value: boolean) {
    if (value === this.allRowsSelected) {
      return this;
    }

    return new RecordSet<R>(
      this.name,
      this._fieldDefs,
      this._data,
      this.currentRow,
      this._sortFields,
      value,
      value ? [] : this.selectedRows
    );
  }

  public selectRow(idx: number, selected: boolean) {
    if (idx < 0 || idx >= this._data.size) {
      throw new Error(`Invalid row index`);
    }

    if (selected && (this.allRowsSelected || this.selectedRows[idx])) {
      return this;
    }

    const selectedRows = this.allRowsSelected ? Array(this._data.size).fill(true) : [...this._selectedRows];

    selectedRows[idx] = selected || undefined;
    const allRowsSelected = this._data.size === selectedRows.reduce( (p, sr) => sr ? p + 1 : p, 0 );

    return new RecordSet<R>(
      this.name,
      this._fieldDefs,
      this._data,
      this.currentRow,
      this._sortFields,
      allRowsSelected,
      allRowsSelected ? [] : selectedRows
    );
  }

  public filter(filterFunc: FilterFunc) {
    return this;
  }
};
