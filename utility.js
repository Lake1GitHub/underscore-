// 工具方法


// 释放 _ ，
_.noConflict = function(){
    root._ = previousUnderscore;
    return this;
}


// 看似无用，实则用处很大，譬如 _.filter(array, _.identity)，就能筛选出，array中值为true的元素
 _.identity = function(value){
     return value;
 };

// constant 恒定的，这里 _.constant 的作用就是返回一个函数，函数的返回值固定为value
 _.constant = function(value){
     return function(){
         return value;
     };
 };

// 其实我觉得这只是节约字符用的
 _.noop = function(){};

// 将 iteratee 执行 n 遍，每次执行的返回值都会存入 accum[] 最后返回
 _.times = function(n, iteratee, context){
     var accum = Array(Math.max(0, n));
     iteratee = optimizeCb(iteratee, context, 1);
     for(var i = 0; i < n; i++) accum[i] = iteratee(i);
     return accum;
 }

// 返回 min~max 之间的随机整数
 _.random = function(min, max){
     if(max == null){
         max = min;
         min = 0;
     }
     return min + Math.floor(Math.random() * (max - min + 1));
 };

// 扩展 underscore 函数库，
 _.mixin = function(obj){
     // 传入 obj 对其中的所有方法，调用扩展函数
     _.each(_.functions(obj), function(name){
         // obj[name]方法赋值给 _(oop调用时需要) 和 func
         var func = _[name] = obj[name];
         // 在 _ 的原型上添加方法
         _.prototype[name] = funciton(){
             var args = [this._wrapped];
             push.apply(args, arguments);
             // 将 _ 和 func 的其他参数组合后，传入 func，调用 func
             return result(this, func.apply(_, args));
         };
     });
 };

// 使 underscore 支持面向对象形式的调用
_.mixin(_);

 _.iteratee = function(value, context){
     return cb(value, context, Infinity);
 };

// 用于生成全局唯一的ID
 var idCounter = 0;
 _.uniqueId = function(prefix){
     var id = ++idCounter + '';
     return prefix ? prefix + id : id;
 }

var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
};
var unescapeMap = _.invert(escapeMap);

var createEscaper = function(map){
    var escaper = function(match){
        return map[match];
    };
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string){
        string = string == null ? '' : '' + string;
        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
};

// 转义逃脱符与反转义
_.escape = createEscaper(escapeMap);
_.unescape = createEscaper(unescapeMap);

// 对 object[property] 调用 fallback，如果 object[property]本身是方法，则调用方法
// 如果 object[property]不是方法，且fallback 为undefined，则返回 object[property];
_.result = function(object, property, fallback){
    var value = object == null ? void 0 : object[property];
    if(value === void 0){
        value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
};

_.now = Date.now || function(){
    return new Date().getTime();
};

// 模板风格设置
 _.templateSettings = {
     evaluate     : /<%([\s\S]+?)%>/g,
     interpolate  : /<%=([\s\S]+?)%>/g,
     escape       : /<%-([\s\S]+?)%>/g
 };

 var noMatch = /(.)^/;

// 转义 \u2028和\u2029， 在ES5的 JSON.stringify 下有 bug
 var escapes = {
     "'":      "'",
     '\\':     '\\',
     '\r':     'r',
     '\n':     'n',
     '\u2028': 'u2028',
     '\u2029': 'u2029'
 };

 var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

 var escapeChar = function(match){
     return '\\' + escapes[match];
 };

// 这个方法，还没能弄的很明白
 _.template = function(text, settings, oldSettings){

     // 兼容旧版本
     if(!settings && oldSettings) settings = oldSettings;
     settings = _.defaults({}, settings, _.templateSettings);

     var matcher = RegExp([
         (settings.escape || noMatch).source,
         (settings.interpolate || noMatch).source,
         (settings.evaluate || noMatch).source
     ].join('|') + '|$', 'g');

     var index = 0;
     var source = "__p+='";

     text.replace(matcher, function(match, escape, interpolate, evaluate, offset){
         source += text.slice(index, offset).replace(escaper, escapeChar);
         index = offset + match.length;

         if(escape){
             source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
         } else if(interpolate){
             source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
         } else if(evaluate){
             source += "';\n" + evaluate + "\n__p+='";
         }
         return match;
     });

     source += "';\n";

     if(!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

     source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments, '');};\n" +
        source + 'return __p;\n';

    try{
        var render = new Funtion(settings.variable || 'obj', '_', source);
    } catch(e){
        e.source = source;
        throw e;
    }

    var template = function(data){
        return render.call(this, data, _);
    };

    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument +'){\n' + source + '}';
    return template;
 }
