import { req } from './requests';
import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';
import { Promise } from 'bluebird';

export const phone = (() => {
  return {
    paths: {
      thumb: '//ImageItem/@Image',
      image: '//ImageItem/@URL'
    },
    itl() {
      return [{
        type: '8800',
        sequence: [
          'Key:Applications',
          'Key:KeyPad6',
          'Key:KeyPad4',
          'Key:KeyPad5',
          'Key:Soft3',
          'Key:Soft1',
          'Key:Soft1'
        ]
      }, {
        type: '8811',
        sequence: [
          'Key:Applications',
          'Key:KeyPad5',
          'Key:KeyPad4',
          'Key:KeyPad5',
          'Key:Soft3',
          'Key:Soft1',
          'Key:Soft1'
        ]
      }, {
        type: '8831',
        sequence: [
          'Init:Services',
          'Key:Soft3',
          'Key:KeyPad4',
          'Key:KeyPad4',
          'Key:Soft4',
          'Key:Soft2'
        ]
      }]
    },
    backgrounds() {
      return [{
        types: ['7941', '7942', '7961', '7962'],
        folder: '320x196x4'
      }, {
        types: ['7945', '7965'],
        folder: '320x212x16'
      }, {
        types: ['7970', '7971'],
        folder: '320x212x12'
      }, {
        types: ['7975'],
        folder: '320x216x16'
      }, {
        types: ['8941', '8945', '9951', '9971'],
        folder: '640x480x24'
      }, {
        types: ['8800'],
        folder: '800x480x24'
      }];
    },
    backgroundSearch({ host, path }) {
      const baseURL = `http://${host}:6970`;
      return req.get({
        url: baseURL + `/Desktops/${path}/List.xml`,
        method: 'get'
      }).then(({data}: any) => {
        if(!data) return null;
        const doc = new DOMParser().parseFromString(data);
        const thumbs: any = xpath.select(this.paths.thumb, doc);
        const images = xpath.select(this.paths.image, doc);
        return Promise.map(images, (img: any, i) => ({
          tn: thumbs[i].value.replace('TFTP:', '/'),
          image: img.value.replace('TFTP:', '/'),
          name: img.value.match(/\/\S+\/(\S+\.png)/)[1]
        }));
      }).then(backgrounds => {
        if(!backgrounds) return null;
        return Promise.map(backgrounds, (bg: any) => {
          return this.getBackground({
            url: baseURL + bg.tn
          }).then(img => {
            if(!img) bg.imgPreview = 'not found';
            else bg.imgPreview = img;
            return bg;
          });
        })
      })
    },
    getBackground({url}) {
      return req.get({
        url,
        method: 'get',
        responseType: 'arraybuffer'
      }).then(resp => resp.data);
    }
  };
})();