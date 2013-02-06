var fsm = (function() {
  var self = null;
  var delegate = null;
  var container = null;
  var stateCounter = 0;
  
  var connectionClicked = function(connection) {
    delegate.fsm().removeTransition(connection.sourceId, connection.getOverlay("label").getLabel(), connection.targetId);
    jsPlumb.detach(connection);
  };
  
  var domReadyInit = function() {
    jsPlumb.Defaults.Container = $('#machineGraph');
    self.setGraphContainer($('#machineGraph'));
    
    jsPlumb.importDefaults({
      Anchors: ["Continuous", "Continuous"],
      ConnectorZIndex: 5,
      Endpoint: ["Dot", {radius:2}],
      HoverPaintStyle: {strokeStyle:"#42a62c", lineWidth:2},
      ConnectionOverlays: [
        ["Arrow", {
          location: 1,
          length: 14,
          foldback: 0.8
          }],
        ["Label", {location:0.5}]
      ],
      Connector: ["StateMachine", {curviness:20}],
      PaintStyle: {strokeStyle:'#00a', lineWidth:2}
    });
    
    jsPlumb.bind("click", connectionClicked);
    
    // Setup handling 'enter' in test string box
    $('#testString').keyup(function(event) {if (event.which === 13) {$('#testBtn').trigger('click');}});
    
    // Setup handling the 'delete' divs on states
    container.on('mouseover', 'div.state', function(event) {
      $(this).find('div.delete').show();
    }).on('mouseout', 'div.state', function(event) {
      $(this).find('div.delete').hide();
    });
    container.on('click', 'div.delete', function(event) {
      self.removeState($(this).closest('div.state'));
    });
    
    // Setup handling for accept state changes
    container.on('change', 'input[type="checkbox"].isAccept', function(event) {
      var cBox = $(this);
      var stateId = cBox.closest('div.state').attr('id');
      if (cBox.prop('checked')) {
        delegate.fsm().addAcceptState(stateId);
      } else {
        delegate.fsm().removeAcceptState(stateId);
      }
    });
    
    // Setup the Automaton type listeners:
    $('button.delegate').on('click', function() {
      var newDelegate = null;
      switch ($(this).html()) {
        case 'DFA': newDelegate = dfa_delegate; break;
        case 'NFA': newDelegate = nfa_delegate; break;
        case 'PDA': newDelegate = pda_delegate; break;
      }
      if (newDelegate !== delegate) {
        self.setDelegate(newDelegate);
        $('button.delegate').prop('disabled', false);
        $(this).prop('disabled', true);
      }
    });
  };
  
  var makeStartState = function() {
    var startState = makeState('start');
    startState.find('div.delete').remove(); // Can't delete start state
    container.append(startState);
    makeStatePlumbing(startState);
  };
  
  var makeState = function(stateId) {
    return $('<div id="' + stateId + '" class="state"></div>')
      .append('<input id="' + stateId+'_isAccept' + '" type="checkbox" class="isAccept" value="true" title="Accept State" />')
      .append(stateId)
      .append('<div class="plumbSource" title="Drag from here to create new transition">&nbsp;</div>')
      .append('<div class="delete" style="display:none;" title="Delete"><img class="delete" src="images/empty.png" /></div>');
  };
  
  var makeStatePlumbing = function(state) {
    var source = state.find('.plumbSource');
    jsPlumb.makeSource(source, {
      parent: state,
      maxConnections: 5,
      onMaxConnections:function(info, e) {
        alert("Maximum connections (" + info.maxConnections + ") reached");
      },
    });

    jsPlumb.makeTarget(state, {
      dropOptions: {hoverClass:'dragHover'}
    });
  };
  
  return {
    init: function() {
      self = this;
      $(domReadyInit);
      $(function(){self.setDelegate(dfa_delegate)}); // Default to DFA
      return self;
    },
    
    setDelegate: function(newDelegate) {
      delegate = newDelegate;
      delegate.reset().fsm().setStartState('start');
      jsPlumb.unbind("jsPlumbConnection");
      jsPlumb.bind("jsPlumbConnection", delegate.connectionAdded);
      jsPlumb.detachAllConnections($('.state'));
      $('#machineGraph').html('');
      makeStartState();
      return self;
    },
    
    setGraphContainer: function(newContainer) {
      container = newContainer;
      return self;
    },
    
    addState: function() {
      // Add state to UI
      var state = makeState('s' + stateCounter++);
      container.append(state);
      jsPlumb.draggable(state, {containment:"parent"});
      makeStatePlumbing(state);
      // Do nothing to model
      return self;
    },
    
    removeState: function(state) {
      var stateId = state.attr('id');
      jsPlumb.select({source:stateId}).detach(); // Remove all connections from UI
      jsPlumb.select({target:stateId}).detach();
      state.remove(); // Remove state from UI
      delegate.fsm().removeTransitions(stateId); // Remove all transitions from model touching this state
      delegate.fsm().removeAcceptState(stateId); // Assure no trace is left
      return self;
    },
    
    test: function(input) {
      if ($.type(input) === 'string') {
        $('#testResult').html('Testing...')
        var accepts = delegate.fsm().accepts(input);
        $('#testResult').html(accepts ? 'Accepted' : 'Rejected').effect('highlight', {color: accepts ? '#bfb' : '#fbb'}, 1000);
      } else {
        $('#resultConsole').html('');
        var makePendingEntry = function(input, type) {
            return $('<div></div>', {'class':'pending', title:'Pending'}).append(type + ': ' + (input === '' ? '[Empty String]' : input)).appendTo('#resultConsole');
        };
        var updateEntry = function(result, entry) {
          entry.removeClass('pending').addClass(result).attr('title', result).append(' -- ' + result);
        };
        $.each(input.accept, function(index, string) {
          updateEntry((delegate.fsm().accepts(string) ? 'Pass' : 'Fail'), makePendingEntry(string, 'Accept'));
        });
        $.each(input.reject, function(index, string) {
          updateEntry((delegate.fsm().accepts(string) ? 'Fail' : 'Pass'), makePendingEntry(string, 'Reject'));
        });
        $('#bulkResultHeader').effect('highlight', {color: '#add'}, 1000);
      }
      return self;
    },
    
    debug: function(input) {
      if ($('#stopBtn').prop('disabled')) {
        $('#testResult').html('&nbsp;');
        $('#stopBtn').prop('disabled', false);
        $('#loadBtn, #testBtn, #bulkTestBtn, #testString').prop('disabled', true);
        delegate.debugStart();
        delegate.fsm().stepInit(input);
      } else {
        delegate.fsm().step();
      }
      delegate.updateUI();
      var status = delegate.fsm().status();
      if (status.status !== 'Active') {
        $('#testResult').html(status.status === 'Accept' ? 'Accepted' : 'Rejected').effect('highlight', {color: status.status === 'Accept' ? '#bfb' : '#fbb'}, 1000);
        $('#debugBtn').prop('disabled', true);
      }
      return self;
    },
    
    debugStop: function() {
      $('#stopBtn').prop('disabled', true);
      $('#loadBtn, #testBtn, #bulkTestBtn, #debugBtn, #testString').prop('disabled', false);
      $('.current').removeClass('current');
      delegate.debugStop();
      return self;
    },
    
    load: function() {
      
    },
    
    save: function() {
      
    }
  };
})().init();
