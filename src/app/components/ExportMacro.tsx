import { React, $ } from './index';

const click = props => {
  setTimeout(() => $('#export-macros')[0].click(), 200);
  $('#export-macros').click((event) => {
    props.cancel();
  })
}

export class ExportMacro extends React.Component<any, any> {
  componentDidMount() {
    setTimeout(() => $('#export-macros')[0].click(), 200);
    $('#export-macros').click((event) => {
      this.props.cancel();
    })
  }
  render() {
    const { filename, macros } = this.props;
    const blob = new Blob(
      [JSON.stringify(macros)], { type: 'text/plain' }
    );
    const uri = URL.createObjectURL(blob);
    return (
      <a id='export-macros'
        download={`${filename || ''}.json`}
        href={uri || ''}
      />
    );

  }
}