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
        time:-2,
        // current counter for the current game stream time
        time_counter:0,
        // current global action index
        time_index:0,
        // last (global) keyframe index before this.status.time_index
        last_keyframe_index:0,
        // current game stream duration (the time and counter are equal to the time and counter of the last entry in the action list)
        duration:{time:-2, counter:0},
        max_duration:((max_duration!=null) ? max_duration : Infinity),
        // setup => no timestamped action has been added yet
        // waiting => true if the current time/counter is ahead of the game stream (and the game stream has not ended)
        // ended => true if the current time is equal to or ahead of the maximal duration of the game stream
        setup:true,
        waiting:false,
        ended:false
    }
    
    /* The first action is set here to be an "empty" KeyFrame. Because it's the first action we have to set force=1... */
    this.queueTimedAction({time:-2, counter:0, name:"KeyFrame", arg:"", position:[], force:1});
    // called outside of GameStream since the board might not be ready yet:
    // this.update(0);
};

// TODO: support insertions inbetween
GameStream.prototype.applyTimedActionList=function(actions) {
    if (Array.isArray(actions)) {
        for(var i=0;i<actions.length;i++) {
            if (!this.queueTimedAction(actions[i])) {
                // TODO: revert all previous changes?
                return false;
            }
        }
    } else {
        if (!this.queueTimedAction(actions)) return false;
    }
    this.update();
    return true;
}

// Adds a timed action to the end of _action_list. This is independant of the current time/position.
GameStream.prototype.queueTimedAction=function(action) {
    // GATHER SOME DATA
    var new_action={name:action.name, arg:action.arg, position:action.position, time:action.time, counter:action.counter};
    
    var time_index, new_node, last_keyframe_index;
    // get the time_index (where to insert in the action list)
    if (action.time<0 || action.time>this.status.duration.time || (action.time==this.status.duration.time && action.counter>this.status.duration.counter)) {
        time_index=this._action_list.length;
    } else {
        time_index=this._getIndex(action.time, action.counter);
    }
    // get the new_node (where to insert in the rgf tree)
    if (action.position!=undefined) {
        // if (action.name!="VT" || action.arg!="N") console.log("Warning: The position SHOULD always be changed with a VT action (not with "+action.name+"["+action.arg+"])!!");
        new_node=this._rgftree.descend(pathToArray(action.position));
    } else if (time_index>0) {
        new_node=this._action_list[time_index-1].node;
    } else {
        new_node=this._rgftree;
    }
    // get the last keyframe index
    last_keyframe_index=0;
    while (last_keyframe_index<this._keyframe_list.length && this._keyframe_list[last_keyframe_index]<=time_index) {
        last_keyframe_index++;
    }
    last_keyframe_index--;


    // VALIDITY CHECK

    // If the player knows what he is doing he can ignore the checks and force an insertion,
    // otherwise we make sure that the action doesn't influence any already existing future actions
    // and return false if that might be the case.

    if (!action.force) {
        if (action.time<0) {
            if (!this.status.setup) return false;
            if (action.time!==-1 || action.counter>0) return false;
            if (action.name=="KeyFrame") return false;
        } else if (action.time>this.status.max_duration || (action.time==this.status.max_duration && action.counter>0)) {
            return false;
        } else if (time_index===0) {
            return false;
        } else if (time_index<this._action_list.length) {
            // this is the latest durationtime/counter for the new_node subtree
            var stree_duration=new_node.getDuration();
            if (action.name==";" && new_node.children.length) {
                var last_node=new_node.children[new_node.children.length-1];
                if (new_action.time<last_node.time) return false;
                if (new_action.time==last_node.time && new_action.counter<=last_node.counter) return false;
            } else {
                if (new_action.time<stree_duration.time) return false;
                if (new_action.time==stree_duration.time && new_action.counter<=stree_duration.counter) return false;
            }
            // we return false if there are keyframes after this action...
            if (last_keyframe_index<this._keyframe_list.length-1 || last_keyframe_index==time_index) {
                return false;
            }
        }
    }


    // UPDATE THE KEYFRAME AND ACTION LIST

    // this is the case where we insert something before the end, so we need to modify the remaining part accordingly...
    if (time_index<this._action_list.length) {
        // we make sure that we jump to the the position of the next action when its time comes
        // note that time_index points to the next action after our soon to be inserted one...
        var next_action=this._action_list[time_index];
        if (!next_action.position) {
            // TODO: we should insert a VT[N] event actually but that's not so easy... :-(
            if (next_action.name==";") next_action.position=next_action.node.parent.position;
            else next_action.position=next_action.node.position;
        }
        // if the time already existed we have to update the counter of all later actions with the same time accordingly
        for (var j=time_index; j<this._action_list.length; j++) {
            var tmp_action=this._action_list[j];
            if (tmp_action.time===new_action.time) {
                // ALSO UPDATE THE COUNTER IN THE RGF TREE
                if (tmp_action.name=="KeyFrame") {
                } else if (tmp_action.name==";") {
                    tmp_action.node.counter++;
                } else {
                    for (var k=0; k<tmp_action.node.properties.length; k++) {
                        if (tmp_action.node.properties[k].time==tmp_action.time && tmp_action.node.properties[k].counter==tmp_action.counter) {
                            tmp_action.node.properties[k].counter++;
                            break;
                        }
                    }
                    alert("should not happen...");
                }
                tmp_action.counter++;
            } else {
                break;
            }
        }
    // and this is the case if we insert something at the end, in which case we have to update the duration status accordingly
    } else {
        this.status.duration.time=new_action.time;
        this.status.duration.counter=new_action.counter;
        if (this.status.duration.time>=0) this.status.setup=false;
    }

    if (action.name=="KeyFrame") this._keyframe_list.splice(last_keyframe_index+1,0,time_index);
    this._action_list.splice(time_index,0,new_action);


    // UPDATE THE RGF TREE

    if (new_action.name=="KeyFrame") {
    } else {
        if (new_action.name==";") new_node=new_node.addNode(new RGFNode(new_action.time,new_action.counter));
        else new_node.addProp(new RGFProperty(new_action.name,new_action.arg,new_action.time,new_action.counter));
    }

    // set the node for the action
    new_action.node=new_node;

    // For testing:
    $('div#'+this.id+"_rgf").text(this.writeRGF());

    return true;
};

GameStream.prototype.applyActionList=function(actions) {
    // TODO (maybe): update to the new time from media stream (as long as it doesn't change the action index)?
    if (Array.isArray(actions)) {
        for(var i=0;i<actions.length;i++) {
            if (!this.insertAction(actions[i])) {
                // TODO: revert all previous changes...
                return false;
            }
        }
    } else {
        if (!this.insertAction(actions)) return false;
    }
    return true;
}

// Adds an action at the current time index if possible, return false if not.
GameStream.prototype.insertAction=function(action) {
    var new_action={name:action.name, arg:action.arg, position:action.position};
    var time_index=this.status.time_index;
    new_action.time=this.status.time;
    new_action.counter=0;
    // set the new counter in case we insert an action at an already existing time
    if (new_action.time>=0 && this._action_list[time_index-1].time===new_action.time) {
        new_action.counter=this._action_list[time_index-1].counter+1;
    }
    if (this.queueTimedAction(new_action)) {
        this.update(new_action.time,new_action.counter);
        return true;
    } else {
        return false;
    }
};

// Returns the time index right after the action corresponding to the supplied time
GameStream.prototype._getIndex = function(time,counter,lower_bound) {
    if (lower_bound==undefined) lower_bound=0;
    if (counter==undefined) counter=0;

    var i=lower_bound;
    while (i<this._action_list.length && this._action_list[i].time<time) i++;
    while (i<this._action_list.length && this._action_list[i].time===time && this._action_list[i].counter<=counter) i++;

    return i;
};
                        
GameStream.prototype.writeRGF = function(node,base) {
    var output=this._rgftree.writeRGF(node,base);
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

GameStream.prototype.update = function(next_time,next_counter) {
    if (next_time==undefined) {
        next_time=this.status.time;
        next_counter=this.status.time_counter;
    } else if (next_counter==undefined) {
        next_counter=Infinity;
    }
    if (next_time>=this.status.time) {
        this._advanceTo(next_time,next_counter);
    } else {
        this._reverseTo(next_time,next_counter);
    }

    // maybe the GS is past (or equal to) its final time in which case it has ended.
    if (this.status.time>=this.status.max_duration) this.status.ended=true;
    else this.status.ended=false;
    // maybe the GS is behind the media stream but still has not ended
    // in which case we are "waiting" for recording commands...
    if (this.status.time<this.status.duration.time || this.status.ended || (this.status.time==this.status.duration.time && this.status.time_counter < this.status.duration.counter) ) this.status.waiting=false;
    else this.status.waiting=true;
};

/* Applies all actions from the current time_index (resp. this.status.time) up to next_time.
   The last_keyframe_index is also updated. */
GameStream.prototype._advanceTo = function(next_time,next_counter) {
    if (next_counter==undefined) next_counter=Infinity;

    var i=this.status.time_index;
    while (i<this._action_list.length && this._action_list[i].time<=next_time) {
        if (this._action_list[i].time==next_time) {
            if (this._action_list[i].counter > next_counter) break;
            else this.status.time_counter=this._action_list[i].counter;
        } else {
            this.status.time_counter=0;
        }
        var action=this._action_list[i];

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

        i++;
    }

    this.status.time_index=i;
    this.status.time=next_time;
    while (this.status.last_keyframe_index<this._keyframe_list.length && this._keyframe_list[this.status.last_keyframe_index]<=this.status.time_index) {
        this.status.last_keyframe_index++;
    }
    this.status.last_keyframe_index--;
};

/* Loads the last KeyFrame before next_time (and also sets the last_keyframe_index to this KeyFrame).
   Then it applies all actions up to next_time... */
GameStream.prototype._reverseTo = function(next_time,next_counter) {
    if (next_counter==undefined) next_counter=Infinity;
       
    // jump to the last KeyFrame before next_time
    while (0<=this.status.last_keyframe_index && this._action_list[this._keyframe_list[this.status.last_keyframe_index]].time>=next_time) {
        this.status.last_keyframe_index--;
    }
    // we assume that keyframes have no counters (resp. ignore the rest)

    var i=this._keyframe_list[this.status.last_keyframe_index];

    // apply all actions up to next_time (a reduced version of advanceTo)
    // note that the first action is applying the KeyFrame...
    while (i<this._action_list.length && this._action_list[i].time<=next_time) {
        if (this._action_list[i].time==next_time) {
            if (this._action_list[i].counter > next_counter) break;
            else this.status.time_counter=this._action_list[i].counter;
        } else {
            this.status.time_counter=0;
        }
        
        var action=this._action_list[i];
        this.board.apply(action);

        i++;
    }
    this.status.time_index=i;
    this.status.time=next_time;
};
