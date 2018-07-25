import axios, { AxiosInstance } from 'axios';
import { readdir, readFile, writeFile } from 'fs';
import { join } from 'path';
import { Promise } from 'bluebird';
import * as moment from 'moment';

export class Updator {
  private GH_TOKEN = '53c3b96a3c5f092111d950d6c67531e2ede5d0bb';
  private GH_URL = 'https://api.github.com/repos/drkchiloll/'
  private GH_REPO = 'imperium_updator';
  public readonly ROOT_DIR = join(__dirname);
  public dateFormat = 'MM/DD/YYYY h:mm:a';
  public requestor: AxiosInstance;
  constructor() {
    this.requestor = axios.create({
      baseURL: this.GH_URL + this.GH_REPO,
      headers: { Authorization: `Bearer ${this.GH_TOKEN}` }
    });
  }

  getLocalFiles() {
    return new Promise(resolve => {
      readdir(this.ROOT_DIR, (err, files) => resolve(files));
    });
  }

  setUpdatedDate() {
    localStorage.setItem('lastUpdated', moment().format(this.dateFormat));
    return Promise.resolve('/contents');
  }

  filterRepo(files: any[]) {
    return Promise.filter(files, ({name, git_url}) =>
      name.includes('bundle.js') || name === 'index.html' ||
      name.includes('.jar')
    ).then(files => Promise.map(files, f =>
      ({ name: f.name, uri: f.git_url })
    ))
  }

  processFiles(files: any[]) {
    return Promise.map(files, f =>
      this.requestor.get(f.uri).then(({data:{content}}) => {
        let encoding = 'base64';
        if(f.name.includes('jar') || f.name.includes('docx')) {
          return Object.assign(f, {
            content: new Buffer(content, 'base64')
          })
        }
        return Object.assign(f, {
          content: new Buffer(content, 'base64')
            .toString('utf-8')
        });
      }));
  }

  getLocalFile({rootdir, name}) {
    return new Promise(resolve => {
      readFile(`${rootdir}/${name}`, 'utf-8', (err, file) =>
        resolve(file))
    });
  }

  writeLocal({rootdir, name, content}) {
    return new Promise(resolve => {
      let encoding = 'utf-8';
      if(name.includes('.jar')) {
        rootdir = rootdir + '/java';
        encoding = null;
      }
      writeFile(`${rootdir}/${name}`, content, (err) =>
        resolve('done'))
    })
  }

  compareFiles(files: any[], rootdir) {
    return Promise.reduce(files, (a, { name, content }) => {
      if(name.includes('.jar')) {
        a.push({ name, content });
        return a;
      }
      return this.getLocalFile({ rootdir, name })
        .then(local => {
          if(local != content) a.push({ name, content });
          return a;
        });
    }, [])
  }

  updateLocal(files: any[], rootdir) {
    if(files.length > 0) {
      return Promise.each(files, ({ name, content }) => {
        this.writeLocal({ rootdir, name, content })
      }).then(() => true);
    } else {
      return false;
    }
  }
}

export const updateService = (() => {
  const service: any = {
    start() {
      const updator = new Updator();
      const rootdir = updator.ROOT_DIR;
      return updator.setUpdatedDate()
        .then(path => updator.requestor.get(path)
        .then(({data}) => data))
        .then(files => updator.filterRepo(files))
        .then(files => updator.processFiles(files))
        .then(files => updator.compareFiles(files, rootdir))
        .then(files => updator.updateLocal(files, rootdir));
    }
  };
  return service;
})();