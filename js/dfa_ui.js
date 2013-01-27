var dfa_ui = (function() {
  var self = null;
  var dfa = null;
  var container = null;
  var stateCounter = 0;
  
  return {
    init: function() {
      return (self = this);
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
      var state = $('<div id="' + stateId + '" class="state">' + stateId + '</div>');
      var tsp = $('<div class="transitionStartPoint">&nbsp;</div>');
      
      container.append(state.append(tsp));
      jsPlumb.draggable(state, {containment:"parent"});
      /*jsPlumb.makeSource(tsp, {
        parent: state,	
        anchor: "Continuous",
        connector: ["StateMachine", {curviness:20}],
        connectorStyle: {strokeStyle:"#00a)", lineWidth:2},
        maxConnections: 5,
        onMaxConnections:function(info, e) {
          alert("Maximum connections (" + info.maxConnections + ") reached");
        }
      });*/

      /*jsPlumb.makeTarget(state, {
        dropOptions: {hoverClass: "dragHover"},
        anchor: "Continuous"	
      });*/
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
