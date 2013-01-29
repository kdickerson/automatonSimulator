var dfa_ui = (function() {
  var self = null;
  var dfa = null;
  var container = null;
  var stateCounter = 0;
  
  var domReadyInit = function() {
    jsPlumb.Defaults.Container = $('#machineGraph');
    dfa_ui.setGraphContainer($('#machineGraph'));
    
    jsPlumb.importDefaults({
      ConnectorZIndex: 5,
      Endpoint : ["Dot", {radius:2}],
      HoverPaintStyle : {strokeStyle:"#42a62c", lineWidth:2},
      ConnectionOverlays : [
        ["Arrow", {
          location: 1,
          id: "arrow",
          length: 14,
          foldback: 0.8
          }],
        ["Label", {label:"FOO", id:"label"}]
      ]
    });
    
    jsPlumb.bind("click", jsPlumb.detach); // Delete connections on click
     
    // When a new connection is made do this:
    jsPlumb.bind("connection", function(info) {
      info.connection.setPaintStyle({strokeStyle:"#0a0"});
      info.connection.getOverlay("label").setLabel(info.connection.id);
    });
    
    // Setup the Start Fake-State
    makeStatePlumbing($('#startCloud'));
  };
  
  var makeStatePlumbing = function(state) {
    var source = state.find('.plumbSource');
    jsPlumb.makeSource(source, {
      parent: state,
      anchor: "Continuous",
      connector: ["StateMachine", {curviness:20}],
      connectorStyle: {strokeStyle:"#00a", lineWidth:2},
      maxConnections: 5,
      onMaxConnections:function(info, e) {
        alert("Maximum connections (" + info.maxConnections + ") reached");
      }
    });

    jsPlumb.makeTarget(state, {
      dropOptions: {hoverClass: "dragHover"},
      anchor: "Continuous"	
    });
  };
  
  return {
    init: function() {
      self = this;
      $(domReadyInit);
      return self;
    },
    
    setDFA: function(newDFA) {
      dfa = newDFA;
      return self;
    },
    
    setGraphContainer: function(newContainer) {
      container = newContainer;
      return self;
    },
    
    addState: function() {
      // Add state to UI
      var stateId = 's' + stateCounter++;
      var state = $('<div id="' + stateId + '" class="state">' + stateId + '<div class="plumbSource">&nbsp;</div></div>');
      
      container.append(state);
      jsPlumb.draggable(state, {containment:"parent"});
      makeStatePlumbing(state);
      // Do nothing to model
      return self;
    },
    
    removeState: function(state) {
      // Remove state from UI
      // Remove all transitions from model touching this state
      return self;
    },
    
    addTransition: function(state1, character, state2) {
      // Add transition to UI
      // Add transition to model
      return self;
    },
    
    removeTransition: function(state, character) {
      // Remove transition from UI
      // Remove transition from model
      return self;
    }
  };
})().init();

