/*  GameStream
    ----------
    Keeps track of the current time and currently applied actions from the RGF game
*/
function GameStream(gsId,rgfGame) {
    var self = this;
    
    self.id = gsId;
    self.rgfGame = (rgfGame) ? rgfGame: new RGFGame(gsId+"_game");

    /* status information */
    self.status = {
        // current game stream time
        time:-2,
        // current counter for the current game stream time
        timeCounter:0,
        // current global action index
        timeIndex:0,
        // last (global) keyframe index before this.status.timeIndex
        lastKeyframeIndex:0,
        // waiting => true if the GS time/counter is not behind the duration of the rgfGame
        waiting:false,
        // inControl => if the timeupdates of MediaStream should not be applied but instead be stored in "timeStored"
        inControl:false,
        timeStored:undefined
    };

    // called outside of GameStream since the board might not be ready yet:
    // this.update(0);
    
    self.onStatusChange = self.onStatusChange.bind(self);
    self.onTimeChange = self.onTimeChange.bind(self);
};

GameStream.prototype.onStatusChange = function (newStatus) {
    // TODO...
};

GameStream.prototype.onTimeChange = function (newStatus) {
    var self = this,
        status = self.status;
    
    if (status.inControl) {
        // TODO: maybe we need to store the whole newStatus using e.g. deepClone?
        // But since performance is an issue here it just stores currentTime for now...
        status.storedTime = newStatus.currentTime;
    } else if (
        (newStatus.currentTime == 0 && status.time > 0)
        || (newStatus.currentTime > 0 && newStatus.currentTime != status.time)
    ) {
        self.update(newStatus.currentTime);
    }
};

GameStream.prototype.attachStream = function (stream) {
    var self = this;
    
    self.detachStream();
    
    self.attachedStream = stream;

    stream.bind('statusChange', self.onStatusChange);
    stream.bind('timeChange', self.onTimeChange);
};

GameStream.prototype.detachStream = function () {
    var self = this,
        stream = self.attachedStream;

    if (stream) {
        stream.unbind('statusChange', self.onStatusChange);
        stream.unbind('timeChange', self.onTimeChange);
        
        delete self.attachedStream;
    }
};

// TODO: support insertions inbetween
GameStream.prototype.applyTimedActionList=function(actions) {
    if (Array.isArray(actions)) {
        for(var i=0;i<actions.length;i++) {
            if (!this.rgfGame.queueTimedAction(actions[i])) {
                // TODO: revert all previous changes?
                return false;
            }
        }
    } else {
        if (!this.rgfGame.queueTimedAction(actions)) return false;
    }
    this.update();
    return true;
}

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
        if (this.status.timeIndex>1 && this.rgfGame._actionList[this.status.timeIndex-2].time>=0) {
            lowerBound=this.rgfGame._actionList[this.status.timeIndex-2].time;
        }
        if (this.status.timeIndex<this.rgfGame._actionList.length-1 && this.rgfGame._actionList[this.status.timeIndex].time>=0) {
            upperBound=this.rgfGame._actionList[this.status.timeIndex].time;
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
    if (newAction.time>=0 && this.rgfGame._actionList[timeIndex-1].time===newAction.time) {
        newAction.counter=this.rgfGame._actionList[timeIndex-1].counter+1;
    }
    if (this.rgfGame.queueTimedAction(newAction)) {
        this.update(newAction.time,newAction.counter);
        return true;
    } else {
        return false;
    }
};

GameStream.prototype.updateCurrentTime = function() {
    var self = this,
        status = self.status;
    
    if (self.attachedStream) {
        self.attachedStream.updateTime();
    } else {
        status.storedTime = status.time;
    }
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

    if (this.status.time<this.rgfGame.duration.time || (this.status.time==this.rgfGame.duration.time && this.status.timeCounter < this.rgfGame.duration.counter) ) this.status.waiting=false;
    else this.status.waiting=true;
};

/* Applies all actions from the current timeIndex (resp. this.status.time) up to nextTime.
   The lastKeyframeIndex is also updated. */
GameStream.prototype._advanceTo = function(nextTime,nextCounter) {
    if (nextCounter==undefined) nextCounter=Infinity;

    var i=this.status.timeIndex;
    while (i<this.rgfGame._actionList.length && this.rgfGame._actionList[i].time<=nextTime) {
        if (this.rgfGame._actionList[i].time==nextTime) {
            if (this.rgfGame._actionList[i].counter > nextCounter) break;
            else this.status.timeCounter=this.rgfGame._actionList[i].counter;
        } else {
            this.status.timeCounter=0;
        }
        var action=this.rgfGame._actionList[i];

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
    while (this.status.lastKeyframeIndex<this.rgfGame._keyframeList.length && this.rgfGame._keyframeList[this.status.lastKeyframeIndex]<=this.status.timeIndex) {
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
        while (0<=this.status.lastKeyframeIndex && this.rgfGame._actionList[this.rgfGame._keyframeList[this.status.lastKeyframeIndex]].time>=nextTime) {
            this.status.lastKeyframeIndex--;
        }
    }

    var i=this.rgfGame._keyframeList[this.status.lastKeyframeIndex];

    // apply all actions up to nextTime (a reduced version of advanceTo)
    // note that the first action is applying the KeyFrame...
    while (i<this.rgfGame._actionList.length && this.rgfGame._actionList[i].time<=nextTime) {
        if (this.rgfGame._actionList[i].time==nextTime) {
            if (this.rgfGame._actionList[i].counter > nextCounter) break;
            else this.status.timeCounter=this.rgfGame._actionList[i].counter;
        } else {
            this.status.timeCounter=0;
        }
        
        var action=this.rgfGame._actionList[i];
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
    var nextAction=this.rgfGame._actionList[i];

    if (steps>0) {
        for (var step=0; step<steps; step++) {
            if (i<this.rgfGame._actionList.length-1) i++;

            if (noInitial) {
                while (i<this.rgfGame._actionList.length-1 && this.rgfGame._actionList[i].time<0) {
                    i++;
                }
            }
        
            nextAction=this.rgfGame._actionList[i];
            while (i<this.rgfGame._actionList.length-1) {
                var found=(ignoreList.indexOf(nextAction.name)!=-1);
                if (found && (isWhiteList) || (!found) && (!isWhiteList)) {
                    break;
                }
                i++;
                nextAction=this.rgfGame._actionList[i];
            }
            
            if (i==this.rgfGame._actionList.length-1) break;
        }
    } else if (steps<0) {
        for (var step=0; step<(-steps); step++) {
            if (noInitial) {
                if (this.rgfGame._actionList[i].time<0) {
                    break;
                }
            }
            if (i>0) i--;

            nextAction=this.rgfGame._actionList[i];
            while (i>0) {
                var found=(ignoreList.indexOf(nextAction.name)!=-1);
                if (found && (isWhiteList) || (!found) && (!isWhiteList)) {
                    break;
                }
                if (noInitial) {
                    if (this.rgfGame._actionList[i].time<0) {
                        break;
                    }
                }
                if (i>0) i--;
                nextAction=this.rgfGame._actionList[i];
            }

            if (i==0) break;
        }
    }
    if (i==this.rgfGame._actionList.length-1 && nextAction.time<0) {
        this.update(0);
    } else {
        this.update(nextAction.time,nextAction.counter);
    }
};

asEvented.call(GameStream.prototype);
