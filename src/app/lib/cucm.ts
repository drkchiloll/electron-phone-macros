import {
  Promise, dom,
  sqlDoc, axlHeaders,
  headers
} from '../components/index';
import { errorLog } from '../services/logger';
import { req } from './requests';
import { RisQuery } from 'cucm-risdevice-query';

export class Cucm {
  readonly doc = sqlDoc;
  readonly testAxlQuery: string = (
    `select skip 0 first 1 version from componentversion\n` +
    `where softwarecomponent="master"`
  );
  profile: ICucmSql;
  axlUrl: string;
  axlHeaders: any;
  risPort8Url: string;
  risPortUrl: string;
  modelNumToName: any;
  models: any;

  constructor(params: ICucmSql) {
    let risPath8 = `realtimeservice/services/RisPort70`,
        risPath = `realtimeservice2/services/RISService70`;
    this.profile = params;
    this.axlUrl = `https://${this.profile.host}:8443/axl/`;
    this.risPort8Url = `https://${this.profile.host}:8443/${risPath8}`;
    this.risPortUrl = `https://${this.profile.host}:8443/${risPath}`;
    this.axlHeaders = axlHeaders;
    const { SOAPAction } = this.axlHeaders;
    if(!SOAPAction.split('=')[1]) {
      this.axlHeaders.SOAPAction = this.axlHeaders.SOAPAction + params.version;
    }
  }

  setDoc(params: any) {
    return this.doc
      .replace(/\%version\%/gi, this.profile.version)
      .replace(/\%statement\%/gi, params.statement)
      .replace(/\%action\%/gi, params.action);
  }

  parseResp(data: string):any {
    // console.log(data);
    const doc = new dom().parseFromString(data);
    let rows = Array.from(doc.getElementsByTagName('row'));
    if (rows && rows.length === 0) {
      return [];
    }
    return Promise.map(rows, row => {
      return Array.from(row.childNodes).reduce((o:any, child:any) => {
        o[child.nodeName] = child.textContent;
        return o;
      }, {})
    }).then((object: any) => {
      // console.log(object);
      return object;
    });
  }

  parseErrorResp(data: any) {
    errorLog.log('error', 'CUCM RISDB Error', {
      data
    });
    console.log(data);
    if (data.statusCode === 599) {
      return new Promise((resolve, reject) => {
        resolve({ error: 'AXL Version Error' });
      });
    } else if (data && data.error) {
      return new Promise((resolve, reject) => reject(data));
    }
    const doc = new dom().parseFromString(data.body);
    let errCode:any, errMessage:any;
    if (doc.getElementsByTagName('axlcode').length >= 1) {
      errCode = doc.getElementsByTagName('axlcode')[0].textContent;
      errMessage = doc.getElementsByTagName('axlmessage')[0].textContent;
    } else {
      errCode = 'none';
      errMessage = 'No Errors';
    }
    return new Promise((resolve, reject) => {
      resolve({
        columns: ['Error'],
        rows: [[{ Error: `AxlError: ${errCode} ${errMessage}` }]]
      });
    });
  }

  query(statement: string, simple: boolean = false) {
    let doc = this.setDoc({ action: 'Query', statement }),
        url = this.axlUrl,
        headers = this.axlHeaders;
    return req.post({
      url,
      headers,
      data: doc,
      auth: {
        username: this.profile.username,
        password: this.profile.password
      },
      timeout: 7500
    }).then((result: any) => {
      if(!result.error) return this.parseResp(result);
      else {
        alert(
          `Status: ${result.error.status};` + 
          `Message: ${result.error.message}`
        );
        return result;
      }
    });
  }

  createRisDoc({ip}) {
    return Promise.resolve(
      RisQuery.createRisDoc({
        version: this.profile.version,
        query: ip
      })
    );
  }

  getDeviceModel() {
    return {
      6900: [], 7900:[], 7800:[], 8800:[], 8831:[], 8832:[], 8900:[], 9900:[]
    };
  }

  parseRisDoc(xml:string, modelNum) {
    // console.log(xml);
    const devices: any = RisQuery.parseResponse(xml);
    let models = this.getDeviceModel();
    return Promise
      .filter(devices, (d: any) =>
        modelNum.find(m => m.modelnumber === d.modelNumber))
      .reduce((item: any, d:any) => {
        d.cleared = false;
        d.checked = false;
        let model = modelNum.find(m => m.modelnumber === d.modelNumber);
        d.model = model.modelname.split(' ')[1];
        if(d.model === '8831' || d.model === '8832') {
          item[d.model].push(d);
        } else {
          item[d.model.substring(0,2) + '00'].push(d);
        }
        return item;
      }, models).then(results => {
        if(!this.models) {
          this.models = results;
          return this.models;
        } else {
          return Promise.each(Object.keys(results), type => {
            return Promise.each(results[type], (d: any) => {
              if(this.models[type].find(dev => d.name === dev.name)) {
                return;
              } else {
                this.models[type].push(d);
                return;
              }
            })
          }).then(() => this.models);
        }
      });
  }
  
  risquery(params:any) {
    let { body, modelNum } = params,
        { version, username, password } = this.profile,
        url = (version.startsWith('8')) ? this.risPort8Url :
          this.risPortUrl;
    if(!body) throw 'error';
    return req.post({
      url,
      headers,
      data: body,
      auth: { username, password },
      timeout: 9500
    }).then((result: any) => {
      if(!result.error) return this.parseRisDoc(result, modelNum);
      else {
        alert(
          `Status: ${result.error.status};` +
          `Message: ${result.error.message}`
        );
        throw result;
      }
      return result;
    });
  }
}

export interface ICucmSql {
  username: string;
  password: string;
  host: string;
  version: string;
}