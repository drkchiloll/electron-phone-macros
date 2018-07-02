import {
  React, Component, Paper,
  IconButton, darkWhite, darkBlack
} from './index';
import { Row, Col } from 'react-styled-flexboxgrid';
import ClearSequence from 'material-ui/svg-icons/content/clear';
import EditSequence from 'material-ui/svg-icons/image/edit';
import {
  DragDropContext, Droppable, Draggable
} from 'react-beautiful-dnd';

export class MacroSequences extends Component<any, any> {
  public grid = 7;
  getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    ...draggableStyle
  })
  getListStyle = isDraggingOver => ({
    background: isDraggingOver ? '#1A237E' : 'lightgrey',
    padding: this.grid,
    width: 985
  })
  reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }
  onDragEnd = result => {
    let { macro } = this.props;
    if(!result.destination) return;
    const items = this.reorder(
      macro.cmds,
      result.source.index,
      result.destination.index
    );
    let updItems = items.map((item: any, i) => {
      item['sequenceId'] = i + 1;
      return item;
    })
    macro['cmds'] = updItems;
    this.props.updateMacro(macro);
  }
  render() {
    const { macro, remove, edit } = this.props;
    let { cmds } = macro;
    // name, description, displayName
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId='droppable'>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              style={this.getListStyle(snapshot.isDraggingOver)}
            >
              {
                cmds.map((c: any, indx: number) => (
                  <Draggable
                    key={c.sequenceId}
                    draggableId={c.sequenceId}
                    index={indx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={this.getItemStyle(
                          snapshot.isDragging,
                          provided.draggableProps.style
                        )}
                      >
                        {this._renderCard(c, snapshot.isDragging) }
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
  _renderCard = (c, isDragging) => {
    return (
      <Paper zDepth={2}
        className='seq-paper'
        style={{
          position: 'relative',
          width: 970,
          height: 60,
          margin: '7px 0px 7px 7px',
          backgroundColor: isDragging ? '#0288D1' : 'lightblue',
        }}
      >
        <IconButton
          tooltip='Remove This Sequence'
          tooltipPosition='bottom-left'
          style={{ position: 'absolute', top: 0, right: 0 }}
          onClick={() => this.props.remove(c.sequenceId)} >
          <ClearSequence style={{ height: 20, width: 20 }} />
        </IconButton>
        <div style={{
            position: 'absolute',
            top: 12,
            right: 40,
            height: 22,
            width: '1px',
            borderRight: '.5px solid black'
          }}
        />
        <IconButton
          tooltip='Edit Sequence'
          tooltipPosition='bottom-left'
          style={{ position: 'absolute', top: 0, right: 35 }}
          onClick={() => this.props.edit(c)} >
          <EditSequence style={{ height: 20, width: 20 }} />
        </IconButton>
        <div style={{ marginLeft: '10px' }}>
          <Row>
            <Col sm={4}>
              <div
                style={{
                  marginTop: '22px',
                  borderRight: 'solid 1px black',
                  color: isDragging ? darkWhite : darkBlack
                }}
              >
                {c.displayName}
              </div>
            </Col>
            <Col sm={6}>
              <div
                style={{
                  marginTop: '22px',
                  color: isDragging ? darkWhite : darkBlack
                }}
              >
                {c.description}
              </div>
            </Col>
          </Row>
        </div>
      </Paper>
    );
  }
}
