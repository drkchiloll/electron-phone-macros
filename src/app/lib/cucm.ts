import {
  Promise, request, dom,
  sqlDoc, risDoc, axlHeaders,
  headers, xpath
} from '../components/index';

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
    this.axlHeaders = axlHeaders + params.version;
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

  gridify(data: any) {
    let keys = Object.keys(data[0]);
    return Promise.all([
      keys.map(value => ({ value })),
      data.reduce((a:any, obj:any, i:number) => {
        a.push(keys.map(value => ({ value: obj[value] })));
        return a;
      }, [])
    ]).then(results => {
      results[1].unshift(results[0]);
      return results[1];
    })
  }

  dataGridColumnize(data: any) {
    let keys = Object.keys(data[0]);
    return Promise.map(keys, (key) => ({
      key, name: key, editable: true, resizeable: true
    }))
  }

  fixDataGridColumnize(data: any) {
    return Object.keys(data[0]);
  }

  dataGridRowify(data: any) {
    let keys = Object.keys(data[0]);
    return Promise.reduce(data, (a:any, o:any, i:any) => {
      return Promise.reduce(keys, (ob:any, key:any, i:any) => {
        if (i === 0) {
          ob['id'] = o[key];
          ob[key] = o[key];
        }
        else ob[key] = o[key];
        return ob;
      }, {}).then((object) => {
        a.push(object);
        return a;
      });
    }, []);
  }

  fixedDataRowify(data: any) {
    let keys = Object.keys(data[0]);
    return Promise.reduce(keys, (a:any, key:any) => {
      return Promise.map(data, (obj:any) => {
        let o:any = {};
        o[key] = obj[key];
        return o;
      }).then((arrs) => {
        a.push(arrs);
        return a;
      })
    }, []);
  }

  query(statement: string, simple: boolean = false) {
    let doc = this.setDoc({ action: 'Query', statement }),
        uri = this.axlUrl,
        headers = this.axlHeaders;
    // console.log(doc);
    let csvRows: any;
    return this._req(this._options({ uri, headers, body: doc }))
      .then((data: string) => this.parseResp(data))
      .then((moreData: any) => {
        if (simple) return moreData;
        if (moreData.length === 0) return undefined;
        csvRows = moreData;
        return Promise.all([
          this.fixDataGridColumnize(moreData), this.fixedDataRowify(moreData)
        ]);
      })
      .then((results: any) => {
        if (results && simple) return results;
        if (!results) {
          results = [];
          results[0] = ['RESULT'];
          results[1] = [[{ RESULT: 'No Results from Query' }]];
        }
        return {
          columns: results[0],
          rows: results[1],
          csvRows
        };
      }).catch(this.parseErrorResp);
  }

  update(statement: string) {
    let doc = this.setDoc({ action: 'Update', statement }),
        uri = this.axlUrl,
        headers = this.axlHeaders;
    // console.log(doc);
    return this._req(
      this._options({
        uri,
        headers,
        body: doc 
      })).then((data: string) => {
      console.log(data);
      return data;
    })
  }

  createRisDoc({doc, ip}) {
    let xml = new dom().parseFromString(doc),
        classElement;
    if(this.profile.version.startsWith('8')) {
      classElement = xml.getElementsByTagName('soap:DeviceClass')[0];
      xml.getElementsByTagName('soap:SelectItems')[0]
         .setAttribute('xsi:type', 'soapenc:Array');
    } else {
      classElement = xml.getElementsByTagName('soap:Class')[0];
    }
    classElement.parentNode.removeChild(classElement);
    return new Promise((resolve, reject) => 
      resolve(xml.toString().replace('%ipaddress%', ip)));
  }

  getDeviceModel() {
    return {
      7900:[], 7800:[], 8800:[], 8831:[], 8900:[], 9900:[]
    };
  }

  parseRisDoc(xml:string, modelNum) {
    let doc = new dom().parseFromString(xml),
        // models = this.getDeviceModel(),
        ipNodes,modelNodes,nameNodes,fwNodes;
    if(!this.models) this.models = this.getDeviceModel();
    if(this.profile.version.startsWith('8')) {}
    else {
      let ns1Select = xpath.useNamespaces({
        ns1: 'http://schemas.cisco.com/ast/soap'
      });
      ipNodes = ns1Select('//ns1:IP', doc);
      modelNodes = ns1Select('//ns1:Model', doc);
      nameNodes = ns1Select('//ns1:CmDevices/ns1:item/ns1:Name', doc);
      fwNodes = ns1Select('//ns1:ActiveLoadID', doc);
    }
    return Promise.map(ipNodes, (node:any, i) => {
      return {
        modelNumber : modelNodes[i].firstChild.data,
        ip: node.firstChild.data,
        name: nameNodes[i].firstChild.data,
        firmware: (() => {
          if(fwNodes[i] && fwNodes[i].firstChild) {
            // console.log(fwNodes[i].firstChild.data);
            return fwNodes[i].firstChild.data;
          } else {
            'UNKNOWN'
          }
        })(),
        cleared: false,
        checked: false
      };
    }).then((phones:any) => {
      return Promise.reduce(phones, (a:any, phone:any) => {
        let model = modelNum.find((m:any) =>
          m.modelnumber === phone.modelNumber);
        if(model) {
          phone['model'] = model.modelname;
          a.push(phone);
        }
        return a;
      }, []);
    }).then((results) => {
      return Promise.map(results, (result:any) => {
        result.model = result.model.split(' ')[1];
        if(result.model === '8831') this.models[result.model].push(result);
        else this.models[result.model.substring(0, 2) + '00'].push(result);
        return;
      });
    }).then(() => this.models);
  }
  
  risquery(params:any) {
    let { body } = params,
        { version } = this.profile,
        uri = (version.startsWith('8')) ? this.risPort8Url :
          this.risPortUrl;
    // console.log(body);
    return this._req(this._options({ uri, headers, body }))
      .then((data:string) => this.parseRisDoc(data, params.modelNum))
      .catch((err:any) => {
        console.log(err);
        return;
        // return new Promise((resolve, reject) => {
        //   setTimeout(() => {
        //     resolve(this._req(params));
        //   }, 5000);
        // });
      })
  }

  devConcattor(old:any, news:any) {
    console.log(old);
    console.log(news);
    // return Object.keys(old).reduce((o:any, k:string) => {
    //   o[k] = old[k];
    //   o[k].concat(news[k]);
    //   return o;
    // }, {})
  }

  private _options({ uri, headers, body }) {
    return {
      uri,
      headers,
      strictSSL: false,
      method: 'POST',
      auth: { user: this.profile.username, pass: this.profile.password },
      body
    };
  }

  private _req(options: any) {
    return new Promise((resolve, reject) => {
      request(options, (err:any, res:any, body:any) => {
        if (err) return reject({ error: err });
        if (res.statusCode >= 500 && res.statusCode <= 599) return reject(res);
        if (res.statusCode === 200) return resolve(body);
        return resolve();
      });
    });
  }
}

export interface ICucmSql {
  username: string;
  password: string;
  host: string;
  version: string;
}