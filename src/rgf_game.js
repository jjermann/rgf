/*  RGFGame
    ----------
    Responsible to store a whole game/lecture together with all timing informations.
*/
function RGFGame(gameId) {
    var self = this;

    self.id = gameId;
    // A KeyFrames should contain all necessary information to restore the situation from the given time,
    // it must set the position to the last known position
    self._keyframeList = [];
    self._actionList = [];
    self._rgfTree = new RGFNode();

    self.duration = {time:-2, counter:0};
    self.setup = true;

    /* The first action is set here to be an "empty" KeyFrame. Because it's the first action we have to set force=1... */
    self.queueTimedAction({time:-2, counter:0, name:"KeyFrame", arg:"", position:[], force:1});
};

RGFGame.prototype.writeRGF = function(node,base) {
    var output=this._rgfTree.writeRGF(node,base);
    // TODO: maybe make this check somewhere else
    if (output=="") output=";TS[0]";
    return output;
};

// Adds a timed action into the _actionList and _rgfTree
RGFGame.prototype.queueTimedAction=function(action) {
    // GATHER SOME DATA
    var newAction={name:action.name, arg:action.arg, position:action.position, time:action.time, counter:action.counter};
    
    var timeIndex, newNode, lastKeyframeIndex;
    // get the timeIndex (where to insert in the action list)
    if (action.time>this.duration.time || (action.time==this.duration.time && action.counter>this.duration.counter)) {
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
        if (timeIndex===0) {
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
            else nextAction.position=nextAction.node.getPosition();
        }
        // update the counters if necessary
        this._updateCounters(timeIndex,newAction.time,false);
    // and this is the case if we insert something at the end, in which case we have to update the duration status accordingly
    } else {
        this.duration.time=newAction.time;
        this.duration.counter=newAction.counter;
        if (this.duration.time>=0) this.setup=false;
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

// TODO: UNTESTED
RGFGame.prototype.removeAction=function(index,force) {
    var action=this._actionList[index];

    // VALIDITY CHECKS (for removing a property)
    if (!force) {
        if (index<=0 || index>=this._actionList.length) return false;
        if (this._keyframeList[this._keyframeList.length-1]>=index) return false;

        if (action.name==";") {
            var index=pathToArray(action.node.getPosition());
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
    this.duration.time=this._actionList[this._actionList.length-1].time;
    this.duration.counter=this._actionList[this._actionList.length-1].counter;
    if (this.duration.time<0) this.setup=true;
    return true;
};


// TODO: UNTESTED, helper function to remove a subtree (doesn't update any other properties and does not perform any validity checks)
RGFGame.prototype._removeTree=function(node,lowerBound) {
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

// Returns the time index right after the action corresponding to the supplied time
// The lower bound is a lower bound for the <to be searched> time index
RGFGame.prototype._getIndex = function(time,counter,lowerBound) {  
    if (lowerBound==undefined) lowerBound=0;
    if (counter==undefined) counter=0;

    var i=lowerBound;
    while (i<this._actionList.length && this._actionList[i].time<time) i++;
    while (i<this._actionList.length && this._actionList[i].time===time && this._actionList[i].counter<=counter) i++;

    return i;
};

// Used to either increase or decrease all counters of actions starting from the given time index, it also modifies the rgf tree nodes resp. properties
RGFGame.prototype._updateCounters=function(timeIndex,time,decrease) {
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

