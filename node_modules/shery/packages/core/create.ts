import { IDiff, Diff } from "./diff";

export interface ICompoenFactory {
    create(store: Object, option?: any): any;
}

/**
 * 组建加工
 */
export class ComponentFactory implements ICompoenFactory {
    diff: IDiff
    originData: Object
    globalStore: any
    fnMapping: any

    constructor(){
        this.diff = new Diff();
        this.fnMapping = {}
    }
    create(store: any, option?: any): any {
        const self = this;
        if (arguments.length === 2) {
            if (option.data && Object.keys(option.data).length > 0) {
                Object.assign(store.data, option.data)
            }
            if (!this.originData) {
                self.originData = JSON.parse(JSON.stringify(store.data))
                self.globalStore = store
                store.instances = {}
                store.update = self.update.bind(this);
                store.push = self.push.bind(this);
                store.pull = self.pull.bind(this);
                store.add = self.add.bind(this);
                store.remove = self.remove.bind(this);
                store.originData = self.originData;
                store.env && self.initCloud(store.env)
            }
            getApp().globalData && (getApp().globalData.store = store)
            option.data = store.data
            const onLoad = option.onLoad
            self.defineFnProp(store.data)
            option.onLoad = function (e) {
                this.store = store
                self.rewriteUpdate(this)
                store.instances[this.route] = []
                store.instances[this.route].push(this)
                onLoad && onLoad.call(this, e)
            }
            Page(option)
        } else {
            const ready = store.ready
            const pure = store.pure
            store.ready = function () {
                if (pure) {
                    this.store = { data: store.data || {} }
                    this.store.originData = store.data ? JSON.parse(JSON.stringify(store.data)) : {}
                    self.defineFnProp(store.data || {}, this)
                    self.rewritePureUpdate(this)
                } else {
                    this.page = getCurrentPages()[getCurrentPages().length - 1]
                    this.store = this.page.store
                    Object.assign(this.store.data, store.data)
                    self.defineFnProp(store.data || {}, this)
                    this.setData.call(this, this.store.data)
                    self.rewriteUpdate(this)
                    this.store.instances[this.page.route].push(this)
                    console.log(this);
                }
                ready && ready.call(this)
            }
            Component(store)
        }
    }

    private rewritePureUpdate(ctx: any) {
        const self = this;
        ctx.update = function (patch) {
            const store = this.store
            self.defineFnProp(store.data)
            if (patch) {
                for (let key in patch) {
                    self.updateByPath(store.data, key, patch[key])
                }
            }
            let diffResult = self.diff.diff(store.data, store.originData)
            if (Object.keys(diffResult)[0] == '') {
                diffResult = diffResult['']
            }
            if (Object.keys(diffResult).length > 0) {
                this.setData(diffResult)
                store.onChange && store.onChange(diffResult)
                for (let key in diffResult) {
                    self.updateByPath(store.originData, key, typeof diffResult[key] === 'object' ? JSON.parse(JSON.stringify(diffResult[key])) : diffResult[key])
                }
            }
            return diffResult
        }
    }

    private initCloud(env: any) {
        wx.cloud.init()
        this.globalStore.db = wx.cloud.database({
            env
        })
    }

    private push(patch: any) {

        return new Promise((resolve, reject) => {
            this._push(this.update(patch), resolve)
        })
    }

    private _push(diffResult: any, resolve: any) {
        const objs = this.diffToPushObj(diffResult)
        Object.keys(objs).forEach((path) => {
            const arr = path.split('-')
            const id = this.globalStore.data[arr[0]][parseInt(arr[1])]._id
            const obj = objs[path]
            if (this.globalStore.methods && this.globalStore.methods[arr[0]]) {
                Object.keys(this.globalStore.methods[arr[0]]).forEach(key => {
                    if (obj.hasOwnProperty(key)) {
                        delete obj[key]
                    }
                })
            }
            this.globalStore.db.collection(arr[0]).doc(id).update({
                data: obj
            }).then((res) => {
                resolve(res)
            })
        })
    }

    private update(patch: any) {
        this.defineFnProp(this.globalStore.data)
        if (patch) {
            for (let key in patch) {
                this.updateByPath(this.globalStore.data, key, patch[key])
            }
        }
        let diffResult = this.diff.diff(this.globalStore.data, this.originData)
        if (Object.keys(diffResult)[0] == '') {
            diffResult = diffResult['']
        }
        if (Object.keys(diffResult).length > 0) {
            for (let key in this.globalStore.instances) {
                this.globalStore.instances[key].forEach(ins => {
                    ins.setData.call(ins, diffResult)
                })
            }
            this.globalStore.onChange && this.globalStore.onChange(diffResult)
            for (let key in diffResult) {
                this.updateByPath(this.originData, key, typeof diffResult[key] === 'object' ? JSON.parse(JSON.stringify(diffResult[key])) : diffResult[key])
            }
        }
        return diffResult
    }

    private defineFnProp(data: any, ctx?:any) {
        Object.keys(data).forEach(key => {
            const fn = data[key]
            if (typeof fn == 'function') {
                this.fnMapping[key] = fn
                Object.defineProperty(this.globalStore.data, key, {
                    enumerable: true,
                    get: () => {
                        return this.fnMapping[key].call(ctx || this.globalStore.data)
                    },
                    set: (value) => {
                        this.fnMapping[key] = value
                    }
                })
            }
        })
    }

    private rewriteUpdate(ctx) {
        ctx.update = this.update
    }

    private updateByPath(origin: any, path: string, value: any) {
        const arr = path.replace(/]/g, '').replace(/\[/g, '.').split('.')
        let current = origin
        for (let i = 0, len = arr.length; i < len; i++) {
            if (i === len - 1) {
                current[arr[i]] = value
            } else {
                current = current[arr[i]]
            }
        }
    }

    private pull(cn: any, where: any) {
        return new Promise(resolve => {
            this.globalStore.db.collection(cn).where(where || {}).get().then(res => {
                this.extend(res, cn)
                resolve(res)
            })
        })
    }

    private extend(res: any, cn: any) {
        res.data.forEach(item => {
            const mds = this.globalStore.methods[cn]
            mds && Object.keys(mds).forEach(key => {
                Object.defineProperty(item, key, {
                    enumerable: true,
                    get: () => {
                        return mds[key].call(item)
                    },
                    set: () => {
                        //方法不能改写
                    }
                })
            })
        })
    }

    private add(cn: any, data: any) {
        return this.globalStore.db.collection(cn).add({ data })
    }

    private remove(cn: any, id: any) {
        return this.globalStore.db.collection(cn).doc(id).remove()
    }
    private diffToPushObj(diffResult: any) {
        const result = {}
        Object.keys(diffResult).forEach(key => {
            this.diffItemToObj(key, diffResult[key], result)
        })
        return result
    }
    private diffToPprivateushObj(diffResult: any) {
        const result = {}
        Object.keys(diffResult).forEach(key => {
            this.diffItemToObj(key, diffResult[key], result)
        })
        return result
    }

    private diffItemToObj(path: string, value: any, result: object) {
        const arr = path.replace(/]/g, '').replace(/\[/g, '.').split('.')
        const obj = {}
        let current = null
        const len = arr.length
        for (let i = 2; i < len; i++) {
            if (len === 3) {
                obj[arr[i]] = value
            } else {
                if (i === len - 1) {
                    current[arr[i]] = value
                } else {
                    const pre = current
                    current = {}
                    if (i === 2) {
                        obj[arr[i]] = current
                    } else {
                        pre[arr[i]] = current
                    }
                }
            }
        }
        const key = arr[0] + '-' + arr[1]
        result[key] = Object.assign(result[key] || {}, obj)
    }
}

export const cfInstance = new ComponentFactory();
