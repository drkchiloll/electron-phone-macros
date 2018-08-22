import * as JSZip from 'jszip';
import * as DocX from 'docxtemplater';
import * as ImageModule from 'open-docxtemplater-image-module';
import * as sizeof from 'image-size';
import { join } from 'path';
import { readFileSync, readFile } from 'fs';
import { resolve } from 'dns';

export class DocBuilder {
  private zip: JSZip;
  private docx: DocX;
  private imager: ImageModule;
  constructor() {}
  initialize() {
    const file = './doc_template.docx',
      enc = 'binary';
    return new Promise((res, rej) => {
      readFile(join(__dirname, file), enc, (err, template) => {
        this.zip = new JSZip(template);
        this.docx = new DocX();
        this.imager = new ImageModule({
          centered: false,
          fileType: 'docx',
          getImage: (tagVal, tagName) => {
            return tagVal;
          },
          getSize: (img, tagVal, tagName) => {
            const image = Buffer.from(img, 'binary');
            const dimensions = sizeof(image);
            if(dimensions.width >= 800 || dimensions.height >= 301) {
              dimensions.width = 450;
              dimensions.height = 300;
            }
            return [dimensions.width, dimensions.height];
          }
        });
        return res();
      });
    });
  }
  createDoc(data) {
    return new Promise((res, rej) => {
      this.docx
        .attachModule(this.imager)
        .loadZip(this.zip)
        .setData(data)
        .render()
      return res(
        this.docx
          .getZip()
          .generate({
            type: 'nodebuffer',
            compression: 'DEFLATE'
          })
      );
    });
  }
}