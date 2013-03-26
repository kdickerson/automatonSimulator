function NFA(useDefaults) {
  "use strict";
  this.transitions = {};
  this.startState = useDefaults ? 'start' : null;
  this.acceptStates = useDefaults ? ['accept'] : [];
  
  this.processor = {
    input: null,
    inputIndex: 0,
    inputLength: 0,
    states: [],
    status: null,
    nextStep: null
  };
}

$(function() { // wrap in a function so we can declare "use strict" once
  "use strict";

NFA.prototype.transition = function(state, character) {
  var retVal = (this.transitions[state]) ? this.transitions[state][character] : null;
  return !retVal ? null : retVal;
};

NFA.prototype.deserialize = function(json) {
  this.transitions = json.transitions;
  this.startState = json.startState;
  this.acceptStates = json.acceptStates;
  return this;
};
NFA.prototype.serialize = function() {
  return {transitions:this.transitions, startState:this.startState, acceptStates:this.acceptStates};
};


NFA.prototype.loadFromString = function(JSONdescription) {
  var parsedJSON = JSON.parse(JSONdescription);
  return this.deserialize(parsedJSON);
};
NFA.prototype.saveToString = function() {
  return JSON.stringify(this.serialize());
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
  var nextChar = null;
  if (this.processor.status === 'Active') {
    if (this.processor.nextStep === 'input' && this.processor.input.length > this.processor.inputIndex) {
      nextChar = this.processor.input.substr(this.processor.inputIndex, 1);
    } else if (this.processor.nextStep === 'epsilons') {
      nextChar = '';
    }
  }
  return {
    states: this.processor.states,
    input: this.processor.input,
    inputIndex: this.processor.inputIndex,
    nextChar: nextChar,
    status: this.processor.status
  };
};

NFA.prototype.stepInit = function(input) {
  this.processor.input = input;
  this.processor.inputLength = this.processor.input.length;
  this.processor.inputIndex = 0;
  this.processor.states = [this.startState];
  this.processor.status = 'Active';
  this.processor.nextStep = 'epsilons';
  return this.updateStatus();
};
NFA.prototype.step = function() {
  switch (this.processor.nextStep) {
    case 'epsilons':
      this.followEpsilonTransitions();
      this.processor.nextStep = 'input';
      break;
    case 'input':
      var newStates = [];
      var char = this.processor.input.substr(this.processor.inputIndex, 1);
      var state = null;
      while (state = this.processor.states.shift()) {
        var tranStates = this.transition(state, char);
        if (tranStates) {$.each(tranStates, function(index, tranState) {
            if (newStates.indexOf(tranState) === -1) {newStates.push(tranState);}
        });}
      };
      ++this.processor.inputIndex;
      this.processor.states = newStates;
      this.processor.nextStep = 'epsilons';
      break;
  }
  return this.updateStatus();
};
NFA.prototype.followEpsilonTransitions = function() {
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
NFA.prototype.updateStatus = function() {
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
  var otherNFA = new NFA().loadFromString(myNFA_asString);
  assert(myNFA_asString === otherNFA.saveToString(), 'Save, Load, Save has no changes');
  assert(!otherNFA.accepts('ab'), 'Loaded DFA rejects ab');
  assert(!otherNFA.accepts(''), 'Loaded DFA rejects [empty string]');
  assert(!otherNFA.accepts('a'), 'Loaded DFA rejects a');
  
  myNFA = new NFA(true)
    .addTransition('start', 'a', 's1')
    .addTransition('s1', 'b', 's2')
    .addTransition('s2', 'c', 'start')
    .addTransition('s1', 'd', 'accept');
  assert(myNFA.accepts('ad'), 'Accept ad');
  console.log('Remove transitions to/from s1');
  myNFA.removeTransitions('s1');
  assert(!myNFA.accepts('ad'), 'Reject ad');
  myNFA.addTransition('s1', 'e', 'accept');
  // s1 should be gone, so we shouldn't be able to pass through it
  // This test is to check if it really got removed from all inbound transitions
  assert(!myNFA.accepts('ae'), 'Reject ae');
  
  // Tests specifically for NFA
  console.log('Tests for NFA');
  myNFA = new NFA(true)
    .addTransition('start', '', 'accept');
  assert(myNFA.accepts(''), 'Accept [empty string] through epsilon');
  
  myNFA.removeTransition('start', '', 'accept')
    .addTransition('start', '', 'b1')
    .addTransition('start', '', 'a1')
    .addTransition('a1', 'a', 'accept')
    .addTransition('b1', 'b', 'accept');
  assert(myNFA.accepts('a'), 'Accept a through epsilon');
  assert(myNFA.accepts('b'), 'Accept b through epsilon');
  assert(!myNFA.accepts(''), 'Reject [empty string]');
  assert(!myNFA.accepts('bbbb'), 'Reject bbbb');
  
  myNFA.addTransition('b1', '', 'b2')
    .addTransition('b2', '', 'b3')
    .addTransition('b3', 'b', 'b3')
    .addTransition('b3', 'b', 'accept');
  assert(myNFA.accepts('b'), 'Accept b through epsilon');
  assert(myNFA.accepts('bbbb'), 'Accept bbbb through multiple epsilons');
  assert(!myNFA.accepts('aa'), 'Reject aa');
}

});
