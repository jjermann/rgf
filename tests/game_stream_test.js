/* mock board */
function MockBoard() {
    // just for testing
    this.applied_actions=[];
};
MockBoard.prototype.apply=function(action) {
    // just for testing
    this.applied_actions.push(action);
};
MockBoard.prototype.insertActionIntoGS=function() {};


/* mock player */
function MockPlayer(board,game_stream) {
    this.board=board;
    //this is just for testing
    this.game_stream=game_stream;
    this.interactions=[];
    this.interactions.push({wait: 1.9});
    this.interactions.push({name: "VT", arg:"N", position: "0.0"});
    this.interactions.push({wait: 0.1});
    this.interactions.push({name: ";B", arg: "dd"});
    this.interactions.push({wait: 0.9});
    this.interactions.push({name: "VT", arg:"N", position: "0.1"});
    this.interactions.push({wait: 0.1});
    this.interactions.push({name: "AW", arg: "cd"});
    this.interactions.push({wait: 1});
    this.interactions.push({name: "AB", arg: "gh"});
    this.interactions.push({wait: 0.9});
    this.interactions.push({name: "VT", arg:"N", position: "0"});
    this.interactions.push({wait: 0.1});
    this.interactions.push({name: "VT", arg: "ENDED"});
};
MockPlayer.prototype.start=function() {
    this.update();
};
MockPlayer.prototype.update=function() {
    var self=this;
    var action=this.interactions.shift();
    if (action==undefined) {
    } else if (action.wait!=undefined) {
        this.timeout=setTimeout(function(){self.update();},action.wait*1000);
    } else {
        cur_action=this.game_stream._action_list[this.game_stream.status.time_index-1];
        ok(this.board.insertActionIntoGS(action),"Action before (was successfully inserted): "+simplePrintAction(cur_action));
        cur_action=this.game_stream._action_list[this.game_stream.status.time_index-1];
        ok(simpleCompareAction(cur_action,action),"Action after (agrees with the supplied Action): "+simplePrintAction(cur_action));
        this.update();
    }
};


/* mock media stream */
function MockMediaStream(new_duration) {
    this.status={
        currentTime:0,
        duration:new_duration,
        ended:false
    };
    // this is just for testing
    this.game_stream=game_stream;
};
MockMediaStream.prototype.timeupdate=function() {
    var self=this;
    if (!this.status.ended) {
        this.date=new Date();
        this.status.currentTime=this.date.getTime()/1000-this.initial_time;
        if (this.status.currentTime>=this.status.duration) {
            this.status.ended=true;
            this.status.currentTime=this.status.duration;
            self.timeupdate();
        } else {
            this.timeout=setTimeout(function(){self.timeupdate();},50);
        }
        this.updateGS(self.status);
        ok(true,"Updated GS time:"+this.status.currentTime);
    } else {
        ok(true,"Media stream has ended...");
        start();
    }
};
MockMediaStream.prototype.start=function() {
    this.date=new Date();
    this.initial_time=this.date.getTime()/1000;
    this.timeupdate();
};
MockMediaStream.prototype.updateGS=function() {};


/* variables */
var board,player,game_stream,gs_status,initial_keyframe,parser,rgf_tree,action_list;
var initial_sgf=";B[aa](;W[bb])(;W[bc]AB[ef][fg])";
var rgf=";B[aa]VT[N]TS[49]VT[ENDED]TS[50](;W[bb]VT[N]TS[19];TS[20]B[dd]TS[20])(;W[bc]AB[ef][fg]VT[N]TS[29]AW[cd]TS[30]AB[gh]TS[40])";
var duration=50;
var ms_duration=55;

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
function simplePrintAction(action) {
    var output="";
    if (action.wait) return action.wait;
    output+=action.name;
    if (action.arg && action.arg!="") output+="["+action.arg+"]";
    if (action.position) output+=" (at "+action.position+")";
    output+=" ";
    return output;
};
function simpleCompareAction(a,b) {
    //if (a.time!==b.time) return false;
    if (a.name!==b.name) return false;
    if (a.arg!==b.arg) return false;
    if (!_.isEqual(a.position,b.position)) return false;
    return true;
}
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
function init(new_duration,ms_duration) {
    board=new MockBoard();
    media_stream=new MockMediaStream(ms_duration);
    game_stream=new GameStream("test",board,new_duration);
    player=new MockPlayer(board,game_stream);

    
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

    // only needed for recording
    board.insertActionIntoGS=game_stream.insertAction.bind(game_stream);
    // only needed for regular time updates
    media_stream.updateGS=game_stream.updatedTime.bind(game_stream);
}
function setupGS() {
    game_stream.update(0);
    board.applied_actions=[];
}
function loadRGF(new_rgf) {
    parser=new RGFParser(new_rgf);
    rgf_tree=parser.rgftree;
    action_list=parser.action_list;
    game_stream.queueTimedActionList(action_list);
    game_stream.update(0);
    board.applied_actions=[];
}
function reset() {
    if (player.timeout) clearTimeout(player.timeout);
    player=undefined;
    if (media_stream.timeout) clearTimeout(media_stream.timeout);
    board=undefined;
    media_stream=undefined;
    game_stream=undefined;
    gs_status=undefined;
    initial_keyframe=undefined;
    parser=undefined;
    rgf_tree=undefined;
    action_list=undefined;
}






/* TEST STARTS */

module("GameStream (after creation)", {
    setup: function() {
        init(duration,ms_duration);
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
test("Loading into the initial setup", function(){
    board.insertActionIntoGS=game_stream.insertAction.bind(game_stream);
    media_stream.updateGS=game_stream.updatedTime.bind(game_stream);
    ok(true,"[DONE] Created hook for the board and media stream to call gamestream's insertAction resp. updatedTime function.");
    game_stream.update(0);
    ok(true,"[DONE] Updated the GameStream to time 0.");
    deepEqual(board.applied_actions,[initial_keyframe],"board.apply should have been called once with the initial keyframe.");
    board.applied_actions=[];
});


module("GameStream (after initial setup)", {
    setup: function() {
        init(duration,ms_duration);
        game_stream.update(0);
        board.applied_actions=[];
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

    game_stream.queueTimedActionList(action_list);
    ok(true,"[DONE] Queued the actions from RGFParser (action_list).");
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


module("GameStream (after loading the RGF, without updating)", {
    setup: function() {
        init(duration,ms_duration);
        game_stream.update(0);
        board.applied_actions=[];
        parser=new RGFParser(rgf);
        rgf_tree=parser.rgftree;
        action_list=parser.action_list;
        game_stream.queueTimedActionList(action_list);
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
});
test("Writing an RGF.", function(){
    equal(game_stream.writeRGF(),rgf_tree.writeRGF(),"The generated RGF from GameStream should be equal to the RGF from RGFParser.");
});


module("GameStream (with RGF)", {
    setup: function() {
        init(duration,ms_duration);
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


module("GameStream (with RGF at time 37)", {
    setup: function() {
        init(duration,ms_duration);
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


module("GameStream (with initial SGF)", {
    setup: function() {
        init(duration/10,ms_duration/10);
        loadRGF(initial_sgf);
    },
    teardown: reset
});
test("Record a short game stream with timing based on a mock media stream", function(){
    stop(ms_duration*1000+1000);
    media_stream.start();
    player.start();
});
