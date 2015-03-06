/*
Homework 5:
  Blocks are not yet fully supported.
  Nonlocal returns aren't yet implemented and blocks naively return the result of their last statement
*/

var OO = {};

function Obj(name, methods, vars, superClass) {
  this.name = name;
  this.methods = methods;
  this.vars = vars;
  this.superClass = superClass;
};

/*function Block(call) {
  this.call = call;
}*/

var CT = {};
var Instances = [];

/*
 * Helpers
 */
// Checks if any members of a1 appear in a2
dups = function(a1, a2) {
  for (var i = 0; i < a1.length; i++) {
    for (var j = 0; j < a2.length; j++) {
      if (a1[i] == a2[j]) {
        return true;
      }
    }
  }
  return false;
}

// Deep copies an object, returns the copy
deep_copy = function(obj) {
  if (obj === undefined) {
    // Base Object class, no superclass copying required
    return undefined;
  }
  var copy = new Obj(obj.name, {}, {}, {});
  for (method in obj.methods) {
    copy.methods[method] = obj.methods[method];
  }
  for (v in obj.vars) {
    copy.vars[v] = obj.vars[v];
  }
  copy.superClass = deep_copy(obj.superClass);
  return copy;
}

getSuperClassName = function(obj) {
  // Check for primitives
  if (obj === null) {
    return 'Object';
  } else if (typeof obj === 'boolean') {
    if (obj === true) {
      return 'Boolean';
    } else {
      return 'Boolean';
    }
  } else if (typeof obj === 'number') {
    return 'Object';
  } else {
    if (!obj.superClass.hasOwnProperty('name')) {
      throw new Error('undefined superclass');
    }
    return obj.superClass.name;
  }
}


/*
 * OO
 */
OO.initializeCT = function() {
  // Clean CT
  for (old_class in CT) {
    delete CT[old_class];
  }

  // Create base Object
  var obj = new Obj(
    'Object',
    {
      'initialize' : function() {},
      '===' : function(_this, x) {
        return _this === x;
      },
      '!==' : function(_this, x) {
        return _this !== x;
      },
      'isNumber' : function() {
        return false;
      }
    },
    {},
    {}
  );
  CT['Object'] = obj;

  // Number class
  var num = new Obj(
    'Number',
    {
      'initialize' : function() {},
      '===' : function(_this, x) {
        return _this === x;
      },
      '!==' : function(_this, x) {
        return _this !== x;
      },
      'isNumber' : function() {
        return true;
      },
      '+' : function(_this, anotherNumber) {
        return _this + anotherNumber;
      },
      '-' : function(_this, anotherNumber) {
        return _this - anotherNumber;
      },
      '*' : function(_this, anotherNumber) {
        return _this * anotherNumber;
      },
      '/' : function(_this, anotherNumber) {
        return _this / anotherNumber;
      },
      '%' : function(_this, anotherNumber) {
        return _this % anotherNumber;
      },
      '<' : function(_this, anotherNumber) {
        return _this < anotherNumber;
      },
      '>' : function(_this, anotherNumber) {
        return _this > anotherNumber;
      },
      '<=' : function(_this, anotherNumber) {
        return _this <= anotherNumber;
      },
      '>=' : function(_this, anotherNumber) {
        return _this >= anotherNumber;
      }
    },
    {},
    CT['Object']
  );
  CT['Number'] = num;

  // Null
  var nul = new Obj(
    'Null',
    {
      'initialize' : function() {},
      '===' : function(_this, x) {
        return _this === x;
      },
      '!==' : function(_this, x) {
        return _this !== x;
      },
      'isNumber' : function() {
        return false;
      },
    },
    {},
    CT['Object']
  );
  CT['Null'] = nul;

  // Boolean
  var bool = new Obj(
    'Boolean',
    {
      'initialize' : function() {},
      '===' : function(_this, x) {
        return _this === x;
      },
      '!==' : function(_this, x) {
        return _this !== x;
      },
      'isNumber' : function() {
        return false;
      },
    },
    {},
    CT['Object']
  );
  CT['Boolean'] = bool;

  // True
  var tru = new Obj(
    'True',
    {
      'initialize' : function() {},
      '===' : function(_this, x) {
        return _this === x;
      },
      '!==' : function(_this, x) {
        return _this !== x;
      },
      'isNumber' : function() {
        return false;
      },
    },
    {},
    CT['Boolean']
  );
  CT['True'] = tru;

  // False
  var fal = new Obj(
    'False',
    {
      'initialize' : function() {},
      '===' : function(_this, x) {
        return _this === x;
      },
      '!==' : function(_this, x) {
        return _this !== x;
      },
      'isNumber' : function() {
        return false;
      },
    },
    {},
    CT['Boolean']
  );
  CT['False'] = fal;
};

OO.declareClass = function(name, superClassName, instVarNames) {
  // Error checking
  if (CT.hasOwnProperty(name)) {
    throw new Error('class ' + name + ' already exists');
  } else if (!CT.hasOwnProperty(superClassName)) {
    throw new ReferenceError('superClassName ' + superClassName + ' does not exist');
  }
  var vars = {};
  if (instVarNames !== undefined) {
    var sorted_arr = instVarNames.sort();
    for (var i = 0; i < sorted_arr.length-1; i++) {
      if (sorted_arr[i] == sorted_arr[i+1]) {
        throw new Error('instVarNames has duplicate variable names');
      }
    }
    // Recursively check for duplicate variable names in superclasses
    var scn = superClassName;
    while (scn) {
      if (CT.hasOwnProperty(scn) && CT[scn] != null) {
        if (dups(instVarNames, Object.keys(CT[scn].vars))) {
          throw new Error('instVarNames duplicates a variable name in ' + superClassName);
        }
        scn = CT[scn].superClass;
      } else {
        break;
      }
    }

    // Add variable names into vars hash
    for (var i = 0; i < instVarNames.length; i++) {
      vars[instVarNames[i]] = null;
    }
  }
  // Inherit superclass's methods
  var superClassMethods = {};
  for (method in CT[superClassName].methods) {
    superClassMethods[method] = CT[superClassName].methods[method];
  }
  // Create the new class
  var obj = new Obj(
    name,
    superClassMethods,
    vars,
    CT[superClassName]
  );
  CT[name] = obj;
};

OO.declareMethod = function(className, selector, implFn) {
  if (!CT.hasOwnProperty(className)) {
    throw new ReferenceError('declareMethod: class name ' + className + ' does not exist');
  }
  CT[className].methods[selector] = implFn;
};

OO.instantiate = function() {
  var a = Array.prototype.slice.call(arguments);
  var className = a[0];
  if (!CT.hasOwnProperty(className)) {
    throw new ReferenceError('instantiate: class name ' + className + ' does not exist');
  }
  var args = a.slice(1);

  var obj = deep_copy(CT[className]);
  args.unshift(obj);
  obj.methods['initialize'].apply(undefined, args);
  Instances.push(obj);
  return obj;
};

OO.send = function() {
  var a = Array.prototype.slice.call(arguments);
  var recv = a[0],
      selector = a[1],
      args = a.slice(2),
      receiver;

  // Check for primitives
  if (recv === null) {
    receiver = CT['Null'];
  } else if (typeof recv === 'boolean') {
    if (recv === true) {
      receiver = CT['True'];
    } else {
      receiver = CT['False'];
    }
  } else if (typeof recv === 'number') {
    receiver = CT['Number'];
  } else if (typeof recv === 'function') {
    // {Block}.call(args...)
    return recv.apply(this, args);
  } else {
    // Any other object
    if (!CT.hasOwnProperty(recv.name)) {
      throw new ReferenceError('send: undefined class ' + recv.name);
    }
    receiver = CT[recv.name];
  }

  if (!receiver.methods.hasOwnProperty(selector)) {
    throw new ReferenceError('send: message not understood');
  }
  // All methods have a _this parameter, so add it in front of the args array
  args.unshift(recv);
  return receiver.methods[selector].apply(undefined, args);
};

OO.superSend = function() {
  var a = Array.prototype.slice.call(arguments);
  var superClassName = a[0],
      recv = a[1],
      selector = a[2],
      args = a.slice(3);

  if (!CT.hasOwnProperty(superClassName)) {
    throw new ReferenceError('superSend: undefined class ' + superClassName);
  } else if (!CT[superClassName].methods.hasOwnProperty(selector)) {
    throw new ReferenceError('superSend: message not understood');
  }

  // Again add the recv object as _this argument
  args.unshift(recv);
  return CT[superClassName].methods[selector].apply(undefined, args);
};

OO.getInstVar = function(recv, instVarName) {
  // Check recv vars
  if (recv.vars.hasOwnProperty(instVarName)) {
    return recv.vars[instVarName];
  } else if (recv.superClass.hasOwnProperty('vars')) {
    // Recursively check for instVarName in superclass
    return OO.getInstVar(recv.superClass, instVarName);
  } else {
    throw new ReferenceError('getInstVar: var ' + instVarName + ' is undeclared');
  }
};

OO.setInstVar = function(recv, instVarName, value) {
  // Check recv vars
  if (recv.vars.hasOwnProperty(instVarName)) {
    recv.vars[instVarName] = value;
  } else if (recv.superClass.hasOwnProperty('vars')) {
    // Recursively check for instVarName in superclass
    return OO.setInstVar(recv.superClass, instVarName, value);
  } else {
    throw new ReferenceError('setInstVar: var ' + instVarName + ' is undeclared');
  }
  
  return value;
};



/*
 * HW5 - Translator
 */

O.translateBody = function(asts) {
  var ret = '';
  for (var i = 0; i < asts.length; i++) {
    ret += O.transAST(asts[i]) + ';\n';
  }
  return ret;
}

/*
 * Define classes for each tag
 */
O.program = function() {
  var asts = Array.prototype.slice.call(arguments);
  console.log(asts);
  var ret = 'OO.initializeCT();\n';
  ret += O.translateBody(asts);
  return ret;
};

O.classDecl = function (name, superClass, instVarNames) {
  var ret = 'OO.declareClass("' + name + '", "' + superClass + '"';
  if (instVarNames.length > 0) {
    ret += ', ["' + instVarNames.join('", "') + '"]';
  }
  ret += ')';
  return ret;
};

O.methodDecl = function (className, method, args, statements) {
  // Need to enclose class and method name in double quotes
  var ret = 'OO.declareMethod("' + className + '", "' + method + '", ';
  // Add function arguments, with _this preceding
  ret += 'function (_this';
  if (args.length > 0) {
    ret += ', ' + args.join(', ');
  }
  ret += ') {';
  // Add function body
  ret += O.translateBody(statements);
  ret += '})';
  return ret;
};

O.varDecls = function () {
  var decls = Array.prototype.slice.call(arguments),
      ret = 'var ', key, val;
  for (var i = 0; i < decls.length; i++) {
    key = decls[i][0];
    val = O.transAST(decls[i][1]);
    ret += key + ' = ' + val;
    if (i !== decls.length-1) {
      ret += ', ';
    }
  }
  return ret;
};

O.return = function (e) {
  return 'return ' + O.transAST(e);
};

O.setVar = function (x, e) {
  return x + ' = ' + O.transAST(e);
};

O.setInstVar = function (x, e) {
  return 'this.' + x + ' = ' + O.transAST(e);
};

O.exprStmt = function (ast) {
  return O.transAST(ast);
};

O.null = function () {
  return 'null';
};

O.true = function () {
  return 'true';
};

O.false = function () {
  return 'false';
};

O.number = function (x) {
  return x.toString();
};

O.getVar = function (x) {
  return x;
};

O.getInstVar = function (x) {
  return 'this.' + x;
};

O.new = function () {
  var a = Array.prototype.slice.call(arguments),
      ret = 'OO.instantiate("' + a[0] + '"';

  for (var i = 1; i < a.length; i++) {
    ret += ', ' + O.transAST(a[i]);
  }
  ret += ')';
  return ret;
};

O.send = function () {
  var a = Array.prototype.slice.call(arguments);
  var recv = a[0],
      method = a[1],
      args = a.slice(2);
  // Need to enclose method name in double quotes
  var ret = 'OO.send(' + O.transAST(recv) + ', "' + method + '"';
  for (var i = 0; i < args.length; i++) {
    ret += ', ' + O.transAST.call(undefined, args[i]);
  }
  ret += ')';
  return ret;
};

O.super = function () {
  var a = Array.prototype.slice.call(arguments);
  var method = a[0],
      args = a.slice(1),
      ret = 'OO.superSend(getSuperClassName(_this), _this, "' + method + '"';
  if (args.length > 0) {
    ret += ', ' + args.join(', ');
  }
  ret += ')';
  return ret;
};

O.block = function (varNames, statements) {
  var ret = 'function(' + varNames.join(', ') + ') {';
  var funcBody = '';
  for (var i = 0; i < statements.length; i++) {
    if (i === statements.length-1 && statements[i][0] !== 'return') {
      funcBody += 'return ';
    }
    funcBody += O.transAST(statements[i]) + ';\n';
  }
  ret += funcBody + '}';
  return ret;
}

O.this = function () {
  return '_this';
}

O.transAST = function(ast) {
  // Dispatch to the proper class
  return O[ast[0]].apply(undefined, ast.slice(1));
}