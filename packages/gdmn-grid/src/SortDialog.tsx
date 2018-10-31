import React, { Fragment } from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, MenuItem, Select, FormControl, InputLabel, createMuiTheme, MuiThemeProvider, NativeSelect, withStyles } from '@material-ui/core';
import cn from 'classnames';
import './SortDialog.css';
import { FieldDefs, SortFields } from 'gdmn-recordset';

const theme = createMuiTheme({
  palette: {
    primary: {
      dark: 'rgb(0, 0, 0)',
      main: 'rgb(0, 0, 0)',
      light: 'rgb(255, 255, 255)',
      contrastText: 'rgb(0, 0, 0)',
    },
    text: {
      primary: 'rgb(0, 0, 0)',
      secondary: 'rgb(0, 0, 0)',
    },
    background: {
      paper: 'rgb(240, 240, 240)'
    },
  },
  shape: {
    borderRadius: 0
  },
  typography: {
    useNextVariants: true,
    button: {
      fontSize: '11px',
      textTransform: 'none'
    },
    fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    subtitle1: {
      fontSize: '11px'
    }
  },
  overrides: {
    MuiDialog: {
      root: {
        cursor: 'default'
      },
      paper: {
        border: '1px solid dodgerblue'
      }
    },
    MuiDialogTitle: {
      root: {
        backgroundColor: 'white',
        height: '25px',
        padding: '5px 4px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    },
    MuiDialogContent: {
      root: {
        padding: '6px'
      }
    },
    MuiSelect: {
      root: {
        border: '1px solid dimgray',
        paddingLeft: '2px'
      },
      select: {
        fontSize: '11px',
        paddingTop: '0',
        paddingBottom: '0'
      }
    },
    MuiFormControl: {
      root: {
        minWidth: '200px',
        paddingRight: '6px',
      }
    },
    MuiListItem: {
      root: {
        paddingTop: '0',
        paddingBottom: '0'
      }
    },
    MuiMenuItem: {
      root: {
        fontSize: '11px'
      }
    },
    MuiButton: {
      root: {
        border: '1px solid rgb(173, 173, 173)',
        padding: '0 4px',
        minHeight: '21px',
      },
    }
  }
});

const smallButtonStyles = {
  root: {
    maxWidth: '21px',
    minWidth: '21px',
    marginLeft: '4px'
  }
};

const SmallButton = withStyles(smallButtonStyles)(Button);

export interface IGDMNSortDialogProps {
  fieldDefs: FieldDefs,
  sortFields: SortFields,
  onCancel: () => void,
  onApply: (sortFields: SortFields) => void
};

export interface IGDMNSortDialogState {
  sortFields: SortFields,
  attnFieldIdx: number
};

class GDMNSortDialog extends React.Component<IGDMNSortDialogProps, {}> {
  state: IGDMNSortDialogState = {
    sortFields: this.props.sortFields.length ? [...this.props.sortFields] : [{ fieldName: this.props.fieldDefs[0].fieldName, asc: true }],
    attnFieldIdx: -1
  };

  setAttnField = (attnFieldIdx: number) => {
    setTimeout( () => this.setState({ attnFieldIdx: -1 }), 400);
    this.setState({ attnFieldIdx });
  }

  selectField = (idx: number) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sortFields = [...this.state.sortFields];
    const attnFieldIdx = sortFields.findIndex( (sf, i) => i !== idx && sf.fieldName === event.target.value );

    if (attnFieldIdx >= 0) {
      this.setAttnField(attnFieldIdx);
    } else {
      sortFields[idx].fieldName = event.target.value;
      this.setState({ sortFields });
    }
  };

  selectFieldOrder = (idx: number) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sortFields = [...this.state.sortFields];
    sortFields[idx].asc = event.target.value === 'true';
    this.setState({ sortFields });
  };

  onDelete = (idx: number) => {
    const sortFields = [...this.state.sortFields];
    sortFields.splice(idx, 1);
    this.setState({ sortFields });
  }

  onAdd = (idx: number) => {
    const sortFields = [...this.state.sortFields];
    const { fieldDefs } = this.props;
    sortFields.splice(idx + 1, 0, { fieldName: fieldDefs.find( fd => !sortFields.find( sf => sf.fieldName === fd.fieldName ) )!.fieldName, asc: true });
    this.setState({ sortFields });
  }

  onMoveUp = (idx: number) => {
    const sortFields = [...this.state.sortFields];
    const temp = sortFields[idx];
    sortFields[idx] = sortFields[idx - 1];
    sortFields[idx - 1] = temp;
    this.setState({ sortFields });
  }

  onMoveDown = (idx: number) => {
    const sortFields = [...this.state.sortFields];
    const temp = sortFields[idx];
    sortFields[idx] = sortFields[idx + 1];
    sortFields[idx + 1] = temp;
    this.setState({ sortFields });
  }

  render() {
    const { onCancel, onApply, fieldDefs } = this.props;
    const { sortFields, attnFieldIdx } = this.state;
    const fields = (prefix: string) => fieldDefs
      .map(
        fd =>
          <MenuItem key={`${prefix}-${fd.fieldName}`} value={fd.fieldName}>
            {fd.caption ? fd.caption : fd.fieldName}
          </MenuItem>
      );

    const makeRow = (idx: number, fieldName: string, sortOrder: boolean) => (
      <div key={`row-${fieldName}`} className={cn('GDMNSortDialogRow', { GDMNAttnSortDialogRow: idx >= 0 && idx === attnFieldIdx })}>
        <FormControl>
          <div className="GDMNSortDialogLabel">Поле:</div>
          <Select
            onChange={this.selectField(idx)}
            value={fieldName}
            displayEmpty={true}
            disableUnderline={true}
            inputProps={{
              id: `select-field-${fieldName}`
            }}
          >
            {fields(fieldName)}
          </Select>
        </FormControl>
        <FormControl>
          <div className="GDMNSortDialogLabel">Порядок:</div>
          <Select
            onChange={this.selectFieldOrder(idx)}
            value={ sortOrder ? 'true' : 'false' }
            disableUnderline={true}
            inputProps={{
              id: `select-order-${fieldName}`
            }}
          >
            <MenuItem value="true">
              По возрастанию
            </MenuItem>
            <MenuItem value="false">
              По убыванию
            </MenuItem>
          </Select>
        </FormControl>
        <SmallButton
          variant="text"
          disabled={sortFields.length === fieldDefs.length}
          color="primary"
          onClick={() => this.onAdd(idx)}
        >
          🞤
        </SmallButton>
        <SmallButton
          variant="text"
          disabled={idx < 1}
          color="primary"
          onClick={() => this.onMoveUp(idx)}
        >
          ▲
        </SmallButton>
        <SmallButton
          variant="text"
          disabled={idx === sortFields.length - 1}
          color="primary"
          onClick={() => this.onMoveDown(idx)}
        >
          ▼
        </SmallButton>
        <SmallButton
          variant="text"
          disabled={sortFields.length === 1}
          color="primary"
          onClick={() => this.onDelete(idx)}
        >
          ✖
        </SmallButton>
      </div>);

    return (
      <MuiThemeProvider theme={theme}>
      <Dialog
        open={true}
        aria-labelledby="sort-dialog-title"
        aria-describedby="sort-dialog-description"
      >
        <DialogTitle
          id="sort-dialog-title"
          disableTypography={true}
        >
          <div>
            Сортировка
          </div>
          <div className="GDMNSortDialogCloseButton" onClick={onCancel}>
            ✕
          </div>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="sort-dialog-description">
            Выберите поле или несколько полей и порядок сортировки.
          </DialogContentText>
            <div className="GDMNSortDialogContainer">
              {sortFields.map( (sf, idx) => makeRow(idx, sf.fieldName, !!sf.asc) )}
            </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} variant="text" color="primary">
            Cancel
          </Button>
          <Button onClick={ () => onApply(sortFields) } variant="text" color="primary" autoFocus>
            Sort
          </Button>
        </DialogActions>
      </Dialog>
      </MuiThemeProvider>
    );
  }
};

export default GDMNSortDialog;