import * as JSZip from 'jszip';
import * as DocX from 'docxtemplater';
import * as ImageModule from 'open-docxtemplater-image-module';
import * as sizeof from 'image-size';
import { join } from 'path';
import { readFileSync } from 'fs';

export class DocBuilder {
  private zip: JSZip;
  private docx: DocX;
  private imager: ImageModule;
  constructor() {
    const docTemplate = readFileSync(
      join(__dirname, './doc_template.docx'), 'binary'
    );
    this.zip = new JSZip(docTemplate);
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
  }
  createDoc(data) {
    this.docx
      .attachModule(this.imager)
      .loadZip(this.zip)
      .setData(data)
      .render()
    return this.docx.getZip()
      .generate({type: 'nodebuffer', compression: 'DEFLATE'})
  }
}