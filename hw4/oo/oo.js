var OO = {};

function Obj(name, methods, vars, superClass) {
  this.name = name;
  this.methods = methods;
  this.vars = vars;
  this.superClass = superClass;
};

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
      }
    },
    {},
    CT['Object']
  );
  CT['Number'] = num;
};

OO.declareClass = function(name, superClassName, instVarNames) {
  // Error checking
  if (CT.hasOwnProperty(name)) {
    throw new Error('class ' + name + ' already exists');
  } else if (!CT.hasOwnProperty(superClassName)) {
    throw new ReferenceError('superClassName ' + superClassName + ' does not exist');
  }
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
  var vars = {};
  for (var i = 0; i < instVarNames.length; i++) {
    vars[instVarNames[i]] = null;
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
      args = a.slice(2);

  // Number
  if (typeof recv === 'number') {
    if (!CT['Number'].methods.hasOwnProperty(selector)) {
      throw new ReferenceError('send: message not understood');
    }
    // All methods have a _this parameter, so add it in front of the args array
    args.unshift(recv);
    return CT['Number'].methods[selector].apply(undefined, args);
  } else {
    // Any other object
    if (!CT.hasOwnProperty(recv.name)) {
      throw new ReferenceError('send: undefined class ' + recv.name);
    } else if (!CT[recv.name].methods.hasOwnProperty(selector)) {
      throw new ReferenceError('send: message not understood');
    }
  
    // All methods have a _this parameter, so add it in front of the args array
    args.unshift(recv);
    return recv.methods[selector].apply(undefined, args);
  }
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

// ...

