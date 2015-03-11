// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------

// Recursively creates a new Clause with fresh variable names (X -> X')
makeFreshClause = function(clause) {
  if (clause.args) {
    var argsCopy = [];
    for (var i = 0; i < clause.args.length; i++) {
      if (clause.args[i] instanceof Var) {
        argsCopy.push(new Var(clause.args[i].name + "'"));
      } else {
        argsCopy.push(makeFreshClause(clause.args[i]));
      }
    }
    return new Clause(clause.name, argsCopy);
  } else {
    return new Clause(clause.name);
  }
}

Rule.prototype.makeCopyWithFreshVarNames = function() {
  var headCopy, bodyCopy = [];
  headCopy = makeFreshClause(this.head);
  for (var i = 0; i < this.body.length; i++) {
    bodyCopy.push(makeFreshClause(this.body[i]));
  }
  return new Rule(headCopy, bodyCopy);
};

Clause.prototype.rewrite = function(subst) {
  if (this.args) {
    var argsCopy = [];
    for (var i = 0; i < this.args.length; i++) {
      argsCopy.push(this.args[i].rewrite(subst));
    }
    return new Clause(this.name, argsCopy);
  } else {
    return new Clause(this.name);
  }
};

Var.prototype.rewrite = function(subst) {
  if (subst.lookup(this.name)) {
    return subst.lookup(this.name);
  } else {
    return new Var(this.name);
  }
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

Subst.prototype.unify = function(term1, term2) {
  throw new TODO("Subst.prototype.unify not implemented");
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

Program.prototype.solve = function() {
  throw new TODO("Program.prototype.solve not implemented");
};

