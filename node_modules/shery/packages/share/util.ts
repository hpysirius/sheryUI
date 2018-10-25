/**
 * 工具类方法
 * @param obj
 */

const ARRAYTYPE = '[object Array]'
const OBJECTTYPE = '[object Object]'
const FUNCTIONTYPE = '[object Function]'

// 判断空
export function isEmpty(obj: any): boolean {
    return obj === null || obj === undefined;
}

// 获取类型
function type(obj:any):string{
    return Object.prototype.toString.call(obj);
}

// Object
export function isObject(obj: any):boolean{
   return !isEmpty(obj) && type(obj) ===OBJECTTYPE;
}
// Function
export function isFunction(fn:any):boolean{
   return !isEmpty(fn) && type(fn) === FUNCTIONTYPE;
}

// Array
export function isArray(arr:any):boolean{
    return !isEmpty(arr) && type(arr) === ARRAYTYPE;
}


export function mapKeys(source: object, target: object, map: object) {
    Object.keys(map).forEach(key => {
      if (source[key]) {
        target[map[key]] = source[key];
      }
    });
  }

