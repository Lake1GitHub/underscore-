  // 遍历方法，大致思路为:类数组（类数组对象或者数组）就用索引遍历，普通对象就用键值遍历
_.each = _.forEach = function(obj, iteratee, context){
  // 绑定 iteratee 迭代函数的上下文环境，
  iteratee = optimizeCb(iteratee, context);
  var i, length;
  // 类数组
  if(isArrayLike(obj)){
    for(i = 0, length = obj.length; i < length; i++){
      iteratee(obj[i], i, obj);
    }
  } else { // 普通对象
    var keys = _.keys(obj);
    for(i = 0, length = keys.length; i < length; i++){
      iteratee(obj[keys[i]], keys[i], obj);
    }
  }
  return obj;
}

  // obj 中的每个元素应用 iteratee 方法，将 iteratee 的返回值，组合成一个数组返回。
_.map = _.collect = function(obj, iteratee, context){
  // cb 方法比 optimizeCb 方法多了一些条件判断，
  iteratee = cb(iteratee, context);
  // 获得 obj 的键值，长度，以及创建返回数组
  var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length,
      results = Array(length);
  for( var index = 0; index < length; index++){
    var currentKey = keys ? keys[index] : index;
    results[index] = iteratee(obj[currentKey], currentKey, obj)
  }
}

// Reduce 内部函数, dir 为步进长度
function createReduce(dir){
  function iterator(obj, iteratee, memo, keys, index, length){
    for(; index >= 0 && index < length; index += dir){
      var currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  }

  return function(obj, iteratee, memo, context){
    iteratee = optimizeCb(iteratee, context, 4);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        index = dir > 0 ? 0 : length - 1;
    if(arguments.length < 3){
      // 没有设置 memo(初始值)，则将第一个值设置为初始值。
      //dir大于0 则为keys[0](正序的第一个值), 否则为keys[keys.length-1](逆序的第一个值)
      memo = obj[keys ? keys[index] : index];
      index += dir;
    }
    return iterator(obj, iteratee, memo, keys, index, length);
  };
}

// _.reduce 方法就是步进为 1 的 createReduce 函数，作用与原生方法相似，可用于对象
_.reduce = _.foldl = _.inject = createReduce(1);
// _.reduceRight 方法就是步进为 -1 的 createReduce 函数，作用与原生方法相似，可用于对象
_.reduceRight = _.folder = createReduce(-1);

// 查找第一个通过断言函数的 索引(数组)或者键(对象)
_.find = _.detect = function(obj, predicate, context){
  var key;
  if(isArrayLike(obj)){
    key = _.findIndex(obj, predicate, context);
  } else{
    key = _.findKey(obj, predicate, context);
  }
  if(key !== void 0 && key !== -1) return obj[key];
}

// 筛选通过断言函数的值，并返回由他们组成的数组
_.filter = _.select = function(obj, predicate, context){
  var results =[];
  predicate = cb(predicate, context);
  // 对于 obj 中的每个元素，如果通过断言，则压入数组，最后返回整个数组
  _.each(obj, function(value, index, list){
    if(predicate(value, index, list)) results.push(value);
  });
  return results;
};

// 遍历obj中的每一个值，返回一个数组，这个数组包含attrs所列出的属性的所有的键值对。
_.where = function(obj, attrs){
  // _.matcher 的返回值是一个断言函数，这个断言函数的作用就是检查给定的 object 中是否含有attrs
  // 对于 obj 中的每个值，都作为 object 传给 _.matcher(attrs)，检查其中是否含有 attrs，返回所有含有 attrs 的 object
  return _.filter(obj, _.matcher(attrs));
};

// 作用与 _.where 类似，但只返回第一个含有 attrs 的 objects
_.findWhere = function(obj, attrs){
  return _.find(obj, _.matcher(attrs));
};

// 筛选没有通过断言函数的值
_.reject = function(obj, predicate, context){
  // _.negate 方法的作用为 将断言函数的返回值置反
  return _.filter(obj, _.negate(cb(predicate)), context);
};

// 检查是否 obj 中的所有元素都通过了断言测试 全称量词
_.every = _.all = function(obj, predicate, context){
  predicate = cb(predicate, context);
  var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length;
  // 遍历，对每个值都调用 断言函数测试
  for(var index = 0; index < length; index++){
    var currentKey = keys ? keys[index] : index;
    if(!predicate(obj[currentKey], currentKey, obj)) return false;
  }
  return true;
};

// 检查是否 obj 中存在能通过断言测试的元素 存在量词
_.some = _.any = function(obj, predicate, context){
  predicate = cb(predicate, context);
  var keys = !isArrayLike(obj) && _.keys(obj),
      length = (keys || obj).length;
  for(var index = 0; index < length; index++){
    var currentKey = keys ? keys[index] : index;
    if(predicate(obj[currentKey], currentKey, obj)) return true;
  }
}

// 检查 obj 是否包含某个值，从 fromIndex 往后寻找，
_.contains = _.includes = _.include = function(obj, target, fromIndex){
  if(!isArrayLike(obj)) obj = _.values(obj);
  return _.indexOf(obj, target, typeof fromIndex == 'number' && fromIndex) >= 0;
}

// 对于 obj 中的每个元素都调用 method 方法，同时传递参数
// 与 _.map 方法的区别就是
// 1.可以传递方法名(譬如 method = 'sort')，应用数组/对象的原生方法
// 2.在应用 method 时可以传递参数，args 就是传递的参数集合
_.invoke = function(obj, method){
  var args = slice.call(arguments, 2);
  var isFunc = _.isFunction(method);
  return _.map(obj, function(value){
    var func = isFunc ? method : value[method];
    return func == null ? func : func.apply(value, args);
  });
};

// 萃取 obj 中 所有键为 key 的元素的值组成的数组，
_.pluck = function(obj, key){
  // _.property(key) 作用为 返回一个函数，该函数接受 object 返回 object[key]
  // 即对 obj 中的每一个元素 object，提取 object[key]，包装成数组返回
  return _.map(obj, _.property(key));
};

// 获取 obj 中的最大值，如果 iteratee 没有定义，则默认比较 obj 中的值
// 如果定义了 iteratee 则对 obj 中的每个值应用 iteratee，以返回值作为比较的基准
_.max = function(obj, iteratee, context){
  var result = -Infinity, lastComputed = -Infinity,
      value, computed;
  if(iteratee == null && obj != null){
    obj = isArrayLike(obj) ? obj : _.values(obj);
    for(var i = 0, length = obj.length; i < length; i++){
      value = obj[i];
      if (value > result){
        result = value;
      }
    }
  } else {
    iteratee = cb(iteratee, context);
    _.each(obj, function(value, index, list){
      computed = iteratee(value, index, list);
      if(computed > lastComputed || computed === -Infinity && result === -Infinity){
        result = value;
        lastComputed = computed;
      }
    });
  }
  return result;
};

// 与 _.max 类似，只是获取的是最小值
_.min = function(obj, iteratee, context){
  var result = Infinity, lastComputed = Infinity,
      value, computed;
  if(iteratee == null && obj != null){
    obj = isArrayLike(obj) ? obj : _.values(obj);
    for(var i = 0, length = obj.length; i < length; i++){
      value = obj[i];
      if(value < result){
        result = value;
      }
    }
  } else {
    iteratee = cb(iteratee, context);
    _.each(obj, function(value, index, list){
      computed = iteratee(value, index, list);
      if(computed < lastComputed || computed === Infinity && result === Infinity){
        result = value;
        lastComputed = computed;
      }
    });
  }
  return result;
};

// 代码有点复杂，第一次看的时候看懵了。。。
// 没关系，仔细来分析一下 第一步是 绑定上下文
// 然后就 return 一个 _.pluck(),仔细分析一下 _.pluck 的参数
// _.pluck(_.map(obj,function1).sort(function2), 'value');
// 第一个参数:
// 也就是说 将 obj _.map 之后排序
// 接着，我们看下 function1，很显然，它直接将value, index 和 iteratee 包装成一个对象
// 也就是说 _.map 在这里的作用就是将 obj 中的每个元素都包装成一个对象，有3个成员 value, index 和 criteria
// 其中 value 和 index 都是它本来的值，而 criteria 则是 iteratee 的返回值
// 而排序的依据是什么呢？ 就是 criteria，在 criteria 相等的情况下再比较 index
// 答案呼之欲出了，第一个参数就是将 obj 中的每个元素包装成一个对象，然后按这个对象中的 criteria 排好序
// 结合第二个参数，整个函数的作用就是，将 obj 中的元素包装成对象，然后按iteratee 的结果排好序，最后返回其中的 value
_.sortBy = function(obj, iteratee, context){
  iteratee = cb(iteratee, context);
  return _.pluck(_.map(obj, function(value, index, list){
    return {
      value: value,
      index: index,
      criteria: iteratee(value, index, list)
    };
  }).sort(function(left, right){
    var a = left.criteria;
    var b = right.criteria;
    if( a!== b){
      if(a > b || a === void 0) return 1;
      if(a < b || b === void 0) return -1;
    }
    return left.index - right.index;
  }), 'value');
};

// 内部函数，对 obj 进行中的每个元素调用iteratee后，调用 behavior 函数。
// behavior 为内部函数接口，用于生成各种方法
var group = function(behavior){
  return function(obj, iteratee, context){
    var result = {};
    iteratee = cb(iteratee, context);
    _.each(obj, function(value, index){
      var key = iteratee(value, index, obj);
      // 根据 iteratee 的返回值执行内部方法
      behavior(result, value, key);
    });
    return result;
  };
};

// 分组方法，根据返回的 key( iteratee的返回值 ) 对 result 中的元素进行分组
_.groupBy = group(function(result, value, key){
  if(_.has(result, key)) result[key].push(value); else result[key] = [value];
});

// 与 groupBy 相比，没有去判断，result 中是否本来就有 key，也就是说，indexBy多用于键是唯一时的情况
_.indexBy = group(function(result, value, key){
  result[key] = value;
});

// 分组计数方法，也是按 返回的key值分组，不过分组的内容不是 value值，而是相同key值出现的次数
_.countBy = group(function(result, value, key){
  if(_.has(result, key)) result[key]++; else result[key] = 1;
});

// 随机打乱集合的方法
_.shuffle = function(obj){
  var set = isArrayLike(obj) ? obj : _.values(obj);
  var length = set.length;
  var shuffled = Array(length);
  for (var index = 0, rand; index < length; index++){
    // 根据 index 随机生成 rand
    rand = _.random(0, index);
    // 这个地方刚开始看的时候有点迷糊，抓住一点就好了，index 增长从而入栈的 set[index]，一定是放置在 shuffled[rand] 里
    // 然后考虑当 rand !== index 时，原来 shuffled[rand]会被覆盖，从而将shuffled[rand]的值放置在shuffled[index](空) 里
    // rand !== index 写在前面，防止 shuffled 的值被覆盖
    if (rand !== index) shuffled[index] = shuffled[rand];
    shuffled[rand] = set[index];
  }
  return shuffled;
};
