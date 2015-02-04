// This function is used by the test harness to pretty-print values.
// Right now it doesn't handle undefined, functions, NaN, Number.POSITIVE_INFINITY, etc.
// Feel free to modify / extend it as you see fit.
// (FYI, pretty-printing is not used by our grading scripts.)

function prettyPrintValue(value) {
  return JSON.stringify(value);
}

// Helper functions used in the tests

function greaterThan(n) {
  return function(x) { return x > n; };
}

function isNumber(x) {
  return typeof x === 'number';
}

function isOne(x) {
  return x === 1;
}

// Tests!

tests(
  {
    name: 'wildcard',
    code: 'match(123,\n' +
          '  _, function(x) { return x + 2; }\n' +
          ')',
    expected: 125
  },
  {
    name: 'literal pattern',
    code: 'match(123,\n' +
          '  42,  function() { return "aaa"; },\n' +
          '  123, function() { return "bbb"; },\n' +
          '  444, function() { return "ccc"; }\n' +
          ')',
    expected: "bbb"
  },
  {
    name: 'array pattern',
    code: 'match(["+", 5, 7],\n' +
          '  ["+", _, _], function(x, y) { return x + y; }\n' +
          ')',
    expected: 12
  },
  {
    name: 'array pattern fail1',
    code: 'match(["+", 5],\n' +
          '  ["+", _, _], function(x, y) { return x + y; }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'array pattern fail2',
    code: 'match(["+", 5, 7],\n' +
          '  ["+", _], function(x, y) { return x + y; }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'many',
    code: 'match(["sum", 1, 2, 3, 4],\n' +
          '  ["sum", many(when(isNumber))], function(ns) {\n' +
          '                                   return ns.reduce(function(x, y) { return x + y; });\n' +
          '                                 }\n' +
          ')',
    expected: 10
  },
  {
    name: 'many 2',
    code: 'match([1, 2, 3, "and", 4],\n' +
          '  [many(when(isNumber)), "and", _], function(ns, n) {\n' +
          '                                   return ns.reduce(function(x, y) { return x + y; });\n' +
          '                                 }\n' +
          ')',
    expected: 6
  },
  {
    name: 'many pairs',
    code: 'match([[1, 2], [3, 4], [5, 6]],\n' +
          '  [many([_, _])], function(pts) { return JSON.stringify(pts); }\n' +
          ')',
    expected: "[1,2,3,4,5,6]"
  },
  {
    name: 'many fail1',
    code: 'match([1, 2, 3, "and", 4],\n' +
          '  [many(_), "and"], function(ns) {\n' +
          '                                   return ns.reduce(function(x, y) { return x + y; });\n' +
          '                                 }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'when',
    code: 'match(5,\n' +
          '  when(greaterThan(8)), function(x) { return x + " is greater than 8"; },\n' +
          '  when(greaterThan(2)), function(x) { return x + " is greater than 2"; }\n' +
          ')',
    expected: "5 is greater than 2"
  },
  {
    name: 'first match wins',
    code: 'match(123,\n' +
          '  _,   function(x) { return x; },\n' +
          '  123, function()  { return 4; }\n' +
          ')',
    expected: 123
  },
  {
    name: 'match failed',
    code: 'match(3,\n' +
          '  1,   function() { return 1; },\n' +
          '  2,   function() { return 2; },\n' +
          '  [3], function() { return 3; }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'argument numbers failure',
    code: 'match(3,\n' +
          '  _,   function(x, y) { return x*y; }\n' +
          ')',
    shouldThrow: true
  },
  {
    name: 'match non-array to array',
    code: 'match(3,\n' +
          '  ["+", _],   function(x) { return x; }\n' +
          ')',
    shouldThrow: true
  },

  // Piazza test cases
  {
    name: 'many_p1',
    code: 'match([1,2,3],\n' +
          '  [many(_)], function(a) { return JSON.stringify(arguments); }\n' +
          ')',
    expected: '{\"0\":[1,2,3]}'
  },
  {
    name: 'many_p2',
    code: 'match([1,2,3],\n' +
          '  [many(when(isOne)), many(_)], function(a,b) { return JSON.stringify(arguments); }\n' +
          ')',
    expected: '{\"0\":[1],\"1\":[2,3]}'
  },
  {
    name: 'many_p3',
    code: 'match([2,2,3],\n' +
          '  [many(when(isOne)), many(_)], function(a,b) { return JSON.stringify(arguments); }\n' +
          ')',
    expected: '{\"0\":[],\"1\":[2,2,3]}'
  },
  {
    name: 'many_p4',
    code: 'match([1,2,3],\n' +
          '  [many(when(isOne)),2, many(_)], function(a,b) { return JSON.stringify(arguments); }\n' +
          ')',
    expected: '{\"0\":[1],\"1\":[3]}'
  },
  {
    name: 'many_p5',
    code: 'match([[1,2],[3,4]],\n' +
          '  [many([many(_)])], function(a) { return JSON.stringify(arguments); }\n' +
          ')',
    expected: '{\"0\":[[1,2],[3,4]]}'
  }
);

