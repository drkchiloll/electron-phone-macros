import * as React from 'react'
import * as $ from 'jquery';

const mod = global.myModule;
mod.init();


// Import Components
import { StateLess } from './component';

export class App extends React.Component<any, any> {
	constructor() {
		super();
		this.state = { activeTab: 'home' };
		this._activeTab = this._activeTab.bind(this);
	}
	componentDidMount() {
		$(`#${this.state.activeTab}`).addClass('active');
	}
	_activeTab(e:any) {
		$(`#${e.target.name}`).addClass('active');
		$(`#${this.state.activeTab}`).removeClass('active');
		this.setState({ activeTab: e.target.name });
	}
	render() {
		let { activeTab } = this.state,
				mainDisplay = activeTab==='home' ? 'block' : 'none',
				compDisplay = activeTab==='component' ? 'block' : 'none';
		return (
			<div>
				<ul className='nav nav-tabs col-sm-7' style={{margin:'0 300px 0 10px'}}>
					<li id='home' role="presentation"
						onClick={this._activeTab}>
						<a href="#">
							Home
						</a>
					</li>
					<li id='component' role="presentation"
						onClick={this._activeTab}>
						<a href="#">
							Component
						</a>
					</li>
				</ul>
				<div style={{margin: '15px 25px 0 10px'}}>
					<div className='row'>
						<div className='col-sm-10'
							style={{display: mainDisplay}}>
							<p> This is HOME </p>
						</div>
						<div className='col-sm-8'
							style={{display: compDisplay}}>
							<StateLess propName={'StateLess/Dumb'}/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
