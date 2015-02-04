/**
 *  Global definitions
 */
_ = {};

function when(fun) {
  return fun;
}

function many(pat) {
  return {'pat': pat};
}


/**
 * Helper functions
 */

// Matches a single pattern to a value, returns an array of bindings
function bind(value, pat, pat_index) {
  var val_index, pattern, binding, bindings = [], many_binding = [];
  if (pat === _) {
    // 'Wildcard'
    return [value];

  } else if (pat instanceof Array) {
    if (!(value instanceof Array)) {
      throw new Error('value is not an array');
    }
    // Recursively match each element of value
    for (val_index = 0; val_index < value.length; val_index++) {
      pattern = pat[pat_index];
      if (typeof pattern === 'object' && pattern.hasOwnProperty('pat')) {
        // 'Many'
        pattern = pattern.pat;
        many_binding = bind_many(value, pattern, val_index, pat_index);
        binding = many_binding[0];
        val_index = many_binding[1];
      } else {
        // Normal array pattern
        binding = bind(value[val_index], pattern, pat_index)[0];
      }
      pat_index++;
      if (binding) {
        bindings.push(binding);
      }
    }
    if ((val_index === value.length && pat_index !== pat.length) ||
        (val_index !== value.length && pat_index === pat.length)) {
      // Reached the end of one array but not the other
      throw new Error('reached end of array!');
    }

    // All good, return bindings
    return bindings;

  } else if (typeof pat === 'function') {
    // 'When'
    if (pat.call(this, value)) {
      return [value];
    }

  } else {
    // All other literals match to themselves
    if (pat === value) {
      return [];
    }
  }

  throw new Error('bind failed');
}

// Binds multiple values in a many pattern.
// Returns a 2-index array: [bindings, val_index]
// val_index is the index to continue at in caller function
function bind_many(value, pat, val_index, pat_index) {
  var binding, bindings = [];
  for (val_index; val_index < value.length; val_index++) {
    try {
      binding = bind(value[val_index], pat, pat_index);
    } catch (err) {
      // Match error means we're done with this many pattern
      break;
    }
    if (binding) {
      bindings = bindings.concat(binding);
    }
  }
  return [bindings, val_index-1];
}

// Checks arity of bindings and functions with helpful error message
function check_num_args(n1, n2) {
  if (n1 !== n2) {
    throw new Error('Argument length mismatch: got ' + n1 + ' but expected ' + n2);
  }
}


/**
 *  Match Function
 */
function match(value) {
  var args, pat, fun, i, bindings = [];
  args = Array.prototype.slice.call(arguments);
  //console.log(args);
  for (i = 1; i < args.length; i+=2) {
    pat = args[i];
    fun = args[i+1];
    // Bind the values
    try {
      bindings = bind(value, pat, 0);
      check_num_args(bindings.length, fun.length);
    } catch (err) {
      //console.log(err.message);
      continue;
    }

    // Call the function
    return fun.apply(this, bindings);
  }
  throw new Error('match failed');
}