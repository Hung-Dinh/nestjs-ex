export class ObjectTool {
  static isEmpty(obj: any): boolean {
    return Object.keys(obj).length === 0;
  }

  static pick(obj: any, attrs: string[]): any {
    if (!obj || this.isEmpty(obj)) return {};

    const result = {};
    attrs.forEach((attr) => {
      if (attr in obj) result[attr] = obj[attr];
      else {
        result[attr] = '';
      }
    });
    return result;
  }

  static omit(obj: any, attrs: string[]): any {
    if (!obj || this.isEmpty(obj)) return {};
    const result = {};
    attrs.forEach(e =>{
      if(e) e = e.toLowerCase();
    })
    Object.keys(obj).forEach((key) => {
      if (!attrs.includes(key.toLowerCase())) result[key] = obj[key];
    });
    return result;
  }
}
