/*  GameStream
    ----------
    Responsible to keep track of applied changes, where we are in this chain and to update the
    current board drawing accordingly. It kind of "hijacks" the board...
*/
function GameStream(gameId,maxDuration) {
    this.id=gameId;
    
    /* List of all KeyFrames:
       A KeyFrame describes how to get the whole current SGF tree and the current position.
       So a keyframe action at a certain time has to have a position argument corresponding
       to the now current position (note that the position is equal to the last position if it exists).
       The resulting SGF tree must be identical to the one we get by successively applying actions.
    */
    this._keyframeList=[];
    // list of all actions
    this._actionList=[];
    // RGF tree/content
    this._rgfTree=new RGFNode();

    /* status information */
    this.status = {
        // current game stream time
        time:-2,
        // current counter for the current game stream time
        timeCounter:0,
        // current global action index
        timeIndex:0,
        // last (global) keyframe index before this.status.timeIndex
        lastKeyframeIndex:0,
        // current game stream duration (the time and counter are equal to the time and counter of the last entry in the action list)
        duration:{time:-2, counter:0},
        maxDuration:((maxDuration!=null) ? maxDuration : Infinity),
        // setup => no timestamped action has been added yet
        // waiting => true if the current time/counter is ahead of the game stream (and the game stream has not ended)
        // ended => true if the current time is equal to or ahead of the maximal duration of the game stream
        setup:true,
        waiting:false,
        ended:false,
        // inControl => if the timeupdates of MediaStream should not be applied but instead be stored in "timeStored"
        inControl:false,
        timeStored:undefined
    }
    
    /* The first action is set here to be an "empty" KeyFrame. Because it's the first action we have to set force=1... */
    this.queueTimedAction({time:-2, counter:0, name:"KeyFrame", arg:"", position:[], force:1});
    // called outside of GameStream since the board might not be ready yet:
    // this.update(0);


    var self=this;
    
    this.onStatusChange = function(newStatus) {
        // TODO...
    }

    this.onTimeChange = function(newStatus) {
        // TODO: maybe more happens depending on the new status...
        if (self.status.inControl) {
            // TODO: maybe we need to store the whole newStatus using e.g. deepClone?
            // But since performance is an issue here it just stores currentTime for now...
            self.status.storedTime=newStatus.currentTime;
        } else if ((newStatus.currentTime==0 && self.status.time>0) || (newStatus.currentTime >0 && newStatus.currentTime!=self.status.time)) {
            self.update(newStatus.currentTime);
        }
    }

    this.onInsertActions = function(actions) {
        self.applyActionList(actions);
    }
};

GameStream.prototype.attachStream = function (stream) {
    this.attachedStream = stream;

    stream.bind('statusChange', this.onStatusChange);
    stream.bind('timeChange', this.onTimeChange);
};

GameStream.prototype.detachStream = function () {
    stream = this.attachedStream;

    stream.unbind('statusChange', this.onStatusChange);
    stream.unbind('timeChange', this.onTimeChange);
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

// Adds a timed action into the _actionList and _rgfTree. This _doesn't_ update the game stream!
GameStream.prototype.queueTimedAction=function(action) {
    // GATHER SOME DATA
    var newAction={name:action.name, arg:action.arg, position:action.position, time:action.time, counter:action.counter};
    
    var timeIndex, newNode, lastKeyframeIndex;
    // get the timeIndex (where to insert in the action list)
    if (action.time>this.status.duration.time || (action.time==this.status.duration.time && action.counter>this.status.duration.counter)) {
        timeIndex=this._actionList.length;
    } else {
        timeIndex=this._getIndex(action.time, action.counter);
    }
    // get the newNode (where to insert in the rgf tree)
    if (action.position!=undefined) {
        // if (action.name!="VT" || action.arg!="N") console.log("Warning: The position SHOULD always be changed with a VT action (not with "+action.name+"["+action.arg+"])!!");
        newNode=this._rgfTree.descend(pathToArray(action.position));
    } else if (timeIndex>0) {
        newNode=this._actionList[timeIndex-1].node;
    } else {
        newNode=this._rgfTree;
    }
    // get the last keyframe index
    lastKeyframeIndex=0;
    while (lastKeyframeIndex<this._keyframeList.length && this._keyframeList[lastKeyframeIndex]<=timeIndex) {
        lastKeyframeIndex++;
    }
    lastKeyframeIndex--;


    // VALIDITY CHECK

    // If the player knows what he is doing he can ignore the checks and force an insertion,
    // otherwise we make sure that the action doesn't influence any already existing future actions
    // and return false if that might be the case.

    if (!action.force) {
        if (action.time>this.status.maxDuration || (action.time==this.status.maxDuration && action.counter>0)) {
            return false;
        } else if (timeIndex===0) {
            return false;
        } else if (timeIndex<this._actionList.length) {
            // this is the latest durationtime/counter for the newNode subtree
            var streeDuration=newNode.getDuration();
            if (action.name==";" && newNode.children.length) {
                var lastNode=newNode.children[newNode.children.length-1];
                if (newAction.time<lastNode.time) return false;
                if (newAction.time==lastNode.time && newAction.counter<=lastNode.counter) return false;
            } else {
                if (newAction.time<streeDuration.time) return false;
                if (newAction.time==streeDuration.time && newAction.counter<=streeDuration.counter) return false;
            }
            // we return false if there are keyframes after this action...
            if (lastKeyframeIndex<this._keyframeList.length-1 || lastKeyframeIndex==timeIndex) {
                return false;
            }
        }
    }


    // UPDATE THE KEYFRAME AND ACTION LIST

    // this is the case where we insert something before the end, so we need to modify the remaining part accordingly...
    if (timeIndex<this._actionList.length) {
        // we make sure that we jump to the the position of the next action when its time comes
        // note that timeIndex points to the next action after our soon to be inserted one...
        var nextAction=this._actionList[timeIndex];
        if (!nextAction.position) {
            // TODO: we should maybe insert a VT[N] event instead but that's not so easy... :-(
            if (nextAction.name==";") nextAction.position=nextAction.node.parent.position;
            else nextAction.position=nextAction.node.position;
        }
        // update the counters if necessary
        this._updateCounters(timeIndex,newAction.time,false);
    // and this is the case if we insert something at the end, in which case we have to update the duration status accordingly
    } else {
        this.status.duration.time=newAction.time;
        this.status.duration.counter=newAction.counter;
        if (this.status.duration.time>=0) this.status.setup=false;
    }

    if (action.name=="KeyFrame") this._keyframeList.splice(lastKeyframeIndex+1,0,timeIndex);
    this._actionList.splice(timeIndex,0,newAction);


    // UPDATE THE RGF TREE

    if (newAction.name=="KeyFrame") {
    } else {
        if (newAction.name==";") newNode=newNode.addNode(new RGFNode(newAction.time,newAction.counter));
        else newNode.addProp(new RGFProperty(newAction.name,newAction.arg,newAction.time,newAction.counter));
    }

    // set the node for the action
    newAction.node=newNode;

    // For testing:
    $('div#'+this.id+"_rgf").text(this.writeRGF());

    return true;
};

// Used to either increase or decrease all counters of actions starting from the given time index, it also modifies the rgf tree nodes resp. properties
GameStream.prototype._updateCounters=function(timeIndex,time,decrease) {
    for (var j=timeIndex; j<this._actionList.length; j++) {
        var tmpAction=this._actionList[j];
        if (tmpAction.time===time) {
            if (tmpAction.name=="KeyFrame") {
            } else if (tmpAction.name==";") {
                if (decrease) tmpAction.node.counter--;
                else tmpAction.node.counter++;
            } else {
                for (var k=0; k<tmpAction.node.properties.length; k++) {
                    if (tmpAction.node.properties[k].time==tmpAction.time && tmpAction.node.properties[k].counter==tmpAction.counter) {
                        if (decrease) tmpAction.node.properties[k].counter--;
                        else tmpAction.node.properties[k].counter++;
                        break;
                    }
                }
            }
            if (decrease) tmpAction.counter--;
            else tmpAction.counter++;
        } else {
            break;
        }
    }
};

// TODO: UNTESTED, assumes that a validity check has already been done and doesn't update any status
GameStream.prototype._removeTree=function(node,lowerBound) {
    var nodeIndex=this._getIndex(node.time,node.counter,lowerBound)-1;
    
    for (var i=0; i<node.children.length; i++) {
        this._removeTree(node.children[i],nodeIndex);
    }
    for (var i=0; i<node.properties.length; i++) {
        var prop=node.properties[i];
        var propIndex=this._getIndex(prop.time,prop.counter,nodeIndex)-1;
        this._updateCounters(propIndex+1,prop.time,true);
        this._actionList.splice(propIndex,1);
    }
    
    this._updateCounters(nodeIndex+1,node.time,true);
    this._actionList.splice(nodeIndex,1);
};

// TODO: UNTESTED
GameStream.prototype.removeAction=function(index,force) {
    var action=this._actionList[index];

    // VALIDITY CHECKS (for removing a property)
    if (!force) {
        if (index<=0 || index>=this._actionList.length) return false;
        if (this._keyframeList[this._keyframeList.length-1]>=index) return false;

        if (action.name==";") {
            var index=pathToArray(action.node.position);
            index=index[index.length-1];
            if (index<action.node.parent.children.length-1) return false;
        } else {
            var streeDuration=action.node.getDuration();
            if (action.time<streeDuration.time) return false;
            if (action.time==streeDuration.time && action.counter<streeDuration.counter) return false;
        }
    }

    if (action.name=="KeyFrame") {
        for (var i=0; i<this._keyframeList.length; i++) {
            if (this._keyframeList[i]==index) {
                this._keyframeList.splice(i,1);
                break;
            }
        }
        this._updateCounters(index+1,action.time,true);
        this._actionList.splice(index,1);
    } else if (action.name==";") {
        this._removeTree(action.node,force,index);
    } else {
        this._updateCounters(index+1,action.time,true);
        this._actionList.splice(index,1);
    }
    
    // update the duration
    this.status.duration.time=this._actionList[this._actionList.length-1].time;
    this.status.duration.counter=this._actionList[this._actionList.length-1].counter;
    if (this.status.duration.time<0) this.status.setup=true;
    return true;
};

// Adds one or more actions at the current time (a timeupdate is performed) if that time still corresponds
// to the time of the board, otherwise return false. It also returns false if the insertion of an action failed.
GameStream.prototype.applyActionList=function(actions) {
    // update the current time without applying it yet
    var oldControl=this.status.inControl;
    this.status.inControl=true;
    this.status.storedTime=undefined;
    this.updateCurrentTime();
    this.status.inControl=oldControl;

    // VALIDITY CHECK: If the new time doesn't effect the board we update it, otherwise we return false
    // We do nothing if the times agree (so we can still keep track of the counters)
    if (this.status.storedTime==undefined) {
        console.log("Warning: The time should have been updated but it was not (maybe the media stream is not ready)!");
    } else if (this.status.storedTime!=this.status.time) {
        var lowerBound=0;
        var upperBound=Infinity;
        if (this.status.timeIndex>1 && this._actionList[this.status.timeIndex-2].time>=0) {
            lowerBound=this._actionList[this.status.timeIndex-2].time;
        }
        if (this.status.timeIndex<this._actionList.length-1 && this._actionList[this.status.timeIndex].time>=0) {
            upperBound=this._actionList[this.status.timeIndex].time;
        }
        if (this.status.storedTime <= lowerBound || this.status.storedTime >= upperBound) {
            return false;
        } else {
            this.update(this.status.storedTime);
        }
    }

    if (Array.isArray(actions)) {
        for(var i=0;i<actions.length;i++) {
            if (!this._insertAction(actions[i])) {
                // TODO: revert all previous changes...
                return false;
            }
        }
    } else {
        if (!this._insertAction(actions)) return false;
    }
    return true;
}

// Adds an action at the current time index if possible, return false if not.
// Not timeupdate is performed!
GameStream.prototype._insertAction=function(action) {
    var newAction={name:action.name, arg:action.arg, position:action.position};
    var timeIndex=this.status.timeIndex;
    newAction.time=this.status.time;
    newAction.counter=0;
    // set the new counter in case we insert an action at an already existing time
    if (newAction.time>=0 && this._actionList[timeIndex-1].time===newAction.time) {
        newAction.counter=this._actionList[timeIndex-1].counter+1;
    }
    if (this.queueTimedAction(newAction)) {
        this.update(newAction.time,newAction.counter);
        return true;
    } else {
        return false;
    }
};

// Returns the time index right after the action corresponding to the supplied time
GameStream.prototype._getIndex = function(time,counter,lowerBound) {
    if (lowerBound==undefined) lowerBound=0;
    if (counter==undefined) counter=0;

    var i=lowerBound;
    while (i<this._actionList.length && this._actionList[i].time<time) i++;
    while (i<this._actionList.length && this._actionList[i].time===time && this._actionList[i].counter<=counter) i++;

    return i;
};
                        
GameStream.prototype.writeRGF = function(node,base) {
    var output=this._rgfTree.writeRGF(node,base);
    // TODO: maybe make this check somewhere else
    if (output=="") output=";TS[0]";
    return output;
};


GameStream.prototype.updateCurrentTime = function() {
    this.status.storedTime=this.status.time;
};

GameStream.prototype.update = function(nextTime,nextCounter) {
    if (nextTime==undefined) {
        nextTime=this.status.time;
        nextCounter=this.status.timeCounter;
    } else if (nextCounter==undefined) {
        nextCounter=Infinity;
    }
    if (nextTime>this.status.time || (nextTime==this.status.time && nextCounter>=this.status.timeCounter)) {
        this._advanceTo(nextTime,nextCounter);
    } else {
        this._reverseTo(nextTime,nextCounter);
    }

    // maybe the GS is past (or equal to) its final time in which case it has ended.
    if (this.status.time>=this.status.maxDuration) this.status.ended=true;
    else this.status.ended=false;
    // maybe the GS is behind the media stream but still has not ended
    // in which case we are "waiting" for recording commands...
    if (this.status.time<this.status.duration.time || this.status.ended || (this.status.time==this.status.duration.time && this.status.timeCounter < this.status.duration.counter) ) this.status.waiting=false;
    else this.status.waiting=true;
};

/* Applies all actions from the current timeIndex (resp. this.status.time) up to nextTime.
   The lastKeyframeIndex is also updated. */
GameStream.prototype._advanceTo = function(nextTime,nextCounter) {
    if (nextCounter==undefined) nextCounter=Infinity;

    var i=this.status.timeIndex;
    while (i<this._actionList.length && this._actionList[i].time<=nextTime) {
        if (this._actionList[i].time==nextTime) {
            if (this._actionList[i].counter > nextCounter) break;
            else this.status.timeCounter=this._actionList[i].counter;
        } else {
            this.status.timeCounter=0;
        }
        var action=this._actionList[i];

        /*  Since the SGFtree given by a KeyFrame should be _exactly_ identical to the SGFtree given by applying
            all actions up to that point, we don't need to apply the Keyframe here...
            Also note that the position argument has to remain valid throughout the game stream.
            I.e. it should always correspond to the position in the RGF tree.
            So the length of arrays in the tree may only increase and deleted indices may not be used
            again for new purposes (because the RGF tree behaves that way). */
        if (action.name!="KeyFrame") {
            this.trigger('applyAction',action);
        } else if (this.status.timeIndex==0) {
            // ok, we apply the very first keyframe...
            this.trigger('applyAction',action);
        }

        i++;
    }

    this.status.timeIndex=i;
    this.status.time=nextTime;
    while (this.status.lastKeyframeIndex<this._keyframeList.length && this._keyframeList[this.status.lastKeyframeIndex]<=this.status.timeIndex) {
        this.status.lastKeyframeIndex++;
    }
    this.status.lastKeyframeIndex--;
};

/* Loads the last KeyFrame before nextTime (and also sets the lastKeyframeIndex to this KeyFrame).
   Then it applies all actions up to nextTime... */
GameStream.prototype._reverseTo = function(nextTime,nextCounter) {
    if (nextCounter==undefined) nextCounter=Infinity;
       
    // jump to the last KeyFrame before nextTime
    if (nextTime<-1) {
        this.status.lastKeyframeIndex=0;
    } else {
        // we assume that keyframes have no counters (resp. ignore the rest)
        while (0<=this.status.lastKeyframeIndex && this._actionList[this._keyframeList[this.status.lastKeyframeIndex]].time>=nextTime) {
            this.status.lastKeyframeIndex--;
        }
    }

    var i=this._keyframeList[this.status.lastKeyframeIndex];

    // apply all actions up to nextTime (a reduced version of advanceTo)
    // note that the first action is applying the KeyFrame...
    while (i<this._actionList.length && this._actionList[i].time<=nextTime) {
        if (this._actionList[i].time==nextTime) {
            if (this._actionList[i].counter > nextCounter) break;
            else this.status.timeCounter=this._actionList[i].counter;
        } else {
            this.status.timeCounter=0;
        }
        
        var action=this._actionList[i];
        this.trigger('applyAction',action);

        i++;
    }
    this.status.timeIndex=i;
    this.status.time=nextTime;
};

// Step <steps> number of actions forward resp. backward (if steps < 0).
// If noInitial is true the initial part (time==-1) is skipped over
// If an ignore list is given all actions with a name from that list are skipped
GameStream.prototype.step = function(steps,noInitial,ignoreList,isWhiteList) {
    var i=this.status.timeIndex-1;
    var nextAction=this._actionList[i];

    if (steps>0) {
        for (var step=0; step<steps; step++) {
            if (i<this._actionList.length-1) i++;

            if (noInitial) {
                while (i<this._actionList.length-1 && this._actionList[i].time<0) {
                    i++;
                }
            }
        
            nextAction=this._actionList[i];
            while (i<this._actionList.length-1) {
                var found=(ignoreList.indexOf(nextAction.name)!=-1);
                if (found && (isWhiteList) || (!found) && (!isWhiteList)) {
                    break;
                }
                i++;
                nextAction=this._actionList[i];
            }
            
            if (i==this._actionList.length-1) break;
        }
    } else if (steps<0) {
        for (var step=0; step<(-steps); step++) {
            if (noInitial) {
                if (this._actionList[i].time<0) {
                    break;
                }
            }
            if (i>0) i--;

            nextAction=this._actionList[i];
            while (i>0) {
                var found=(ignoreList.indexOf(nextAction.name)!=-1);
                if (found && (isWhiteList) || (!found) && (!isWhiteList)) {
                    break;
                }
                if (noInitial) {
                    if (this._actionList[i].time<0) {
                        break;
                    }
                }
                if (i>0) i--;
                nextAction=this._actionList[i];
            }

            if (i==0) break;
        }
    }
    if (i==this._actionList.length-1 && nextAction.time<0) {
        this.update(0);
    } else {
        this.update(nextAction.time,nextAction.counter);
    }
};

asEvented.call(GameStream.prototype);
