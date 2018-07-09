// LIB Imports
import * as React from 'react';
import { Component } from 'react';
import * as ReactDOM from 'react-dom';
import * as Promise from 'bluebird';
import * as $ from 'jquery';
import * as path from 'path';
import * as Datastore from 'nedb-core';
import * as request from 'request';
import { DOMParser as dom } from 'xmldom';
import * as xpath from 'xpath';
import * as moment from 'moment';
import { App } from './App';
import { Accounts } from './Accounts';
import { MainView } from './MainView';
import { MacroForm } from './MacroForm';
import { MacroSequences } from './MacroSequences'
import { PhoneMacros } from './PhoneMacros';

import { Api } from '../lib/api';
import { Cucm } from '../lib/cucm';
import { phone } from '../lib/phone-macros';
import {
  sqlDoc, risDoc, axlHeaders, headers,
  phModelQuery, devAssQuery, updDevAssoc
} from '../lib/configs';

import {
  indigo900, blue300, red300,
  darkBlack, darkWhite, fullWhite,
  blueGrey200, blueGrey500
} from 'material-ui/styles/colors';

import { getMuiTheme, MuiThemeProvider } from 'material-ui/styles';

import {
  Paper, TextField, Divider, Drawer, AutoComplete,
  Subheader, List, ListItem, makeSelectable, CardMedia,
  BottomNavigation, BottomNavigationItem, CardActions,
  Toggle, Dialog, FlatButton, Chip, Avatar, CardTitle,
  IconButton, FontIcon, Snackbar, LinearProgress, MenuItem,
  SelectField, FloatingActionButton, Tab, Tabs, RaisedButton,
  Card, CardHeader, CardText, Table, TableBody, TableHeader,
  TableHeaderColumn, TableRow, TableRowColumn, Checkbox
} from 'material-ui';
const SelectableList = makeSelectable(List),
  fs = require('fs');

export {
  React, Component, ReactDOM, Promise, $,
  Paper, TextField, Divider, Drawer, moment,
  Subheader, List, ListItem, makeSelectable,
  BottomNavigation, BottomNavigationItem,
  Toggle, Dialog, FlatButton, Chip, Avatar,
  indigo900, blue300, red300, blueGrey200,
  IconButton, FontIcon, Snackbar, LinearProgress,
  SelectableList, fs, App, Accounts, Cucm,
  MenuItem, SelectField, path, Datastore,
  Api, MainView, FloatingActionButton,
  Tab, Tabs, sqlDoc, risDoc, axlHeaders,
  request, dom, headers, RaisedButton, phModelQuery,
  xpath, Card, CardHeader, CardText, Table, TableBody,
  TableHeader, TableHeaderColumn, TableRow, TableRowColumn,
  devAssQuery, updDevAssoc, darkBlack, darkWhite, getMuiTheme,
  MuiThemeProvider, fullWhite, phone, Checkbox, blueGrey500,
  PhoneMacros, MacroForm, MacroSequences, AutoComplete,
  CardMedia, CardTitle
};