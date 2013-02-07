var dfa_delegate = (function() {
  var self = null;
  var dfa = null;
  var container = null;
  
  var statusConnector = null;

  var updateStatusUI = function(status, curState) {
    var doneSpan = $('<span class="consumedInput"></span>').html(status.input.substring(0, status.inputIndex));
    var curSpan = $('<span class="currentInput"></span>').html(status.input.substr(status.inputIndex, 1));
    var futureSpan = $('<span class="futureInput"></span>').html(status.input.substring(status.inputIndex+1));
    
    if (curState.length > 0) {
      $('#dfaStatus').css('left', curState.position().left + 4 + 'px')
        .css('top', curState.position().top - 25 + 'px')
        .html('').append(doneSpan).append(curSpan).append(futureSpan);
        
      if ($('#dfaStatus').position().top < 0) { // Flip to bottom
        $('#dfaStatus').css('top', $('#dfaStatus').position().top + curState.outerHeight() + 29 + 'px');
      }
      var overscan = $('#dfaStatus').position().left + $('#dfaStatus').outerWidth() + 4 - $('#machineGraph').innerWidth();
      if (overscan > 0) { // Push inward
        $('#dfaStatus').css('left', $('#dfaStatus').position().left - overscan + 'px');
      }
    };
  };
  
  var updateUIForDebug = function() {
    var status = dfa.status();
    
    $('.current').removeClass('current');
    if (statusConnector) {statusConnector.setPaintStyle(jsPlumb.Defaults.PaintStyle);}
    
    if (status.status === 'Active') {
      var curState = $('#' + status.state).addClass('current');
      jsPlumb.select({source:status.state}).each(function(connection) {
        if (connection.getLabel() === status.nextChar) {
          statusConnector = connection;
          connection.setPaintStyle({strokeStyle:'#0a0'});
        }
      });
      updateStatusUI(status, curState);
    }
    return self;
  };

  return {
    init: function() {
      self = this;
      dfa = new DFA();
      return self;
    },
    
    setContainer: function(newContainer) {
      container = newContainer;
      return self;
    },
    
    fsm: function() {
      return dfa;
    },
    
    connectionAdded: function(info) {
      // TODO: Better UI
      var inputChar = prompt('Read what input character on transition?', 'A');
      inputChar = (inputChar && inputChar.length > 0) ? inputChar[0] : inputChar;
      if (!inputChar || dfa.hasTransition(info.sourceId, inputChar)) {
        jsPlumb.detach(info.connection);
        if (inputChar && inputChar.length === 0) {
          alert("Deterministic Finite Automaton cannot have empty string transition.");
        } else if (inputChar) {
          alert(info.sourceId + " already has a transition for " + inputChar);
        }
        return;
      } 
      info.connection.setLabel(inputChar);
      dfa.addTransition(info.sourceId, inputChar, info.targetId);
    },
    
    updateUI: updateUIForDebug,
    
    reset: function() {
      dfa = new DFA();
      return self;
    },
    
    debugStart: function() {
      $('<div id="dfaStatus" class="fsmStatus"></div>').appendTo(container);
      return self;
    },
    
    debugStop: function() {
      $('#dfaStatus').remove();
      return self;
    },
    
    serialize: function() {
      // Convert dfa into common serialized format
      var model = {};
      model.type = 'DFA';
      model.dfa = dfa.serialize();
      model.states = {};
      model.transitions = [];
      $.each(model.dfa.transitions, function(stateA, transition) {
        model.states[stateA] = {};
        $.each(transition, function(character, stateB) {
          model.states[stateB] = {};
          model.transitions.push({stateA:stateA, label:character, stateB:stateB});
        });
      });
      $.each(model.dfa.acceptStates, function(index, state) {
        model.states[state].isAccept = true;
      });
      return model;
    },
    
    deserialize: function(model) {
      dfa.deserialize(model.dfa);
    }
  };
}()).init();
