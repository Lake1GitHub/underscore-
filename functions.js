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


// 函数节流，func 在 wait 时间内至多调用一次
_.throttle = function(func, wait, options){
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if(!options) options = {};
  // 最后一次的执行函数
  var later = function(){
    previous = options.leading === false ? 0 : _.now();
    timeout = null;
    result = func.apply(context, args);
    if(!timeout) context = args = null;
  };
  // 方法直接返回一个函数，函数的作用就是对 func 的调用施加一个节流阀
  return function(){}
    var now = _.now();
    // 判断是否初次调用，leading 为 false 时，第一次调用需等待 wait 毫秒
    if(!previous && options.leading === false) previous = now;
    // 计算剩余等待时间
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    // 剩余等待时间小于等于 0
    if(remaining <= 0 || remaining > wait){
      // 将 setTimeout 重置
      if(timeout){
        clearTimeout(timeout);
        timeout = null;
      }
      // 直接调用 func 函数
      previous = now;
      result = func.apply(context, args);
      if(!timeout) context = args = null;
    }
    // timeout 没有等待执行的函数时且设置了最后一次调用时
    // 将 later 压入栈，设置 remaining 毫秒后执行
    else if(!timeout && options.trailing !== false){
      timeout = setTimeout(later, remaining);
    }
    return result;
  };

  // 函数防抖
  _.debounce = function(func, wait, immediate){
    var timeout, args, context, timestamp, result;

    var later = function(){
      // 计算剩余时间
      var last = _.now() - timestamp;
      if(last < wait && last >= 0){
        // _.debounce 没有使用 clearTimeout，而是每次调用 later 时都判断，需不需要开始下次 setTimeout 等待
        timeout = setTimeout(later, wait - last);
      } else{
        // 立即执行的方法和延时执行的方法是分开的，延时执行到达这里，如果设定了立即执行，这里只会把 timeout 设置为 null
        // 而不会执行 func 函数，哪怕等待的时间已经够长了
        timeout = null;
        if(!immediate){
          result = func.apply(context, args);
          if(!timeout) context = args = null;
        }
      }
    };

    return function(){
      context = this;
      args = arguments;
      // 每次调用都会更新 timestamp，从而达到阻碍函数调用的目的
      timestamp = _.now();
      // 是否立即执行
      var callNow = immediate && !timeout;

      // 这里 timeout 是一个锁，如果设置了立即执行，执行过程大致是：
      // （1）立即执行 func 函数
      // （2）在 last > wait 之后，解除 timeout 的绑定，在此期间任何调用都只会重置 last 的时间
      // 如果是延时执行，执行过程大致是：
      //      在 last > wait 之后，执行 func 函数，在此期间，任何调用都只会重置 last 的时间


      if(!timeout) timeout = setTimeout(later, wait);
      if(callNow){
        result = func.apply(context, args);
        context = args = null;
      }
      return result;
    };
  };

  // 在 N 次调用后才执行 func
  _.after = function(times, func){
    return function(){
      if(--times < 1){
        return func.apply(this, arguments);
      }
    };
  };

  // func 至多调用 times-1次，后续调用都会返回第 times-1 次调用的结果
  _.before = function(times, func){
    var memo;
    return function(){
      if(--times > 0){
        memo = func.apply(this, arguments);
      }
      if(times <= 1) func = null;
      return memo;
    };
  };

  // 只能调用一次的方法，其实也就是 before 至多调用 1 次的情况
  _.once = _.partial(_.before, 2);

  // 将 func 作为参数传给 wrapper，可以在调用 func 之前或者之后执行一些操作
  _.wrap = function(func, wrapper){
    return _.partial(wrapper, func);
  }

  将函数的返回值置反
  _.negate = function(predicate){
    return function(){
      return !predicate.apply(this.arguments);
    };
  };

  // 从最后一个到第一个函数，依次执行，每次执行后的返回值都传递给前一个作为其参数
  // 最后返回第一个函数调用的结果
  _.compose = function(){
      var args = arguments;
      var start = args.length - 1;
      return function(){
        var i = start;
        // 执行最后一个函数，
        var result = args[start].apply(this, arguments);
        // 每次都将 result 传入 前一个函数作为其参数
        while(i--) result = args[i].call(this, result);
        // 最后返回第一个函数执行的结果
        return result;
      };
  };
