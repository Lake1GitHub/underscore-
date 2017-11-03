// 对象方法


// 这段代码是用于解决 IE<9 的一个bug，具体描述为
// nonEnumerableProps中的这些属性在被重载之后，能被谷歌等浏览器 for in 出来
// 但 IE<9 中不会

// hasEnumBug 判断方法，{} 的 toString 被重载，然后检测是否可枚举。如果可以，则没有bug
var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
// 这些属性会有这种bug
var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                    'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

// bug 修复方法，也就是逐个枚举nonEnumerableProps中的属性，看是否被重载了，重载了就压入keys返回
function collectNonEnumProps(obj, keys){
  var nonEnumIdx = nonEnumerableProps.length;
  var constructor = obj.constructor;
  // proto 为 obj 的原型，这里考虑了构造函数被重载的情况，不过其实可以直接赋值 proto = ObjProto
  // 这里不太了解，可能是出于性能？
  var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

  // 这里把构造函数也考虑进去了，而不仅仅只包含 nonEnumerableProps 里面的属性
  var prop = 'constructor';
  if(_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

  // 逐个检查 nonEnumerableProps 中的属性是否被重载
  while(nonEnumIdx--){
    prop = nonEnumerableProps[nonEnumIdx];
    // 当对象上面继承的这些方法和 原型上的方法不严格相等时，证明这些方法被重载了
    if(prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)){
      keys.push(prop);
    }
  }
}

// 获取 *自有属性* 的 key 值集合
// 枚举->判断自有->处理bug
_.keys = function(obj){
  if(!_.isObject(obj)) return [];
  if(nativeKeys) return nativeKeys(obj);
  var keys = [];
  // _.has() 判断自有属性
  for(var key in obj) if(_.has(obj, key)) keys.push(key);
  // 处理bug
  if(hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
};

// 获取 *所有属性,包括自有和继承* 的 key 值集合
// 枚举->处理bug
_.allKeys = function(obj){
  if(!_.isObject(obj)) return [];
  var keys = [];
  for(var key in obj) keys.push(key);
  if(hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
}

// 获取自有属性的 values
_.values = function(obj){
  var keys = _.keys(obj);
  var length = keys.length;
  var values = Array(length);
  for(var i = 0; i < length; i++){
    values[i] = obj[keys[i]];
  }
  return values;
}

// _.map 的对象实现，逻辑基本都差不多，只是这里作用于对象
_.mapObject = function(obj, iteratee, context){
  iteratee = cb(iteratee, context);
  var keys = _.keys(obj),
      length = keys.length,
      results = {},
      currentKey;
  for(var index = 0; index < length; index++){
    currentKey = keys[index];
    results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
  }
  return results;
}

// 对象转数组，以键值对作为一个数组存入 pairs
// [ [key1, value1], [key2, value2]...]
_.pairs = function(obj){
  var keys = _.keys(obj);
  var length = keys.length;
  var pairs = Array(length);
  for(var i = 0; i < length; i++){
    pairs[i] = [keys[i], obj[keys[i]]];
  }
  return pairs;
};

// 将 obj 的键值对互换，values必须是可序列化的
_.invert = function(obj){
  var result = {};
  var keys = _.keys(obj);
  for(var i = 0, length = keys.length; i < length; i++){
    result[obj[keys[i]]] = keys[i];
  }
  return result
}

// 提取 obj 中的所有可枚举的方法，并将其排序后返回
_.functions = _.methods = function(obj){
  var names = [];
  for(var key in obj){
    if(_.isFunction(obj[key])) names.push(key);
  }
  return names.sort();
}

// 在obj 中找出第一个通过predicate断言的键值对的键
_.findKey = function(obj, predicate, context){
  predicate = cb(predicate, context);
  var keys = _.keys(obj), key;
  for(var i = 0, length = keys.length; i < length; i++){
    key = keys[i];
    if(predicate(obj[key], key, obj)) return key;
  }
}

// _.extend, _.extendOwn, _.defaults 调用的内部方法
// 对 obj 进行扩展，对返回函数中的其他参数调用keysFunc方法
// 获取键值后，对 obj 进行扩展
var createAssigner = function(keysFunc, undefinedOnly){
  return function(obj){
    var length = arguments.length;
    if(length < 2 || obj == null) return obj;
    for(var index = 1; index < length; index++){
      var source = arguments[index],
          keys = keysFunc(source),
          l = keys.length;
      for(var i = 0; i < l; i++){
        var key = keys[i];
        if(!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
      }
    }
    return obj;
  };
};

// 根据所有属性的键值进行扩展
_.extend = createAssigner(_.allKeys);

// 根据自有属性的键值进行扩展
_.extendOwn = _.assign = createAssigner(_.keys);

// 基于原型继承的寄生式继承
_.create = function(prototype, props){
  var result = baseCreate(prototype);
  if(props) _.extendOwn(result, props);
  return result;
};

// 根据 oiteratee 筛选出符合要求的 object 中的键值对
_.pick = function(object, oiteratee, context){
  var result = {}, obj = object, iteratee, keys;
  if(obj == null) return result;
  // 初始化 oteratee 筛选函数，
  if(_.isFunction(oiteratee)){
    keys = _.allKeys(obj);
    iteratee = optimizeCb(oiteratee, context);
  } else {
    // 扁平化数组
    keys = flatten(arguments, false, false, 1);
    // 如果 oteratee 不是函数，则建立 iteratee 函数
    iteratee = function(value, key, obj) { return key in obj; };
    obj = Object(obj);
  }
  // 遍历，筛选符合要求的，存入 result
  for(var i = 0, length = keys.length; i < length; i++){
    var keys = keys[i];
    var value = obj[key];
    if(iteratee(value, key, obj)) result[key] = value;
  }
  return result;
};

// 过滤掉通过 iteratee 的键值对
_.omit = function(obj, iteratee, context){
  if(_.isFunction(iteratee)){
    // 定义的iteratee是函数，则对 iteratee 进行取反操作.
    iteratee = _.negate(iteratee);
  } else {
    // 没有定 iteratee，则 iteratee 定义为，断言:不包含在 arguments中的键值
    var keys = _.map(flatten(arguments, false, false, 1), String);
    iteratee = function(value, key){
      return !_.contains(keys, key);
    };
  }
  return _.pick(obj, iteratee, context);
};

// 对 _.allKeys 进行扩展，只对 undefinedOnly 进行扩展
_.defaults = createAssigner(_.allKeys, true);

// 克隆方法，用于返回对象或者数组的拷贝，浅拷贝
_.clone = function(obj){
  if(!_.isObject(obj)) return obj;
  return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
};

// 对 obj 调用 interceptor 函数，并做链式返回( 返回obj )
_.tap = function(obj, interceptor){
  interceptor(obj);
  return obj;
};

// 判断，obj 中是否有自有属性 key
_.has = function(obj, key){
  return obj != null && hasOwnProperty.call(obj, key);
};

// 断言，obj 中是否包含 attrs对象的 所有键值对
_.matcher = _.matches = function(attrs){
  attrs = _.extendOwn({}, attrs);
  return function(obj){
    return _.isMatch(obj, attrs);
  };
};

// 断言，传入key 返回的函数中传入obj，用于检测obj[key]，常用语多个对象检测指定的key
_.property = function(key){
  return function(obj){
    return obj == null ? void 0 : obj[key];
  };
};

// 断言，传入obj，返回的函数中传入key，检测obj[key]，一个对象检测多个key
_.propertyOf = function(obj){
  return obj == null ? function(){} : function(key){
    return obj[key];
  }
}

// 比较完备的判断相等的方法
var eq = function(a, b, aStack, bStack){
  // 这里指出了一种情况 -0 不等于 +0
  if(a === b) return a!== 0 || 1 / a === 1 / b;
  // 这里判断 undefined 是等于 null 的
  if(a == null || b == null) return a === b;
  // 如果 a 和 b 是 _ OOP 的对象
  if(a instanceof _) a = a._wrapped;
  if(b instanceof _) b = b._wrapped;

  // 获取 a 的类型
  var className = toString.call(a);
  // 类型不同直接判否
  if(className !== toString.call(b)) return false;
  switch(className){
    case '[object RegExp]':
    case '[object String]':
      // 正则和字符串，转为字符串后比较
      return '' + a === '' + b;
    case '[object Number]':
      // NaN 类型
      if(+a !== +a) return +b !== +b;
      // 数字 +0 和 -0
      return +a === 0 ? 1 / +a === 1 / b : +a === +b;
    case '[object Date]':
    case '[object Boolean]':
      // 日期和布尔型转为数字比较
      return +a === +b;
  }
  // 数组类型
  var areArrays = className = '[object Array]';
  if(areArrays){
    // a 或者 b 不是对象
    if(typeof a != 'object' || typeof b != 'object') return false;
    // 在不同的 iframe 中 a.constructor 可能不等于 b.constructor
    var aCtor = a.constructor, bCtor = b.constructor;
    if(aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                            _.isFunction(bCtor) && bCtor instanceof bCtor)
                       && ('constructor' in a && 'constructor' in b)){
      return false;
    }
  }
  // 后面开始深度比较，第一次递归时，aStack和bStack都是空数组
  aStack = aStack || [];
  bStack = bStack || [];
  var length = aStack.length;

  // 后续调用时，如果 a 和 b 已经入栈，对应相等则相等
  while(length--){
    if(aStack[length] === a) return bStack[length] === b;
  }
  // a,b 入栈
  aStack.push(a);
  bStack.push(b);

  // 数组类型
  if(areArrays){
    length = a.length;
    // 比较长度
    if(length !== b.length) return false;
    // 逐个比较里面的元素，开始下一轮递归
    while(length--){
      if(!eq(a[length], b[length], aStack, bStack)) return false;
    }
  }
  // 对象
  else {
    var keys = _.keys(a), key;
    length = keys.length;
    // 判断键数组长度
    if(_.keys(b).length !== length) return false;
    // 逐个比较键值对，开始下一轮递归。
    while(length--){
      key = keys[length];
      if(!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
    }
  }
  // a 和 b 是相等的，出栈，并返回 true
  aStack.pop();
  bStack.pop();
  return true;
};

// 判断 a 和 b 是否深度相等，对于引用类，会比较其中的元素是否相等
_.isEqual = function(a, b){
  return eq(a, b);
};

// 检测object 中是否有 给定的 attrs中的所有键值对
_.isMatch = function(object, attrs){
  var keys = _.keys(attrs), length = keys.length;
  if(object == null) return !length;
  var obj = Object(object);
  for(var i = 0; i < length; i++){
    var key = keys[i];
    if(attrs[key] !== obj[key] || !(key in obj)) return false;
  }
  return true;
};

_.isEmpty = function(obj){
  if(obj == null) return true;
  // 对于含有length的类型，直接判断length
  if(isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))){
    return obj.length === 0;
  }
  // 对于普通对象，获取键值长度判断
  return _.keys(obj).length === 0;
}

// 判断 obj 节点的类型是否为 元素类型
_.isElement = function(obj){
  return !!(obj && obj.nodeType === 1);
};

// 判断数组类型
_.isArray = nativeIsArray || function(obj){
  return toString.call(obj) === '[object Array]';
};

// 判断对象类型（函数类型也是对象类型）
_.isObject = function(obj){
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

// isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError 的判断通用方法
_.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name){
  _['is' + name] = function(obj){
    return toString.call(obj) === '[object ' + name + ']';
  };
});

// IE<9 下无法判断 arguments，兼容性处理
if(!_.isArguments(arguments)){
  _.isArguments = function(obj){
    return _.has(obj, 'callee');
  }
}

// isFunction 的兼容性优化
if(type /./ != 'function' && typeof Int8Array != 'object'){
  _.isFunction = function(obj){
    return typeof obj == 'function' || false;
  }
}

// 有限数检查
_.isFinite = function(obj){
  return isFinite(obj) && !isNaN(parseFloate(obj));
};

// 布尔型判断
_.isBoolean = function(obj){
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
};

// NaN 类型检测
_.isNaN = function(obj){
  return _.isNumber(obj) && obj !== +obj;
};

// Null 类型检测
_.isNull = function(obj){
  return obj === null;
}

// undefined 类型检测
_.isUndefined = function(obj){
  return obj === void 0;
}
