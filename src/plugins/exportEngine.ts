export class ExportEngine {
    constructor() {
    }
    downloadConfigFile(json:{}, download:boolean, id:any) {
        const fileName = 'FB_LAYOUT_' + id + '.json'
        const file = this.renderJsonConfig(json, fileName)
        if (download) {
            if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) { // IE
                (window.navigator as any).msSaveOrOpenBlob(file, fileName);
                (window.navigator as any).msSaveOrOpenBlob(file, fileName);
            } else { //Chrome & Firefox
                const a = document.createElement('a');
                const url = window.URL.createObjectURL(file);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            }
        }
    }
    renderJsonConfig(json:{}, fileName:string):File {
        return new File([JSON.stringify(json)], fileName, {
            type: 'application/json'
        })
    }
}