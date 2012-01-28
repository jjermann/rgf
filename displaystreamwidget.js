function BoardWidget(board_id) {
/*  Go board internals/etc (should already exist)
    Has no information about time...
    Maybe also responsible for the drawing of the go board and/or variations (no idea)
    This is just here for testing!
*/
    this.board_id=board_id;
    this.sgftree;
    // for drawing (?)
    this.board_element=this._initBoardElement(this.board_id);
};
BoardWidget.prototype._initBoardElement=function(id) {
    // only for testing at the moment
    var el=document.createElement("div");
    el.id=id;
    return el;
};
BoardWidget.prototype.clear=function() {
    // Clears the whole board to an "initial" empty board.
   
    // For testing:
    $('div#'+this.board_id).text("");
};

BoardWidget.prototype.apply=function(data) {
    // For testing:
    if (data.property=="KeyFrame") {
        $('div#'+this.board_id).text(data.arg);
    } else if (data.property=="Ended") {
        $('div#'+this.board_id).append(" (game ended)").show();
    } else {
        $('div#'+this.board_id).append(data.property+"["+data.arg+"]").show();
        // note that the line below is exactly "NOT" what is usually done by the
        // board drawing or creation of the sgf tree!
        if (data.time!=-1) $('div#'+this.board_id).append("TS["+data.time+"]").show();
    }
};

/*  A single modification on the go board. Depends on the actual implementation... */
function Action(time,property,arg,position) {
    this.time=time;
    /* the following two arguments (property/position) could e.g. also be queryied in
       the RGF game tree, so maybe position alone is enough... */
    this.property=property;
    this.arg=arg;
    this.position=position;
};

/*  GameStream
    ----------
    Responsible to initialize a "MediaStream" and to synchronize with the current board drawing...
    Responsible for putting the actual html body...
*/
function GameStream(base_id) {
    /*
        id=base_id   = ID
        media_id     = ID_media
        interface_id = ID_interface
        board_id     = ID_board
    */
    this.id=base_id;
    this.board;
    this.media_stream;
    this.gui;

    // TODO(?): maybe we want to have the possibility to specify a delay...
    // For now we assume time starts at 0 (or at least >0)...
    
    // current game stream time
    this.time=0;
    // used internally for timeupdates (next game stream time)
    this._next_time=0;
    // current action index
    this.time_index=0;
    // last keyframe index before this.time_index (useful for reversing in individual steps)
    this.last_keyframe_index=0;
    // current game stream duration (equal to the time of the last entry in the action list)
    this.duration=0;
    // list of all keyframes, note that for consistency reasons the first property should always
    // be a KeyFrame. It could be empty or describe the initial board position. As it is now this
    // is not strictly required to though...
    this._keyframe_list=[0];
    // list of all actions
    this._action_list=[];

    // true if the media stream is ahead of the game stream (and the game stream has not ended)...
    this.waiting=false;
    this.ended=false;
};

// Adds actions to the _action_list. The first action should always be a KeyFrame...
// TODO: be more flexible with "initial" time, resp. the start of the _action_list...
GameStream.prototype.queueActions=function(actions) {
    for(var i=0;i<actions.length;i++){
        var action = actions[i];
        if (action.property=="KeyFrame") {
            this._keyframe_list.push(this._action_list.length-1);
        }
        this._action_list.push(new Action(action.time, action.property, action.arg, action.position));
    }
    if (this._action_list.length) this.duration=this._action_list[this._action_list.length-1].time;
}

GameStream.prototype.loadStream = function(sources,media_type,width,height,duration) {
    // Set up the basic widgets
    this.board=new BoardWidget(this.id+"_board");
    this.media_stream=new MediaStream(this.id+"_media_stream",sources,media_type,width,height,duration);
    this.gui=new MediaInterface(this.id+"_media_interface");
    
    // Set up the placement in the body/some container
    document.body.appendChild(this.board.board_element);
    document.body.appendChild(this.media_stream.media_element);
    document.body.appendChild(this.gui.interface_element);

    // Initialize the MediaStream and its interface(s)
    this.media_stream.initPlayer();
    this.gui.initMediaInterface(this.media_stream);
    this.media_stream.addInterface(this.updatedStatus.bind(this),this.updatedTime.bind(this));
    
    // Initialize the the starting Board position
    this.update(0);
};

GameStream.prototype.updatedStatus = function() {
    // TODO...
};

GameStream.prototype.updatedTime = function() {
    this._next_time=this.media_stream.status.currentTime;
    // we only update the internal (this.time) clock if we still
    // have actions to process resp. if the "game stream" is
    // ahead of the "media stream"
    if (this._next_time<=this.duration) {
        if (this.waiting) {
            this.waiting=false;
        }
        this.update(this._next_time);
    } else if (this.ended) {
        this.update(this._next_time);
    } else {
        this._next_time=this.duration;
        this.update(this._next_time);
        // we should tell the media stream to react appropriately, e.g. pause?
        // it should furthermore give some hint to the user and continue playing
        // once it caught up...
        // otherwise the "media stream" and "game stream" get out of sync...
        if (!this.waiting && !this.ended) {
            this.waiting=true;
            // this.media_stream.player.pause();
        }
    }
};

GameStream.prototype.update = function(next_time) {
    if (next_time>=this.time) {
        this._advanceTo(next_time);
        this.time=next_time;
    } else {
        this._reverseTo(next_time);
        this.time=next_time;
    }
};

GameStream.prototype._advanceTo = function(next_time) {
    /* Applies all actions from the current time_index (resp. this.time) up to next_time.
       The last_keyframe_index is also updated.
       If property=="Ended" we inform the GameStream and BoardWidget */

    while (this.time_index<this._action_list.length && this._action_list[this.time_index].time<=next_time) {
        if (this._action_list[this.time_index].property=="Ended") {
            this.ended=true;
        }
        // A KeyFrame should always be recoverable by all of the previous actions (back to the previous keyframe),
        // so it should not introduce any new actions (except maybe at the beginning),
        // so when advancing forward we can just skip it to save time...
        if (this._action_list[this.time_index].property!="KeyFrame") {
            this.board.apply(this._action_list[this.time_index]);
        }
        this.time_index++;
    }

    while (this.last_keyframe_index<this._keyframe_list.length && this._keyframe_list[this.last_keyframe_index]<=this.time_index) {
        this.last_keyframe_index++;
    }
    this.last_keyframe_index--;
};

GameStream.prototype._reverseTo = function(next_time) {
    /* Loads the last KeyFrame before next_time (and also sets the last_keyframe_index to this KeyFrame).
       Then it applies all actions up to next_time... */
       
    // jump to the last KeyFrame before next_time
    while (0<=this.last_keyframe_index && this._keyframe_list[this.last_keyframe_index]<=next_time) {
        this.last_keyframe_index--;
    }
    this.last_keyframe_index++;

    this.time_index=this._keyframe_list[this.last_keyframe_index];
    this.board.clear();

    // apply all actions up to next_time (a reduced version of advanceTo)
    // note that the first action is applying the KeyFrame...
    while (this.time_index<this._action_list.length && this._action_list[this.time_index].time<=next_time) {
        this.board.apply(this._action_list[this.time_index]);
        this.time_index++;
    }
};
