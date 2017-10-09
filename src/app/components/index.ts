// LIB Imports
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Promise from 'bluebird';
import * as $ from 'jquery';
import * as moment from 'moment';
import * as path from 'path';
import * as Datastore from 'nedb-core';

import { App } from './App';
import { Accounts } from './Accounts';
import { WorkingComponent } from './WorkingComponent';
import { Api } from '../lib/api';
import { CucmSql } from '../lib/cucm-sql';

import {
  indigo900, blue300, red300
} from 'material-ui/styles/colors';

import SvgIconErrorOutline from 'material-ui/svg-icons/alert/error-outline';
import { ContentAdd } from 'material-ui/svg-icons/content/add';

import {
  Paper, TextField, Divider, Drawer,
  Subheader, List, ListItem, makeSelectable,
  BottomNavigation, BottomNavigationItem,
  Toggle, Dialog, FlatButton, Chip, Avatar,
  IconButton, FontIcon, Snackbar, LinearProgress, MenuItem,
  SelectField, FloatingActionButton, Tab, Tabs
} from 'material-ui';
const SelectableList = makeSelectable(List),
      fs = require('fs');

export {
  React, ReactDOM, Promise, $,
  Paper, TextField, Divider, Drawer,
  Subheader, List, ListItem, makeSelectable,
  BottomNavigation, BottomNavigationItem,
  Toggle, Dialog, FlatButton, Chip, Avatar,
  indigo900, blue300, red300, SvgIconErrorOutline,
  IconButton, FontIcon, Snackbar, LinearProgress,
  SelectableList, fs, App, Accounts, CucmSql,
  MenuItem, SelectField, path, Datastore, moment,
  Api, WorkingComponent, FloatingActionButton,
  ContentAdd, Tab, Tabs
};