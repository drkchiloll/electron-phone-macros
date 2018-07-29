import { React, RaisedButton } from './index';

export const ResultDocButton = props => {
  const { style, open } = props;
  return (
    <RaisedButton
      label='OPEN RESULTS'
      style={style}
      primary={true}
      fullWidth={true}
      onClick={open}
    />
  )
}