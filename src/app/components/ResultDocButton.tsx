import { React, RaisedButton } from './index';

export const ResultDocButton = props => {
  const { style, open } = props;
  return (
    <RaisedButton
      label='OPEN RESULTS'
      style={style}
      fullWidth={true}
      onClick={open}
      buttonStyle={{backgroundColor: 'red'}}
    />
  )
}