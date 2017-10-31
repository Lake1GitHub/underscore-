
// 数组方法，同时包括类数组对象


// 获取数组的前 n 个元素，如果 guard 为true 则必定只返回第一个元素
_.first = _.head = _.take = function(array, n, guard){
  if(array == null) return void 0;
  if(n == null || guard) return array[0];
  return _.initial(array, array.length - n);
};

// 获取数组的前(lenght-n)项。也作，截断数组的后 n 项，n 默认为1，当 guard为true时，截断最后一个
_.initial = function(array, n, guard){
  return slice.call(array, 0, Math.max(0, array.lenght - (n == null || guard ? 1 : n)));
};

// 获取数组中，从最后一个元素开始的 n 个元素，guard 为 true 时，返回最后一个元素
_.last = function(array, n, guard){
  if(array == null) return void 0;
  if(n == null || guard) return array[array.length - 1];
  return _.rest(array, Math.max(0, array.length - n));
};

// 获取数组中，从 n 开始的剩余所有元素，guard 为 true 时，获取除第一元素以外的其他元素
_.rest = _.tail = _.drop =  function(array, n, guard){
  return slice.call(array, n == null || guard ? 1 : n);
};

// 获取数组中所有真值组成的数组
_.compact = function(array){
  // _.identity 的作用为返回参数本身，这里起到了筛选的作用，参数为 false 则会被剔除
  return _.filter(array, _.identity);
};

// 扁平化数组，若 shallow 为 true，则只解构一层
// strict 若为 true，则忽略非数组元素。
// 若 shallow 为 false 且 strict 为 true，则总是返回空数组
// 因为 shallow 为 false 则会一直解构，直到全部为非数组元素，而 strict 会将其忽略，最后返回空数组
// startIndex 为起始索引，索引之前的数组不会被解构
var flatten = function(input, shallow, strict, startIndex){
  var ouput = [], idx = 0;
  for(var i = startIndex || 0, length = input && input.length; i < length; i++){
    var value = input[i];
    // 数组
    if(isArrayLike(value) && (_.isArray(value) || _.isArguments(value))){
      // shallow 为 false 继续解构
      if(!shallow) value = flatten(value, shallow, strict);
      var j = 0, len = value.length;
      output.length += len;
      // 解构出来的元素压入 output
      while(j < len){
        output[idx++] = value[j++];
      }
    } else if(!strict){
      // 非数组，也就是元素压入 output
      output[idx++] = value;
    }
  }
  return output;
};

// 扁平化数组方法
_.flatten = function(array, shallow){
  return flatten(array, shallow, false);
};

// 返回 array 中删除所有其他参数的结果
_.without = function(array){
  // _.difference 为求差集，也就是，array中除开其他参数的部分
  return _.difference(array, slice.call(arguments, 1));
};

// 求并集，也就是将参数扁平化之后去重
_.union = function(){
  return _.uniq(flatten(arguments, true, true));
}

// 求交集，也就是判断array中的元素是否在其他参数中存在，若都存在，压入result
_.intersection = function(array){
  if(array == null) return [];
  var result = [];
  var argsLength = arguments.length;
  // 遍历 array
  for(var i = 0, length = array.length; i < length; i++){
    var item = array[i];
    if(_.contains(result, item)) continue;
    // 遍历其他参数，是否存在 item
    for( var j = 1; j < argsLength; j++ ){
      if(!_.contains(arguments[j], item)) break;
    }
    if(j === argsLength) result.push(item);
  }
  return result;
};

// 求差集，将除第一个参数(array)的其他参数扁平化，然后从array中剔除其他参数中存在的元素
_.difference = function(array){
  var rest = flatten(arguments, true, true, 1);
  return _.filter(array, function(value){
    return !_.contains(rest, value);
  });
};

// 数组去重，如果已经排好序，传递 isSorted 为true，效率会更高
_.uniq = _.unique = function(array, isSorted, iteratee, context){
  if(array == null) return [];
  // isSorted 如果不是布尔型，则默认没有传递 isSorted 参数
  if(!_.isBoolean(isSorted)){
    context = iteratee;
    iteratee = isSorted;
    isSorted = false;
  }
  if(iteratee != null) iteratee = cb(iteratee, context);
  var result = [];
  // seen 为迭代函数返回值的集合
  var seen = [];
  for(var i = 0, length = array.length; i < length; i++){
    var value = array[i],
        // 去重依据
        computed = iteratee ? iteratee(value, i, array) : value;
    // 已经排好序
    // 这里有个 bug 就是关于是否已经排好序，我们常常以为排好序的定义就是从小到大，或者从大到小
    // 但是如果定义了 iteratee，这里排序的定义就不一样了，_.uniq 会以 iteratee的返回值作为是否排序的依据
    // 看个例子，var numbers = [1, 2, 2, 3, 4, 4], var iteratee = function(value){ return value === 3; }
    // var un = _.uniq(numbers, true, iteratee);
    // numbers 我们常常认为他是排好序的，但是 iteratee作用之后，其实他比较的依据变成了 Num = [false,false,false,true,false,false];
    // 显然　Num 是没有排好序的，可是我们却传递了 isSorted = true，这里算是一个坑，和我们平时理解的是否排序有点差异
    // 如果没有特别严格的性能要求，isSorted 尽量传递为 false.
    if(isSorted){
      // 如果比较值不同，则压入栈（由于排好序，不用和之前的对比，只需要和上一个对比）
      if(!i || seen !== computed) result.push(value);
      seen = computed;
    } else if(iteratee){
      // 没有排序，但定义了迭代函数
      if(!_.contains(seen, computed)){
        seen.push(computed);
        result.push(value);
      }
    } else if(!_.contains(result, value)){
      result.push(value);
    }
  }
  return result;
}

// _.zip 和 _.unzip 其实是一个方法
_.zip = function(){
  return _.unzip(arguments);
}

// unzip = zip 作用为 将array中的元素重排 array应该是一个二维数组
_.unzip = function(array){
  // 获取array 中元素数组的最大长度
  var length = array && _.max(array, 'length').length || 0;
  var result = Array(length);
  // 萃取 array的子元素数组中 所有索引为index的元素，作为一个数组存入 result[index];
  for(var index = 0; index < length; index++){
    result[index] = _.pluck(array, index);
  }
  return result;
}

// 将数组转为对象，转换规则如下:
// 若 list == false, 则返回空对象。
// 若 list == true, values == false, 则 list 的第 0 列为键, 第 1 列为值转为对象
// 若 list == true, values == true, 则根据 list 的长度，list 为键, values 为值，转为对象
_.object = function(list, values){
  var result = {};
  for(var i = 0, length = list && list.length; i < length; i++){
    if(values){
      result[list[i]] = values[i];
    } else {
      result[list[i][0]] = list[i][1];
    }
  }
  return result;
};

// 寻找 item 第一次出现在 array 中的位置，若不存在，返回 -1.
// isSorted 若为数字，>0 则表示寻找的起始位置（之前的不会被寻找）, <0 表示从尾部向前|isSorted|,然后往后查找
// isSorted 若为布尔值，true 表示 array 已经排好序，采用二分查找，效率更高
_.indexOf = function(array, item, isSorted){
  var i = 0, length = array && array.length;
  if(typeof isSorted == 'number'){
    i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
  } else if(isSorted && length){
    i = _.sortedIndex(array, item);
    return array[i] === item ? i : -1;
  }
  // 处理 item 为 NaN 的情况
  if(item !== item){
    return _.findIndex(slice.call(array, i), _.isNaN);
  }
  for(; i < length; i++) if (array[i] === item) return i;
  return -1;
};

// 从 array 尾部往前查找 item 在 array 中的位置
_.lastIndexOf = function(array, item, from){
  var idx = array ? array.length : 0;
  if(typeof from == 'number'){
    idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
  }
  if(item !== item){
    return _.findLastIndex(slice.call(array, 0, idx), _.isNaN);
  }
  while(--idx >= 0) if(array[idx] === item) return idx;
  return -1;
}

// 这_.findIndex和_.findLastIndex方法在 1.7.0 中没有，是后来新加入的方法，这里稍微讲一下
// 这个是创建一个索引查找的函数，传递的dir为步进的长度，dir<0表示从后查找
// 查找的方法也很简单，就是逐个对比，只是每次index不是增长1，而是增长一个dir
function createIndexFinder(dir){
  return function(array, predicate, context){
    predicate = cb(predicate, context);
    var length = array != null && array.length;
    // 初始 index 根据 dir 的正负，来判断正序还是逆序（这里有个bug 如果 dir为0 整个程序就变成死循环了。。。）
    var index = dir > 0 ? 0 : length - 1;
    for(; index >= 0 && index < length; index += dir){
      if(predicate(array[index], index, array)) return index;
    }
    return -1;
  };
}

// _.findIndex 也就是步进长度为 1 的逐个查找
_.findIndex = createIndexFinder(1);

// _.findLastIndex 也就是步进长度为 -1 的逐个查找（逆序）
_.findLastIndex = createIndexFinder(-1);

// 二分查找
_.sortedIndex = function(array, obj, iteratee, context){
  iteratee = cb(iteratee, context, 1);
  var value = iteratee(obj);
  var low = 0, high = array.length;
  while(low < high){
    var mid = Math.floor((low + high) / 2);
    if(iteratee(array[mid]) < value) low = mid + 1; else high = mid;
  }
  return low;
};

// 按照一定规律创建数组，从 start 到 stop，每次步进的长度为 step
// 若_.range(5) 则会返回 [0, 1, 2, 3, 4];
_.range = function(start, stop, step){
  if(arguments.length <= 1){ // 只有一个参数时，默认为 stop，start 为0
    stop = start || 0;
    start = 0;
  }
  step = step || 1;  // 步进长度
  var length = Math.max(Math.ceil((stop - start) / step), 0); //步进次数,(结束点-开始点)/步进长度 = 步进次数
  var range = Array(length);
  for(var idx = 0; idx < length; idx++, start += step){
    range[idx] = start;
  }
  return range;
};
