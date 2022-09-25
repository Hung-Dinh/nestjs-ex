export class ArrayTool {
  static removeDuplicateObjectInArray = (arr: any[]): any[] =>
    arr.filter((item, index) => {
      const _item = JSON.stringify(item);
      return (
        index ===
        arr.findIndex((obj) => {
          return JSON.stringify(obj) === _item;
        })
      );
    });
}
