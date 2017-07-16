import * as React from 'react'
import * as $ from 'jquery';
import { 
	Tabs, Tab, FontIcon, Dialog,
	FlatButton
} from 'material-ui';

// Import Components
import {
	Accounts
} from './index';

export class App extends React.Component<any, any> {
	constructor() {
		super();
		this.state = {
			tabValue: 'mainView',
			openAcct: false,
			tabIndx: 1,
		};
		this.handleClose = this.handleClose.bind(this);
		this._tabSelect = this._tabSelect.bind(this);
	}
	handleClose() {
		this.setState({
			openAcct: false,
			tabIdx: 1,
			tabValue: 'mainView'
		});
	}
	_tabSelect(tabValue:string) {
		let saveQuery = false;
		if(tabValue==='save') saveQuery = true;
		this.setState({
			openAcct: tabValue==='accts' ? true : false,
			tabValue,
			saveQuery
		});
	}
	render() {
		return (
			<div>
				<div style={{width: 180}}>
					<Tabs className='tabs-container'
						inkBarStyle={{ background:'rgb(140,20,17)' }}
						tabItemContainerStyle={{width: 180}}
						initialSelectedIndex={this.state.tabIndx}
						value={this.state.tabValue}
						onChange={this._tabSelect}>
						<Tab
							icon={
								<span className='fa-stack fa-lg' >
									<i className='fa fa-server fa-stack-2x'/>
								</span>
							}
							label='Accounts'
							value='accts'>
							<Accounts
								openDia={this.state.openAcct}
								acctClose={this.handleClose} />
						</Tab>
					</Tabs>
				</div>
			</div>
		);
	}
}
