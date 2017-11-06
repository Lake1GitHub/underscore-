(function(){
    var root = this;

    var previousUnderscore = root._;

    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    var push             = ArrayProto.push,
        slice            = ArrayProto.slice,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty;

    var nativeIsArray = Array.isArray,
        nativeKeys    = Object.keys,
        nativeBind    = FuncProto.bind,
        nativeCreate  = Object.create;

    var Ctor = function(){};

    var _ = function(obj){
        if(obj instanceof _) return obj;
        if(!(this instanceof _)) return new _(obj);
        this._wrapped = obj;
    };

    if(typeof exports !== 'undefined'){
        if(typeof module !== 'undefined' && module.exports){
            exports = module.exports = _;
        }
        exports._ = _;
    } else {
        root._ = _;
    }

    _.VERSION = '1.8.2';

    // 使 underscore 支持面向对象形式的调用
    _.mixin(_);

    // underscore 支持原型方法的调用
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name){
        var method = ArrayProto[name];
        _.prototype[name] = function(){
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
            return result(this, obj);
        }
    });

    _.each(['concat', 'join', 'slice'], function(name){
        var method = ArrayProto[name];
        _.prototype[name] = function(){
            return result(this, method.apply(this._wrapped, arguments));
        };
    });

    _.prototype.value = function(){
        return this._wrapped;
    };

    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function(){
        return '' + this._wrapped;
    };

    if(typeof define === 'function' && define.amd){
        define('underscore', [], function(){
            return _;
        });
    }
}.call(this));
