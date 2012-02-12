// variables
var rgf, rgfparser;


// Empty rgf parsing
module("Empty rgf parsing", {
    setup: function() {
        rgf="";
        rgfparser=new RGFParser("");
    },
    teardown: function() {
        rgf=undefined;
        rgfparser=undefined;
    }
});
test("Basic RGFParser properties", function(){
    equal(rgfparser.rgf, rgf, "RGF Content (rgfparser.rgf): "+rgfparser.rgf);
    equal(rgfparser.index,  0, "Character index after parsing (rgfparser.index): "+rgfparser.index);
});
test("RGF Tree", function(){
    var root=new RGFNode();
    deepEqual(rgfparser.rgftree, root, "RGF Tree created by rgfparser._parseTree(new RGFNode()) based on rgfparser.rgf => (rgfparser.rgftree)");
});
test("Action List", function(){
    var unsorted_actions=[];
    var sorted_actions=[];
    deepEqual(RGFParser._getUnsortedActions(rgfparser.rgftree),unsorted_actions, "Step 1: Unsorted Action List created by rgfparser._getUnsortedActions(rgfparser.rgftree), it contains temporary node position information");
    deepEqual(RGFParser._sortActions(RGFParser._getUnsortedActions(rgfparser.rgftree)),sorted_actions, "Step 2: Sorted Action List created by rgfparser._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfparser.action_list,sorted_actions, "Step 3: The Action List created by rgfparser.getActions(rgfparser.rgftree), it should be the same as <result from above> => (rgfparser.action_list): "+rgfparser.action_list);
});
test("Writing RGF", function(){
    equal(RGFParser.writeRGF(rgfparser.rgftree),"", "Generated RGF file, with standard indentations, created by RGFParser.writeRGF(rgfparser.rgftree): "+RGFParser.writeRGF(rgfparser.rgftree));
    equal(RGFParser.writeRGF(rgfparser.rgftree,"  ","  "),"", "Generated RGF file, with 2 indentations, created by RGFParser.writeRGF(rgfparser.rgftree,\"<2 spaces>\",\"<2 spaces>\"): "+RGFParser.writeRGF(rgfparser.rgftree,"  ","  "));
    equal(RGFParser.writeRGF(rgfparser.rgftree,"",""),"", "Generated RGF file, without indentations, created by RGFParser.writeRGF(rgfparser.rgftree,\"\",\"\"): "+RGFParser.writeRGF(rgfparser.rgftree,"",""));
});
test("Consistency", function(){
    var new_rgfparser=new RGFParser(RGFParser.writeRGF(rgfparser.rgftree));
    deepEqual(rgfparser.rgftree,new_rgfparser.rgftree,"The generated RGF should give the same tree as the original one...");
});


// Empty rgf parsing
module("Simple RGF tree parsing", {
    setup: function() {
        rgf=";B[aa]VT[N]TS[4.9]VT[ENDED]TS[5](;W[bb]VT[N]TS[1.9];TS[2]B[dd]TS[2])(;W[bc]AB[ef][fg]VT[N]TS[2.9]AW[cd]TS[3]AB[gh]TS[4])";
        rgfparser=new RGFParser(rgf);
    },
    teardown: function() {
        rgfparser=undefined;
    }
});
test("Basic RGFParser properties", function(){
    equal(rgfparser.rgf, rgf, "RGF Content (rgfparser.rgf): "+rgfparser.rgf);
    equal(rgfparser.index, rgf.length, "Character index after parsing (rgfparser.index): "+rgfparser.index);
});
test("RGF Tree", function(){
    // here we construct the tree manually
    var root=new RGFNode();
    root.addNode(new RGFNode());
        root.children[0].addProp(new RGFProperty("B","aa"));
        root.children[0].addNode(new RGFNode());
            root.children[0].children[0].addProp(new RGFProperty("W","bb"));
            root.children[0].children[0].addProp(new RGFProperty("VT","N",1.9));
            root.children[0].children[0].addNode(new RGFNode(2));
                root.children[0].children[0].children[0].addProp(new RGFProperty("B","dd",2));
        root.children[0].addNode(new RGFNode());
            root.children[0].children[1].addProp(new RGFProperty("W","bc"))
            root.children[0].children[1].addProp(new RGFProperty("AB","ef"))
            root.children[0].children[1].addProp(new RGFProperty("AB","fg"))
            root.children[0].children[1].addProp(new RGFProperty("VT","N",2.9));
            root.children[0].children[1].addProp(new RGFProperty("AW","cd",3))
            root.children[0].children[1].addProp(new RGFProperty("AB","gh",4))
        root.children[0].addProp(new RGFProperty("VT","N",4.9));
        root.children[0].addProp(new RGFProperty("VT","ENDED",5));
    ok(_.isEqual(rgfparser.rgftree,root), "RGF Tree created by rgfparser._parseTree(new RGFNode()) based on rgfparser.rgf => (rgfparser.rgftree)");
});
test("Action List", function(){
    // here we construct the (un)sorted action lists manually
    var unsorted_actions=[];
    unsorted_actions.push( {time:  -1, name:  ";", arg:      "", position: "",     _node_pos: "0"     } );
    unsorted_actions.push( {time:  -1, name:  "B", arg:    "aa", position: "0"                        } );
    unsorted_actions.push( {time: 4.9, name: "VT", arg:     "N", position: "0"                        } );
    unsorted_actions.push( {time:   5, name: "VT", arg: "ENDED", position: "0"                        } );
    unsorted_actions.push( {time:  -1, name:  ";", arg:      "", position: "0",    _node_pos: "0.0"   } );
    unsorted_actions.push( {time:  -1, name:  "W", arg:    "bb", position: "0.0"                      } );
    unsorted_actions.push( {time: 1.9, name: "VT", arg:     "N", position: "0.0"                      } );
    unsorted_actions.push( {time:   2, name:  ";", arg:      "", position: "0.0",  _node_pos: "0.0.0" } );
    unsorted_actions.push( {time:   2, name:  "B", arg:    "dd", position: "0.0.0"                    } );
    unsorted_actions.push( {time:  -1, name:  ";", arg:      "", position: "0",    _node_pos: "0.1"   } );
    unsorted_actions.push( {time:  -1, name:  "W", arg:    "bc", position: "0.1"                      } );
    unsorted_actions.push( {time:  -1, name: "AB", arg:    "ef", position: "0.1"                      } );
    unsorted_actions.push( {time:  -1, name: "AB", arg:    "fg", position: "0.1"                      } );
    unsorted_actions.push( {time: 2.9, name: "VT", arg:     "N", position: "0.1"                      } );
    unsorted_actions.push( {time:   3, name: "AW", arg:    "cd", position: "0.1"                      } );
    unsorted_actions.push( {time:   4, name: "AB", arg:    "gh", position: "0.1"                      } );

    var sorted_actions=[];
    sorted_actions.push(   {time:  -1, name:  ";", arg:      ""                    } );
    sorted_actions.push(   {time:  -1, name:  "B", arg:    "aa"                    } );
    sorted_actions.push(   {time:  -1, name:  ";", arg:      ""                    } );
    sorted_actions.push(   {time:  -1, name:  "W", arg:    "bb"                    } );
    sorted_actions.push(   {time:  -1, name:  ";", arg:      "", position: "0"     } );
    sorted_actions.push(   {time:  -1, name:  "W", arg:    "bc"                    } );
    sorted_actions.push(   {time:  -1, name: "AB", arg:    "ef"                    } );
    sorted_actions.push(   {time:  -1, name: "AB", arg:    "fg"                    } );
    sorted_actions.push(   {time: 1.9, name: "VT", arg:     "N", position: "0.0"   } );
    sorted_actions.push(   {time:   2, name:  ";", arg:      ""                    } );
    sorted_actions.push(   {time:   2, name:  "B", arg:    "dd"                    } );
    sorted_actions.push(   {time: 2.9, name: "VT", arg:     "N", position: "0.1"   } );
    sorted_actions.push(   {time:   3, name: "AW", arg:    "cd"                    } );
    sorted_actions.push(   {time:   4, name: "AB", arg:    "gh"                    } );
    sorted_actions.push(   {time: 4.9, name: "VT", arg:     "N", position: "0"     } );
    sorted_actions.push(   {time:   5, name: "VT", arg: "ENDED"                    } );

    deepEqual(RGFParser._getUnsortedActions(rgfparser.rgftree),unsorted_actions, "Step 1: Unsorted Action List created by rgfparser._getUnsortedActions(rgfparser.rgftree), it contains temporary node position information");
    deepEqual(RGFParser._sortActions(RGFParser._getUnsortedActions(rgfparser.rgftree)),sorted_actions, "Step 2: Sorted Action List created by rgfparser._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfparser.action_list,sorted_actions, "Step 3: The Action List created by rgfparser.getActions(rgfparser.rgftree), it should be the same as <result from above> => (rgfparser.action_list): "+rgfparser.action_list);
});
test("Writing RGF", function(){
    final_rgf="";
    final_rgf+="("+"\n";
    final_rgf+="    ;B[aa] VT[N]TS[4.9] VT[ENDED]TS[5]" + " \n";
    final_rgf+="    (" + "\n";
    final_rgf+="        ;W[bb] VT[N]TS[1.9]" + " \n";
    final_rgf+="        ;TS[2] B[dd]TS[2]" + " \n";
    final_rgf+="    )" + "\n";
    final_rgf+="    (" + "\n";
    final_rgf+="        ;W[bc] AB[ef][fg]VT[N]TS[2.9] AW[cd]TS[3] AB[gh]TS[4]" + " \n";
    final_rgf+="    )" + "\n";
    final_rgf+=")"+"\n";

    equal(RGFParser.writeRGF(rgfparser.rgftree),final_rgf, "Generated RGF file, with standard indentations, created by RGFParser.writeRGF(rgfparser.rgftree): "+RGFParser.writeRGF(rgfparser.rgftree));
    //equal(RGFParser.writeRGF(rgfparser.rgftree,"  ","  "),"", "Generated RGF file, with 2 indentations, created by RGFParser.writeRGF(rgfparser.rgftree,\"<2 spaces>\",\"<2 spaces>\"): "+RGFParser.writeRGF(rgfparser.rgftree,"  ","  "));
    //equal(RGFParser.writeRGF(rgfparser.rgftree,"",""),"", "Generated RGF file, without indentations, created by RGFParser.writeRGF(rgfparser.rgftree,\"\",\"\"): "+RGFParser.writeRGF(rgfparser.rgftree,"",""));
});
test("Consistency", function(){
    var new_rgfparser=new RGFParser(RGFParser.writeRGF(rgfparser.rgftree));
    ok(_.isEqual(rgfparser.rgftree,new_rgfparser.rgftree),"The generated RGF should give the same tree as the original one...");
});
