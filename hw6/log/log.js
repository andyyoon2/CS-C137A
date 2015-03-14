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
  if (value instanceof Var) {
    return new Var(value.name);
  } else if (value instanceof Clause) {
    return value.rewrite(this);
  } else {
    return new Var(this.name);
  }
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

Subst.prototype.unify = function(term1, term2) {
  var t1 = term1.rewrite(this),
      t2 = term2.rewrite(this);
  if (t1 instanceof Var || t2 instanceof Var) {
    if (t1 instanceof Var) {
      return this.bind(t1.name, t2);
    } else {
      return this.bind(t2.name, t1);
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
    return this;
  }
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

Program.prototype.solve = function() {
  // Save state info
  var root = {
    backtrack: null,
    rules: refresh(this.rules),
    goals: this.query,
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
  if (this.curr_state.rules.length === 0) {
    // No more rules to check, backtrack!
    this.curr_state = this.curr_state.backtrack;
    return this.next();
  }
  if (this.curr_state.backtrack === null) {
    // We've reached the root, start a new subst
    this.curr_state.subst = new Subst();
  }

  // Unify first goal & rule
  try {
    this.curr_state.subst = this.curr_state.subst.unify(this.curr_state.goals[0], this.curr_state.rules[0].head);
  } catch (e) {
    // Check the next rule
    this.curr_state.rules = this.curr_state.rules.slice(1);
    return this.next();
  }

  // Set a backtrack point to current state, removing first rule
  var rule = this.curr_state.rules.shift();
  this.curr_state.backtrack = {
    backtrack: this.curr_state.backtrack,
    rules: refresh(this.curr_state.rules),
    goals: this.curr_state.goals
  }

  // Remove first goal and add RHS of the removed rule to goals if necessary
  this.curr_state.goals = this.curr_state.goals.slice(1);
  if (rule.body.length > 0) {
    this.curr_state.goals.unshift(rule.body);
  }

  if (this.curr_state.goals.length === 0) {
    // All done with goals: set curr_state to backtrack and return the substitution
    var result = this.curr_state.subst;
    this.curr_state = this.curr_state.backtrack;
    return result;
  } else {
    return this.next();
  }
}

Program.prototype.nextKZ = function() {
  if (this.curr_state === null) {
    // No more possibilities
    return false;
  }

  // Unification
  this.curr_state.subst = new Subst();
  for (var i = 0; i < this.curr_state.rules.length; i++) {
    try {
      this.curr_state.subst = this.curr_state.subst.unify(this.curr_state.goals[0], this.curr_state.rules[i].head);
    } catch (e) {
      continue;
    }

    if (this.curr_state.rules[i].body.length > 0) {
      // Add clause body to goals
      this.curr_state.goals.unshift(this.curr_state.rules[i].body);
    }
    // an atom
    if (this.curr_state.goals.length > 1) {
      // Still have more goals to check, so save a backtrack point
      this.curr_state.backtrack = {
        backtrack: this.curr_state.backtrack,
        rules: refresh(this.curr_state.rules).slice(1),
        goals: this.curr_state.goals
      }
    }

    // Remove the goal we just checked
    var new_goals = this.curr_state.goals.slice(1);
    if (new_goals.length === 0) {
      // All done with goals
      /*if (i < this.curr_state.rules.length-1) {
        // Still have more rules to check, add a backtrack point
        this.curr_state.backtrack = {
          backtrack: this.curr_state.backtrack,
          rules: refresh(this.curr_state.rules.slice(1)),
          goals: this.curr_state.goals
        }
      }*/
      // Return the substitution
      var s = this.curr_state.subst;
      this.curr_state = this.curr_state.backtrack;
      return s;
    } else {
      this.curr_state.goals = new_goals;
      continue;
    }
  }
  // Out of rules
  this.curr_state = this.curr_state.backtrack;
  return this.next();

/*old
  // Unification
  this.curr_state.subst = new Subst();
  for (var i = 0; i < this.curr_state.goals.length; i++) {
    if (this.curr_state.rule_index === this.curr_state.rules.length) {
      // No more rules to check, so backtrack
      this.curr_state = this.curr_state.backtrack;
      return this.next();
    }
    try {
      this.curr_state.subst = this.curr_state.subst.unify(this.curr_state.goals[i], this.curr_state.rules[this.curr_state.rule_index].head);
      if (this.curr_state.rules[this.curr_state.rule_index].body.length > 0) {
        // Add clause body to goals
      } else {
        // an atom
        this.curr_state.rule_index++;
        //WRONG
        return this.curr_state.subst;

        // We have more goals to check, save a backtrack point
        if (i < this.curr_state.goals.length-1) {
          this.curr_state.backtrack = {
            backtrack: this.curr_state.backtrack,
            rules: this.refresh(),
            goals: this.curr_state.goals,
          }
        }
      }
    } catch (e) {
      // Check the next rule
      this.curr_state.rule_index++;
      i--;
    }
  }

  // Finished one goal
  this.curr_state.goals.shift();

  if (this.curr_state.goals.length === 0) {
    // All done with goals, return the substitution
    var s = this.curr_state.subst;
    this.curr_state = this.curr_state.backtrack;
    return s;
  }*/
}