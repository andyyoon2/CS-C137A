F.evalAST = function(ast) {
  return mEval(ast, {});
};

// Helper function:
// Calls mEval on each element in args, and returns an array of those values
evalArgs = function(args, env) {
  var r = [];
  for (var i = 0; i < args.length; i++) {
    r.push(mEval(args[i], env));
  }
  return r;
}

// Primary function
mEval = function(ast, env) {
  // Primitive Values
  var type = typeof ast;
  if (type === "number" || type === "boolean" || ast === null) {
    return ast;
  }

  var tag = ast[0];
  var args = ast.slice(1);
  switch(tag) {
    case 'closure':
      return ast;

    case 'id':
      // Variable lookup
      if (env.hasOwnProperty(args[0])) {
        console.log('found it!');
        return env[args[0]];
      } else {
        throw new ReferenceError("Variable " + args[0] + " is undefined");
      }

    case 'fun':
      return ['closure', args[0], args[1], env];

    case 'call':
      // Get the function's closure
      var closure = mEval(args[0], env);
      var closure_args = closure[1];
      var closure_body = closure[2];
      var closure_env  = closure[3];
      var passed_args = evalArgs(args.slice(1), env);
      // Check number of arguments
      if (passed_args.length != closure_args.length) {
        throw new Error("Wrong number of arguments, expected " + num + " but got " + args.length);
      }
      // Create a new env for evaluation
      var temp_env = { };
      // Add in any existing key-val pairs from function's closure
      for (var key in closure_env) {
        temp_env[key] = closure_env[key];
      }
      // Add in passed argument mappings
      for (var i = 0; i < passed_args.length; i++) {
        temp_env[closure_args[i]] = passed_args[i];
      }
      // Evaluate function in new env
      return mEval(closure_body, temp_env);

    case 'let':
      // Create a new env with an extra mapping
      var key = args[0];
      var val = mEval(args[1], env);
      var new_env = env;
      new_env[key] = val;
      return mEval(args[2], new_env);

    case 'if':
      var vals = evalArgs(args, env);
      if (typeof vals[0] !== "boolean") {
        throw new TypeError("Conditional is not boolean");
      }
      if (vals[0])
        return vals[1];
      else
        return vals[2];

    // eq, neq ops
    case '=':
    case '!=':
      var vals = evalArgs(args, env);
      return ops[tag].apply(undefined, vals);

    // Boolean ops
    case 'and':
    case 'or':
      var vals = evalArgs(args, env);
      if (typeof vals[0] === "boolean" && typeof vals[1] === "boolean") {
        return ops[tag].apply(undefined, vals);
      } else {
        throw new TypeError("Arguments are not boolean");
      }

    // Number ops
    case '+': case '-': case '*': case '/':
    case '%': case '<': case '>':
      var vals = evalArgs(args, env);
      if (typeof vals[0] === "number" && typeof vals[1] === "number") {
        return ops[tag].apply(undefined, vals);
      } else {
        throw new TypeError("Arguments are not numbers");
      }

    // Something different
    default:
      throw new Error("should never reach here");
  }
}

ops = {
  '+': function(x, y) { return x+y; },
  '-': function(x, y) { return x-y; },
  '*': function(x, y) { return x*y; },
  '/': function(x, y) {
    if (y === 0) {
      throw new Error("DIVIDE BY ZERO! THE WORLD MIGHT HAVE EXPLODED.");
    } else {
      return x/y;
    }
  },
  '%': function(x, y) {
    if (y === 0) {
      throw new Error("MODULO BY ZERO! THE WORLD MIGHT HAVE EXPLODED.");
    } else {
      return x%y;
    }
  },
  '<': function(x, y) { return x<y; },
  '>': function(x, y) { return x>y; },
  '=': function(x, y) { return x===y; },
  '!=': function(x, y) { return x!==y; },
  'and': function(x, y) { return x && y; },
  'or': function(x, y) { return x || y; }
};