import { resolve } from 'path';
import { Promise } from 'bluebird';
import * as Datastore from 'nedb-core';
const dbpath = resolve(__dirname, '../.data/.models');
export class ModelEnum {
  private static db: Datastore = new Datastore({
    filename: dbpath,
    autoload: true
  });
  static get() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, models) => resolve(models));
    })
  }
}