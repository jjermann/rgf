/*  RGFGame
    ----------
    Responsible to store a whole game/lecture together with all timing informations.
*/
function RGFGame() {
    var self = this;

    // A KeyFrames should contain all necessary information to restore the situation from the given time,
    // it must set the position to the last known position
    self.keyframeList = [];
    self.actionList = [];
    self.rgfTree = new RGFNode();

    self.duration = {time:-2, counter:0};
    self.setup = true;

    /* The first action is set here to be an "empty" KeyFrame. Because it's the first action we have to set force=1... */
    self.queueTimedAction({time:-2, counter:0, name:"KeyFrame", arg:"", position:[]},"force_insert",false);
};

RGFGame.prototype.writeRGF = function(node,base) {
    var output=this.rgfTree.writeRGF(node,base);
    // TODO: maybe make this check somewhere else
    if (output=="") output=";TS[0]";
    return output;
};

// Adds a timed action into the actionList and rgfTree
RGFGame.prototype.queueTimedAction=function(action,force,check) {
    // GATHER SOME DATA
    var newAction={name:action.name, arg:action.arg, position:action.position, time:action.time, counter:action.counter};
    
    var timeIndex, newNode, lastKeyframeIndex;
    // get the timeIndex (where to insert in the action list)
    if (newAction.time>this.duration.time || (newAction.time==this.duration.time && newAction.counter>this.duration.counter)) {
        timeIndex=this.actionList.length;
    } else if (newAction.counter) {
        // Since we don't make any changes to the actionList yet we have to account for the fact that
        // newAction.counter already exists when determing the timeIndex!!
        timeIndex=this._getIndex(newAction.time, newAction.counter-1);
    } else {
        timeIndex=this._getIndex(newAction.time, newAction.counter);
    }
    // get the newNode (where to insert in the rgf tree)
    if (newAction.position!=undefined) {
        // if (newAction.name!="VT" || newAction.arg!="N") console.log("Warning: The position SHOULD always be changed with a VT newAction (not with "+newAction.name+"["+newAction.arg+"])!!");
        newNode=this.rgfTree.descend(pathToArray(newAction.position));
    } else if (timeIndex>0) {
        newNode=this.actionList[timeIndex-1].node;
    } else {
        newNode=this.rgfTree;
    }
    // get the last keyframe index
    lastKeyframeIndex=0;
    while (lastKeyframeIndex<this.keyframeList.length && this.keyframeList[lastKeyframeIndex]<timeIndex) {
        lastKeyframeIndex++;
    }
    lastKeyframeIndex--;


    // VALIDITY CHECK

    // If the player knows what he is doing he can ignore the checks and force an insertion,
    // otherwise we make sure that the action doesn't influence any already existing future actions
    // and return false if that might be the case.

    if (force==="force_insert") {
    } else if (timeIndex==0) {
        return false;
    } else if (timeIndex===this.actionList.length || newAction.name=="KeyFrame") {
    } else if (force==="remove_all") {
    } else if (force==="remove_necessary") {
    } else {
        if (newAction.name==";" && newNode.children.length) {
            var lastNode=newNode.children[newNode.children.length-1];
            if (newAction.time<lastNode.time) return false;
            if (newAction.time==lastNode.time && newAction.counter<=lastNode.counter) return false;
        } else if (newAction.name==";") {
        } else {
            // this is the latest durationtime/counter for the newNode subtree
            var streeDuration=newNode.getDuration();
            if (newAction.time<streeDuration.time) return false;
            if (newAction.time==streeDuration.time && newAction.counter<=streeDuration.counter) return false;
        }
        
        if (force!=="remove_keyframes") {
            // we return false if there are keyframes after this action...
            if (lastKeyframeIndex<this.keyframeList.length-1) {
                return false;
            }
        }
    }
    
    // If the player just wants to check whether an insertion of an action would work we return true here without modifying anything
    if (check) {
        return true;
    }


    // REMOVE ACTIONS IF FORCED

    if (timeIndex===this.actionList.length || newAction.name=="KeyFrame") {
    } else if (force==="remove_all") {
        for (var i=this.actionList.length-1; i>=timeIndex; i--) {
            this.removeAction(i,true);
        }
    } else if (force==="remove_necessary") {
        // remove all keyframes after the timeIndex
        for (var i=this.keyframeList.length-1; i>lastKeyframeIndex; i--) {
            this.removeAction(this.keyframeList[i],true);
        }
        if (newAction.name==";") {
            // remove all older brothers
            this._removeBigBrothers(newNode,{time:newAction.time, counter:newAction.counter},timeIndex);
        } else {
            // remove all nodes and properties of the whole subtree (of newNode) which are older...
            this._removeOlderDescendants(newNode,{time:newAction.time, counter:newAction.counter},timeIndex);
        }
    } else if (force==="remove_keyframes") {
        // remove all keyframes after the timeIndex
        for (var i=this.keyframeList.length-1; i>lastKeyframeIndex; i--) {
            this.removeAction(this.keyframeList[i],true);
        }
    }
    

    // UPDATE THE KEYFRAME AND ACTION LIST

    // this is the case where we insert something before the end, so we need to modify the remaining part accordingly...
    if (timeIndex<this.actionList.length) {
        // we make sure that we jump to the the position of the next action when its time comes
        // note that timeIndex points to the next action after our soon to be inserted one...
        var nextAction=this.actionList[timeIndex];
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

    if (newAction.name=="KeyFrame") this.keyframeList.splice(lastKeyframeIndex+1,0,timeIndex);
    this.actionList.splice(timeIndex,0,newAction);


    // UPDATE THE RGF TREE

    if (newAction.name=="KeyFrame") {
    } else {
        if (newAction.name==";") newNode=newNode.addNode(new RGFNode(newAction.time,newAction.counter));
        else newNode.addProp(new RGFProperty(newAction.name,newAction.arg,newAction.time,newAction.counter));
    }

    // set the node for the action
    newAction.node=newNode;

    this.trigger("actionQueued",timeIndex);

    return true;
};

RGFGame.prototype.modifyActionTime = function(firstIndex,lastIndex,dt,check) {
    var firstAction = this.actionList[firstIndex],
        lastAction  = this.actionList[lastIndex];
    
    // VALIDITY CHECKS
    if (lastIndex-firstIndex<0) return false;
    if (firstIndex<=0 || lastIndex>=this.actionList.length) return false;
    var dprev=this.actionList[firstIndex-1].time-firstAction.time;
    var dnext=Infinity;
    if (lastIndex<this.actionList.length-1) dnext=this.actionList[lastIndex+1].time-lastAction.time;
    if (dt<dprev || dt>dnext) return false;
    // at the moment we don't touch the initial setup
    if ((firstAction.time+dt)<0) return false;
    // if (dt==0) the time doesn't change
    if (dt==0) return false;

    if (check) return true;
    

    // CHANGE THE TIME AND COUNTERS ACCORDINGLY

    // Set the time and counters of the first action
    var prevTime=this.actionList[firstIndex-1].time;
    if (firstAction.time+dt==prevTime) var counter=this.actionList[firstIndex-1].counter+1;
    else var counter=0;
    this._setActionTime(firstIndex,firstAction.time+dt,counter);

    // Set the time and counters of all selected actions
    var i=firstIndex+1;
    while (i<=lastIndex) {
        var action=this.actionList[i];
        if (action.time+dt==firstAction.time) counter++;
        else counter=action.counter; 
        this._setActionTime(i,action.time+dt,counter);
        i++;
    }
    
    // Set the time and counters of all remaining actions
    if (i<this.actionList.length) var nextTime=this.actionList[i].time;
    else var nextTime=Infinity;
    if (nextTime==lastAction.time) counter=lastAction.counter+1;
    else counter=0;
    
    while (i<this.actionList.length) {
        var action=this.actionList[i];
        if (action.time==nextTime) {
            this._setActionTime(i,action.time,counter);
            counter++;
            i++;
        } else {
            break;
        }
    }

    // modify the duration/etc in case we modify the last time of the action list...
    if (dnext==Infinity) {
        this.duration.time=lastAction.time;
        this.duration.counter=lastAction.counter;
        if (this.duration.time>=0) this.setup=false;
        else this.setup=true;
    }

    this.trigger("timeModified",firstIndex,lastIndex,dt);

    return true;
};


// helper function to set the time and counter of just _one single_ action
RGFGame.prototype._setActionTime = function(index,time,counter) {
    var action=this.actionList[index];
    var node=action.node;
    var prop=undefined;
    if (action.name=="KeyFrame") {
    } else if (action.name==";") {
        node.time=time;
        node.counter=counter;
    } else {
        prop=this._getProp(node,action.time,action.counter);
        prop.time=time;
        prop.counter=counter;
    }
    action.time=time;
    action.counter=counter;
};


RGFGame.prototype.removeAction=function(index,force) {
    var action=this.actionList[index];

    // VALIDITY CHECKS (for removing a property)
    if (!force) {
        if (index<=0 || index>=this.actionList.length) return false;
        if (this.keyframeList[this.keyframeList.length-1]>index) return false;

        if (action.name==";") {
            var nodeIndex=pathToArray(action.node.getPosition());
            nodeIndex=nodeIndex[nodeIndex.length-1];
            if (nodeIndex<action.node.parent.children.length-1) return false;
        } else {
            var streeDuration=action.node.getDuration();
            if (action.time<streeDuration.time) return false;
            if (action.time==streeDuration.time && action.counter<streeDuration.counter) return false;
        }
    }

    if (action.name=="KeyFrame") {
        for (var i=0; i<this.keyframeList.length; i++) {
            if (this.keyframeList[i]==index) {
                this.keyframeList.splice(i,1);
                break;
            }
        }
        this._updateCounters(index+1,action.time,true);
        this.actionList.splice(index,1);
    } else if (action.name==";") {
        var node=action.node;
        var j=node.children.length-1;
        while (j>=0) {
            var child=node.children[j];
            var cIndex=this._getIndex(child.time,child.counter,index)-1;
            this.removeAction(cIndex,true);
            j=node.children.length-1;
        }

        var k=action.node.properties.length-1;
        while (k>=0) {
            var prop=node.properties[k];
            var pIndex=this._getIndex(prop.time,prop.counter,index)-1;
            this.removeAction(pIndex,true);
            k=action.node.properties.length-1;
        }
        
        this._updateCounters(index+1,node.time,true);
        this.actionList.splice(index,1);
        node.remove();
    } else {
        this._updateCounters(index+1,action.time,true);
        this.actionList.splice(index,1);
        this._getProp(action.node,action.time,action.counter).remove();
    }
    
    // update the duration
    this.duration.time=this.actionList[this.actionList.length-1].time;
    this.duration.counter=this.actionList[this.actionList.length-1].counter;
    if (this.duration.time<0) this.setup=true;
    
    this.trigger("removedAction",index,action);

    return true;
};

RGFGame.prototype._removeBigBrothers = function(parent,myAge,lowerBound) {
    if (lowerBound==undefined) lowerBound=0;
    
    if (parent.children.length) var oldestBrother=parent.children[parent.children.length-1];
    while (parent.children.length && (myAge.time<oldestBrother.time || (myAge.time==oldestBrother.time && myAge.counter<=oldestBrother.counter))) {
        var brotherIndex=this._getIndex(oldestBrother.time,oldestBrother.counter,lowerBound)-1;
        this.removeAction(brotherIndex,true);
        oldestBrother=parent.children[parent.children.length-1];
    }
};

RGFGame.prototype._removeOlderDescendants = function(parent,duration,lowerBound) {
    if (lowerBound==undefined) lowerBound=0;

    // basically do the same as in parent.getDuration but remove all corresponding actions...
    if (parent.properties.length) var lastProp=parent.properties[parent.properties.length-1];
    while (parent.properties.length && (duration.time<lastProp.time || (duration.time==lastProp.time && duration.counter<=lastProp.counter))) {
        var propIndex=this._getIndex(lastProp.time,lastProp.counter,lowerBound)-1;
        // forcing is needed here!!
        this.removeAction(propIndex,true);
        lastProp=parent.properties[parent.properties.length-1];
    }

    var i=parent.children.length-1;
    while (i>=0) {
        var child=parent.children[i];
        if (duration.time<child.time || (duration.time==child.time && duration.counter<=child.counter)) {
            var nodeIndex=this._getIndex(child.time,child.counter,lowerBound)-1;      
            this.removeAction(nodeIndex,true);
        } else {
            this._removeOlderDescendants(child,duration,lowerBound);
        }
        i--;
    }
};

// Returns the first time index with time/counter bigger than the specified time/counter (if found)
// If the index was not found it returns this.actionList.length
// The lower bound is a lower bound for the <to be searched> time index
RGFGame.prototype._getIndex = function(time,counter,lowerBound) {  
    if (lowerBound==undefined) lowerBound=0;
    if (counter==undefined) counter=0;

    // "-1" to make it also work for finding the actual index for that time and counter...
    var i=(lowerBound>0) ? lowerBound-1 : lowerBound;
    
    while (i<this.actionList.length && this.actionList[i].time<time) i++;
    while (i<this.actionList.length && this.actionList[i].time===time && this.actionList[i].counter<=counter) i++;

    return i;
};

RGFGame.prototype._getProp = function(parent,time,counter) {
    for (var i=0; i<parent.properties.length; i++) {
        if (parent.properties[i].time==time && parent.properties[i].counter==counter) return parent.properties[i];
    }
    return null;
};

// Used to either increase or decrease all counters of actions starting from the given time index, it also modifies the rgf tree nodes resp. properties
RGFGame.prototype._updateCounters=function(timeIndex,time,decrease) {
    for (var j=timeIndex; j<this.actionList.length; j++) {
        var tmpAction=this.actionList[j];
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

asEvented.call(RGFGame.prototype);
