import { isArray, isFunction, isObject, isEmpty } from '../share/util';
export var Diff =
/*#__PURE__*/
function () {
  function Diff() {}

  var _proto = Diff.prototype;

  _proto.diff = function diff(source, dest) {
    var result = {};
    this.syncKeys(source, dest);
    this.dodiff(source, dest, '', result);
    console.log(result);
    return result;
  };

  _proto.syncKeys = function syncKeys(cu, pre) {
    var _this = this;

    if (cu === pre) {
      return;
    }

    if (isObject(cu) && isObject(pre)) {
      var _loop = function _loop(key) {
        var cuValue = cu[key];

        if (isEmpty(cuValue)) {
          cu[key] = null;
        } else {
          var preVa = pre[key];

          if (isArray(preVa) && isArray(cuValue)) {
            if (cuValue.length >= preVa.length) {
              preVa.forEach(function (item, idx) {
                _this.syncKeys(cuValue[idx], item);
              });
            }
          } else if (isObject(cuValue) && isObject(preVa)) {
            for (var subKeys in preVa) {
              _this.syncKeys(cuValue, preVa);
            }
          }
        }
      };

      for (var key in pre) {
        _loop(key);
      }
    } else if (isArray(cu) && isArray(pre)) {
      if (cu.length >= pre.length) {
        pre.forEach(function (item, idx) {
          _this.syncKeys(cu[idx], item);
        });
      }
    }
  }; //赋值


  _proto.setResult = function setResult(result, key, value) {
    if (!isFunction(value)) {
      result[key] = value; //    else{
      //     // 这里复制功能 日期有问题
      //     result[key] =JSON.parse(JSON.stringify(value));
      //    }
    }
  }; //


  _proto.addPrefix = function addPrefix(path, key, idx, subkey) {
    var result = '';

    if (path != '') {
      result = path + '.';
    }

    result += key;

    if (!isEmpty(idx)) {
      result += '[' + idx + ']';
    }

    if (!isEmpty(subkey)) {
      result += '.' + subkey;
    }

    return result;
  }; // diff


  _proto.dodiff = function dodiff(curr, pre, path, result) {
    var _this2 = this;

    if (curr === pre) return;
    console.log(isObject(curr));

    if (isObject(curr)) {
      if (!isObject(pre) || Object.keys(curr).length < Object.keys(pre).length) {
        this.setResult(result, path, curr);
      } else {
        var _loop2 = function _loop2(key) {
          var cuValue = curr[key];
          var preValue = pre[key];

          if (!isObject(cuValue) && !isArray(cuValue)) {
            _this2.setResult(result, _this2.addPrefix(path, key), cuValue);
          } else if (isArray(cuValue)) {
            if (!isArray(preValue)) {
              _this2.setResult(result, _this2.addPrefix(path, key), cuValue);
            } else {
              if (cuValue.length < preValue.length) {
                _this2.setResult(result, _this2.addPrefix(path, key), cuValue);
              } else {
                cuValue.forEach(function (it, idx) {
                  _this2.dodiff(it, preValue[idx], _this2.addPrefix(path, key, idx), result);
                });
              }
            }
          } else if (isObject(cuValue)) {
            if (!isObject(preValue) || Object.keys(cuValue).length < Object.keys(preValue).length) {
              _this2.setResult(result, _this2.addPrefix(path, key), cuValue);
            } else {
              for (var subKey in cuValue) {
                _this2.dodiff(cuValue[subKey], preValue[subKey], _this2.addPrefix(path, key, null, subKey), result);
              }
            }
          }
        };

        for (var key in curr) {
          _loop2(key);
        }
      }
    } else if (isArray(curr)) {
      if (!isArray(pre)) {
        this.setResult(result, path, curr);
      } else {
        if (curr.length < pre.length) {
          this.setResult(result, path, curr);
        } else {
          curr.forEach(function (item, idx) {
            _this2.dodiff(item, pre[idx], path + '[' + idx + ']', result);
          });
        }
      }
    } else {
      this.setResult(result, path, curr);
    }
  };

  return Diff;
}();