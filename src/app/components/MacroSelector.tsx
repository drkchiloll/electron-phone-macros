import {
  React, Component, IconButton, MenuItem, ListItem, SelectField,
  Subheader, darkBlack, $, FontIcon
} from './index';
// const robot = require('robotjs');
import * as robot from 'robotjs';

import CloseIcon from 'material-ui/svg-icons/navigation/close';
import ExpandMore from 'material-ui/svg-icons/navigation/expand-more'

import { fullBlack } from 'material-ui/styles/colors';

const origins: any = {
  horizontal: 'left', vertical: 'top'
};

const menuItems = (macros: any, values: any) => {
  let items: any = [(
    <IconButton
      key='close'
      style={{ position: 'absolute', right: 5, top: -13 }}
      iconStyle={{ height: 19, width: 19 }}
      onClick={() => {
        let { x, y } = robot.getMousePos();
        robot.moveMouseSmooth(x+50, y);
        robot.mouseClick();
        setTimeout(() => {
          $('#search_field_0').focus();
        }, 0);
      }}
    >
      <CloseIcon />
    </IconButton>
  )]
  return macros.reduce((a: any, m, index) => {
    a.push(<MenuItem
      key={m._id}
      value={m}
      checked={values && values.findIndex(v => v._id === m._id) > -1}
      innerDivStyle={{
        marginTop: index===0 ? 8: 0
      }}
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
      floatingLabelText={'SELECT MACROS TO RUN'}
      multiple={true}
      value={values}
      onChange={props.change}
      fullWidth={true}
      style={{marginLeft: 5, width: 'auto', minWidth: 335}}
      menuStyle={{autoWidth: true}}
      underlineStyle={{borderBottomColor: fullBlack}}
      dropDownMenuProps={{
        iconButton: <FontIcon style={{ color: fullBlack, marginTop: -150 }}>
          <ExpandMore/>
        </FontIcon>
      }}
    >
      { menuItems(macros, values) }
    </SelectField>
  );
}