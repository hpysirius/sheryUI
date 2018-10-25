
import {
    isArray,
    isFunction,
    isObject,
    isEmpty
} from '../share/util'

export interface IDiff {
    diff(source: any, dest: any): Object;
}

export  class Diff implements IDiff {
    public diff(source: any, dest: any): Object {
        let result: Object = {};
        this.syncKeys(source, dest);
        this.dodiff(source, dest, '', result);
        console.log(result);
        return result;
    }

    private syncKeys(cu: any, pre: any): void {
        if (cu === pre) {
            return;
        }
        if (isObject(cu) && isObject(pre)) {
            for (const key in pre) {
                const cuValue = cu[key];
                if (isEmpty(cuValue)) {
                    cu[key] = null;
                } else {
                    const preVa = pre[key];
                    if (isArray(preVa) && isArray(cuValue)) {
                        if (cuValue.length >= preVa.length) {
                            preVa.forEach((item, idx) => {
                                this.syncKeys(cuValue[idx], item);
                            });
                        }
                    } else if (isObject(cuValue) && isObject(preVa)) {
                        for (let subKeys in preVa) {
                            this.syncKeys(cuValue, preVa)
                        }
                    }
                }
            }
        } else if (isArray(cu) && isArray(pre)) {
            if (cu.length >= pre.length) {
                pre.forEach((item, idx) => {
                    this.syncKeys(cu[idx], item);
                });
            }
        }
    }

    //赋值
    private setResult(result: any, key: string, value: any): void {
        if (!isFunction(value)) {
            result[key] = value;
            //    else{
            //     // 这里复制功能 日期有问题
            //     result[key] =JSON.parse(JSON.stringify(value));
            //    }
        }
    }

    //
    private addPrefix(path: any, key: string, idx?: number, subkey?: string): string {
        let result: string = '';
        if (path != '') {
            result = path + '.';
        }
        result += key;
        if (!isEmpty(idx)) {
            result += '[' + idx + ']';
        }
        if(!isEmpty(subkey)){
            result += ('.'+ subkey);
        }
        return result;
    }

    // diff
    private dodiff(curr: any, pre: any, path: any, result: Object): void {
        if (curr === pre) return;
        console.log(isObject(curr));
        if (isObject(curr)) {
            if (!isObject(pre) || Object.keys(curr).length < Object.keys(pre).length) {
                this.setResult(result, path, curr);
            } else {
                for (let key in curr) {
                    const cuValue = curr[key];
                    const preValue = pre[key];
                    if (!isObject(cuValue) && !isArray(cuValue)) {
                        this.setResult(result,  this.addPrefix(path, key), cuValue);
                    }else if(isArray(cuValue)){
                         if(!isArray(preValue)){
                             this.setResult(result, this.addPrefix(path, key),cuValue);
                         }else {
                             if(cuValue.length < preValue.length){
                                 this.setResult(result, this.addPrefix(path, key), cuValue);
                             }else{
                                 cuValue.forEach((it, idx)=>{
                                     this.dodiff(it, preValue[idx], this.addPrefix(path, key, idx), result)
                                 })
                             }
                         }
                    }else if(isObject(cuValue)){
                       if(!isObject(preValue) || Object.keys(cuValue).length < Object.keys(preValue).length){
                           this.setResult(result, this.addPrefix(path, key), cuValue);
                       }else{
                           for(let subKey in cuValue){
                               this.dodiff(cuValue[subKey], preValue[subKey], this.addPrefix(path, key, null, subKey), result);
                           }
                       }
                    }
                }
            }
        }else if(isArray(curr)){
            if(!isArray(pre)){
                this.setResult(result ,path, curr);
            }else{

                if(curr.length< pre.length){
                    this.setResult(result, path, curr);
                }else{
                    curr.forEach((item, idx)=>{
                        this.dodiff(item, pre[idx], path+ '['+ idx+']', result);
                    })
                }
            }
        }else{
            this.setResult(result, path, curr);
        }
    }
}
