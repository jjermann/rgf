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
    this.gui;

    /* fixed header information */
    this.media_stream;

    // TODO: maybe we want to have the possibility to specify a delay...
    // For now we assume time starts at 0 (or at least >0)...
    
    /* status information */
    this.status = {
        // current game stream time
        time:0,
        // current action index
        time_index:0,
        // last keyframe index before this.status.time_index (useful for reversing in individual steps)
        last_keyframe_index:0,
        // current game stream duration (equal to the time of the last entry in the action list)
        duration:0,
        max_duration:Infinity,
        // true if the media stream is ahead of the game stream (and the game stream has not ended)...
        waiting:false,
        ended:false
    }

    // list of all keyframes, note that for consistency reasons the first property should always
    // be a KeyFrame. It could be empty or describe the initial board position. As it is now this
    // is not strictly required to though...
    this._keyframe_list=[0];
    // list of all actions
    this._action_list=[];
    // current RGF tree/content
    this._rgftree;
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
    if (this._action_list.length) this.status.duration=this._action_list[this._action_list.length-1].time;
}

GameStream.prototype.loadStream = function(sources,media_type,max_duration,width,height) {
    // Set up header information (max_duration)
    this.status.max_duration=(max_duration>0) ? max_duration : Infinity;

    // Set up the basic widgets
    this.board=new BoardWidget(this.id+"_board");
    this.media_stream=new MediaStream(this.id+"_media_stream",sources,media_type,max_duration,width,height);
    this.gui=new MediaInterface(this.id+"_media_interface");
    
    // Set up the placement in the body/some container
    document.body.appendChild(this.board.board_element);
    document.body.appendChild(this.media_stream.media_element);
    document.body.appendChild(this.gui.interface_element);

    // Initialize the MediaStream and its interface(s)
    this.media_stream.initPlayer();
    this.gui.initMediaInterface(this.media_stream);
    this.media_stream.addInterface(this.updatedMStatus.bind(this),this.updatedMTime.bind(this));
    
    // Initialize the the starting Board position
    this.update(0);
};

GameStream.prototype.updatedMStatus = function() {
    // TODO...
};

GameStream.prototype.updatedMTime = function() {
    var next_time=this.media_stream.status.currentTime;
    // we only update the internal (this.status.time) clock if we still
    // have actions to process resp. if the "game stream" is
    // ahead of the "media stream"
    if (next_time<=this.status.duration) {
        if (this.status.waiting) {
            this.status.waiting=false;
        }
        this.update(next_time);
    } else if (this.status.ended) {
        this.update(next_time);
    } else {
        next_time=this.status.duration;
        this.update(next_time);
        // we should tell the media stream to react appropriately, e.g. pause?
        // it should furthermore give some hint to the user and continue playing
        // once it caught up...
        // otherwise the "media stream" and "game stream" get out of sync...
        if (!this.status.waiting && !this.status.ended) {
            this.status.waiting=true;
            // this.media_stream.player.pause();
        }
    }
};

GameStream.prototype.update = function(next_time) {
    if (next_time>=this.status.time) {
        this._advanceTo(next_time);
        this.status.time=next_time;
    } else {
        this._reverseTo(next_time);
        this.status.time=next_time;
    }
};

GameStream.prototype._advanceTo = function(next_time) {
    /* Applies all actions from the current time_index (resp. this.status.time) up to next_time.
       The last_keyframe_index is also updated.
       If property=="Ended" we inform the GameStream and BoardWidget */

    while (this.status.time_index<this._action_list.length && this._action_list[this.status.time_index].time<=next_time) {
        // A KeyFrame should always be recoverable by all of the previous actions (back to the previous keyframe),
        // so it should not introduce any new actions (except maybe at the beginning),
        // so when advancing forward we can just skip it to save time...
        if (this._action_list[this.status.time_index].property!="KeyFrame") {
            this.board.apply(this._action_list[this.status.time_index]);
        }
        this.status.time_index++;
    }

    while (this.status.last_keyframe_index<this._keyframe_list.length && this._keyframe_list[this.status.last_keyframe_index]<=this.status.time_index) {
        this.status.last_keyframe_index++;
    }
    this.status.last_keyframe_index--;

    if (next_time>=this.status.max_duration) this.status.ended=true;
};

GameStream.prototype._reverseTo = function(next_time) {
    /* Loads the last KeyFrame before next_time (and also sets the last_keyframe_index to this KeyFrame).
       Then it applies all actions up to next_time... */
       
    // jump to the last KeyFrame before next_time
    while (0<=this.status.last_keyframe_index && this._keyframe_list[this.status.last_keyframe_index]<=next_time) {
        this.status.last_keyframe_index--;
    }
    this.status.last_keyframe_index++;

    this.status.time_index=this._keyframe_list[this.status.last_keyframe_index];
    this.board.clear();

    // apply all actions up to next_time (a reduced version of advanceTo)
    // note that the first action is applying the KeyFrame...
    while (this.status.time_index<this._action_list.length && this._action_list[this.status.time_index].time<=next_time) {
        this.board.apply(this._action_list[this.status.time_index]);
        this.status.time_index++;
    }
};
