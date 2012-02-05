/*  GameStream
    ----------
    Responsible to keep track of applied changes, where we are in this chain and to update the
    current board drawing accordingly. It kind of "hijacks" the board...
*/
function GameStream(game_id,board,max_duration) {
    this.id=game_id;
    this.board=board;
    
    /* status information */
    this.status = {
        // current game stream time
        time:0,
        // current action index
        time_index:0,
        // last keyframe index before this.status.time_index
        last_keyframe_index:0,
        // current game stream duration (equal to the time of the last entry in the action list)
        duration:0,
        max_duration:((max_duration>0) ? max_duration : Infinity),
        // true if the current time is ahead of the game stream (and the game stream has not ended)...
        waiting:false,
        ended:false
    }

    /* List of all KeyFrames:
       A KeyFrame describes how to get the whole current SGF tree.
       The resulting SGF tree must be identical to the one we get by successively applying actions.
    */
    this._keyframe_list=[];
    // list of all actions
    this._action_list=[];
    // current RGF tree/content
    this._rgftree=new RGFNode();
    // current RGF path
    this._rgfpath=[];
    // current RGF parent node (equal to this._rgftree.descend(this._rgfpath))
    this._rgfnode=this._rgftree;

    /* The first action is set here to be an "empty" KeyFrame. */
    this.queueActions([new Action(-2,"KeyFrame","",undefined)]);
    // called outside of GameStream:
    // this.update(0);
};

// Adds actions to the _action_list.
// TODO: be more flexible with "initial" time, resp. the start of the _action_list...
GameStream.prototype.queueActions=function(actions) {
    if (this._action_list.length && this._action_list[0].name!="KeyFrame") alert("The first Action must be a KeyFrame!");
    for(var i=0;i<actions.length;i++) {
        var action = actions[i];
        
        // modify action list
        if (action.name=="KeyFrame") {
            this._keyframe_list.push(this._action_list.length);
            // TODO: parse the KeyFrame?
        }
        this._action_list.push(new Action(action.time, action.name, action.arg, action.position));

        // modify rgf tree
        if (action.name=="KeyFrame") {
        } else {
            if (action.position!=undefined) {
                if (typeof action.position=='string') this._rgfpath=(action.position).split('.');
                else this._rgfpath=action.position;
                this._rgfnode=this._rgftree.descend(this._rgfpath);
            }
            // if a node is added
            if (action.name[0]==";") {
                this._rgfpath.push(this._rgfnode.children.length);
                this._rgfnode=this._rgfnode.addNode(new RGFNode(action.time));
                if (action.name==";") {
                } else if (action.name==";B") {
                    this._rgfnode.addProp(new RGFProperty("B",action.arg,action.time));
                } else if (action.name==";W") {
                    this._rgfnode.addProp(new RGFProperty("W",action.arg,action.time));
                } else {
                    alert("Invalid node action: "+action.name);
                }
            // if a property is added
            } else {
                this._rgfnode.addProp(new RGFProperty(action.name,action.arg,action.time));
            }
        }
    }
    if (this._action_list.length) this.status.duration=this._action_list[this._action_list.length-1].time;
    this.status.duration=(this.status.duration>0) ? this.status.duration : 0;

    // For testing:
    $('div#'+this.id+"_rgf").text(this.getRGF());
};

GameStream.prototype.writeRGF = function() {
    return RGFParser.writeRGF(this._rgftree);
};

GameStream.prototype.updatedStatus = function(newstatus) {
    // TODO...
};

GameStream.prototype.updatedTime = function(newstatus) {
    var next_time=newstatus.currentTime;
    // we only update the internal (this.status.time) clock if we still
    // have actions to process resp. if the "game stream" is
    // ahead of the "current time"
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
       If we reached the final game stream time we update the status accordingly. */

    while (this.status.time_index<this._action_list.length && this._action_list[this.status.time_index].time<=next_time) {
        /*  Since the SGFtree given by a KeyFrame should be _exactly_ identical to the SGFtree given by applying
            all actions up to that point, we don't need to apply the Keyframe here...
            Also note that the position argument has to remain valid throughout the game stream.
            I.e. it should always correspond to the position in the RGF tree.
            So the length of arrays in the tree may only increase and deleted indices may not be used
            again for new purposes (because the RGF tree behaves that way). */
        if (this._action_list[this.status.time_index].name!="KeyFrame") {
            this.board.apply(this._action_list[this.status.time_index]);
        } else if (this.status.time_index==0) {
            // ok, we apply the very first keyframe...
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
    while (0<=this.status.last_keyframe_index && this._action_list[this._keyframe_list[this.status.last_keyframe_index]].time<=next_time) {
        this.status.last_keyframe_index--;
    }
    this.status.last_keyframe_index++;

    this.status.time_index=this._keyframe_list[this.status.last_keyframe_index];

    // apply all actions up to next_time (a reduced version of advanceTo)
    // note that the first action is applying the KeyFrame...
    while (this.status.time_index<this._action_list.length && this._action_list[this.status.time_index].time<=next_time) {
        this.board.apply(this._action_list[this.status.time_index]);
        this.status.time_index++;
    }
};
