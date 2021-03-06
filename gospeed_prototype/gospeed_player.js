function GoSpeedPlayer(playerId,config) {
    var self=this;
    self.id=playerId;

    // Customize configuration
    this.custom_config = {
        mode: "play",
        shower: "graphic",
        size: config.size,
        div_id_board: config.div_id_board,
        div_id_tree: config.div_id_tree,
        div_id_captured_w: config.div_id_captured_w,
        div_id_captured_b: config.div_id_captured_b,
        div_id_result: config.div_id_result,
        div_id_move_number: config.div_id_move_number,
        div_id_comments: config.div_id_comments,
        server_path_gospeed_root: config.server_path_gospeed_root,
    }
 
    self.onApplyAction = self.applyAction.bind(self);

    // Initializes the Player (the HTML is organized by the GUI)
    self.init(this.custom_config);
};

GoSpeedPlayer.prototype.init = function(config) {
    var self = this;

    // Initialize GoSpeed with custom config
    this.gospeed = new GoSpeed(this.custom_config);
    this.gospeed.mode = "rgf";
    this.gospeed.callbacks["rgf_board_click"] = function() {
        return self.boardClicked.call(self, arguments[0], arguments[1])
    };
    
    // Private properties
    this.new_node = false;
    this.recording = false;

    // We are always recording...
    this.enableRecording();
};

GoSpeedPlayer.prototype.createNode = function() {
    if (!this.gospeed.game_tree.actual_move.root) {
        this.new_node = true;
    }
};

GoSpeedPlayer.prototype.addProperty = function(name, arg) {
    var pos;
    var bRes = false;

    switch(name) {
        case "B":
        case "W":
            // Check if turn corresponds with color
            if (name == this.gospeed.get_next_move()) {
                var store_mode = this.gospeed.mode;
                this.gospeed.mode = "play";
                if (arg == "") {
                    // Pass
                    bRes = this.gospeed.pass();
                } else {
                    // Play
                    pos = this.gospeed.sgf_coord_to_pos(arg)
                    bRes = this.gospeed.play(pos.row, pos.col);
                }
                this.gospeed.mode = store_mode;
                this.new_node = false;
            } else {
                throw new Error("Not " + name + "'s turn...");
            }
        break;
        case "C":
            if (!this.new_node) {
                this.gospeed.game_tree.actual_move.comments = arg;
                if (this.gospeed.shower != undefined) {
                    this.gospeed.shower.update_comments();
                }
                bRes = true;
            } else {
                throw new Error("New node's first property must be \"W\" or \"B\".");
            }
        break;
        case "PL":
            if (this.gospeed.game_tree.actual_move.root && this.gospeed.game_tree.root.next.length == 0) {
                this.gospeed.game_tree.root.next_move = arg;
                bRes = true;
            }
        break;
    }
    return bRes;
};

GoSpeedPlayer.prototype.getCurrentPath = function() {
    return this.gospeed.get_path();
};

GoSpeedPlayer.prototype.goTo = function(path) {
    return this.gospeed.goto_path(pathToArray(path));
};

// GoSpeed click callback
GoSpeedPlayer.prototype.boardClicked = function(row, col) {
    var actionName = this.gospeed.get_next_move();
    var actionArg = this.gospeed.pos_to_sgf_coord(row, col);
    var success=this.insertActions([{name:";"}, {name: actionName, arg: actionArg}]);

    // we handle "adding things" on our own, so we always return false...
    return false;
};

GoSpeedPlayer.prototype.enableRecording = function() {
    this.gospeed.mode = "play";
    this.recording = true;
    return true;
};
GoSpeedPlayer.prototype.disableRecording = function() {
    this.gospeed.mode = "rgf";
    this.recording = false;
    return true;
};
GoSpeedPlayer.prototype.isRecording = function() {
    return this.recording;
};


/* OUR NEW MODIFICATIONS */
GoSpeedPlayer.prototype.applyAction = function(action) {
    if (action.name=="KeyFrame") {
        // We don't really need KeyFrames except for the initial
        // keyframe which clears everything...
        // alternative1: load the Sgf while taking care of deleted nodes
        // alternative: directly load an sgf tree
        this.gospeed.clear();
        this.gospeed.render();

        if (action.position!=undefined) {
            this.goTo(action.position);
        }
    } else {
        if (action.position!=undefined) {
            this.goTo(action.position);
        }

        if (action.name==";") {
            this.createNode();
        } else if (action.name=="VT") {
        } else if (action.name=="RP") {
        } else {
            this.addProperty(action.name,action.arg);
        }
    }
};

GoSpeedPlayer.prototype.attachStream = function (stream) {
    var self = this;

    self.detachStream();
    self.attachedStream = stream;
    stream.bind('applyAction', self.onApplyAction);
};
GoSpeedPlayer.prototype.detachStream = function () {
    var self = this,
        stream = self.attachedStream;

    if (stream) {
        stream.unbind('applyAction', self.onApplyAction);
        delete self.attachedStream;
    }
};
GoSpeedPlayer.prototype.insertActions = function(actions) {
    var self=this;

    if (self.attachedStream) {
        return self.attachedStream.applyActionList(actions,"remove_necessary");
    } else {
        return false;
    }
};

asEvented.call(GoSpeedPlayer.prototype);
