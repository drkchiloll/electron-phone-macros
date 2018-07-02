// import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import * as Datastore from 'nedb-core';
import { EventEmitter } from 'events';

const appOut = path.resolve(__dirname, '../../'),
      appIn = path.resolve(__dirname, '../');

export class Api {
  acctDb: Datastore;
  macroDb: Datastore;
  modelDb: Datastore;
  recordId: string;
  macroEvent = new EventEmitter();

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
      case 'modelDb':
        this.modelDb = new Datastore({ filename, autoload: true });
      case 'macroDb':
        this.macroDb = new Datastore({ filename, autoload: true });
      default:
        return null;
    }
    return db;
  }

  whichDB() {
    if(this.acctDb) return this.acctDb;
    if(this.macroDb) return this.macroDb;
    if(this.modelDb) return this.modelDb;
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
      db.insert(record, (err, doc) => {
        if(this.macroDb) {
          this.get().then(macros => {
            this.macroEvent.emit('m-add', macros);
          });
        }
        resolve(doc)
      });
    });
  }

  update(record:any) {
    let _id = JSON.parse(JSON.stringify(record))._id;
    return new Promise((resolve, reject) => {
      let db = this.whichDB();
      db.update({ _id }, record, { upsert: false },
        (err:any, num:number) => {
          db.persistence.compactDatafile();
          if(this.macroDb) {
            this.get().then(macros => {
              this.macroEvent.emit('m-update', macros);
            });
          }
          return resolve(num);
      });
    });
  }

  remove(_id:string) {
    return new Promise((resolve, reject) => {
      let db = this.whichDB();
      db.remove({ _id }, {}, (err: any, num: any) => {
        db.persistence.compactDatafile();
        if(this.macroDb) {
          this.get().then(macros => {
            this.macroEvent.emit('m-remove', macros);
          });
        }
        return resolve(num);
      });
    });
  }
}

export const dbService = (() => {
  const service: any = {
    accounts() {
      return new Api({
        db: 'acctDb',
        dbName: 'accounts'
      });
    },
    models() {
      return new Api({
        db: 'modelDb',
        dbName: 'models'
      });
    },
    macros() {
      return new Api({
        db: 'macroDb',
        dbName: 'macros'
      });
    }
  };
  return service;
})()