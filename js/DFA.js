function DFA(useDefaults) {
  "use strict";
  this.transitions = {};
  this.startState = useDefaults ? 'start' : null;
  this.acceptStates = useDefaults ? ['accept'] : [];
  
  this.processor = {
    input: null,
    inputLength: 0,
    state: null,
    inputIndex: 0,
    status: null,
  };
}

$(function() { // wrap in a function so we can declare "use strict" once
  "use strict";

DFA.prototype.transition = function(state, character) {
  var retVal = (this.transitions[state]) ? this.transitions[state][character] : null;
  return !retVal ? null : retVal;
};

DFA.prototype.deserialize = function(json) {
  this.transitions = json.transitions;
  this.startState = json.startState;
  this.acceptStates = json.acceptStates;
  return this;
};
DFA.prototype.serialize = function() {
  return {transitions:this.transitions, startState:this.startState, acceptStates:this.acceptStates};
};

DFA.prototype.loadFromString = function(JSONdescription) {
  var parsedJSON = JSON.parse(JSONdescription);
  return this.deserialize(parsedJSON);
};
DFA.prototype.saveToString = function() {
  return JSON.stringify(this.serialize());
};


DFA.prototype.addTransition = function(stateA, character, stateB) {
  if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
  this.transitions[stateA][character] = stateB;
  return this;
};

DFA.prototype.hasTransition = function(state, character) {
  if (this.transitions[state]) {return !!this.transitions[state][character];}
  return false;
};

// Removes all transitions to/from the state
DFA.prototype.removeTransitions = function(state) {
  delete this.transitions[state];
  var self = this;
  $.each(self.transitions, function(stateA, sTrans) {
    $.each(sTrans, function(char, stateB) {
      if (stateB === state) {self.removeTransition(stateA, char);}
    });
  });
  return this;
};

DFA.prototype.removeTransition = function(stateA, character) {
  if (this.transitions[stateA]) {delete this.transitions[stateA][character];}
  return this;
};

DFA.prototype.setStartState = function(state) {
  this.startState = state;
  return this;
};

DFA.prototype.addAcceptState = function(state) {
  this.acceptStates.push(state);
  return this;
};
DFA.prototype.removeAcceptState = function(state) {
  var stateI = -1;
  if ((stateI = this.acceptStates.indexOf(state)) >= 0) {
    this.acceptStates.splice(stateI, 1);
  }
  return this;
};

DFA.prototype.accepts = function(input) {
  var _status = this.stepInit(input);
  while (_status === 'Active') {_status = this.step();}
  return _status === 'Accept';
};

DFA.prototype.status = function() {
  return {
    state: this.processor.state, 
    input: this.processor.input,
    inputIndex: this.processor.inputIndex,
    nextChar: this.processor.input.substr(this.processor.inputIndex, 1),
    status: this.processor.status
  };
};

DFA.prototype.stepInit = function(input) {
  this.processor.input = input;
  this.processor.inputLength = this.processor.input.length;
  this.processor.inputIndex = 0;
  this.processor.state = this.startState;
  this.processor.status = (this.processor.inputLength === 0 && this.acceptStates.indexOf(this.processor.state) >= 0) ? 'Accept' : 'Active';
  return this.processor.status;
};
DFA.prototype.step = function() {
  if ((this.processor.state = this.transition(this.processor.state, this.processor.input.substr(this.processor.inputIndex++, 1))) === null) {this.processor.status = 'Reject';}
  if (this.processor.inputIndex === this.processor.inputLength) {this.processor.status = (this.acceptStates.indexOf(this.processor.state) >= 0 ? 'Accept' : 'Reject');}
  return this.processor.status;
};

DFA.runTests = function() {
  function assert(outcome, description) {window.console && console.log((outcome ? 'Pass:' : 'FAIL:'),  description);}

  var myDFA = new DFA(true)
    .addTransition('start', 'a', 's1')
    .addTransition('s1', 'a', 's2')
    .addTransition('s1', 'c', 'end2')
    .addTransition('s2', 'b', 'accept')
    .addAcceptState('end2');

  assert(myDFA.accepts('aab'), 'Accept aab');
  assert(myDFA.accepts('ac'), 'Accept ac');
  assert(!myDFA.accepts(''), 'Reject [emptyString]');
  assert(!myDFA.accepts('a'), 'Reject a');
  assert(!myDFA.accepts('aa'), 'Reject aa');
  assert(!myDFA.accepts('ab'), 'Reject ab');

  console.log('Remove transition');
  myDFA.removeTransition('s1', 'c');
  assert(!myDFA.accepts('ac'), 'Reject ac');

  console.log('Change start state');
  myDFA.setStartState('s1');
  assert(myDFA.accepts('ab'), 'Accept ab');
  assert(!myDFA.accepts('aab'), 'Reject aab');

  console.log('Remove accept state');
  myDFA.removeAcceptState('accept');
  assert(!myDFA.accepts('ab'), 'Reject ab');
  
  var myDFA_asString = myDFA.saveToString();
  var otherDFA = new DFA().loadFromString(myDFA_asString);
  assert(myDFA_asString === otherDFA.saveToString(), 'Save, Load, Save has no changes');
  assert(!otherDFA.accepts('ab'), 'Loaded DFA rejects ab');
  assert(!otherDFA.accepts(''), 'Loaded DFA rejects [empty string]');
  assert(!otherDFA.accepts('a'), 'Loaded DFA rejects a');
  
  myDFA = new DFA(true)
    .addTransition('start', 'a', 's1')
    .addTransition('s1', 'b', 's2')
    .addTransition('s2', 'c', 'start')
    .addTransition('s1', 'd', 'accept');
  assert(myDFA.accepts('ad'), 'Accept ad');
  console.log('Remove transitions to/from s1');
  myDFA.removeTransitions('s1');
  assert(!myDFA.accepts('ad'), 'Reject ad');
  myDFA.addTransition('s1', 'e', 'accept');
  // s1 should be gone, so we shouldn't be able to pass through it
  // This test is to check if it really got removed from all inbound transitions
  assert(!myDFA.accepts('ae'), 'Reject ae');
}

});
