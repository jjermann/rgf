// ------------//
// RGF Player //
// ----------//

DIV_ID_BOARD = "rgf_board";
DIV_ID_TREE = "tree";
DIV_ID_CAPTURED_W = "cap_w";
DIV_ID_CAPTURED_B = "cap_b";
DIV_ID_RESULT = "res";
DIV_ID_COMMENTS = "comments";
DIV_ID_MOVE_NUMBER = "move_no";

module("Empty config", {
	setup: function() {
		var conf = {
			div_id_board: DIV_ID_BOARD,
			server_path_gospeed_root: "../../../",
		};
		this.rgf_player = new RGFPlayer(conf);
	},
	teardown: function() {
		delete this.rgf_player;
	}
});

test("Init", function() {
	equal(this.rgf_player.new_node, false, "new_node is false");
	equal(this.rgf_player.gospeed.mode, "play", "gospeed mode is play");
	equal(this.rgf_player.gospeed.size, 19, "gospeed size is 19");
	equal(this.rgf_player.gospeed.connected, false, "gospeed is not connected");
});

// ---

module("Full config", {
	setup: function() {
		var conf = {
			size: 13,
			div_id_board: DIV_ID_BOARD,
			div_id_tree: DIV_ID_TREE,
			div_id_captured_w: DIV_ID_CAPTURED_W,
			div_id_captured_b: DIV_ID_CAPTURED_B,
			div_id_result: DIV_ID_RESULT,
			div_id_move_number: DIV_ID_MOVE_NUMBER,
			div_id_comments: DIV_ID_COMMENTS,
			server_path_gospeed_root: "../../../",
		};
		this.rgf_player = new RGFPlayer(conf);
	},
	teardown: function() {
		delete this.rgf_player;
	}
});

test("Init", function() {
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
	equal(this.rgf_player.gospeed.mode, "play", "GoSpeed mode is \"play\".");
	equal(this.rgf_player.gospeed.size, 13, "GoSpeed size is 13.");
	equal(this.rgf_player.gospeed.connected, false, "GoSpeed is not connected.");
});

test("createNode with empty board", function() {
	// While on root node you can't createNode. It will be created when you add an B or W property.
	this.rgf_player.createNode();
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
});

test("createNode after adding nodes", function() {
	var res;
	// First let's add a node
	res = this.rgf_player.addProperty("B", "dd");
	equal(res, true, "Added the B property.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
	equal(this.rgf_player.gospeed.get_pos(3, 3), "B", "A black stone has been placed.");

	// Now lets create a new node
	this.rgf_player.createNode();
	equal(this.rgf_player.new_node, true, "The new_node property is true.");

	// Now it's required that the first property of a new node is "B" or "W"
	raises(function() {
		this.rgf_player.addProperty("C", "Check this out");
	}, "Could not add the C property, because the new node has not B or W property.");
});

test("addProperty", function() {
	var res;
	// Wrong node
	res = this.rgf_player.addProperty("Fruit", "Blah");
	equal(res, false, "Should return false on request for add an unknown property.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");

	// Root comment
	res = this.rgf_player.addProperty("C", "root node comment");
	equal(res, true, "The comment should have been added at the root node.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");

	// Wrong turn
	raises(function() {
		res = this.rgf_player.addProperty("W", "ab");
	}, "Can't add W property because it is not white's turn...");

	// Correct turn
	res = this.rgf_player.addProperty("B", "dd");
	equal(res, true, "Added the B property.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
	equal(this.rgf_player.gospeed.get_pos(3, 3), "B", "A black stone has been placed.");

	// Correct turn again
	res = this.rgf_player.addProperty("W", "jj");
	equal(res, true, "Added the W property.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
	equal(this.rgf_player.gospeed.get_pos(9, 9), "W", "A white stone has been placed.");
});

test("The PL property", function() {
	var res;
	// Set PL to W at the root node
	res = this.rgf_player.addProperty("PL", "W");
	equal(res, true, "As the game is empty and we are at the root node, we can set the first play to W.");

	// Play white
	res = this.rgf_player.addProperty("W", "jj");
	equal(res, true, "Added the W property.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
	equal(this.rgf_player.gospeed.get_pos(9, 9), "W", "A white stone has been placed.");

	// Try to set the PL property of the new node
	res = this.rgf_player.addProperty("PL", "W");
	equal(res, false, "The PL property can only be added to the root node.");

	// Ok.. let's go back to root then...
	res = this.rgf_player.goTo([]);
	equal(res, true, "No prob, back to root.");
	res = this.rgf_player.addProperty("PL", "B");
	equal(res, false, "Nope, you can't set the PL property to root if you added a stone, this might bring inconsistency.");
});

test("goTo", function() {
	var res;
	var path;
	// First, lets draw the same stones as before
	res = this.rgf_player.addProperty("B", "dd");
	equal(res, true, "Added the B property.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
	equal(this.rgf_player.gospeed.get_pos(3, 3), "B", "A black stone has been placed.");
	res = this.rgf_player.addProperty("W", "jj");
	equal(res, true, "Added the W property.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
	equal(this.rgf_player.gospeed.get_pos(9, 9), "W", "A white stone has been placed.");

	// Now, lets go back to first node
	path = [0];
	res = this.rgf_player.goTo(path);
	equal(res, true, "Ok, we could move.");
	equal(this.rgf_player.gospeed.get_pos(9, 9), undefined, "The second stone is no longer there.");
	deepEqual(this.rgf_player.getCurrentPath(), path, "The current path is the same as requested.");

	// Place a new stone instead
	res = this.rgf_player.addProperty("W", "jd");
	equal(res, true, "Added the W property.");
	equal(this.rgf_player.new_node, false, "The new_node property is false.");
	equal(this.rgf_player.gospeed.get_pos(3, 9), "W", "A white stone has been placed.");

	// Check the new path
	path = this.rgf_player.getCurrentPath();
	deepEqual(path, [0,1], "Now the path has changed.");

	// Go back to the first path created
	path = [0, 0];
	res = this.rgf_player.goTo(path);
	equal(res, true, "We could move.");
	equal(this.rgf_player.gospeed.get_pos(9, 9), "W", "The second stone is back.");
	deepEqual(this.rgf_player.getCurrentPath(), path, "The current path is the same as requested.");
});

