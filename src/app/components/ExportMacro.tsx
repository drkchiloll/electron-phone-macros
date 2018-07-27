import {
  React, $, Dialog, ListItem,
  List, Checkbox, FlatButton,
  Subheader
} from './index';

export class ExportMacro extends React.Component<any, any> {
  state = {
    selectedMacros: [],
    exportBlobUri: null
  };
  export = () => {
    setTimeout(() => $('#export-macros')[0].click(), 500);
    let { selectedMacros, exportBlobUri } = this.state;
    const blob = new Blob(
      [JSON.stringify(selectedMacros)], { type: 'text/plain' }
    );
    exportBlobUri = URL.createObjectURL(blob);
    this.setState({ exportBlobUri });
    $('#export-macros').click((event) => {
      this.props.cancel();
    })
  }
  handleItemCheck = (checked, macro) => {
    let { selectedMacros } = this.state;
    if(checked) {
      if(macro === 'all') selectedMacros = this.props.macros;
      else selectedMacros.push(macro);
    } else {
      if(macro === 'all') selectedMacros = [];
      else {
        const macroIndex = selectedMacros.findIndex((s: any) =>
          s._id === macro._id);
        selectedMacros.splice(macroIndex, 1);
      }
    }
    this.setState({ selectedMacros });
  }
  render() {
    const { filename, macros } = this.props;
    let { exportBlobUri, selectedMacros } = this.state;
    return (
      <Dialog open={true}
        title='Macro Exporter'
        autoScrollBodyContent={true}
        modal={true}
        actions={[
          <FlatButton
            label='Cancel'
            onClick={() => this.props.cancel()} />,
          <FlatButton
            label='Export Selected'
            primary={true}
            onClick={this.export}
          >
            <a id='export-macros'
              download={`${filename || ''}.json`}
              href={exportBlobUri || ''}
            />
          </FlatButton>
        ]}
      >
        <List style={{marginLeft: 50}}>
          <Subheader> Existing Macros </Subheader>
          {
            macros.reduce((a: any[], m: any) => {
              a.push(
                <ListItem
                  key={m._id}
                  primaryText={<div style={{marginLeft:-18}}>{m.name}</div>}
                  style={{lineHeight: .20}}
                  leftCheckbox={
                    <Checkbox
                      iconStyle={{bottom:3}}
                      size={15}
                      onCheck={(e, c:boolean) => this.handleItemCheck(c, m)}
                      checked={(() => {
                        if(selectedMacros.findIndex(s => s._id === m._id) > -1)
                          return true;
                        else return false;
                      })()}
                    />
                  }
                />
              );
              return a;
            }, [
              <ListItem
                style={{lineHeight:.20}}
                key={0}
                  primaryText={
                    <div style={{ marginLeft: -18, color: '#546E7A'}}>
                      <strong>SELECT ALL</strong>
                    </div>
                  }
                leftCheckbox={
                  <Checkbox
                    size={15}
                    iconStyle={{bottom:3}}
                    onCheck={(e, c:boolean) => this.handleItemCheck(c, 'all')} />
                  }
              />
            ])
          }
        </List>
      </Dialog>
    );

  }
}