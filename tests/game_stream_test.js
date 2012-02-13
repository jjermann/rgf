/* mock board */
function MockBoard() {
    // just for testing
    this.applied_actions=[];
};
MockBoard.prototype.apply=function(action) {
    // just for testing
    this.applied_actions.push(action);
};
MockBoard.prototype.insertActionIntoGS;


/* variables */
var board,game_stream,gs_status,initial_keyframe,parser,rgf_tree,action_list;
var rgf=";B[aa]VT[N]TS[49]VT[ENDED]TS[50](;W[bb]VT[N]TS[19];TS[20]B[dd]TS[20])(;W[bc]AB[ef][fg]VT[N]TS[29]AW[cd]TS[30]AB[gh]TS[40])";
var duration=50;

/* helper functions */
RGFNode.prototype.__getUnsortedActionsWithNode = function() {
    var actions=[];
    if (this.parent==null && !this.children.length) {
        return actions;
    } else if (this.parent!=null) {
        actions.push({time:this.time, name:";", arg:"", position:this.parent.position, node:this.parent, _node_pos:this.position});
    }

    for (var i=0; i<this.properties.length; i++) {
        actions.push({time:this.properties[i].time, name:this.properties[i].name, arg:this.properties[i].argument, node:this, position:this.position});
    }
    for (var i=0; i<this.children.length; i++) {
        actions=actions.concat(this.children[i].__getUnsortedActionsWithNode());
    }
    return actions;
};
function compareActionLists(actions1,actions2) {
    if (actions1.length!==actions2.length) return false;
    for (var i=0; i<actions1.length; i++) {
        var a=actions1[i];
        var b=actions2[i];
        var c,d;
        if (a.time!==b.time) return false;
        if (a.name!==b.name) return false;
        if (a.arg!==b.arg) return false;
        if (!_.isEqual(a.position,b.position)) return false;
// TODO: make this work somehow
//        if (!_.isEqual(a.node,b.node)) return false;
        if (a.strict!=b.strict) return false;
    }
    return true;
}


/* functions to initialize a certain state for the unit tester... */
function init(new_duration) {
    board=new MockBoard();
    game_stream=new GameStream("test",board,new_duration);

    
    /* SHOULD BE VARIABLES */
    
    //how the initial status should be
    gs_status={
        time:0,
        time_index:0,
        last_keyframe_index:0,
        duration:0,
        max_duration:new_duration,
        waiting:false,
        ended:false
    };
    
    // how the initial keyframe should be
    initial_keyframe={time: -2, name: "KeyFrame", arg:"",position:[],node:game_stream._rgftree};
}
function update() {
    board.insertActionIntoGS=game_stream.insertAction.bind(game_stream);
    game_stream.update(0);
    board.applied_actions=[];
}
function loadRGF(new_rgf) {
    parser=new RGFParser(new_rgf);
    rgf_tree=parser.rgftree;
    action_list=parser.action_list;
    game_stream.queueTimedActions(action_list);
    game_stream.update(0);
    board.applied_actions=[];
}
function reset() {
    board=undefined;
    game_stream=undefined;
    gs_status=undefined;
    initial_keyframe=undefined;
    parser=undefined;
    rgf_tree=undefined;
    action_list=undefined;
}






/* TEST STARTS */

module("GameStream (after init)", {
    setup: function() {
        init(duration);
    },
    teardown: reset
});
test("Internal GameStream properties", function(){
    deepEqual(game_stream._action_list,[initial_keyframe],"The Action List consists of one KeyFrame.");
    deepEqual(game_stream._keyframe_list,[0],"The KeyFrame List has one entry pointing to the first KeyFrame in the ActionList.");
    deepEqual(game_stream._rgftree,new RGFNode(),"The rgf tree is an empty root node (without parent).");
    deepEqual(game_stream._rgfpath,[],"The current path points to the root node.");
    deepEqual(game_stream._rgfnode,game_stream._rgftree,"The current node is the root node.");
    deepEqual(game_stream._last_rgfpath,[],"The last path points to the root node.");
    deepEqual(game_stream._last_rgfnode,game_stream._rgftree,"The last node is the root node.");
});
test("GameStream status", function(){
    equal(game_stream.status.time,gs_status.time,"The time is set to 0 (not updated yet!).");
    equal(game_stream.status.time_index,gs_status.time_index,"The next action is the initial KeyFrame (not updated yet!).");
    equal(game_stream.status.last_keyframe_index,gs_status.last_keyframe_index,"The last KeyFrame is the initial KeyFrame (last_keyframe_index=0).");
    equal(game_stream.status.duration,gs_status.duration,"The current duration is 0 since the action list doesn't have any (positive) timestamped actions yet.");
    equal(game_stream.status.max_duration,gs_status.max_duration,"The duration of the final RGF is set to the duration argument we passed at the beginning.");
    equal(game_stream.status.ended,gs_status.ended,"The game stream has not ended yet initially (not updated yet!).");
    equal(game_stream.status.waiting,gs_status.waiting,"We are also not waiting initially (not updated yet!).");
});
test("Loading into the basic setup", function(){
    board.insertActionIntoGS=game_stream.insertAction.bind(game_stream);
    ok(true,"[DONE] Created a hook for the board to call gamestream's insertAction function.");
    game_stream.update(0);
    ok(true,"[DONE] Updated the GameStream to time 0. [NEXT] board forgets the applied actions...");
    deepEqual(board.applied_actions,[initial_keyframe],"board.apply should have been called once with the initial keyframe.");
    board.applied_actions=[];
});


module("GameStream (ready to record)", {
    setup: function() {
        init(duration);
        update();
    },
    teardown: reset
});
test("Internal GameStream properties", function(){
    // all properties remain the same
    deepEqual(game_stream._action_list,[initial_keyframe],"The Action List consists of one KeyFrame.");
    deepEqual(game_stream._keyframe_list,[0],"The KeyFrame List has one entry pointing to the first KeyFrame in the ActionList.");
    deepEqual(game_stream._rgftree,new RGFNode(),"The rgf tree is an empty root node (without parent).");
    deepEqual(game_stream._rgfpath,[],"The current path points to the root node.");
    deepEqual(game_stream._rgfnode,game_stream._rgftree,"The current node is the root node.");
    deepEqual(game_stream._last_rgfpath,[],"The last path points to the root node.");
    deepEqual(game_stream._last_rgfnode,game_stream._rgftree,"The last node is the root node.");
});
test("GameStream status", function(){
    gs_status.time_index=1;
    equal(game_stream.status.time,gs_status.time,"The time is 0.");
    equal(game_stream.status.time_index,gs_status.time_index,"The time index points to the end of the Action List.");
    equal(game_stream.status.last_keyframe_index,gs_status.last_keyframe_index,"The last KeyFrame is the initial KeyFrame (last_keyframe_index=0).");
    equal(game_stream.status.duration,gs_status.duration,"The current duration is 0 since the action list doesn't have any (positive) timestamped actions yet.");
    equal(game_stream.status.max_duration,gs_status.max_duration,"The duration of the final RGF is the duration argument we passed at the beginning.");
    equal(game_stream.status.ended,gs_status.ended,"The game stream has not ended yet because the current time is still smaller than the maximal duration.");
    equal(game_stream.status.waiting,gs_status.waiting,"We are also not waiting because the current time is still not bigger than the current duration.");
});
test("Loading a sorted timestamped action list, resp. loading from an RGF content/file", function(){
    parser=new RGFParser(rgf);
    rgf_tree=parser.rgftree;
    action_list=parser.action_list;
    // TODO: this approach is not working properly yet...
    var game_action_list=[initial_keyframe];
    game_action_list=game_action_list.concat(RGFNode._sortActions(rgf_tree.__getUnsortedActionsWithNode()));
    gs_status.time_index=1;
    gs_status.duration=parser.duration;

    game_stream.queueTimedActions(action_list);
    ok(true,"[DONE] Queued the actions from RGFParser (action_list). [NEXT] board forgets the applied actions...");
    deepEqual(board.applied_actions,[],"board.apply should never habe been called since we didn't update the time yet!).");
    board.applied_actions=[];

    ok(true,"[NEXT] We check the internal GameStream properties...");
    ok(compareActionLists(game_stream._action_list,game_action_list),"The Action List is equal to the supplied action list except for: one additional KeyFrame at the beginning and one further node parameter for each action (NOT checked atm!!).");
    deepEqual(game_stream._keyframe_list,[0],"Since no new KeyFrame was added, the list still has only one entry pointing to the first KeyFrame in the Action List.");
    ok(_.isEqual(game_stream._rgftree,parser.rgftree),"The rgf tree coincides with the rgf tree from RGFParser!");
    deepEqual(game_stream._rgfpath,[],"The current path points to the root node.");
    ok(_.isEqual(game_stream._rgfnode,game_stream._rgftree),"The current node is the root node.");
    deepEqual(game_stream._last_rgfpath,pathToArray(game_stream._action_list[game_stream._action_list.length-1].node.position),"The last path is given by the position of the last action of the action list.");
    ok(_.isEqual(game_stream._last_rgfnode,game_stream._action_list[game_stream._action_list.length-1].node),"The last node is given by the node corresponding to the last action of the action list.");

    ok(true,"[NEXT] We check the GameStream status.");
    equal(game_stream.status.time,gs_status.time,"The time is 0.");
    equal(game_stream.status.time_index,gs_status.time_index,"The time index still points to the next action after the KeyFrame since we didn't update the time yet.");
    equal(game_stream.status.last_keyframe_index,gs_status.last_keyframe_index,"The last KeyFrame is the initial KeyFrame (last_keyframe_index=0).");
    equal(game_stream.status.duration,gs_status.duration,"The current duration is <duration> (50) since this is the time of the last supplied action.");
    equal(game_stream.status.max_duration,gs_status.max_duration,"The duration of the final RGF is the duration argument we passed at the beginning.");
    equal(game_stream.status.ended,gs_status.ended,"The game stream has not ended yet because the current time is smaller than the maximal duration.");
    equal(game_stream.status.waiting,gs_status.waiting,"We are also not waiting because the current time is still not bigger than the current duration.");
});


module("GameStream (after loading the RGF)", {
    setup: function() {
        init(duration);
        update();
        parser=new RGFParser(rgf);
        rgf_tree=parser.rgftree;
        action_list=parser.action_list;
        game_stream.queueTimedActions(action_list);
        board.applied_actions=[];
    },
    teardown: reset
});
test("Updating the game stream to time 0 again.", function(){
    gs_status.time_index=9;
    gs_status.duration=parser.duration;
    var applied_actions=game_stream._action_list.slice(1,gs_status.time_index);
    var rgfpath=[];
    if (applied_actions.length) rgfpath=pathToArray(applied_actions[applied_actions.length-1].node.position);

    game_stream.update(0);
    ok(true,"[DONE] Updated the game stream to time 0.");
    ok(_.isEqual(board.applied_actions,applied_actions),"All new actions with time smaller or equal to 0 should have been applied (those are the first eight actions _after_ the KeyFrame which was already applied).");
    board.applied_actions=[];

    ok(true,"[NEXT] We check the potentially changed internal GameStream properties. Note that the remaining internal properties are not touched by update anyway (unless the board would interfere)...");
    deepEqual(game_stream._rgfpath,rgfpath,"The current path corresponds to the last applied action. It specifies the node where new actions and/or properties will be inserted.");
    ok(_.isEqual(game_stream._rgfnode,game_stream._rgftree.descend(game_stream._rgfpath)),"This is the node corresponding to the current path.");

    ok(true,"[NEXT] We check the GameStream status.");
    equal(game_stream.status.time,gs_status.time,"The time is 0.");
    equal(game_stream.status.time_index,gs_status.time_index,"Now the time index points to the next action after the last applied action.");
    equal(game_stream.status.last_keyframe_index,gs_status.last_keyframe_index,"The last KeyFrame is the initial KeyFrame (last_keyframe_index=0).");
    equal(game_stream.status.duration,gs_status.duration,"The current duration is <duration> (50) since this is the time of the last supplied action.");
    equal(game_stream.status.max_duration,gs_status.max_duration,"The duration of the final RGF is the duration argument we passed at the beginning.");
    equal(game_stream.status.ended,gs_status.ended,"The game stream has not ended yet because the current time is smaller than the maximal duration.");
    equal(game_stream.status.waiting,gs_status.waiting,"We are also not waiting because the current time is still not bigger than the current duration.");

    ok(true,"[NEXT] We check the GameStream status.");
});


module("GameStream (ready to play)", {
    setup: function() {
        init(duration);
        update();
        loadRGF(rgf);
    },
    teardown: reset
});
test("Jump to time 37.", function(){
    gs_status.time=37;
    gs_status.time_index=14;
    gs_status.duration=parser.duration;
    var applied_actions=game_stream._action_list.slice(9,gs_status.time_index);
    var rgfpath=[];
    if (applied_actions.length) rgfpath=pathToArray(applied_actions[applied_actions.length-1].node.position);

    game_stream.update(37);
    ok(true,"[DONE] Updated the game stream to time 37.");
    ok(_.isEqual(board.applied_actions,applied_actions),"All new actions with time smaller or equal to 37 should have been applied.");
    board.applied_actions=[];

    ok(true,"[NEXT] We check the potentially changed internal GameStream properties. Note that the remaining internal properties are not touched by update anyway (unless the board would interfere)...");
    deepEqual(game_stream._rgfpath,rgfpath,"The current path corresponds to the last applied action. It specifies the node where new actions and/or properties will be inserted.");
    ok(_.isEqual(game_stream._rgfnode,game_stream._rgftree.descend(game_stream._rgfpath)),"This is the node corresponding to the current path.");

    ok(true,"[NEXT] We check the GameStream status.");
    equal(game_stream.status.time,gs_status.time,"The time is 37.");
    equal(game_stream.status.time_index,gs_status.time_index,"The time index points to the next action after the last applied action.");
    equal(game_stream.status.last_keyframe_index,gs_status.last_keyframe_index,"The last KeyFrame is still the initial KeyFrame (last_keyframe_index=0) because didn't pass any new KeyFrames...");
    equal(game_stream.status.duration,gs_status.duration,"The current duration is <duration> (50) since this is the time of the last supplied action.");
    equal(game_stream.status.max_duration,gs_status.max_duration,"The duration of the final RGF is the duration argument we passed at the beginning.");
    equal(game_stream.status.ended,gs_status.ended,"The game stream has not ended yet because the current time is smaller than the maximal duration.");
    equal(game_stream.status.waiting,gs_status.waiting,"We are also not waiting because the current time is still not bigger than the current duration.");
});


module("GameStream (at time 37)", {
    setup: function() {
        init(duration);
        update();
        loadRGF(rgf);
        game_stream.update(37);
        board.applied_actions=[];
    },
    teardown: reset
});
test("Jump to time 50.", function(){
    gs_status.time=50;
    gs_status.time_index=17;
    gs_status.ended=true;
    gs_status.duration=parser.duration;
    var applied_actions=game_stream._action_list.slice(14,gs_status.time_index);
    var rgfpath=[];
    if (applied_actions.length) rgfpath=pathToArray(applied_actions[applied_actions.length-1].node.position);

    game_stream.update(50);
    ok(true,"[DONE] Updated the game stream to time 50.");
    ok(_.isEqual(board.applied_actions,applied_actions),"All new actions with time smaller or equal to 50 should have been applied.");
    board.applied_actions=[];

    ok(true,"[NEXT] We check the potentially changed internal GameStream properties. Note that the remaining internal properties are not touched by update anyway (unless the board would interfere)...");
    deepEqual(game_stream._rgfpath,rgfpath,"The current path corresponds to the last applied action. It specifies the node where new actions and/or properties will be inserted.");
    ok(_.isEqual(game_stream._rgfnode,game_stream._rgftree.descend(game_stream._rgfpath)),"This is the node corresponding to the current path.");

    ok(true,"[NEXT] We check the GameStream status.");
    equal(game_stream.status.time,gs_status.time,"The time is 50.");
    equal(game_stream.status.time_index,gs_status.time_index,"The time index points to the end of the action list (game_stream._action_list.length).");
    equal(game_stream.status.last_keyframe_index,gs_status.last_keyframe_index,"The last KeyFrame is still the initial KeyFrame (last_keyframe_index=0) because didn't pass any new KeyFrames...");
    equal(game_stream.status.duration,gs_status.duration,"The current duration is <duration> (50) since this is the time of the last supplied action.");
    equal(game_stream.status.max_duration,gs_status.max_duration,"The duration of the final RGF is the duration argument we passed at the beginning.");
    equal(game_stream.status.ended,gs_status.ended,"The game stream has ended because the current time is equal to the maximal duration.");
    equal(game_stream.status.waiting,gs_status.waiting,"We are not waiting because the stream has ended (and because the current time is still not bigger than the current duration).");
});
test("Jump back to time 24.", function(){
    gs_status.last_keyframe_index=0;
    gs_status.time=24;
    gs_status.time_index=12;
    gs_status.duration=parser.duration;
    var applied_actions=game_stream._action_list.slice(gs_status.last_keyframe_index,gs_status.time_index);
    var rgfpath=[];
    if (applied_actions.length) rgfpath=pathToArray(applied_actions[applied_actions.length-1].node.position);

    game_stream.update(24);
    ok(true,"[DONE] Updated the game stream to time 24.");
    ok(_.isEqual(board.applied_actions,applied_actions),"All actions starting from the last keyframe with time smaller or equal to 24 should have been applied.");
    board.applied_actions=[];

    ok(true,"[NEXT] We check the potentially changed internal GameStream properties. Note that the remaining internal properties are not touched by update anyway (unless the board would interfere)...");
    deepEqual(game_stream._rgfpath,rgfpath,"The current path corresponds to the last applied action. It specifies the node where new actions and/or properties will be inserted.");
    ok(_.isEqual(game_stream._rgfnode,game_stream._rgftree.descend(game_stream._rgfpath)),"This is the node corresponding to the current path.");

    ok(true,"[NEXT] We check the GameStream status.");
    equal(game_stream.status.time,gs_status.time,"The time is 24.");
    equal(game_stream.status.time_index,gs_status.time_index,"The time index points to the next action after the last applied action.");
    equal(game_stream.status.last_keyframe_index,gs_status.last_keyframe_index,"Since the last KeyFrame was the initial KeyFrame before and we jumped backwards it certainly is still that.");
    equal(game_stream.status.duration,gs_status.duration,"The current duration is <duration> (50) since this is the time of the last supplied action.");
    equal(game_stream.status.max_duration,gs_status.max_duration,"The duration of the final RGF is the duration argument we passed at the beginning.");
    equal(game_stream.status.ended,gs_status.ended,"The game stream has not ended yet because the current time is smaller than the maximal duration.");
    equal(game_stream.status.waiting,gs_status.waiting,"We are also not waiting because the current time is still not bigger than the current duration.");
});




