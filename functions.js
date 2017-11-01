// 函数方法，大部分方法都是用于包装函数

// 内部函数，用于绑定上下文环境。
// 首先，这个函数是没有本地的 bind 方法时使用的。
// 本来呢，sourceFunc.apply(context, args); 就能解决大部分的问题。
// 但是有一个情况需要我们注意，就是使用 new 运算符时。
// sourceFunc.apply(context, args) 会在 new sourceFunc() 时继续绑定在 context 上面
// 例子如下：
// var a = function(){
//     this.d = 'd';
//     console.log('-B-'+this.b+'-B-');
//     console.log('-C-'+this.c+'-C-');
//     console.log('-D-'+this.d+'-D-');
//     return {
//         c: 'c'
//     }
// };
// var A = {
//     b: 'B',
//     c: 'C'
// };
// var c = _.bind(a, A);
// var d = new c;
// 尝试引入 underscore.js 然后去注释掉 _.bind 的本地bind检测和 executeBound的实例检测
// 会发现在 d = new c; 的过程中，执行的环境一直是 A 的环境下（ this.b 和 this.c 均有赋值）
// 而平时的绑定操作，却是在 a 的环境下（ this.b 和 this.c 均为 undefined ）;
var executeBound = function(sourceFunc, boundFunc, context, callingContext, args){
  if(!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
  // 这里 self 继承 sourceFunc的原型，所以 self的执行环境就是 sourceFunc本身。
  var self = baseCreate(sourceFunc.prototype);
  var result = sourceFunc.apply(self, args);
  if(_.isObject(result)) return result;
  return self;
};

// 绑定上下文
_.bind = function(func, context){
  // 如果有本地的 bind 方法直接使用
  if(nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
  if(!_isFunction(func)) throw new TypeError('Bind must be called on a function');
  var args = slice.call(arguments, 2);
  var bound = function(){
    return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
  };
  return bound;
};

// 批量绑定，将 obj后的其余参数绑定在 obj上
_.bindAll = function(obj){
  var i, length = arguments.length, key;
  if(length <= 1) throw new Error('bindAll must be passed function names');
  for(i = 1; i < length; i++){
    key = arguments[i];
    obj[key] = _.bind(obj[key], obj);
  }
  return obj;
};

// 偏函数方法，可以分多次传参
_.partial = function(func){
  var boundArgs = slice.call(arguments, 1);
  var bound = function(){
    var position = 0, length = boundArgs.length;
    var args = Array(length);
    for(var i = 0; i < length; i++){
      // 这里 arguments 是 bound 的参数，而不是 _.partial 的参数
      // 如果 boundArgs[i] 的值 为 _ ，就从 bound 里面取值（也就是后续调用时传递的参数）
      args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
    }
    // 传入 bound 的后续参数
    while(position < arguments.length) args.push(arguments[position++]);
    return executeBound(func, bound, this, this, args);
  };
  return bound;
};

// 缓存方法，可以缓存函数的计算结果，在递归等方面可以减少重复计算
_.memoize = function(func, hasher){
  var memoize = function(key){
    var cache = memoize.cache;
    // 存储的 address，如果传递了 hasher函数，就以 hasher函数的返回值作为索引，否则，就以 key 作为索引
    var address = '' + (hasher ? hasher.apply(this, arguments) : key);
    // 如果 cache 中没有 address，则应用函数 func，并存储其返回值
    if(!_.has(cache, address)) cache[address] = func.apply(this, arguments);
    return cache[address];
  };
  memoize.cache = {};
  return memoize;
};

// setTimeout 的简易版本，支持传参，节省好多字节呢
_.delay = function(func, wait){
  var args = slice.call(arguments, 2);
  return setTimeout(function(){
    return func.apply(null, args);
  }, wait);
};

// 同步转异步，文档上面说是栈清空后执行func.
// 因为setTimeout立即执行时会把 func推入栈，等到前面的事件全部结束时才会执行 func
// 所以也就是栈清空之后执行 func.
_.defer = _.partial(_.delay, _, 1);
