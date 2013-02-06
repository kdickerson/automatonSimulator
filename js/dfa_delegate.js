var dfa_delegate = (function() {
  var self = null;
  var dfa = null;

  var updateStatusUI = function(status, curState) {
    var doneSpan = $('<span id="consumedInput"></span>').html(status.input.substring(0, status.inputIndex));
    var curSpan = $('<span id="currentInput"></span>').html(status.input.substr(status.inputIndex, 1));
    var futureSpan = $('<span id="futureInput"></span>').html(status.input.substring(status.inputIndex+1));
    
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
    var curState = $('#' + status.state).addClass('current');
    updateStatusUI(status, curState);
  };

  return {
    init: function() {
      self = this;
      dfa = new DFA();
      return self;
    },
    
    fsm: function() {
      return dfa;
    },
    
    connectionAdded: function(info) {
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
      info.connection.setPaintStyle({strokeStyle:"#0a0"});
      info.connection.getOverlay("label").setLabel(inputChar);
      dfa.addTransition(info.sourceId, inputChar, info.targetId);
    },
    
    updateUI: updateUIForDebug,
    
    reset: function() {
      dfa = new DFA();
      return self;
    },
    
    debugStart: function() {
      $('<div id="dfaStatus"></div>').appendTo('#machineGraph');
    },
    
    debugStop: function() {
      $('#dfaStatus').remove();
    }
  };
}()).init();
