// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------

// Recursively creates a new Clause with fresh variable names (X -> X')
makeFreshClause = function(clause) {
  if (clause.args.length > 0) {
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
  if (this.args.length > 0) {
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
  var value = subst.lookup(this.name);
  if (value) {
    if (subst.lookup(value.name)) {
      // Recursive rewrite to get to solved form
      return subst.lookup(value.name).rewrite(subst);
    }
    if (value instanceof Var) {
      return new Var(this.name);
    } else {
      return value.rewrite(subst);
    }
  }
  return this;
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

Subst.prototype.unify = function(term1, term2) {
  var t1 = term1.rewrite(this),
      t2 = term2.rewrite(this);
  if (t1 instanceof Var || t2 instanceof Var) {
    if (t1 instanceof Var) {
      this.bind(t1.name, t2);
    } else {
      this.bind(t2.name, t1);
    }
  } else {
    // both terms are Clauses
    if (t1.name !== t2.name) {
      throw new Error("unification failed");
    } else {
      if (t1.args.length > 0 && t2.args.length > 0) {
        var shorterLength = t1.args.length < t2.args.length ? t1.args.length : t2.args.length;
        for (var i = 0; i < shorterLength; i++) {
          this.unify(t1.args[i], t2.args[i]);
        }
      }
    }
  }
  // Solved form
  for (i in this.bindings) {
    this.bind(i, this.bindings[i].rewrite(this));
  }
  return this;
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

refresh = function(rules) {
  var freshRules = [];
  for (var i = 0; i < rules.length; i++) {
    freshRules.push(rules[i].makeCopyWithFreshVarNames());
  }
  return freshRules;
}

rewriteAll = function(goals, subst) {
  var rewritten = [];
  for (var i = 0; i < goals.length; i++) {
    rewritten.push(goals[i].rewrite(subst));
  }
  return rewritten;
}

Program.prototype.solve = function() {
  // Save state info
  var root = {
    backtrack: null,
    rules: refresh(this.rules),
    goals: this.query,
    rule_index: 0,
    subst: new Subst()
  };
  this.curr_state = root;
  return this;
};

Program.prototype.next = function() {
  if (this.curr_state === null) {
    // No more possibilities
    return false;
  }
  if (this.curr_state.rule_index === this.curr_state.rules.length) {
    // No more rules to check, backtrack!
    this.curr_state = this.curr_state.backtrack;
    return this.next();
  }

  // Unify first goal & rule
  var subst = this.curr_state.subst.clone();
  try {
    subst = subst.unify(this.curr_state.goals[0], this.curr_state.rules[this.curr_state.rule_index].head);
  } catch (e) {
    // Check the next rule
    this.curr_state.rule_index++;
    return this.next();
  }

  var next_goals = this.curr_state.goals.slice(1);
  if (this.curr_state.rules[this.curr_state.rule_index].body.length > 0) {
    // Replace current goal with RHS of current rule
    next_goals = this.curr_state.rules[this.curr_state.rule_index].body.concat(next_goals);
  }

  if (next_goals.length === 0) {
    // No other goals to check
    this.curr_state.rule_index++;
    if (this.curr_state.rule_index <= this.curr_state.rules.length) {
      // Still more rules to check
      return subst;
    } else {
      return this.next();
    }
  } else {
    // More goals to check: Set a backtrack point
    var backtrack = {
      backtrack: this.curr_state.backtrack,
      rules: this.curr_state.rules,
      goals: this.curr_state.goals,
      rule_index: this.curr_state.rule_index+1,
      subst: this.curr_state.subst
    }
    var next_state = {
      backtrack: backtrack,
      rules: refresh(this.curr_state.rules),
      goals: next_goals,
      rule_index: 0,
      subst: subst
    }
    this.curr_state = next_state;
    return this.next();
  }
}