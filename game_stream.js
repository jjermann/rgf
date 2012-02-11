/*  GameStream
    ----------
    Responsible to keep track of applied changes, where we are in this chain and to update the
    current board drawing accordingly. It kind of "hijacks" the board...
*/
function GameStream(game_id,board,max_duration) {
    this.id=game_id;
    this.board=board;
    
    /* List of all KeyFrames:
       A KeyFrame describes how to get the whole current SGF tree and the current position.
       So a keyframe action at a certain time has to have a position argument corresponding
       to the now current position (note that the position is equal to the last position if it exists).
       The resulting SGF tree must be identical to the one we get by successively applying actions.
    */
    this._keyframe_list=[];
    // list of all actions
    this._action_list=[];
    // RGF tree/content
    this._rgftree=new RGFNode();

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
    
    /* internal status */
    // current rgf position
    this._rgfpath=[];
    // current rgf node (equal to this._rgftree.descend(this._rgfpath))
    this._rgfnode=this._rgftree;
    // the last position from _action_list
    this._last_rgfpath=[];
    // the last node from _action_list (equal to this._rgftree.descend(this._last_rgfpath))
    this._last_rgfnode=this._rgftree;

    /* The first action is set here to be an "empty" KeyFrame. */
    this.queueTimedActions([{time:-2, name:"KeyFrame", arg:"", position:[]}]);
    // called outside of GameStream:
    // this.update(0);
};

// Adds timed actions to the end of _action_list. This is independant of the current time/position.
// TODO: be more flexible with "initial" time, resp. the start of the _action_list...
GameStream.prototype.queueTimedActions=function(actions) {
    if (this._action_list.length && this._action_list[0].name!="KeyFrame") alert("The first Action must be a KeyFrame!");
    for(var i=0;i<actions.length;i++) {
        var action = actions[i];
        
        // modify action list
        if (action.name=="KeyFrame") {
            this._keyframe_list.push(this._action_list.length);
        }
        var new_action={time:action.time, name:action.name, arg:action.arg, position:action.position};
        this._action_list.push(new_action);

        // determine the new position and node
        var new_path=this._last_rgfpath;
        var new_node=this._last_rgfnode;
        if (action.position!=undefined) {
            if (action.position=="") new_path=[];
            else if (typeof action.position=='string') new_path=(action.position).split('.');
            else new_path=action.position;
            new_node=this._rgftree.descend(new_path);
        }

        // modify rgf tree
        if (action.name=="KeyFrame") {
        } else {
            // if a node is added
            if (action.name[0]==";") {
                new_path.push(new_node.children.length);
                new_node=new_node.addNode(new RGFNode(action.time));
                if (action.name==";") {
                } else if (action.name==";B") {
                    new_node.addProp(new RGFProperty("B",action.arg,action.time));
                } else if (action.name==";W") {
                    new_node.addProp(new RGFProperty("W",action.arg,action.time));
                } else {
                    alert("Invalid node action: "+action.name);
                }
            // if a property is added
            } else {
                new_node.addProp(new RGFProperty(action.name,action.arg,action.time));
            }
        }
        
        // set the node for the action
        new_action.node=new_node;

        // update the last postion and node
        this._last_rgfpath=new_path;
        this._last_rgfnode=new_node;
    }
    if (this._action_list.length) this.status.duration=this._action_list[this._action_list.length-1].time;
    this.status.duration=(this.status.duration>0) ? this.status.duration : 0;

    // For testing:
    $('div#'+this.id+"_rgf").text(this.writeRGF());
};

// Adds an action at the current time index if possible, return false if not.
GameStream.prototype.insertAction=function(action) {
    action.time=this.status.time;

    if (this.status.time_index===0 && action.name!="KeyFrame") {
        alert("The first Action must be a KeyFrame!");
        return false;
    }
    if (this.status.time_index==this._action_list.length) {
        // NOWTODO: maybe we want to clearly distinguish between queuing and inserting (not done yet here)!!
        // But in that case we would have to update this._last_* and this.status.duration too!
        this.queueTimedActions([action]);
        return true;
    }

    // determine the new position and node
    var new_path=this._rgfpath;
    var new_node=this._rgfnode;
    if (action.position!=undefined) {
        if (action.position=="") new_path=[];
        else if (typeof action.position=='string') new_path=(action.position).split('.');
        else new_path=action.position;
        new_node=this._rgftree.descend(new_path);
    }

    // If board_player knows what he is doing he can force an insertion...
    if (!action.force) {
        // ... Otherwise we make sure that the action doesn't influence any already existing future actions
        // and return false if that was the case.
        // if (new_node.time>=action.time) return false;
        if (action.name[0]==";") {
            if (new_node.children.length && new_node.children[new_node.children.length-1].time>=action.time) return false;
        } else {
            if (new_node.getDuration()>=action.time) return false;
        }
    }
    // For simplicity we force that the action has to have an as of yet unused time.
    if (this._action_list.length>0 && action.time==this._action_list[this.status.time_index].time) {
        return false;
    }
    if (this.status.time_index<this._action_list.length && action.time==this._action_list[this.status.time_index].time) {
        return false;
    }
    
    // since we insert a property inbetween we have to update the keyframe list accordingly
    for (var i=this.status.last_keyframe_index+1;i<this._keyframe_list.length; i++) {
        this._keyframe_list[i]++;
    }
    
    // modify action list
    if (action.name=="KeyFrame") {
        this._keyframe_list.splice(this.status.last_keyframe_index+1,0,this.status.time_index);
        // TODO: parse the KeyFrame?
    }
    var new_action={time:action.time, name:action.name, arg:action.arg, position:action.position};
    this._action_list.splice(this.status.time_index,0,new_action);

    // modify/update rgf tree
    if (action.name=="KeyFrame") {
    } else {
        // if a node is added
        if (action.name[0]==";") {
            new_path.push(new_node.children.length);
            new_node=new_node.addNode(new RGFNode(action.time));
            if (action.name==";") {
            } else if (action.name==";B") {
                new_node.addProp(new RGFProperty("B",action.arg,action.time));
            } else if (action.name==";W") {
                new_node.addProp(new RGFProperty("W",action.arg,action.time));
            } else {
                alert("Invalid node action: "+action.name);
            }
        // if a property is added
        } else {
            new_node.addProp(new RGFProperty(action.name,action.arg,action.time));
        }
    }

    // set the node for the action
    new_action.node=new_node;
    
    // For testing:
    $('div#'+this.id+"_rgf").text(this.writeRGF());

    // only here the status and internal status is updated
    this.update(this.status.time);
    return true;
};

GameStream.prototype.writeRGF = function() {
    var output=RGFParser.writeRGF(this._rgftree);
    // TODO: maybe make this check somewhere else
    if (output=="") output=";TS[0]";
    return output;
};

GameStream.prototype.updatedStatus = function(newstatus) {
    // TODO...
};

GameStream.prototype.updatedTime = function(newstatus) {
    // TODO: maybe more happens depending on the new status...
    this.update(newstatus.currentTime);
};

GameStream.prototype.update = function(next_time) {
    if (next_time>=this.status.time) {
        this._advanceTo(next_time);
    } else {
        this._reverseTo(next_time);
    }

    // maybe the GS is past (or equal to) its final time in which case it has ended.
    if (this.status.time>=this.status.max_duration) this.status.ended=true;
    else this.status.ended=false;
    // maybe the GS is behind the media stream but still has not ended
    // in which case we are "waiting" for recording commands...
    if (this.status.time<=this.status.duration || this.status.ended) this.status.waiting=false;
    else this.status.waiting=true;
};

GameStream.prototype._advanceTo = function(next_time) {
    /* Applies all actions from the current time_index (resp. this.status.time) up to next_time.
       The last_keyframe_index is also updated. */

    while (this.status.time_index<this._action_list.length && this._action_list[this.status.time_index].time<=next_time) {
        var action=this._action_list[this.status.time_index];

        /*  Since the SGFtree given by a KeyFrame should be _exactly_ identical to the SGFtree given by applying
            all actions up to that point, we don't need to apply the Keyframe here...
            Also note that the position argument has to remain valid throughout the game stream.
            I.e. it should always correspond to the position in the RGF tree.
            So the length of arrays in the tree may only increase and deleted indices may not be used
            again for new purposes (because the RGF tree behaves that way). */
        if (action.name!="KeyFrame") {
            this.board.apply(action);
        } else if (this.status.time_index==0) {
            // ok, we apply the very first keyframe...
            this.board.apply(action);
        }

        // update the current node position, the current node and the current time index
        this._rgfnode=action.node;
        if (action.node.position=="") this._rgfpath=[];
        else if (typeof action.node.position=='string') this._rgfpath=(action.node.position).split('.');
        else this._rgfpath=action.node.position;
        this.status.time_index++;
    }

    while (this.status.last_keyframe_index<this._keyframe_list.length && this._keyframe_list[this.status.last_keyframe_index]<=this.status.time_index) {
        this.status.last_keyframe_index++;
    }
    this.status.last_keyframe_index--;
    this.status.time=next_time;
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
        var action=this._action_list[this.status.time_index];

        this.board.apply(action);

        // update the current node position, the current node and the current time index
        this._rgfnode=action.node;
        if (action.node.position=="") this._rgfpath=[];
        else if (typeof action.node.position=='string') this._rgfpath=(action.node.position).split('.');
        else this._rgfpath=action.node.position;
        this.status.time_index++;
    }
    this.status.time=next_time;
};
