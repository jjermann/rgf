function GoSpeedPlayer(boardId) {
	this.id=boardId;
	this.onApplyAction = this.applyAction.bind(this);
};

GoSpeedPlayer.prototype.init = function(config) {
	var self = this;
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
	// Initialize GoSpeed with custom config
		this.gospeed = new GoSpeed(this.custom_config);
		this.gospeed.mode = "rgf";
		this.gospeed.callbacks["rgf_board_click"] = function() {
			return self.boardClicked.call(self, arguments[0], arguments[1])
		};
	// Private props
		this.new_node = false;
		this.recording = false;
		
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
console.log("ok");
	// Do some stuff related with GameStream
	// return false if it fails.
	// return true if its ok and the stone was placed.
        var actionName = this.gospeed.get_next_move();
        var actionArg = this.gospeed.pos_to_sgf_coord(row, col);
        var success=this.insertActions([{name:";"}, {name: actionName, arg: actionArg}]);
        
        // we handle adding things on our own...
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
        // load the Sgf while taking care of deleted nodes
        // alternative: directly load an sgf tree
        // instead we simply clear everything for now
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

GoSpeedPlayer.prototype.html = function(style) {
    var el, container, lvl1, lvl2;
    el=document.createElement("div");
    el.id=this.id;
      container=document.createElement("div");
      container.id=this.id+"_rgf_board";
      container.className="rgf_board";
      el.appendChild(container);

      container=document.createElement("div");
      container.id=this.id+"_tree";
      container.className="tree";
      el.appendChild(container);

      container=document.createElement("table");
      container.className="rgf_stats";
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Captured W';
          lvl1.appendChild(lvl2);
          lvl2=document.createElement("td");
          lvl2.id=this.id+"_cap_w";
          lvl2.className="cap_w";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Captured B';
          lvl1.appendChild(lvl2);
          lvl2=document.createElement("td");
          lvl2.id=this.id+"_cap_b";
          lvl2.className="cap_b";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Result';
          lvl1.appendChild(lvl2);
          lvl2=document.createElement("td");
          lvl2.id=this.id+"_res";
          lvl2.className="res";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Move number';
          lvl1.appendChild(lvl2);
          lvl2=document.createElement("td");
          lvl2.id=this.id+"_move_no";
          lvl2.className="move_no";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
      el.appendChild(container);

      container=document.createElement("div");
      container.id=this.id+"_comments";
      container.className="comments";
      el.appendChild(container);

    extend(el.style,style);
    return el;
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
        return self.attachedStream.applyActionList(actions);
    } else {
        return false;
    }
};

asEvented.call(GoSpeedPlayer.prototype);
