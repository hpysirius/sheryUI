/**
 * 工具类方法
 * @param obj
 */
var ARRAYTYPE = '[object Array]';
var OBJECTTYPE = '[object Object]';
var FUNCTIONTYPE = '[object Function]'; // 判断空

export function isEmpty(obj) {
  return obj === null || obj === undefined;
} // 获取类型

function type(obj) {
  return Object.prototype.toString.call(obj);
} // Object


export function isObject(obj) {
  return !isEmpty(obj) && type(obj) === OBJECTTYPE;
} // Function

export function isFunction(fn) {
  return !isEmpty(fn) && type(fn) === FUNCTIONTYPE;
} // Array

export function isArray(arr) {
  return !isEmpty(arr) && type(arr) === ARRAYTYPE;
}
export function mapKeys(source, target, map) {
  Object.keys(map).forEach(function (key) {
    if (source[key]) {
      target[map[key]] = source[key];
    }
  });
}