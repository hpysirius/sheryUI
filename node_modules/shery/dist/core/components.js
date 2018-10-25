import { mapKeys } from "../share/util";
import { basic } from "../mixins/basic";
import { cfInstance } from "./create";
/**
 * 组件封装
 * 考虑原声组建实现方式
 * 加入diff 算法
 */

export function SheryComponent(vantOptions) {
  var options = {};
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
  var relation = vantOptions.relation;

  if (relation) {
    var _Object$assign;

    options.relations = Object.assign(options.relations || {}, (_Object$assign = {}, _Object$assign["../" + relation.name + "/" + relation.name] = relation, _Object$assign));
  } // add default externalClasses


  options.externalClasses = options.externalClasses || [];
  options.externalClasses.push('custom-class'); // add default behaviors

  options.behaviors = options.behaviors || [];
  options.behaviors.push(basic); // map field to form-field behavior

  if (vantOptions.field) {
    options.behaviors.push('wx://form-field');
  } // add default options


  options.options = {
    multipleSlots: true,
    addGlobalClass: true
  };
  cfInstance.create(options);
}
export function SheryPage(store, options) {
  cfInstance.create(store, options);
}