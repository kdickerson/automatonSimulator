var nfa_delegate = (function() {
  var self = null;
  var nfa = null;
  var container = null;
  var dialogDiv = null;
  var dialogActiveInfo = null;
  var emptyLabel = 'ϵ';
  
  var statusConnectors = [];
  
  var updateUIForDebug = function() {
    var status = nfa.status();
    
    $('.current').removeClass('current');
    $.each(statusConnectors, function(index, connection) {
      connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
    });
    
    if (status.status === 'Active') {
      $.each(status.states, function(index, state) {
        var curState = $('#' + state).addClass('current');
        jsPlumb.select({source:state}).each(function(connection) {
          if (connection.getLabel() === status.nextChar) {
            statusConnectors.push(connection);
            connection.setPaintStyle({strokeStyle:'#0a0'});
          }
        });
      });
    }
    return self;
  };

  var dialogSave = function() {
    var inputChar = $('#nfa_dialog_readCharTxt').val();
    if (inputChar.length > 1) {inputChar = inputChar[0];}
    if (nfa.hasTransition(dialogActiveInfo.sourceId, inputChar, dialogActiveInfo.targetId)) {
      alert(dialogActiveInfo.sourceId + " already has a transition to " + dialogActiveInfo.targetId + " on " + (inputChar || emptyLabel));
      return;
    }
    dialogActiveInfo.connection.setLabel(inputChar || emptyLabel);
    nfa.addTransition(dialogActiveInfo.sourceId, inputChar, dialogActiveInfo.targetId);  
    dialogActiveInfo = null;
    dialogDiv.dialog("close");
  };

  var dialogCancel = function() {
    dialogDiv.dialog("close");
  };
  
  var dialogClose = function() {
    if (dialogActiveInfo) {
      jsPlumb.detach(dialogActiveInfo.connection);
      dialogActiveInfo = null;
    }
  };

  var makeDialog = function() {
    dialogDiv = $('<div></div>', {style:'text-align:center;'});
    $('<div></div>', {style:'font-size:small;'}).html('Blank for Empty String: '+emptyLabel+'<br />Read from Input').appendTo(dialogDiv);
    $('<span></span>', {id:'nfa_dialog_stateA', 'class':'tranStart'}).appendTo(dialogDiv);
    $('<input />', {id:'nfa_dialog_readCharTxt', type:'text', maxlength:1, style:'width:30px;text-align:center;'})
      .val('A')
      .keypress(function(event) {
        if (event.which === $.ui.keyCode.ENTER) {dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(1).click();}
      })
      .appendTo(dialogDiv);
    $('<span></span>', {id:'nfa_dialog_stateB', 'class':'tranEnd'}).appendTo(dialogDiv);
    $('body').append(dialogDiv);
    
    dialogDiv.dialog({
      autoOpen: false,
      title: 'Set Transition Character',
      height: 220,
      width: 310,
      modal: true,
      buttons: {
        Cancel: dialogCancel,
        Save: dialogSave
      },
      close: dialogClose
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
      dialogActiveInfo = info;
      $('#nfa_dialog_stateA').html(dialogActiveInfo.sourceId + '&nbsp;');
      $('#nfa_dialog_stateB').html('&nbsp;' + dialogActiveInfo.targetId);
      dialogDiv.dialog("open");
    },
    
    connectionClicked: function(connection) {
      nfa.removeTransition(connection.sourceId, connection.getLabel(), connection.targetId);
      jsPlumb.detach(connection);
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
