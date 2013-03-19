var dfa_delegate = (function() {
  var self = null;
  var dfa = null;
  var container = null;
  var dialogDiv = null;
  var dialogActiveInfo = null;
  
  var statusConnector = null;

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
    }
    return self;
  };

  var dialogSave = function() {
    var inputChar = $('#dialog_readCharTxt').val();
    if (inputChar.length > 1) {inputChar = inputChar[0];}
    if (inputChar.length === 0 || dfa.hasTransition(dialogActiveInfo.sourceId, inputChar)) {
      if (inputChar.length === 0) {
        alert("Deterministic Finite Automaton cannot have empty-string transition.");
      } else {
        alert(dialogActiveInfo.sourceId + " already has a transition for " + inputChar);
      }
      return;
    }
    dialogActiveInfo.connection.setLabel(inputChar);
    dfa.addTransition(dialogActiveInfo.sourceId, inputChar, dialogActiveInfo.targetId);  
    dialogActiveInfo = null;
    dialogDiv.dialog( "close" );
  };

  var dialogCancel = function() {
    dialogDiv.dialog( "close" );
  };
  
  var dialogClose = function() {
    if (dialogActiveInfo) {
      jsPlumb.detach(dialogActiveInfo.connection);
      dialogActiveInfo = null;
    }
  };

  var makeDialog = function() {
    dialogDiv = $('<div></div>', {style:'text-align:center;'});
    $('<span></span>', {id:'dialog_stateA', 'class':'tranStart'}).appendTo(dialogDiv);
    $('<input />', {id:'dialog_readCharTxt', type:'text', maxlength:1, style:'width:30px;text-align:center;'})
      .val('A')
      .keypress(function(event) {
        console.log(event.which);
        if (event.which === $.ui.keyCode.ENTER) {
          dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(1).click();
        }
      })
      .appendTo(dialogDiv);
    $('<span></span>', {id:'dialog_stateB', 'class':'tranEnd'}).appendTo(dialogDiv);
    
    $('body').append(dialogDiv);
    
    dialogDiv.dialog({
      autoOpen: false,
      title: 'Set Transition Character',
      height: 165,
      width: 275,
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
      dfa = new DFA();
      makeDialog();
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
      dialogActiveInfo = info;
      $('#dialog_stateA').html(dialogActiveInfo.sourceId + '&nbsp;');
      $('#dialog_stateB').html('&nbsp;' + dialogActiveInfo.targetId);
      dialogDiv.dialog("open");
    },
    
    updateUI: updateUIForDebug,
    
    reset: function() {
      dfa = new DFA();
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
