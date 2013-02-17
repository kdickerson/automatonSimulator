function PDA(useDefaults) {
  this.transitions = {}; // state -> inputChar -> stackPopChar -> stateStackPushCharPairs {state:'', stackPushChar:''}
  this.startState = useDefaults ? 'start' : null;
  this.acceptStates = useDefaults ? ['accept'] : [];
  
  this.processor = {
    input: null,
    inputIndex: 0,
    inputLength: 0,
    stateStackPairs: [],
    status: null,
  };
}

PDA.prototype.transition = function(state, inputChar, stack) {
  var newStateStackPairs = [];
  var tmp = (this.transitions[state]) ? this.transitions[state][inputChar] : null;
  if (tmp) {
    // Handle transitions that don't pop the stack
    if (tmp['']) {
      $.each(tmp[''], function(index, stateStackPair) {
        var newStack = stack.slice();
        newStack.push(stateStackPair.stackPushChar);
        newStateStackPairs.push({state:stateStackPair.state, stack:newStack});
      });
    }
    
    // Handle transitions that pop the stack
    var newStackBase = stack.slice();
    var stackHead = newStackBase.pop();
    if (tmp[stackHead]) {
      $.each(tmp[stackHead], function(index, stateStackPair) {
        var newStack = newStackBase.slice();
        newStack.push(stateStackPair.stackPushChar);
        newStateStackPairs.push({state:stateStackPair.state, stack:newStack});
      });
    }
  }
  return newStateStackPairs;
};

PDA.prototype.deserialize = function(json) {
  this.transitions = json.transitions;
  this.startState = json.startState;
  this.acceptStates = json.acceptStates;
  return this;
};
PDA.prototype.serialize = function() {
  return {transitions:this.transitions, startState:this.startState, acceptStates:this.acceptStates};
};


PDA.prototype.loadFromString = function(JSONdescription) {
  var parsedJSON = JSON.parse(JSONdescription);
  return this.deserialize(parsedJSON);
};
PDA.prototype.saveToString = function() {
  return JSON.stringify(this.serialize());
};

PDA.prototype.addTransition = function(stateA, character, stackPopChar, stackPushChar, stateB) {
  if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
  if (!this.transitions[stateA][character]) {this.transitions[stateA][character] = {};}
  if (!this.transitions[stateA][character][stackPopChar]) {this.transitions[stateA][character][stackPopChar] = [];}
  this.transitions[stateA][character][stackPopChar].push({state:stateB, stackPushChar:stackPushChar});
  return this;
};

PDA.prototype.hasTransition = function(stateA, character, stackPopChar, stackPushChar, stateB) {
  if (this.transitions[stateA] &&
      this.transitions[stateA][character] &&
      this.transitions[stateA][character][stackPopChar]) {
    var match = false;
    $.each(this.transitions[stateA][character][stackPopChar], function(index, stateStackPair) {
      if (stateStackPair.state === stateB && stateStackPair.stackPushChar === stackPushChar) {
        match = true; return false; // return false breaks the iteration
      }
    });
    return match;
  }
  return false;
};

// Removes all transitions to/from the state
PDA.prototype.removeTransitions = function(state) {
  delete this.transitions[state];
  var self = this;
  $.each(self.transitions, function(stateA, inputCharBase) {
    $.each(inputCharBase, function(inputChar, stackPopBase) {
      $.each(stackPopBase, function(stackPopChar, stateStackPairs) {
        var matchPushChar = null;
        $.each(this.transitions[stateA][character][stackPopChar], function(index, stateStackPair) {
          if (stateStackPair.state === state) {
            matchPushChar = stateStackPair.stackPushChar; return false; // return false breaks the iteration
          }
        });
        if (matchPushChar) {
          self.removeTransition(stateA, inputChar, stackPopChar, matchPushChar, state)
        }
      });
    });
  });
  return this;
};

PDA.prototype.removeTransition = function(stateA, inputChar, stackPopChar, stackPushChar, stateB) {
  if (this.hasTransition(stateA, inputChar, stackPopChar, stackPushChar, stateB)) {
    var stateStackIndex = null;
    $.each(this.transitions[stateA][character][stackPopChar], function(index, stateStackPair) {
      if (stateStackPair.state === stateB && stateStackPair.stackPushChar === stackPushChar) {
        stateStackIndex = index; return false; // return false breaks the iteration
      }
    });
    this.transitions[stateA][character][stackPopChar].splice(stateStackIndex, 1);
  }
  return this;
};

PDA.prototype.setStartState = function(state) {
  this.startState = state;
  return this;
};

PDA.prototype.addAcceptState = function(state) {
  this.acceptStates.push(state);
  return this;
};
PDA.prototype.removeAcceptState = function(state) {
  var stateI = -1;
  if ((stateI = this.acceptStates.indexOf(state)) >= 0) {
    this.acceptStates.splice(stateI, 1);
  }
  return this;
};

PDA.prototype.accepts = function(input) {
  var _status = this.stepInit(input);
  while (_status === 'Active') {_status = this.step();}
  return _status === 'Accept';
};

PDA.prototype.status = function() {
  return {
    stateStackPairs: this.processor.stateStackPairs,
    input: this.processor.input,
    inputIndex: this.processor.inputIndex,
    nextChar: this.processor.input.substr(this.processor.inputIndex, 1),
    status: this.processor.status
  };
};

PDA.prototype.stepInit = function(input) {
  this.processor.input = input;
  this.processor.inputLength = this.processor.input.length;
  this.processor.inputIndex = 0;
  this.processor.stateStackPairs = [{state:this.startState, stack:[]}];
  this.processor.status = 'Active';
  this.followEpsilonInputTransitions();
  return this.updateStatus();
};


// TODO: !!!!!!   From here down need to be converted from NFA to PDA
PDA.prototype.step = function() {
  var newStateStackPairs = [];
  var char = this.processor.input.substr(this.processor.inputIndex, 1);
  var state = null;
  while (state = this.processor.states.shift()) {
    var tranStates = this.transition(state, char);
    if (tranStates) {$.each(tranStates, function(index, tranState) {
        if (newStates.indexOf(tranState) === -1) {newStates.push(tranState);}
    });}
  };
  this.processor.inputIndex++;
  this.processor.states = newStates;
  this.followEpsilonTransitions();
  return this.updateStatus();
};
PDA.prototype.followEpsilonInputTransitions = function() {
  var self = this;
  var changed = true;
  while (changed) {
    changed = false;
    $.each(self.processor.states, function(index, state) {
      var newStates = self.transition(state, '');
      if (newStates) {$.each(newStates, function(sIndex, newState) {
          var match = false;
          $.each(self.processor.states, function(oIndex, checkState) {
            if (checkState === newState) {
              match = true;
              return false; // break the iteration
            }
          });
          if (!match) {
            changed = true;
            self.processor.states.push(newState);
          }
      });}
    });
  }
};
PDA.prototype.updateStatus = function() {
  var self = this;
  if (self.processor.states.length === 0) {
    self.processor.status = 'Reject';
  }
  if (self.processor.inputIndex === self.processor.inputLength) {
   $.each(self.processor.states, function(index, state) {
      if (self.acceptStates.indexOf(state) >= 0) {
        self.processor.status = 'Accept';
        return false; // break the iteration
      }
    });
  }
  return self.processor.status;
};

PDA.runTests = function() {
  function assert(outcome, description) {window.console && console.log((outcome ? 'Pass:' : 'FAIL:'),  description);}

  var myPDA = new PDA(true)
    .addTransition('start', 'a', 's1')
    .addTransition('s1', 'a', 's2')
    .addTransition('s1', 'c', 'end2')
    .addTransition('s2', 'b', 'accept')
    .addAcceptState('end2');
  
  // Same tests as DFA, should respond identically
  assert(myPDA.accepts('aab'), 'Accept aab');
  assert(myPDA.accepts('ac'), 'Accept ac');
  assert(!myPDA.accepts(''), 'Reject [emptyString]');
  assert(!myPDA.accepts('a'), 'Reject a');
  assert(!myPDA.accepts('aa'), 'Reject aa');
  assert(!myPDA.accepts('ab'), 'Reject ab');

  console.log('Remove transition');
  myPDA.removeTransition('s1', 'c', 'end2');
  assert(!myPDA.accepts('ac'), 'Reject ac');

  console.log('Change start state');
  myPDA.setStartState('s1');
  assert(myPDA.accepts('ab'), 'Accept ab');
  assert(!myPDA.accepts('aab'), 'Reject aab');

  console.log('Remove accept state');
  myPDA.removeAcceptState('accept');
  assert(!myPDA.accepts('ab'), 'Reject ab');
  
  var myPDA_asString = myPDA.saveToString();
  var otherDFA = new PDA().loadFromString(myPDA_asString);
  assert(myPDA_asString === otherDFA.saveToString(), 'Save, Load, Save has no changes');
  assert(!otherDFA.accepts('ab'), 'Loaded DFA rejects ab');
  assert(!otherDFA.accepts(''), 'Loaded DFA rejects [empty string]');
  assert(!otherDFA.accepts('a'), 'Loaded DFA rejects a');
  
  myPDA = new PDA(true)
    .addTransition('start', 'a', 's1')
    .addTransition('s1', 'b', 's2')
    .addTransition('s2', 'c', 'start')
    .addTransition('s1', 'd', 'accept');
  assert(myPDA.accepts('ad'), 'Accept ad');
  console.log('Remove transitions to/from s1');
  myPDA.removeTransitions('s1');
  assert(!myPDA.accepts('ad'), 'Reject ad');
  myPDA.addTransition('s1', 'e', 'accept');
  assert(!myPDA.accepts('ae'), 'Reject ae');
  
  // Tests for NFA
  myPDA = new PDA(true)
    .addTransition('start', '', 'accept')
  assert(myPDA.accepts(''), 'Accept [empty string] through epsilon');
  
  myPDA.removeTransition('start', '', 'accept')
    .addTransition('start', '', 'b1')
    .addTransition('start', '', 'a1')
    .addTransition('a1', 'a', 'accept')
    .addTransition('b1', 'b', 'accept')
  assert(myPDA.accepts('a'), 'Accept a through epsilon');
  assert(myPDA.accepts('b'), 'Accept b through epsilon');
  assert(!myPDA.accepts(''), 'Reject [empty string]');
  assert(!myPDA.accepts('bbbb'), 'Reject bbbb');
  
  myPDA.addTransition('b1', '', 'b2')
    .addTransition('b2', '', 'b3')
    .addTransition('b3', 'b', 'b3')
    .addTransition('b3', 'b', 'accept')
  assert(myPDA.accepts('b'), 'Accept b through epsilon');
  assert(myPDA.accepts('bbbb'), 'Accept bbbb through multiple epsilons');
  assert(!myPDA.accepts('aa'), 'Reject aa');
  
  // Tests specifically for PDA
}
