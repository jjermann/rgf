// mock board
function MockBoard() {
    // just for testing
    this.applied_actions=[];
};
MockBoard.prototype.apply=function(action) {
    // just for testing
    this.applied_actions.push(action);
};
MockBoard.prototype.insertActionIntoGS;


// initializing board and game stream...
var board=new MockBoard();
var duration=20;
var game_stream=new GameStream("test1",board,duration);

// how the initial status should be
var initial_status={
    time:0,
    time_index:0,
    last_keyframe_index:0,
    duration:0,
    max_duration:duration,
    waiting:false,
    ended:false
};
// how the intial keyframe should be
var initial_keyframe={time: -2, name: "KeyFrame", arg:"",position:[],node:game_stream._rgftree};


module("GameStream (before update)");
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
    equal(game_stream.status.time,initial_status.time,"The time is set to 0 (not updated yet!).");
    equal(game_stream.status.time_index,initial_status.time_index,"The next action is the initial KeyFrame (not updated yet!).");
    equal(game_stream.status.last_keyframe_index,initial_status.last_keyframe_index,"The last KeyFrame is the initial KeyFrame (last_keyframe_index=0).");
    equal(game_stream.status.duration,initial_status.duration,"The current duration is 0 since the action list doesn't have any (positive) timestamped actions yet.");
    equal(game_stream.status.max_duration,initial_status.max_duration,"The duration of the final RGF is set to the duration argument we passed at the beginning.");
    equal(game_stream.status.waiting,initial_status.waiting,"We are not waiting initially (not updated yet!).");
    equal(game_stream.status.ended,initial_status.ended,"The game stream has not ended yet initially (not updated yet!).");
});


module("GameStream (init and update)");
test("Creating a hook for the board to call gamestream's insertAction function...", function(){
    board.insertActionIntoGS=game_stream.insertAction.bind(game_stream);
});
test("Updating the GameStream to time 0...", function(){
    game_stream.update(0);
    deepEqual(board.applied_actions,[initial_keyframe],"board.apply should have been called once with the initial keyframe.");
    board.applied_actions=[];
});


module("GameStream (after update)");
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
test("GameStream status (after the update)", function(){
    var updated_status=initial_status;
    // only the time index changed
    updated_status.time_index=1;
    equal(game_stream.status.time,updated_status.time,"The time is 0.");
    equal(game_stream.status.time_index,updated_status.time_index,"The time index points to the end of the Action List.");
    equal(game_stream.status.last_keyframe_index,updated_status.last_keyframe_index,"The last KeyFrame is the initial KeyFrame (last_keyframe_index=0).");
    equal(game_stream.status.duration,updated_status.duration,"The current duration is 0 since the action list doesn't have any (positive) timestamped actions yet.");
    equal(game_stream.status.max_duration,updated_status.max_duration,"The duration of the final RGF is the duration argument we passed at the beginning.");
    equal(game_stream.status.waiting,updated_status.waiting,"We are not waiting because the current time is still not bigger than the current duration.");
    equal(game_stream.status.ended,updated_status.ended,"The game stream has not ended yet because the current time is still not bigger than the maximal duration.");
});

