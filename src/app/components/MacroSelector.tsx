import {
  React, Component, IconButton, MenuItem, ListItem
} from './index';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { IconMenu } from 'material-ui';

const origins: any = {
  horizontal: 'left', vertical: 'top'
};

export const MacroSelector = props => {
  const { macros, values } = props;
  return (
    <IconMenu
      value={values}
      clickCloseDelay={1500}
      onChange={props.change}
      multiple={true}
      anchorOrigin={origins}
      targetOrigin={origins}
      maxHeight={272}
      iconButtonElement={
        <IconButton> <MoreVertIcon /> </IconButton>
      }
    >
      {macros.map(m => 
        <MenuItem
          key={m._id}
          value={m}
          primaryText={m.name}
        />
      )}
    </IconMenu>
  );
}