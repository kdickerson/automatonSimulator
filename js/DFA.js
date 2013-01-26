function DFA(useDefaults) {
  this.transitions = {};
  this.startState = useDefaults ? 'start' : null;
  this.endStates = useDefaults ? ['end'] : null;
  
  this.processor = {
    currentInput: null,
    currentState: null,
    inputIndex: 0,
    status: null,
  };
}

DFA.prototype.transition = function(state, character) {
  var retVal = (this.transitions[state]) ? this.transitions[state][character] : null;
  return !retVal ? null : retVal;
};

DFA.prototype.loadFromString = function(JSONdescription) {
  var parsedJSON = JSON.parse(JSONdescription);
  this.transitions = parsedJSON.transitions;
  this.startState = parsedJSON.startState;
  this.endStates = parsedJSON.endStates;
  return this;
};
DFA.prototype.saveToString = function() {
  return JSON.stringify({transitions:this.transitions, startState:this.startState, endStates:this.endStates});
};

DFA.prototype.addTransition = function(stateA, character, stateB) {
  if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
  this.transitions[stateA][character] = stateB;
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

DFA.prototype.addEndState = function(state) {
  this.endStates.push(state);
  return this;
};
DFA.prototype.removeEndState = function(state) {
  var stateI = -1;
  if ((stateI = this.endStates.indexOf(state)) >= 0) {
    this.endStates.splice(stateI, 1);
  }
  return this;
};

DFA.prototype.accepts = function(input) {
  this.stepInit(input);
  var _status;
  while ((_status = this.step()) !== 'Reject' && _status !== 'Accept') {}
  return _status === 'Accept';
};

DFA.prototype.status = function() {
  return {state:this.processor.currentState, inputIndex:this.processor.inputIndex, nextChar:this.processor.currentInput.substr(this.processor.inputIndex, 1), status:this.processor.status};
};

DFA.prototype.stepInit = function(input) {
  this.processor.currentInput = input;
  this.processor.inputIndex = 0;
  this.processor.currentState = this.startState;
  this.processor.status = 'Active';
  return this.processor.status;
};
DFA.prototype.step = function() {
  if (this.processor.inputIndex === this.processor.currentInput.length) {this.processor.status = (this.endStates.indexOf(this.processor.currentState) >= 0 ? 'Accept' : 'Reject');}
  else if ((this.processor.currentState = this.transition(this.processor.currentState, this.processor.currentInput.substr(this.processor.inputIndex++, 1))) === null) {this.processor.status = 'Reject';}
  return this.processor.status;
};

DFA.runTests = function() {
  function assert(outcome, description) {window.console && console.log((outcome ? 'Pass:' : 'FAIL:'),  description);}

  var myDFA = new DFA(true)
    .addTransition('start', 'a', 's1')
    .addTransition('s1', 'a', 's2')
    .addTransition('s1', 'c', 'end2')
    .addTransition('s2', 'b', 'end')
    .addEndState('end2');

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

  console.log('Remove end state');
  myDFA.removeEndState('end');
  assert(!myDFA.accepts('ab'), 'Reject ab');
  
  var myDFA_asString = myDFA.saveToString();
  var otherDFA = new DFA().loadFromString(myDFA_asString);
  assert(myDFA_asString === otherDFA.saveToString(), 'Save, Load, Save has no changes');
  assert(!otherDFA.accepts('ab'), 'Loaded DFA rejects ab');
  assert(!otherDFA.accepts(''), 'Loaded DFA rejects [empty string]');
  assert(!otherDFA.accepts('a'), 'Loaded DFA rejects a');
}
