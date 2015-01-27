F.evalAST = function(ast) {
  var environment = {
    keys: {},
    parent: {}
  };
  return mEval(ast, environment);
};

// Helper functions:
// Calls mEval on each element in args, and returns an array of those values
evalArgs = function(args, env) {
  var r = [];
  for (var i = 0; i < args.length; i++) {
    r.push(mEval(args[i], env));
  }
  return r;
}

// Deep copies the 'keys' hash from env to new_env
deepCopy = function(env) {
  var new_env = {
    keys: {},
    parent: {}
  };
  if (env.hasOwnProperty('keys')) {
    for (var i in env.keys) {
      new_env.keys[i] = env.keys[i];
    }
  }
  return new_env;
}

// Primary function
mEval = function(ast, env) {
  // Primitive Values
  var type = typeof ast;
  if (type === 'number' || type === 'boolean' || ast === null) {
    return ast;
  }

  var tag = ast[0];
  var args = ast.slice(1);
  switch(tag) {
    case 'closure':
      return ast;

    case 'id':
      // Variable lookup
      if (env.keys.hasOwnProperty(args[0])) {
        return env.keys[args[0]];
      } else {
        throw new ReferenceError('[id] Variable ' + args[0] + ' is undefined');
      }

    case 'set':
      if (env.hasOwnProperty('parent')) {
        // Propagate up through parents
        mEval(ast, env.parent);
      }
      if (env.hasOwnProperty('keys')) {
        if (env.keys.hasOwnProperty(args[0])) {
          var val = mEval(args[1], env);
          env.keys[args[0]] = val;
          return val;
        } else {
          throw new ReferenceError('[set] Variable ' + args[0] + ' is undefined');
        }
      }
      break;

    case 'seq':
      mEval(args[0], env);
      return mEval(args[1], env);

    case 'fun':
      return ['closure', args[0], args[1], env];

    case 'cons':
      return ['cons', mEval(args[0], env), mEval(args[1], env)];

    case 'match':
      var val = mEval(args[0], env);
      var backup = deepCopy(env);
      for (var i = 1; i < args.length; i+=2) {
        var pattern = args[i];
        var expr = args[i+1];
        type = typeof pattern;
        if (type === 'number' || type === 'boolean' || pattern === null) {
          if (val === pattern) {
            return mEval(expr, env);
          } else {
            continue;
          }
        } else if (pattern[0] === '_') {
          return mEval(expr, env);
        } else if (pattern[0] === 'id') {
          // Add new mapping to env
          env.keys[pattern[1]] = val;
          return mEval(expr, env);
        } else if (pattern[0] === 'cons') {
          // Recursively call match to bind variable names
          try {
            mEval(['match', val[1], pattern[1], 0], env);
            mEval(['match', val[2], pattern[2], 0], env);
            return mEval(expr, env);
          } catch (e) {
            if (e.message !== 'No match found') {
              throw e;
            }
            // Reset any bindings we may have added
            env = backup;
            continue;
          }
        } else {
          throw new Error('Match pattern not supported');
        }
      }
      throw new Error('No match found');

    case 'delay':
      // Do nothing
      return ast;

    case 'force':
      var val = mEval(args[0], env);
      if (val[0] !== 'delay') {
        throw new Error('Force can only be called on delayed expressions');
      }
      return mEval(val[1], env);

    case 'call':
      // Get the function's closure
      var closure = mEval(args[0], env);
      var closure_args = closure[1];
      var closure_body = closure[2];
      var closure_env  = closure[3];
      var passed_args = evalArgs(args.slice(1), env);
      // Check number of arguments
      if (passed_args.length > closure_args.length) {
        throw new Error('Too many arguments, expected ' + closure_args.length + ' but got ' + passed_args.length);
      }
      // Create a new env for evaluation
      var temp_env = deepCopy(closure_env);
      temp_env.parent = env.parent;
      // Add in passed argument mappings
      var i;
      for (i = 0; i < passed_args.length; i++) {
        temp_env.keys[closure_args[i]] = passed_args[i];
      }

      if (passed_args.length < closure_args.length) {
        // Currying
        return ['closure', closure_args.slice(i), closure_body, temp_env];
      } else {
        // Evaluate function in new env
        return mEval(closure_body, temp_env);
      }

    case 'let':
      // Create a new env with an extra mapping
      var k = args[0];
      // Add the variable into scope with empty value (for recursive let)
      env.keys[args[0]] = null;
      var v = mEval(args[1], env);
      var new_env = {
        keys: env.keys,
        parent: env
      };
      new_env.keys[k] = v;
      return mEval(args[2], new_env);

    case 'if':
      var condition = mEval(args[0], env);
      if (typeof condition !== 'boolean') {
        throw new TypeError('Conditional is not boolean');
      }
      if (condition)
        return mEval(args[1], env);
      else
        return mEval(args[2], env);

    // eq, neq ops
    case '=':
    case '!=':
      var vals = evalArgs(args, env);
      return ops[tag].apply(undefined, vals);

    // Boolean ops
    case 'and':
    case 'or':
      var vals = evalArgs(args, env);
      if (typeof vals[0] === 'boolean' && typeof vals[1] === 'boolean') {
        return ops[tag].apply(undefined, vals);
      } else {
        throw new TypeError('Arguments are not boolean');
      }

    // Number ops
    case '+': case '-': case '*': case '/':
    case '%': case '<': case '>':
      var vals = evalArgs(args, env);
      if (typeof vals[0] === 'number' && typeof vals[1] === 'number') {
        return ops[tag].apply(undefined, vals);
      } else {
        throw new TypeError('Arguments are not numbers');
      }

    // Something different
    default:
      throw new Error('should never reach here');
  }
}

ops = {
  '+': function(x, y) { return x+y; },
  '-': function(x, y) { return x-y; },
  '*': function(x, y) { return x*y; },
  '/': function(x, y) {
    if (y === 0) {
      throw new Error('DIVIDE BY ZERO! THE WORLD MIGHT HAVE EXPLODED.');
    } else {
      return x/y;
    }
  },
  '%': function(x, y) {
    if (y === 0) {
      throw new Error('MODULO BY ZERO! THE WORLD MIGHT HAVE EXPLODED.');
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