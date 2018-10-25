import { Diff } from "./diff";

/**
 * 组建加工
 */
export var ComponentFactory =
/*#__PURE__*/
function () {
  function ComponentFactory() {
    this.diff = new Diff();
    this.fnMapping = {};
  }

  var _proto = ComponentFactory.prototype;

  _proto.create = function create(store, option) {
    var self = this;

    if (arguments.length === 2) {
      if (option.data && Object.keys(option.data).length > 0) {
        Object.assign(store.data, option.data);
      }

      if (!this.originData) {
        self.originData = JSON.parse(JSON.stringify(store.data));
        self.globalStore = store;
        store.instances = {};
        store.update = self.update.bind(this);
        store.push = self.push.bind(this);
        store.pull = self.pull.bind(this);
        store.add = self.add.bind(this);
        store.remove = self.remove.bind(this);
        store.originData = self.originData;
        store.env && self.initCloud(store.env);
      }

      getApp().globalData && (getApp().globalData.store = store);
      option.data = store.data;
      var onLoad = option.onLoad;
      self.defineFnProp(store.data);

      option.onLoad = function (e) {
        this.store = store;
        self.rewriteUpdate(this);
        store.instances[this.route] = [];
        store.instances[this.route].push(this);
        onLoad && onLoad.call(this, e);
      };

      Page(option);
    } else {
      var ready = store.ready;
      var pure = store.pure;

      store.ready = function () {
        if (pure) {
          this.store = {
            data: store.data || {}
          };
          this.store.originData = store.data ? JSON.parse(JSON.stringify(store.data)) : {};
          self.defineFnProp(store.data || {}, this);
          self.rewritePureUpdate(this);
        } else {
          this.page = getCurrentPages()[getCurrentPages().length - 1];
          this.store = this.page.store;
          Object.assign(this.store.data, store.data);
          self.defineFnProp(store.data || {}, this);
          this.setData.call(this, this.store.data);
          self.rewriteUpdate(this);
          this.store.instances[this.page.route].push(this);
          console.log(this);
        }

        ready && ready.call(this);
      };

      Component(store);
    }
  };

  _proto.rewritePureUpdate = function rewritePureUpdate(ctx) {
    var self = this;

    ctx.update = function (patch) {
      var store = this.store;
      self.defineFnProp(store.data);

      if (patch) {
        for (var key in patch) {
          self.updateByPath(store.data, key, patch[key]);
        }
      }

      var diffResult = self.diff.diff(store.data, store.originData);

      if (Object.keys(diffResult)[0] == '') {
        diffResult = diffResult[''];
      }

      if (Object.keys(diffResult).length > 0) {
        this.setData(diffResult);
        store.onChange && store.onChange(diffResult);

        for (var _key in diffResult) {
          self.updateByPath(store.originData, _key, typeof diffResult[_key] === 'object' ? JSON.parse(JSON.stringify(diffResult[_key])) : diffResult[_key]);
        }
      }

      return diffResult;
    };
  };

  _proto.initCloud = function initCloud(env) {
    wx.cloud.init();
    this.globalStore.db = wx.cloud.database({
      env: env
    });
  };

  _proto.push = function push(patch) {
    var _this = this;

    return new Promise(function (resolve, reject) {
      _this._push(_this.update(patch), resolve);
    });
  };

  _proto._push = function _push(diffResult, resolve) {
    var _this2 = this;

    var objs = this.diffToPushObj(diffResult);
    Object.keys(objs).forEach(function (path) {
      var arr = path.split('-');

      var id = _this2.globalStore.data[arr[0]][parseInt(arr[1])]._id;

      var obj = objs[path];

      if (_this2.globalStore.methods && _this2.globalStore.methods[arr[0]]) {
        Object.keys(_this2.globalStore.methods[arr[0]]).forEach(function (key) {
          if (obj.hasOwnProperty(key)) {
            delete obj[key];
          }
        });
      }

      _this2.globalStore.db.collection(arr[0]).doc(id).update({
        data: obj
      }).then(function (res) {
        resolve(res);
      });
    });
  };

  _proto.update = function update(patch) {
    this.defineFnProp(this.globalStore.data);

    if (patch) {
      for (var key in patch) {
        this.updateByPath(this.globalStore.data, key, patch[key]);
      }
    }

    var diffResult = this.diff.diff(this.globalStore.data, this.originData);

    if (Object.keys(diffResult)[0] == '') {
      diffResult = diffResult[''];
    }

    if (Object.keys(diffResult).length > 0) {
      for (var _key2 in this.globalStore.instances) {
        this.globalStore.instances[_key2].forEach(function (ins) {
          ins.setData.call(ins, diffResult);
        });
      }

      this.globalStore.onChange && this.globalStore.onChange(diffResult);

      for (var _key3 in diffResult) {
        this.updateByPath(this.originData, _key3, typeof diffResult[_key3] === 'object' ? JSON.parse(JSON.stringify(diffResult[_key3])) : diffResult[_key3]);
      }
    }

    return diffResult;
  };

  _proto.defineFnProp = function defineFnProp(data, ctx) {
    var _this3 = this;

    Object.keys(data).forEach(function (key) {
      var fn = data[key];

      if (typeof fn == 'function') {
        _this3.fnMapping[key] = fn;
        Object.defineProperty(_this3.globalStore.data, key, {
          enumerable: true,
          get: function get() {
            return _this3.fnMapping[key].call(ctx || _this3.globalStore.data);
          },
          set: function set(value) {
            _this3.fnMapping[key] = value;
          }
        });
      }
    });
  };

  _proto.rewriteUpdate = function rewriteUpdate(ctx) {
    ctx.update = this.update;
  };

  _proto.updateByPath = function updateByPath(origin, path, value) {
    var arr = path.replace(/]/g, '').replace(/\[/g, '.').split('.');
    var current = origin;

    for (var i = 0, len = arr.length; i < len; i++) {
      if (i === len - 1) {
        current[arr[i]] = value;
      } else {
        current = current[arr[i]];
      }
    }
  };

  _proto.pull = function pull(cn, where) {
    var _this4 = this;

    return new Promise(function (resolve) {
      _this4.globalStore.db.collection(cn).where(where || {}).get().then(function (res) {
        _this4.extend(res, cn);

        resolve(res);
      });
    });
  };

  _proto.extend = function extend(res, cn) {
    var _this5 = this;

    res.data.forEach(function (item) {
      var mds = _this5.globalStore.methods[cn];
      mds && Object.keys(mds).forEach(function (key) {
        Object.defineProperty(item, key, {
          enumerable: true,
          get: function get() {
            return mds[key].call(item);
          },
          set: function set() {//方法不能改写
          }
        });
      });
    });
  };

  _proto.add = function add(cn, data) {
    return this.globalStore.db.collection(cn).add({
      data: data
    });
  };

  _proto.remove = function remove(cn, id) {
    return this.globalStore.db.collection(cn).doc(id).remove();
  };

  _proto.diffToPushObj = function diffToPushObj(diffResult) {
    var _this6 = this;

    var result = {};
    Object.keys(diffResult).forEach(function (key) {
      _this6.diffItemToObj(key, diffResult[key], result);
    });
    return result;
  };

  _proto.diffToPprivateushObj = function diffToPprivateushObj(diffResult) {
    var _this7 = this;

    var result = {};
    Object.keys(diffResult).forEach(function (key) {
      _this7.diffItemToObj(key, diffResult[key], result);
    });
    return result;
  };

  _proto.diffItemToObj = function diffItemToObj(path, value, result) {
    var arr = path.replace(/]/g, '').replace(/\[/g, '.').split('.');
    var obj = {};
    var current = null;
    var len = arr.length;

    for (var i = 2; i < len; i++) {
      if (len === 3) {
        obj[arr[i]] = value;
      } else {
        if (i === len - 1) {
          current[arr[i]] = value;
        } else {
          var pre = current;
          current = {};

          if (i === 2) {
            obj[arr[i]] = current;
          } else {
            pre[arr[i]] = current;
          }
        }
      }
    }

    var key = arr[0] + '-' + arr[1];
    result[key] = Object.assign(result[key] || {}, obj);
  };

  return ComponentFactory;
}();
export var cfInstance = new ComponentFactory();