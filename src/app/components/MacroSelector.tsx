import {
  React, Component, IconButton, MenuItem, ListItem, SelectField,
  Subheader, darkBlack, $
} from './index';
// const robot = require('robotjs');

import CloseIcon from 'material-ui/svg-icons/navigation/close';

import { fullBlack } from 'material-ui/styles/colors';

const origins: any = {
  horizontal: 'left', vertical: 'top'
};

const menuItems = (macros: any, values: any) => {
  let items: any = [(
    <IconButton
      key='close'
      style={{ position: 'absolute', right: 5, top: -13, marginBottom: 10 }}
      iconStyle={{ height: 25, width: 25 }}
      onClick={() => {
        // let { x, y } = robot.getMousePos();
        // robot.moveMouseSmooth(x+50, y);
        // robot.mouseClick();
        setTimeout(() => {
          $('#search_field_0').focus();
        }, 0);
      }}
    >
      <CloseIcon />
    </IconButton>
  )]
  return macros.reduce((a: any, m) => {
    a.push(<MenuItem
      key={m._id}
      value={m}
      checked={values && values.findIndex(v => v._id === m._id) > -1}
      primaryText={m.name}
    />);
    return a;
  }, items);
};

export const MacroSelector = props => {
  const { macros, values } = props;
  return (
    <SelectField
      id='macro-selector'
      floatingLabelText={'SELECT JOBS TO RUN'}
      multiple={true}
      value={values}
      onChange={props.change}
      fullWidth={true}
      style={{marginLeft: 5, width: 'auto', minWidth: 335}}
      menuStyle={{autoWidth: true}}
      iconStyle={{outlineColor: fullBlack}}
    >
      { menuItems(macros, values) }
    </SelectField>
  );
}