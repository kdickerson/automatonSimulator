var nfa_delegate = (function() {
  var self = null;
  var nfa = null;
  var container = null;
  var emptyLabel = '[empty]';
  
  var statusConnectors = [];

  var updateStatusUI = function(status, curState) {
    // TODO: Test for existing box
    //  If found, add to it, and reposition
    //  Position based on actual height, not just magic 25px value
    //    Backport that change to DFA code
    
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
    $.each(statusConnectors, function(index, connection) {
      connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
    });
    
    if (status.status === 'Active') {
      $.each(status.stateIndexPairs, function(index, pair) {
        var curState = $('#' + pair.state).addClass('current');
        jsPlumb.select({source:pair.state}).each(function(connection) {
          if (connection.getLabel() === status.input.substr(pair.index, 1)) {
            statusConnectors.push(connection);
            connection.setPaintStyle({strokeStyle:'#0a0'});
          }
        });
        updateStatusUI(status, curState);
      });
    }
    return self;
  };

  return {
    init: function() {
      self = this;
      nfa = new NFA();
      return self;
    },
    
    setContainer: function(newContainer) {
      container = newContainer;
      return self;
    },
    
    fsm: function() {
      return nfa;
    },
    
    connectionAdded: function(info) {
      // TODO: Better UI
      var inputChar = prompt('Read what input character on transition?', 'A');
      inputChar = (inputChar && inputChar.length > 0) ? inputChar[0] : inputChar;
      if (inputChar === null || nfa.hasTransition(info.sourceId, inputChar, info.targetId)) {
        jsPlumb.detach(info.connection);
        if (inputChar) {
          alert(info.sourceId + " already has a transition for " + inputChar);
        }
        return;
      } 
      info.connection.setLabel(inputChar || emptyLabel);
      nfa.addTransition(info.sourceId, inputChar, info.targetId);
    },
    
    updateUI: updateUIForDebug,
    
    reset: function() {
      nfa = new NFA();
      return self;
    },
    
    debugStart: function() {
      return self;
    },
    
    debugStop: function() {
      $('.fsmStatus').remove();
      return self;
    },
    
    serialize: function() {
      // Convert dfa into common serialized format
      var model = {};
      model.type = 'NFA';
      model.nfa = nfa.serialize();
      model.states = {};
      model.transitions = [];
      $.each(model.dfa.transitions, function(stateA, transition) {
        model.states[stateA] = {};
        $.each(transition, function(character, stateB) {
          model.states[stateB] = {};
          model.transitions.push({stateA:stateA, label:(character || emptyLabel), stateB:stateB});
        });
      });
      $.each(model.nfa.acceptStates, function(index, state) {
        model.states[state].isAccept = true;
      });
      return model;
    },
    
    deserialize: function(model) {
      nfa.deserialize(model.nfa);
    }
  };
}()).init();
