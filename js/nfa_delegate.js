var nfa_delegate = (function() {
  var self = null;
  var nfa = null;
  var container = null;
  var dialogDiv = null;
  var dialogActiveConnection = null;
  var emptyLabel = 'ϵ';
  
  var statusConnectors = [];
  
  var updateUIForDebug = function() {
    var status = nfa.status();
    
    $('.current').removeClass('current');
    $.each(statusConnectors, function(index, connection) {
      connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
    });
    
    var comparisonChar = status.nextChar === '' ? emptyLabel : status.nextChar;
    $.each(status.states, function(index, state) {
      var curState = $('#' + state).addClass('current');
      jsPlumb.select({source:state}).each(function(connection) {
        if (connection.getLabel() === comparisonChar) {
          statusConnectors.push(connection);
          connection.setPaintStyle({strokeStyle:'#0a0'});
        }
      });
    });
    return self;
  };

  var dialogSave = function(update) {
    var inputChar = $('#nfa_dialog_readCharTxt').val();
    if (inputChar.length > 1) {inputChar = inputChar[0];}
    
    if (update) {
      nfa.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
    } else if (nfa.hasTransition(dialogActiveConnection.sourceId, inputChar, dialogActiveConnection.targetId)) {
      alert(dialogActiveConnection.sourceId + " already has a transition to " + dialogActiveConnection.targetId + " on " + (inputChar || emptyLabel));
      return;
    }
    
    dialogActiveConnection.setLabel(inputChar || emptyLabel);
    nfa.addTransition(dialogActiveConnection.sourceId, inputChar, dialogActiveConnection.targetId);
    dialogDiv.dialog("close");
  };

  var dialogCancel = function(update) {
    if (!update) {fsm.removeConnection(dialogActiveConnection);}
    dialogDiv.dialog("close");
  };
  
  var dialogDelete = function() {
    nfa.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
    fsm.removeConnection(dialogActiveConnection);
    dialogDiv.dialog("close");
  };
  
  var dialogClose = function() {
    dialogActiveConnection = null;
  };

  var makeDialog = function() {
    dialogDiv = $('<div></div>', {style:'text-align:center;'});
    $('<div></div>', {style:'font-size:small;'}).html('Blank for Empty String: '+emptyLabel+'<br />Read from Input').appendTo(dialogDiv);
    $('<span></span>', {id:'nfa_dialog_stateA', 'class':'tranStart'}).appendTo(dialogDiv);
    $('<input />', {id:'nfa_dialog_readCharTxt', type:'text', maxlength:1, style:'width:30px;text-align:center;'})
      .val('A')
      .keypress(function(event) {
        if (event.which === $.ui.keyCode.ENTER) {dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(-1).click();}
      })
      .appendTo(dialogDiv);
    $('<span></span>', {id:'nfa_dialog_stateB', 'class':'tranEnd'}).appendTo(dialogDiv);
    $('body').append(dialogDiv);
    
    dialogDiv.dialog({
      dialogClass: "no-close",
      autoOpen: false,
      title: 'Set Transition Character',
      height: 220,
      width: 350,
      modal: true,
      open: function() {dialogDiv.find('input').focus().select();}
    });
  };

  return {
    init: function() {
      self = this;
      nfa = new NFA();
      makeDialog();
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
      dialogActiveConnection = info.connection;
      $('#nfa_dialog_stateA').html(dialogActiveConnection.sourceId + '&nbsp;');
      $('#nfa_dialog_stateB').html('&nbsp;' + dialogActiveConnection.targetId);
      
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function(){dialogCancel(false);},
        Save: function(){dialogSave(false);}
      }).dialog("open");
    },
    
    connectionClicked: function(connection) {
      dialogActiveConnection = connection;
      $('#nfa_dialog_readCharTxt').val(dialogActiveConnection.getLabel());
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function(){dialogCancel(true);},
        Delete: dialogDelete,
        Save: function(){dialogSave(true);}
      }).dialog("open");
    },
    
    updateUI: updateUIForDebug,
    
    getEmptyLabel: function() {return emptyLabel;},
    
    reset: function() {
      nfa = new NFA();
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
      model.type = 'NFA';
      model.nfa = nfa.serialize();
      model.states = {};
      model.transitions = [];
      $.each(model.nfa.transitions, function(stateA, transition) {
        model.states[stateA] = {};
        $.each(transition, function(character, states) {
          $.each(states, function(index, stateB) {
            model.states[stateB] = {};
            model.transitions.push({stateA:stateA, label:(character || emptyLabel), stateB:stateB});
          });
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
