// LIB Imports
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Promise from 'bluebird';
import * as $ from 'jquery';
import * as moment from 'moment';
import * as path from 'path';
import * as Datastore from 'nedb-core';
import * as request from 'request';
import { DOMParser as dom } from 'xmldom';
import * as xpath from 'xpath';

import { App } from './App';
import { Accounts } from './Accounts';
import { WorkingComponent } from './WorkingComponent';
import { Api } from '../lib/api';
import { Cucm } from '../lib/cucm';
import {
  sqlDoc, risDoc, axlHeaders, headers, phModelQuery, devAssQuery, updDevAssoc
} from '../lib/configs';

import {
  indigo900, blue300, red300
} from 'material-ui/styles/colors';

// import SvgIconErrorOutline from 'material-ui/svg-icons/alert/error-outline';

import {
  Paper, TextField, Divider, Drawer,
  Subheader, List, ListItem, makeSelectable,
  BottomNavigation, BottomNavigationItem,
  Toggle, Dialog, FlatButton, Chip, Avatar,
  IconButton, FontIcon, Snackbar, LinearProgress, MenuItem,
  SelectField, FloatingActionButton, Tab, Tabs, RaisedButton,
  Card, CardHeader, CardText, Table, TableBody, TableHeader,
  TableHeaderColumn, TableRow, TableRowColumn
} from 'material-ui';
const SelectableList = makeSelectable(List),
      fs = require('fs');

export {
  React, ReactDOM, Promise, $,
  Paper, TextField, Divider, Drawer,
  Subheader, List, ListItem, makeSelectable,
  BottomNavigation, BottomNavigationItem,
  Toggle, Dialog, FlatButton, Chip, Avatar,
  indigo900, blue300, red300,
  IconButton, FontIcon, Snackbar, LinearProgress,
  SelectableList, fs, App, Accounts, Cucm,
  MenuItem, SelectField, path, Datastore, moment,
  Api, WorkingComponent, FloatingActionButton,
  Tab, Tabs, sqlDoc, risDoc, axlHeaders,
  request, dom, headers, RaisedButton, phModelQuery,
  xpath, Card, CardHeader, CardText, Table, TableBody,
  TableHeader, TableHeaderColumn, TableRow, TableRowColumn,
  devAssQuery, updDevAssoc
};