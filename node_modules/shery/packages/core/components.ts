import {
    SheryComponentOptions,
    CombinedComponentInstance
} from "types/index";
import { mapKeys } from "../share/util";
import { basic } from "../mixins/basic";
import { cfInstance } from "./create";
/**
 * 组件封装
 * 考虑原声组建实现方式
 * 加入diff 算法
 */
export function SheryComponent<Data, Props, Watch, Methods, Computed>(
    vantOptions: SheryComponentOptions<
        Data,
        Props,
        Watch,
        Methods,
        Computed,
        CombinedComponentInstance<Data, Props, Watch, Methods, Computed>
        >
) {

  const options: any = {};
  mapKeys(vantOptions, options, {
    data: 'data',
    props: 'properties',
    mixins: 'behaviors',
    methods: 'methods',
    beforeCreate: 'created',
    created: 'attached',
    mounted: 'ready',
    relations: 'relations',
    destroyed: 'detached',
    classes: 'externalClasses'
  });

  const { relation } = vantOptions;
  if (relation) {
    options.relations = Object.assign(options.relations || {}, {
      [`../${relation.name}/${relation.name}`]: relation
    });
  }

  // add default externalClasses
  options.externalClasses = options.externalClasses || [];
  options.externalClasses.push('custom-class');

  // add default behaviors
  options.behaviors = options.behaviors || [];
  options.behaviors.push(basic);

  // map field to form-field behavior
  if (vantOptions.field) {
    options.behaviors.push('wx://form-field');
  }

  // add default options
  options.options = {
    multipleSlots: true,
    addGlobalClass: true
  };

  cfInstance.create(options);
}


export function SheryPage(store:any , options:any){
    cfInstance.create(store, options);
}
