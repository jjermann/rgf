function GoSpeedPlayer(config) {
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
	// Private props
		this.new_node = false;

        this.onApplyAction = this.applyAction.bind(this);
};

GoSpeedPlayer.prototype.init = function() {
	// Initialize GoSpeed with custom config
		this.gospeed = new GoSpeed(this.custom_config);
		this.gospeed.disconnect();
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
				this.gospeed.connect();
				if (arg == "") {
					// Pass
					bRes = this.gospeed.pass();
				} else {
					// Play
					pos = this.gospeed.sgf_coord_to_pos(arg)
					bRes = this.gospeed.play(pos.row, pos.col);
				}
				this.gospeed.disconnect();
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
	return this.gospeed.goto_path(path);
};

GoSpeedPlayer.prototype.applyAction = function(action) {
    var path;
    if (action.name=="KeyFrame") {
        // load the Sgf while taking care of deleted nodes
        // alternative: directly load an sgf tree

        // this.goTo(action.position);
    } else {
        if (action.position!=undefined) {
            this.goTo(path);
        }
        // if a node is added
        if (action.name==";") {
            this.createNode();
        // if a property is added
        } else {
            if (action.name!="VT") {
                this.addProperty(action.name,action.arg);
            }
        }
    }
};

GoSpeedPlayer.prototype.html = function(style) {
    var el, container, lvl1, lvl2;
    el=document.createElement("div");
      container=document.createElement("div");
      container.id="rgf_board";
      el.appendChild(container);

      container=document.createElement("div");
      container.id="tree";
      el.appendChild(container);

      container=document.createElement("table");
      container.className="rgf_stats";
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Captured W';
          lvl1.appendChild(lvl2);          
          lvl2=document.createElement("td");
          lvl2.id="cap_w";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Captured B';
          lvl1.appendChild(lvl2);          
          lvl2=document.createElement("td");
          lvl2.id="cap_b";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Result';
          lvl1.appendChild(lvl2);          
          lvl2=document.createElement("td");
          lvl2.id="res";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
        lvl1=document.createElement("tr");
          lvl2=document.createElement("th");
          lvl2.innerHTML='Move number';
          lvl1.appendChild(lvl2);          
          lvl2=document.createElement("td");
          lvl2.id="move_no";
          lvl2.innerHTML='0';
          lvl1.appendChild(lvl2);
        container.appendChild(lvl1);
      el.appendChild(container);

      container=document.createElement("div");
      container.id="comments";
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

GoSpeedPlayer.prototype.gsInsertActions = function(actions) {
    this.trigger('insertActions', actions);
};

asEvented.call(GoSpeedPlayer.prototype);
