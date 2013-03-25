var pda_delegate = (function() {
  var self = null;
  var pda = null;
  var container = null;
  var dialogDiv = null;
  var dialogActiveConnection = null;
  var emptyLabel = 'ϵ';
  
  var statusConnectors = [];
  
  var makeConnectionLabel = function(inputChar, popChar, pushChar) {
    return (inputChar || emptyLabel) + ',' + (popChar || emptyLabel) + ',' + (pushChar || emptyLabel);
  };
  
  var decodeConnectionLabel = function(label) {
    var pieces = label.split(',');
    if (pieces.length !== 3) {return null;}
    var decoded = {inputChar:pieces[0], popChar:pieces[1], pushChar:pieces[2]};
    if (decoded.inputChar === emptyLabel) {decoded.inputChar = '';}
    if (decoded.popChar === emptyLabel) {decoded.popChar = '';}
    if (decoded.pushChar === emptyLabel) {decoded.pushChar = '';}
    return decoded;
  };
  
  var addStackDataAndGetStackBox = function(stackStatePair) {
    var stackSpan = $('<span class="futureInput stackBody"></span>').html(stackStatePair.stack.slice(0,-1).join(''));
    var headSpan = $('<span class="currentInput"></span>').html(stackStatePair.stack[stackStatePair.stack.length-1]);
    var stackBoxId = stackStatePair.state + '_stackBox';
    var stackBox = $('#' + stackBoxId);
    if (stackBox.length === 0) {
      var stackBox = $('<div></div>', {id:stackBoxId, 'class':'fsmStatus'}).appendTo(container);
    }
    $('<div></div>', {style:'margin-bottom:1px'}).append(stackSpan).append(headSpan).appendTo(stackBox);
    return stackBox;
  };

  var updateStacksUI = function(curStateEl, stateStackPair) {
    var stackBox = addStackDataAndGetStackBox(stateStackPair);
    
    stackBox.css('left', curStateEl.position().left + 4 + 'px')
      .css('top', curStateEl.position().top - stackBox.outerHeight() - 3 + 'px');
      
    if (stackBox.position().top < 0) { // Flip to bottom
      stackBox.css('top', curStateEl.position().top + curStateEl.outerHeight() + 3 + 'px');
    }
    var overscan = stackBox.position().left + stackBox.outerWidth() + 4 - container.innerWidth();
    if (overscan > 0) { // Push inward
      stackBox.css('left', stackBox.position().left - overscan + 'px');
    }
  };
  
  var updateUIForDebug = function() {
    var status = pda.status();
    
    // Cleanup previous UI data
    $('.current').removeClass('current');
    container.find('.fsmStatus').remove();
    $.each(statusConnectors, function(index, connection) {
      connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
    });
    
    $.each(status.stateStackPairs, function(index, ssp) {
      var curState = $('#' + ssp.state).addClass('current');
      updateStacksUI(curState, ssp);
      
      // Highlight transitions that will be traversed next
      var sspLabelParts = makeConnectionLabel(status.nextChar, ssp.stack[ssp.stack.length-1], '').split(',');
      jsPlumb.select({source:ssp.state}).each(function(connection) {
        var connLabelParts = connection.getLabel().split(',');
        // Don't care about the pushChar here
        if (connLabelParts[0] === sspLabelParts[0] && 
              (connLabelParts[1] === sspLabelParts[1] || connLabelParts[1] === emptyLabel)) {
          statusConnectors.push(connection);
          connection.setPaintStyle({strokeStyle:'#0a0'});
        }
      });
    });
    return self;
  };

  var dialogSave = function(update) {
    var inputChar = $('#pda_dialog_readCharTxt').val();
    var popChar = $('#pda_dialog_popCharTxt').val();
    var pushChar = $('#pda_dialog_pushCharTxt').val();
    if (inputChar.length > 1) {inputChar = inputChar[0];}
    if (popChar.length > 1) {popChar = popChar[0];}
    if (pushChar.length > 1) {pushChar = pushChar[0];}
    
    if (update) {
      var labelPieces = decodeConnectionLabel(dialogActiveConnection.getLabel());
      pda.removeTransition(dialogActiveConnection.sourceId, labelPieces.inputChar, labelPieces.popChar, labelPieces.pushChar, dialogActiveConnection.targetId);
    } else if (pda.hasTransition(dialogActiveConnection.sourceId, inputChar, popChar, pushChar, dialogActiveConnection.targetId)) {
      alert(info.sourceId + " already has a transition to " + info.targetId + " on " + 
            makeConnectionLabel(inputChar, popChar, pushChar));
      return;
    }
    dialogActiveConnection.setLabel(makeConnectionLabel(inputChar, popChar, pushChar));
    pda.addTransition(dialogActiveConnection.sourceId, inputChar, popChar, pushChar, dialogActiveConnection.targetId);
    dialogDiv.dialog("close");
  };

  var dialogCancel = function(update) {
    if (!update) {fsm.removeConnection(dialogActiveConnection);}
    dialogDiv.dialog("close");
  };
  
  var dialogDelete = function() {
    var labelPieces = decodeConnectionLabel(dialogActiveConnection.getLabel());
    pda.removeTransition(dialogActiveConnection.sourceId, labelPieces.inputChar, labelPieces.popChar, labelPieces.pushChar, dialogActiveConnection.targetId);
    fsm.removeConnection(dialogActiveConnection);
    dialogDiv.dialog("close");
  };
  
  var dialogClose = function() {
    dialogActiveConnection = null;
  };

  var makeDialog = function() {
    dialogDiv = $('<div></div>', {style:'text-align:center;'});
    $('<div></div>', {style:'font-size:small;'})
      .html('Blank for Empty String: '+emptyLabel+'<br />Read from Input | Pop off Stack | Push on Stack')
      .appendTo(dialogDiv);
    $('<span></span>', {id:'pda_dialog_stateA', 'class':'tranStart'}).appendTo(dialogDiv);
    $('<input />', {id:'pda_dialog_readCharTxt', type:'text', maxlength:1, style:'width:30px;text-align:center;', title:'Read from Input'}).val('A').appendTo(dialogDiv);
    $('<input />', {id:'pda_dialog_popCharTxt', type:'text', maxlength:1, style:'width:30px;text-align:center;', title:'Pop from Stack'}).val('').appendTo(dialogDiv);
    $('<input />', {id:'pda_dialog_pushCharTxt', type:'text', maxlength:1, style:'width:30px;text-align:center;', title:'Push to Stack'}).val('').appendTo(dialogDiv);
    dialogDiv.find('input').keypress(function(event) {
      if (event.which === $.ui.keyCode.ENTER) {dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(-1).click();}
    });
    $('<span></span>', {id:'pda_dialog_stateB', 'class':'tranEnd'}).appendTo(dialogDiv);
    $('body').append(dialogDiv);
    
    dialogDiv.dialog({
      dialogClass: "no-close",
      autoOpen: false,
      title: 'Set Transition Characters',
      height: 220,
      width: 350,
      modal: true,
      open: function() {dialogDiv.find('input').eq(0).focus().select();}
    });
  };


  return {
    init: function() {
      self = this;
      pda = new PDA();
      makeDialog();
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
      dialogActiveConnection = info.connection;
      $('#pda_dialog_stateA').html(dialogActiveConnection.sourceId + '&nbsp;');
      $('#pda_dialog_stateB').html('&nbsp;' + dialogActiveConnection.targetId);
      
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function(){dialogCancel(false);},
        Save: function(){dialogSave(false);}
      }).dialog("open");
    },
    
    connectionClicked: function(connection) {
      dialogActiveConnection = connection;
      
      var labelPieces = decodeConnectionLabel(dialogActiveConnection.getLabel());
      $('#pda_dialog_readCharTxt').val(labelPieces.inputChar);
      $('#pda_dialog_popCharTxt').val(labelPieces.popChar);
      $('#pda_dialog_pushCharTxt').val(labelPieces.pushChar);
      
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function(){dialogCancel(true);},
        Delete: dialogDelete,
        Save: function(){dialogSave(true);}
      }).dialog("open");
    },
    
    updateUI: updateUIForDebug,
    
    getEmptyLabel: function() {return emptyLabel;},
    
    reset: function() {
      pda = new PDA();
      return self;
    },
    
    debugStart: function() {
      return self;
    },
    
    debugStop: function() {
      $('.current').removeClass('current');
      container.find('.fsmStatus').remove();
      $.each(statusConnectors, function(index, connection) {
        connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
      });
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
