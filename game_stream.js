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
        max_duration:((max_duration>0) ? max_duration : Infinity),
        // true if the current time is ahead of the game stream (and the game stream has not ended)...
        waiting:false,
        ended:false
    }
    
    /* internal status */
    // current rgf node (equal to this._rgftree.descend(this._rgfpath))
    this._rgfnode=this._rgftree;
    // the last node from _action_list (equal to this._rgftree.descend(this._last_rgfpath))
    this._last_rgfnode=this._rgftree;

    /* The first action is set here to be an "empty" KeyFrame. Because it's the first action we have to set force=1... */
    this.queueTimedAction({time:-2, counter:0, name:"KeyFrame", arg:"", position:[], force:1});
    // called outside of GameStream since the board might not be ready yet:
    // this.update(0);
};

GameStream.prototype.queueTimedActionList=function(actions) {
    for(var i=0;i<actions.length;i++) {
        if (!this.queueTimedAction(actions[i])) {
            return false;
        }
    }
    return true;
}

// Adds a timed action to the end of _action_list. This is independant of the current time/position.
GameStream.prototype.queueTimedAction=function(action) {
    // make validity checks
    if (!action.force && action.time>=0) {
        if (action.time<this.status.duration.time) return false;
        if (action.time==this.status.duration.time && action.counter<=this.status.duration.counter) return false;
    }
    // TODO: support queueing timed Actions at earlier times...
    
    // modify keyframe list
    if (action.name=="KeyFrame") {
        this._keyframe_list.push(this._action_list.length);
    }
    // modify action list
    var new_action={time:action.time, counter: action.counter, name:action.name, arg:action.arg, position:action.position};
    this._action_list.push(new_action);

    // determine the new node
    var new_node=this._last_rgfnode;
    // (Just) the next line should make no difference: it is useful for testing/debugging but commented out normally
    // if (new_action.position==undefined) new_action.position=new_node.position;
    if (new_action.position!=undefined) {
        // if (action.name!="VT" || action.arg!="N") console.log("Warning: The position SHOULD always be changed with a VT[N] action (not with "+action.name+"["+action.arg+"])!!");
        new_node=this._rgftree.descend(pathToArray(new_action.position));
    }

    // modify rgf tree
    if (new_action.name=="KeyFrame") {
    } else {
        if (new_action.name==";") new_node=new_node.addNode(new RGFNode(new_action.time,new_action.counter));
        else new_node.addProp(new RGFProperty(new_action.name,new_action.arg,new_action.time,new_action.counter));
    }
    
    // set the node for the action
    new_action.node=new_node;

    // update the last postion, last node and duration, the same happens in insertAction (at the end)!
    this._last_rgfnode=new_node;
    this.status.duration.time=new_action.time;
    this.status.duration.counter=new_action.counter;

    // For testing:
    $('div#'+this.id+"_rgf").text(this.writeRGF());

    // TODO (UNSURE): Not running an update gives a way to exactly control _when_ updates are performed
    // bit this also means that usually update has to be called to synchronize the status and board with the game stream...
    // this.update(this.status.time);

    return true;
};

// Adds an action at the current time index if possible, return false if not.
GameStream.prototype.insertAction=function(action) {
    // GATHER DATA AND DO SOME CHECKS
    
    // determine the new node and action
    var new_node=this._rgfnode;
    if (action.position!=undefined) {
        // if (action.name!="VT" || action.arg!="N") console.log("Warning: The position SHOULD always be changed with a VT action (not with "+action.name+"["+action.arg+"])!!");
        new_node=this._rgftree.descend(pathToArray(action.position));
    }
    // this is the latest time/counter for the new_node subtree
    var stree_duration=new_node.getDuration();
    var new_action={name:action.name, arg:action.arg, position:action.position};
    // TODO: maybe grab the new time from media stream (as long as it doesn't change the action index)?
    new_action.time=this.status.time;
    new_action.counter=0;
    //set the new counter in case we insert an action at an already existing time
    if (action.name==";" && new_node.children.length) {
        var last_node=new_node.children[new_node.children.length-1];
        if (new_action.time==last_node.time) new_action.counter=last_node.counter+1;
    } else {
        if (new_action.time==stree_duration.time) new_action.counter=stree_duration.counter+1;
    }
    
    // until now no changes were made, now we first make some validity checks:
    // If board_player knows what he is doing he can ignore the checks and force an insertion...
    if (!action.force) {
        // ... otherwise we make sure that the action doesn't influence any already existing future actions
        // and return false if that might be the case.
        if (this.status.time_index===0) return false;
        if (action.name==";" && new_node.children.length) {
            var last_node=new_node.children[new_node.children.length-1];
            if (new_action.time<last_node.time) return false;
            //if (new_action.time==last_node.time && new_action.counter<=last_node.counter) return false;
        } else {
            if (new_action.time<stree_duration.time) return false;
            //if (new_action.time==stree_duration.time && new_action.counter<=stree_duration.counter) return false;
        }
        // we return false if there are keyframes after this action...
        if (this.status.last_keyframe_index<this._keyframe_list.length-1 || this.status.last_keyframe_index==this.status.time_index) {
            return false;
        }
    }
    

    // UPDATE THE KEYFRAME AND ACTION LIST

    // we also make sure that we jump to the the position of the next action when its time comes
    if (this.status.time_index<this._action_list.length) {
        // note that atm this.status.time_index points to the next action after our soon to be inserted one...
        var next_action=this._action_list[this.status.time_index];
        if (!next_action.position) {
            // TODO: we should insert a VT[N] event actually but that's not so easy... :-(
            if (next_action.name==";") next_action.position=next_action.node.parent.position;
            else next_action.position=next_action.node.position;
        }
    }

    // if the time already existed we have to update the counter of all later actions with the same time accordingly
    for (var j=this.status.time_index; j<this._action_list.length; j++) {
          if (this._action_list[j].time===new_action.time) {
              this._action_list[j].counter++;
          } else {
              break;
          }
    }

    if (action.name=="KeyFrame") this._keyframe_list.splice(this.status.last_keyframe_index+1,0,this.status.time_index);
    this._action_list.splice(this.status.time_index,0,new_action);


    // UPDATE THE RGF TREE

    if (new_action.name=="KeyFrame") {
    } else {
        if (new_action.name==";") new_node=new_node.addNode(new RGFNode(new_action.time,new_action.counter));
        else new_node.addProp(new RGFProperty(new_action.name,new_action.arg,new_action.time,new_action.counter));
    }

    // set the node for the action
    new_action.node=new_node;

    
    // UPDATE THE STATUS
    
    // In case we are changing the end of the action list: update the duration status
    // and the last rgf node accordingly. The same happens in queueActions (at the end)!
    if (this.status.time_index==this._action_list.length) {
        this._last_rgfnode=new_node;
        this.status.duration.time=new_action.time;
        this.status.duration.counter=new_action.counter;
    }

    // For testing:
    $('div#'+this.id+"_rgf").text(this.writeRGF());

    // update the time_index...
    this.update();
    return true;
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

GameStream.prototype.update = function(next_time) {
    if (next_time==undefined) next_time=this.status.time;
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
    if (this.status.time<=this.status.duration.time || this.status.ended) this.status.waiting=false;
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
        this.status.time_index++;
    }
    this.status.time=next_time;
};
