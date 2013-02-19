var pda_delegate = (function() {
  var self = null;
  var pda = null;
  var container = null;
  var emptyLabel = '[empty]';
  
  var statusConnectors = [];
  
  var makeConnectionLabel = function(inputChar, popChar, pushChar) {
    return (inputChar || emptyLabel) + ',' + (popChar || emptyLabel) + ',' + (pushChar || emptyLabel);
  };
  
  var updateUIForDebug = function() {
    var status = pda.status();
    
    $('.current').removeClass('current');
    $.each(statusConnectors, function(index, connection) {
      connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
    });
    
    if (status.status === 'Active') {
      $.each(status.stateStackPairs, function(index, ssp) {
        var curState = $('#' + ssp.state).addClass('current');
        var sspLabelParts = makeConnectionLabel(status.nextChar, ssp.stack[0], '').split(',');
        jsPlumb.select({source:ssp.state}).each(function(connection) {
          var connLabelParts = connection.getLabel().split(','); // Don't care about the pushChar here
          if (connLabelParts[0] === sspLabelParts[0] && connLabelParts[1] === sspLabelParts[1]) {
            statusConnectors.push(connection);
            connection.setPaintStyle({strokeStyle:'#0a0'});
          }
        });
      });
    }
    return self;
  };

  return {
    init: function() {
      self = this;
      pda = new PDA();
      return self;
    },
    
    setContainer: function(newContainer) {
      container = newContainer;
      return self;
    },
    
    fsm: function() {
      return pda;
    },
    
    connectionAdded: function(info) {
      // TODO: Better UI
      var chars = prompt('Transition characters (format: input,pop,push):', 'A,B,C');
      var inputChar=null, popChar=null, pushChar = null;
      if (chars !== null) {
        chars = chars.split(',');
        if (chars.length === 3) {
          inputChar = chars[0];
          popChar = chars[1];
          pushChar = chars[2];
        }
      }
      
      // either they'll all be null or they'll all be non-null, so only need to test one
      if (inputChar === null || pda.hasTransition(info.sourceId, inputChar, popChar, pushChar, info.targetId)) {
        jsPlumb.detach(info.connection);
        if (inputChar !== null) {
          alert(info.sourceId + " already has a transition to " + info.targetId + " on " + 
            makeConnectionLabel(inputChar, popChar, pushChar));
        }
        return;
      } 
      info.connection.setLabel(makeConnectionLabel(inputChar, popChar, pushChar));
      pda.addTransition(info.sourceId, inputChar, popChar, pushChar, info.targetId);
    },
    
    updateUI: updateUIForDebug,
    
    reset: function() {
      pda = new PDA();
      return self;
    },
    
    debugStart: function() {
      return self;
    },
    
    debugStop: function() {
      $('.current').removeClass('current');
      return self;
    },
    
    serialize: function() {
      // Convert dfa into common serialized format
      var model = {};
      model.type = 'PDA';
      model.pda = pda.serialize();
      model.states = {};
      model.transitions = [];
      $.each(model.pda.transitions, function(stateA, inputCharBase) {
        model.states[stateA] = {};
        $.each(inputCharBase, function(inputChar, popCharBase) {
          $.each(popCharBase, function(popChar, stateStackPairs) {
            $.each(stateStackPairs, function(idx, ssp) {
              model.states[ssp.state] = {};
              model.transitions.push({stateA:stateA, label:makeConnectionLabel(inputChar, popChar, ssp.stackPushChar), stateB:ssp.state});
            });
          });
        });
      });
      $.each(model.pda.acceptStates, function(index, state) {
        model.states[state].isAccept = true;
      });
      return model;
    },
    
    deserialize: function(model) {
      pda.deserialize(model.pda);
    }
  };
}()).init();
