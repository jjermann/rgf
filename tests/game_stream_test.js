function MockBoardPlayer() {
    var self=this;
    
    // just for testing
    self.appliedActions=[];

    self.onApplyAction = function(action) {
        self.appliedActions.push(action);
    }
};

MockBoardPlayer.prototype.attachStream = function (stream) {
    var self = this;

    self.detachStream();
    self.attachedStream = stream;
    stream.bind('applyAction', self.onApplyAction);
};
MockBoardPlayer.prototype.detachStream = function () {
    var self = this,

    stream = self.attachedStream;
    if (stream) {
        stream.unbind('applyAction', self.onApplyAction);
        delete self.attachedStream;
    }
};
MockBoardPlayer.prototype.insertActions = function(actions) {  
    var self=this;
    
    if (self.attachedStream) {
        return self.attachedStream.applyActionList(actions);
    } else {
        return false;
    }
};
asEvented.call(MockBoardPlayer.prototype);


function MockHuman(player,gameStream) {
    this.player=player;
    //gameStream is just for testing
    this.gameStream=gameStream;
    this.interactions=[];
    this.interactions.push({wait: 1.9});
    this.interactions.push({name: "VT", arg:"N", position: "0.0"});
    this.interactions.push({wait: 0.1});
    this.interactions.push({name: ";"});
    this.interactions.push({name: "B", arg: "dd"});
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
MockHuman.prototype.start=function() {
    this.update();
};
MockHuman.prototype.update=function() {
    var self=this;
    var action=this.interactions.shift();
    if (action==undefined) {
    } else if (action.wait!=undefined) {
        this.timeout=setTimeout(function(){self.update();},action.wait*1000);
    } else {
        var curAction=this.gameStream._rgfGame.actionList[this.gameStream.status.timeIndex-1];
        ok(this.player.insertActions(action),"The new action was sucessfully inserted, the last action was: "+simplePrintAction(curAction));
        curAction=this.gameStream._rgfGame.actionList[this.gameStream.status.timeIndex-1];
        ok(simpleCompareAction(curAction,action),"The (new) last action agrees with the supplied action, it is: "+simplePrintAction(curAction));
        this.update();
    }
};


/* mock media stream */
function MockMediaStream(newDuration) {
    this.status={
        currentTime:0,
        duration:newDuration,
        ended:false
    };
};
MockMediaStream.prototype.timeupdate=function() {
    var self=this;
    if (!this.status.ended) {
        this.date=new Date();
        this.status.currentTime=this.date.getTime()/1000-this.initialTime;
        if (this.status.currentTime>=this.status.duration) {
            this.status.ended=true;
            this.status.currentTime=this.status.duration;
            self.timeupdate();
        } else {
            this.timeout=setTimeout(function(){self.timeupdate();},50);
        }
        this.trigger('timeChange',self.status);
        // too much...
        // ok(true,"Updated GS time:"+this.status.currentTime);
    } else {
        ok(true,"Media stream has ended...");
        start();
    }
};
MockMediaStream.prototype.updateTime=function() {
    this.timeupdate();
};
MockMediaStream.prototype.start=function() {
    this.date=new Date();
    this.initialTime=this.date.getTime()/1000;
    this.timeupdate();
};
MockMediaStream.prototype.updateGS=function() {};
asEvented.call(MockMediaStream.prototype);


/* variables */
var player,human,gameStream,mediaStream,gsStatus,initialKeyframe,parser,rgfTree,actionList;
var initialSGF=";B[aa](;W[bb])(;W[bc]AB[ef][fg])";
var rgf=";B[aa]VT[N]TS[49]VT[ENDED]TS[50](;W[bb]VT[N]TS[19];TS[20]B[dd]TS[20:1])(;W[bc]AB[ef][fg]VT[N]TS[29]AW[cd]TS[30]AB[gh]TS[40])";
var duration=50;
var msDuration=55;

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
    for (var i=0; i<actions2.length; i++) {
        var a=actions1[i];
        var b=actions2[i];
        if (a.time!==b.time) return false;
        if (a.counter!==b.counter) return false;
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
function init(newDuration,msDuration) {
    player=new MockBoardPlayer();
    mediaStream=new MockMediaStream(msDuration);
    gameStream=new GameStream("test");
    human=new MockHuman(player,gameStream);

    
    /* SHOULD BE VARIABLES */
    
    //how the initial status should be
    gsStatus={
        time:-2,
        timeCounter:0,
        timeIndex:0,
        lastKeyframeIndex:0,
        duration:{time:-2, counter:0},
        waiting:false,
    };
    
    // how the initial keyframe should be
    initialKeyframe={time: -2, counter: 0, name: "KeyFrame", arg:"",position:[],node:gameStream._rgfGame.rgfTree};


    // create the necessary hooks for the MS, GS and BOARD
    gameStream.attachStream(mediaStream);
    player.attachStream(gameStream);
}
function setupGS() {
    gameStream.update(0);
    player.appliedActions=[];
}
function loadRGF(newRGF) {
    parser=new RGFParser;
    parser.loadRGF(newRGF);
    rgfTree=parser.rgfTree;
    actionList=parser.actionList;
    gameStream.applyTimedActionList(actionList);
    gameStream.update(0);
    player.appliedActions=[];
}
function reset() {
    // remove the hooks for the MS, GS and BOARD
    gameStream.detachStream();
    player.detachStream();

    if (human.timeout) clearTimeout(human.timeout);
    human=undefined;
    if (mediaStream.timeout) clearTimeout(mediaStream.timeout);
    player=undefined;
    mediaStream=undefined;
    gameStream=undefined;
    gsStatus=undefined;
    initialKeyframe=undefined;
    parser=undefined;
    rgfTree=undefined;
    actionList=undefined;
}






/*
    **************************************************************************
    * TEST STARTS                                                            *
    **************************************************************************
*/

module("GameStream (after creation)", {
    setup: function() {
        init(duration,msDuration);
    },
    teardown: reset
});
test("Internal GameStream properties", function(){
    deepEqual(gameStream._rgfGame.actionList,[initialKeyframe],"The Action List consists of one KeyFrame.");
    deepEqual(gameStream._rgfGame.keyframeList,[0],"The KeyFrame List has one entry pointing to the first KeyFrame in the ActionList.");
    deepEqual(gameStream._rgfGame.rgfTree,new RGFNode(),"The rgf tree is an empty root node (without parent).");
});
test("GameStream status", function(){
    equal(gameStream.status.time,gsStatus.time,"The time is set to 0 (not updated yet!).");
    equal(gameStream.status.timeIndex,gsStatus.timeIndex,"The next action is the initial KeyFrame (not updated yet!).");
    equal(gameStream.status.lastKeyframeIndex,gsStatus.lastKeyframeIndex,"The last KeyFrame is the initial KeyFrame (lastKeyframeIndex=0).");
    deepEqual(gameStream._rgfGame.duration,gsStatus.duration,"The current duration is given by the KeyFrame: time is -2 and its counter is 0. That's because the action list doesn't have any other timestamped actions yet.");
    equal(gameStream.status.waiting,gsStatus.waiting,"We are also not waiting initially (not updated yet!).");
});
test("Jump to time 0", function(){
    gameStream.update(0);
    ok(true,"[DONE] Updated the GameStream to time 0.");
    deepEqual(player.appliedActions,[initialKeyframe],"player.onApplyAction should have been called once with the initial keyframe.");
    player.appliedActions=[];
});


module("GameStream (after initial setup)", {
    setup: function() {
        init(duration,msDuration);
        gameStream.update(0);
        player.appliedActions=[];
    },
    teardown: reset
});
test("Internal GameStream properties", function(){
    // all properties remain the same
    deepEqual(gameStream._rgfGame.actionList,[initialKeyframe],"The Action List consists of one KeyFrame.");
    deepEqual(gameStream._rgfGame.keyframeList,[0],"The KeyFrame List has one entry pointing to the first KeyFrame in the ActionList.");
    deepEqual(gameStream._rgfGame.rgfTree,new RGFNode(),"The rgf tree is an empty root node (without parent).");
});
test("GameStream status", function(){
    gsStatus.time=0;
    gsStatus.timeIndex=1;
    gsStatus.waiting=true;
    equal(gameStream.status.time,gsStatus.time,"The time is 0.");
    equal(gameStream.status.timeIndex,gsStatus.timeIndex,"The time index points to the end of the Action List.");
    equal(gameStream.status.lastKeyframeIndex,gsStatus.lastKeyframeIndex,"The last KeyFrame is the initial KeyFrame (lastKeyframeIndex=0).");
    deepEqual(gameStream._rgfGame.duration,gsStatus.duration,"The current duration is given by the KeyFrame: time is -2 and its counter is 0. That's because the action list doesn't have any other timestamped actions yet.");
    equal(gameStream.status.waiting,gsStatus.waiting,"We are waiting because the current time is not smaller than the GameStream duration.");
});
test("Loading a sorted timestamped action list, resp. loading from an RGF content/file", function(){
    parser=new RGFParser;
    parser.loadRGF(rgf);
    rgfTree=parser.rgfTree;
    actionList=parser.actionList;
    // TODO: check the node parameter too
    var gameActionList=[initialKeyframe];
    gameActionList=gameActionList.concat(rgfTree.getActions());
    gsStatus.time=0;
    gsStatus.timeIndex=9;
    gsStatus.waiting=false;
    gsStatus.duration={time: parser.maxDuration, counter:0};

    gameStream.applyTimedActionList(actionList);
    var appliedActions=gameStream._rgfGame.actionList.slice(1,gsStatus.timeIndex);
    ok(true,"[DONE] Queued the actions from RGFParser (actionList).");
    ok(_.isEqual(player.appliedActions,appliedActions),"All new actions with time smaller or equal to the current time (0) should have been applied.");
    player.appliedActions=[];

    ok(true,"[NEXT] We check the internal GameStream properties...");
    ok(compareActionLists(gameStream._rgfGame.actionList,gameActionList),"The Action List is equal to the supplied action list except for: one additional KeyFrame at the beginning and one further node parameter for each action (NOT checked atm!!).");
    deepEqual(gameStream._rgfGame.keyframeList,[0],"Since no new KeyFrame was added, the list still has only one entry pointing to the first KeyFrame in the Action List.");
    ok(_.isEqual(gameStream._rgfGame.rgfTree,parser.rgfTree),"The rgf tree coincides with the rgf tree from RGFParser!");

    ok(true,"[NEXT] We check the GameStream status.");
    equal(gameStream.status.time,gsStatus.time,"The time is 0.");
    equal(gameStream.status.timeIndex,gsStatus.timeIndex,"The time index still points to the next action after the KeyFrame since we didn't update the time yet.");
    equal(gameStream.status.lastKeyframeIndex,gsStatus.lastKeyframeIndex,"The last KeyFrame is the initial KeyFrame (lastKeyframeIndex=0).");
    deepEqual(gameStream._rgfGame.duration,gsStatus.duration,"The current duration is given by the time of the last supplied action (reported by RGFParser, it has count=0).");
    equal(gameStream.status.waiting,gsStatus.waiting,"We are not waiting because the current time is smaller than the rgfGame duration.");
});

module("GameStream (with RGF)", {
    setup: function() {
        init(duration,msDuration);
        loadRGF(rgf);
    },
    teardown: reset
});
test("Writing an RGF.", function(){
    equal(gameStream._rgfGame.writeRGF(),rgfTree.writeRGF(),"The generated RGF from GameStream should be equal to the RGF from RGFParser.");
});
test("Jump to time 37.", function(){
    gsStatus.time=37;
    gsStatus.timeIndex=14;
    gsStatus.duration={time: parser.maxDuration, counter:0};
    var appliedActions=gameStream._rgfGame.actionList.slice(9,gsStatus.timeIndex);

    gameStream.update(37);
    ok(true,"[DONE] Updated the game stream to time 37.");
    ok(_.isEqual(player.appliedActions,appliedActions),"All new actions with time smaller or equal to 37 should have been applied.");
    player.appliedActions=[];

    ok(true,"[NEXT] We check the potentially changed internal GameStream properties. Note that the remaining internal properties are not touched by update anyway (unless the player would interfere)...");
    // TODO
    
    ok(true,"[NEXT] We check the GameStream status.");
    equal(gameStream.status.time,gsStatus.time,"The time is 37.");
    equal(gameStream.status.timeIndex,gsStatus.timeIndex,"The time index points to the next action after the last applied action.");
    equal(gameStream.status.lastKeyframeIndex,gsStatus.lastKeyframeIndex,"The last KeyFrame is still the initial KeyFrame (lastKeyframeIndex=0) because didn't pass any new KeyFrames...");
    deepEqual(gameStream._rgfGame.duration,gsStatus.duration,"The current duration is given by the last supplied action (reported by RGFParser, it has count=0).");
    equal(gameStream.status.waiting,gsStatus.waiting,"We are also not waiting because the current time is smaller than the rgfGame duration.");
});


module("GameStream (with RGF at time 37)", {
    setup: function() {
        init(duration,msDuration);
        loadRGF(rgf);
        gameStream.update(37);
        player.appliedActions=[];
    },
    teardown: reset
});
test("Jump to time 50.", function(){
    gsStatus.time=50;
    gsStatus.timeIndex=17;
    gsStatus.waiting=true;
    gsStatus.duration={time: parser.maxDuration, counter: 0};
    var appliedActions=gameStream._rgfGame.actionList.slice(14,gsStatus.timeIndex);

    gameStream.update(50);
    ok(true,"[DONE] Updated the game stream to time 50.");
    ok(_.isEqual(player.appliedActions,appliedActions),"All new actions with time smaller or equal to 50 should have been applied.");
    player.appliedActions=[];

    ok(true,"[NEXT] We check the potentially changed internal GameStream properties. Note that the remaining internal properties are not touched by update anyway (unless the player would interfere)...");
    // TODO

    ok(true,"[NEXT] We check the GameStream status.");
    equal(gameStream.status.time,gsStatus.time,"The time is 50.");
    equal(gameStream.status.timeIndex,gsStatus.timeIndex,"The time index points to the end of the action list (gameStream._rgfGame.actionList.length).");
    equal(gameStream.status.lastKeyframeIndex,gsStatus.lastKeyframeIndex,"The last KeyFrame is still the initial KeyFrame (lastKeyframeIndex=0) because didn't pass any new KeyFrames...");
    deepEqual(gameStream._rgfGame.duration,gsStatus.duration,"The current duration is given by the last supplied action (reported by RGFParser, it has count=0).");
    equal(gameStream.status.waiting,gsStatus.waiting,"We are waiting because the current time is equal to (resp. bigger-equal than) the rgfDuration.");
});
test("Jump back to time 24.", function(){
    gsStatus.lastKeyframeIndex=0;
    gsStatus.time=24;
    gsStatus.timeIndex=12;
    gsStatus.duration={time: parser.maxDuration, counter: 0};
    var appliedActions=gameStream._rgfGame.actionList.slice(gsStatus.lastKeyframeIndex,gsStatus.timeIndex);

    gameStream.update(24);
    ok(true,"[DONE] Updated the game stream to time 24.");
    ok(_.isEqual(player.appliedActions,appliedActions),"All actions starting from the last keyframe with time smaller or equal to 24 should have been applied.");
    player.appliedActions=[];

    ok(true,"[NEXT] We check the potentially changed internal GameStream properties. Note that the remaining internal properties are not touched by update anyway (unless the player would interfere)...");
    // TODO

    ok(true,"[NEXT] We check the GameStream status.");
    equal(gameStream.status.time,gsStatus.time,"The time is 24.");
    equal(gameStream.status.timeIndex,gsStatus.timeIndex,"The time index points to the next action after the last applied action.");
    equal(gameStream.status.lastKeyframeIndex,gsStatus.lastKeyframeIndex,"Since the last KeyFrame was the initial KeyFrame before and we jumped backwards it certainly is still that.");
    deepEqual(gameStream._rgfGame.duration,gsStatus.duration,"The current duration is given by the last supplied action (reported by RGFParser, it has count=0).");
    equal(gameStream.status.waiting,gsStatus.waiting,"We are also not waiting because the current time is smaller than the rgfGame duration.");
});


module("GameStream (with initial SGF)", {
    setup: function() {
        init(null,msDuration/10);
        loadRGF(initialSGF);
    },
    teardown: reset
});
test("Record a short game stream with timing based on a mock media stream", function(){
    stop(msDuration*1000+1000);
    mediaStream.start();
    human.start();
});
