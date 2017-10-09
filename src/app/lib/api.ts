// import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import * as Datastore from 'nedb-core';

const appOut = path.resolve(__dirname, '../../'),
      appIn = path.resolve(__dirname, '../');

export class Api {
  acctDb: Datastore;
  queryDb: Datastore;
  editorDb: Datastore;
  recordId: string;

  constructor({db, dbName}:any) {
    let filename: string;
    if(fs.existsSync(`${appOut}/.data`)) {
      filename = `${appOut}/.data/.${dbName}`;
    } else {
      filename = `${appIn}/.data/.${dbName}`;
    }
    this.setDB(db, filename);
  }

  setDB(db: string, filename: string) {
    switch(db) {
      case 'acctDb':
        this.acctDb = new Datastore({ filename, autoload: true });
        break;
      default:
        return null;
    }
    return db;
  }

  whichDB() {
    if(this.acctDb) return this.acctDb;
    if(this.queryDb) return this.queryDb;
    if(this.editorDb) return this.editorDb;
  }

  get(query={}) {
    return new Promise((resolve, reject) => {
      let db = this.whichDB();
      db.find(query, (err: any, docs: any) => resolve(docs));
    });
  }

  add(record:any) {
    return new Promise((resolve, reject) => {
      let db = this.whichDB();
      db.insert(record, (err, doc) => resolve(doc));
    });
  }

  update(record:any) {
    let _id = JSON.parse(JSON.stringify(record))._id;
    return new Promise((resolve, reject) => {
      let db = this.whichDB();
      db.update({ _id }, record, { upsert: false },
        (err:any, num:number) => resolve(num));
    });
  }

  remove(_id:string) {
    return new Promise((resolve, reject) => {
      let db = this.whichDB();
      db.remove({ _id }, {}, (err: any, num: any) => {
        return resolve(num);
      });
    });
  }
}

export interface IAccount {
  name:string;
  host:string;
  version:string;
  username:string;
  password:string;
  selected:boolean;
  connected:boolean;
}

export interface IEditorSettings {
  vimMode:boolean;
  fontSize:number;
}