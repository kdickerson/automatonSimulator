function NFA(useDefaults) {
  this.transitions = {};
  this.startState = useDefaults ? 'start' : null;
  this.acceptStates = useDefaults ? ['accept'] : [];
  
  this.processor = {
    input: null,
    inputLength: 0,
    stateIndexPairs: [],
    status: null,
  };
}

NFA.prototype.transition = function(state, character) {
  var retVal = (this.transitions[state]) ? this.transitions[state][character] : null;
  return !retVal ? null : retVal;
};

NFA.prototype.loadFromString = function(JSONdescription) {
  var parsedJSON = JSON.parse(JSONdescription);
  this.transitions = parsedJSON.transitions;
  this.startState = parsedJSON.startState;
  this.acceptStates = parsedJSON.acceptStates;
  return this;
};
NFA.prototype.saveToString = function() {
  return JSON.stringify({transitions:this.transitions, startState:this.startState, acceptStates:this.acceptStates});
};

NFA.prototype.addTransition = function(stateA, character, stateB) {
  if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
  if (!this.transitions[stateA][character]) {this.transitions[stateA][character] = [];}
  this.transitions[stateA][character].push(stateB);
  return this;
};

NFA.prototype.hasTransition = function(stateA, character, stateB) {
  if (this.transitions[stateA] && this.transitions[stateA][character]) {
    return this.transitions[stateA][character].indexOf(stateB) >= 0;
  }
  return false;
};

// Removes all transitions to/from the state
NFA.prototype.removeTransitions = function(state) {
  delete this.transitions[state];
  var self = this;
  $.each(self.transitions, function(stateA, sTrans) {
    $.each(sTrans, function(char, states) {
      if (states.indexOf(state) >= 0) {
        self.removeTransition(stateA, char, state);
      }
    });
  });
  return this;
};

NFA.prototype.removeTransition = function(stateA, character, stateB) {
  if (this.hasTransition(stateA, character, stateB)) {
    this.transitions[stateA][character].splice(this.transitions[stateA][character].indexOf(stateB), 1);
  }
  return this;
};

NFA.prototype.setStartState = function(state) {
  this.startState = state;
  return this;
};

NFA.prototype.addAcceptState = function(state) {
  this.acceptStates.push(state);
  return this;
};
NFA.prototype.removeAcceptState = function(state) {
  var stateI = -1;
  if ((stateI = this.acceptStates.indexOf(state)) >= 0) {
    this.acceptStates.splice(stateI, 1);
  }
  return this;
};

NFA.prototype.accepts = function(input) {
  var _status = this.stepInit(input);
  while (_status === 'Active') {_status = this.step();}
  return _status === 'Accept';
};

NFA.prototype.status = function() {
  return {
    stateIndexPairs: this.processor.stateIndexPairs, 
    input: this.processor.input,
    status: this.processor.status
  };
};

NFA.prototype.stepInit = function(input) {
  this.processor.input = input;
  this.processor.inputLength = this.processor.input.length;
  this.processor.stateIndexPairs = [{state:this.startState, index:0}];
  this.processor.status = 'Active';
  this.followEpsilonTransitions();
  return this.updateStatus();
};
NFA.prototype.step = function() {
  var newStateIndexPairs = [];
  var pair = null;
  while (pair = this.processor.stateIndexPairs.shift()) {
    var newStates = this.transition(pair.state, this.processor.input.substr(pair.index, 1));
    if (newStates) {
      $.each(newStates, function(index, state) {
        newStateIndexPairs.push({state:state, index:pair.index+1});
      });
    }
  };
  this.processor.stateIndexPairs = newStateIndexPairs;
  this.followEpsilonTransitions();
  return this.updateStatus();
};
NFA.prototype.followEpsilonTransitions = function() {
  var self = this;
  var changed = true;
  while (changed) {
    changed = false;
    $.each(self.processor.stateIndexPairs, function(index, pair) {
      var newStates = self.transition(pair.state, '');
      if (newStates) {
        $.each(newStates, function(sIndex, newState) {
          var match = false;
          $.each(self.processor.stateIndexPairs, function(oIndex, checkPair) {
            if (checkPair.state === newState && checkPair.index === pair.index) {
              match = true;
              return false; // break the iteration
            }
          });
          if (!match) {
            changed = true;
            self.processor.stateIndexPairs.push({state:newState, index:pair.index});
          }
        });
      }
    });
  };
};
NFA.prototype.updateStatus = function() {
  var self = this;
  if (self.processor.stateIndexPairs.length === 0) {
    self.processor.status = 'Reject';
  }
  $.each(self.processor.stateIndexPairs, function(index, pair) {
    if (pair.index === self.processor.inputLength && self.acceptStates.indexOf(pair.state) >= 0) {
      self.processor.status = 'Accept';
      return false; // break the iteration
    }
  })
  return self.processor.status;
};

NFA.runTests = function() {
  function assert(outcome, description) {window.console && console.log((outcome ? 'Pass:' : 'FAIL:'),  description);}

  var myNFA = new NFA(true)
    .addTransition('start', 'a', 's1')
    .addTransition('s1', 'a', 's2')
    .addTransition('s1', 'c', 'end2')
    .addTransition('s2', 'b', 'accept')
    .addAcceptState('end2');
  
  // Same tests as DFA, should respond identically
  assert(myNFA.accepts('aab'), 'Accept aab');
  assert(myNFA.accepts('ac'), 'Accept ac');
  assert(!myNFA.accepts(''), 'Reject [emptyString]');
  assert(!myNFA.accepts('a'), 'Reject a');
  assert(!myNFA.accepts('aa'), 'Reject aa');
  assert(!myNFA.accepts('ab'), 'Reject ab');

  console.log('Remove transition');
  myNFA.removeTransition('s1', 'c', 'end2');
  assert(!myNFA.accepts('ac'), 'Reject ac');

  console.log('Change start state');
  myNFA.setStartState('s1');
  assert(myNFA.accepts('ab'), 'Accept ab');
  assert(!myNFA.accepts('aab'), 'Reject aab');

  console.log('Remove accept state');
  myNFA.removeAcceptState('accept');
  assert(!myNFA.accepts('ab'), 'Reject ab');
  
  var myNFA_asString = myNFA.saveToString();
  var otherDFA = new DFA().loadFromString(myNFA_asString);
  assert(myNFA_asString === otherDFA.saveToString(), 'Save, Load, Save has no changes');
  assert(!otherDFA.accepts('ab'), 'Loaded DFA rejects ab');
  assert(!otherDFA.accepts(''), 'Loaded DFA rejects [empty string]');
  assert(!otherDFA.accepts('a'), 'Loaded DFA rejects a');
  
  myNFA = new DFA(true)
    .addTransition('start', 'a', 's1')
    .addTransition('s1', 'b', 's2')
    .addTransition('s2', 'c', 'start')
    .addTransition('s1', 'd', 'accept');
  assert(myNFA.accepts('ad'), 'Accept ad');
  console.log('Remove transitions to/from s1');
  myNFA.removeTransitions('s1');
  assert(!myNFA.accepts('ad'), 'Reject ad');
  myNFA.addTransition('s1', 'e', 'accept');
  assert(!myNFA.accepts('ae'), 'Reject ae');
  
  // Tests specifically for NFA
}
