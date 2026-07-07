import fs from 'fs';
import path from 'path';

class CorkBuild {

  constructor() {
    this.file = null;
  }

  readFile(){
    if (this.file) {
      return this.file;
    }
    const filePath = path.resolve('/cork-build-info', 'ucdlib-ref-stats.json');
    if (fs.existsSync(filePath)) {
      this.file = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return this.file;
  }

  get tag(){
    const file = this.readFile();
    if ( file?.tag ) return file.tag;
    return '';
  }

  get version(){
    const file = this.readFile();
    if ( file?.tag ) return file.tag;
    if ( file?.branch ) return file.branch;
    return '';
  }
}

export default new CorkBuild();
