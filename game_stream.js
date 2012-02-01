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
        // last keyframe index before this.status.time_index
        last_keyframe_index:0,
        // current game stream duration (equal to the time of the last entry in the action list)
        duration:0,
        max_duration:Infinity,
        // true if the media stream is ahead of the game stream (and the game stream has not ended)...
        waiting:false,
        ended:false
    }

    /* List of all KeyFrames:
       A KeyFrame describes how to get the whole current SGF tree.
       The resulting SGF tree must be identical to the one we get by successively applying actions.
       The first action MUST be be an "empty" KeyFrame.
    */
    this._keyframe_list=[0];
    // list of all actions
    this._action_list=[new Action(-2,"KeyFrame","")];
    // current RGF tree/content
    this._rgftree=new RGFNode();
    // current RGF path
    this._rgfpath=[];
    // current RGF parent node (equal to this._rgftree.descend(this._rgfpath))
    this._rgfnode=this._rgftree;
};

// Adds actions to the _action_list.
// TODO: be more flexible with "initial" time, resp. the start of the _action_list...
GameStream.prototype.queueActions=function(actions) {
    if (this._action_list.length && this._action_list[0].name!="KeyFrame") alert("The first Action must be a KeyFrame!");
    for(var i=0;i<actions.length;i++) {
        var action = actions[i];
        
        // modify action list
        if (action.name=="KeyFrame") {
            this._keyframe_list.push(this._action_list.length-1);
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
    $('div#'+this.id+"_rgftree").text(this.getRGF());
}

GameStream.prototype.getRGF = function() {
    var output="";
    if (!this._rgftree.children.length) {
        output=";TS[0]";
    } else {
        for (var i=0; i<this._rgftree.children.length; i++) {
            output += "(\n";
            output += this.getRGFSub("    ",this._rgftree.children[i]);
            output += ")\n";
        }
    }
    return output;
};

GameStream.prototype.getRGFSub = function(indent,node) {
    var output=indent;
    output += ";" + ((node.time==-1) ? "" : "TS["+node.time+"] ");
    for (var i=0; i<node.properties.length; i++) {
        output +=  node.properties[i].name + "[" + node.properties[i].argument + "]"
        output += (node.properties[i].time==-1) ? " " : "TS[" + node.properties[i].time + "] ";
    }
    output += "\n";
    
    if (!node.children.length) {
    } else if (node.children.length==1) {
        output += this.getRGFSub(indent,node.children[0]);
    } else {
        for (var i=0; i<node.children.length; i++) {
            output += indent + "(\n";
            output += this.getRGFSub(indent + "    ",node.children[i]);
            output += indent + ")\n";
        }
    }
    return output;
};

GameStream.prototype.loadStream = function(sources,media_type,max_duration,width,height) {
    // Set up header information (max_duration)
    this.status.max_duration=(max_duration>0) ? max_duration : Infinity;

    // Set up the basic widgets
    this.board=new BoardWidget(this.id+"_board",this);
    this.media_stream=new MediaStream(this.id+"_media_stream",sources,media_type,max_duration,width,height);
    this.gui=new MediaInterface(this.id+"_media_interface");
    
    // For testing
    this.txt_element=createBox(this.id+"_rgftree","Current RGF Tree",500,500,640,10);
    document.body.appendChild(this.txt_element);
    
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
