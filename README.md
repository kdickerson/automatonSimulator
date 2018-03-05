# automatonSimulator
A website that simulates various finite state machines: Deterministic Finite Automata (DFA), Nondeterministic Finite Automata (NFA), Pushdown Automata (PDA).

A GUI is provided to create, save/load (browser local storage), export/import (plaintext format), and debug finite state machines.

A large set of test strings can be designated to be accepted or rejected and then all tested at once.

Or, a specific string can be step-debugged to see exactly how the finite state machine would handle it.

You can embed a machine description in a URL hash and the page will load it for you.  This allows you to provide a link that will load a specific machine.  For example: `http://[site-domain]/#[paste machine description here]`

A real-world example: [Click to load an example machine](http://automatonsimulator.com/#{%22type%22:%22DFA%22,%22dfa%22:{%22transitions%22:{%22start%22:{%22A%22:%22s0%22},%22s0%22:{%22B%22:%22s1%22},%22s1%22:{%22A%22:%22s2%22},%22s2%22:{%22B%22:%22s1%22}},%22startState%22:%22start%22,%22acceptStates%22:[%22s1%22]},%22states%22:{%22start%22:{},%22s0%22:{%22top%22:100,%22left%22:208},%22s1%22:{%22isAccept%22:true,%22top%22:210,%22left%22:231},%22s2%22:{%22top%22:286,%22left%22:70}},%22transitions%22:[{%22stateA%22:%22start%22,%22label%22:%22A%22,%22stateB%22:%22s0%22},{%22stateA%22:%22s0%22,%22label%22:%22B%22,%22stateB%22:%22s1%22},{%22stateA%22:%22s1%22,%22label%22:%22A%22,%22stateB%22:%22s2%22},{%22stateA%22:%22s2%22,%22label%22:%22B%22,%22stateB%22:%22s1%22}],%22bulkTests%22:{%22accept%22:%22AB\nABAB\nABABAB%22,%22reject%22:%22\nA\nB\nABA\nBA\nBB\nABABB%22}})

MIT Licensed, see License.txt
