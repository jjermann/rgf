// variables
var rgf, rgfparser, max_duration;


// Empty rgf parsing
module("Empty rgf parsing", {
    setup: function() {
        rgf="";
        rgfparser=new RGFParser("");
    },
    teardown: function() {
        rgf=undefined;
        rgfparser=undefined;
        max_duration=undefined;
    }
});
test("Basic RGFParser properties", function(){
    equal(rgfparser.rgf, rgf, "RGF Content (rgfparser.rgf): "+rgfparser.rgf);
    equal(rgfparser.index, 0, "Character index after parsing (rgfparser.index): "+rgfparser.index);
    equal(rgfparser.duration, undefined, "Maximal time of all actions (rgfparser.duration): "+ ((rgfparser.duration==undefined) ? "undefined" : rgfparser.duration));
});
test("RGF Tree", function(){
    var root=new RGFNode();
    deepEqual(rgfparser.rgftree, root, "RGF Tree created by rgfparser._parseTree(new RGFNode()) based on rgfparser.rgf => (rgfparser.rgftree)");
});
test("Action List", function(){
    var unsorted_actions=[];
    var sorted_actions=[];
    deepEqual(rgfparser.rgftree._getUnsortedActions(),unsorted_actions, "Step 1: Unsorted Action List created by rgfparser._getUnsortedActions(rgfparser.rgftree), it contains temporary node position information");
    deepEqual(RGFNode._sortActions(rgfparser.rgftree._getUnsortedActions()),sorted_actions, "Step 2: Sorted Action List created by rgfparser._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfparser.action_list,sorted_actions, "Step 3: The Action List created by rgfparser.rgftree.getActions(), it should be the same as <result from above> => (rgfparser.action_list): "+rgfparser.action_list);
});
test("Writing RGF", function(){
    equal(rgfparser.rgftree.writeRGF(),"", "Generated RGF file, with standard indentations, created by rgfparser.rgftree.writeRGF(): "+rgfparser.rgftree.writeRGF());
    equal(rgfparser.rgftree.writeRGF("  "),"", "Generated RGF file, with 2 indentations, created by rgfparser.rgftree.writeRGF(\"<2 spaces>\"): "+rgfparser.rgftree.writeRGF("  "));
    equal(rgfparser.rgftree.writeRGF(""),"", "Generated RGF file, without indentations, created by rgfparser.rgftree.writeRGF(\"\"): "+rgfparser.rgftree.writeRGF(""));
});
test("Consistency", function(){
    var new_rgfparser=new RGFParser(rgfparser.rgftree.writeRGF());
    deepEqual(rgfparser.rgftree,new_rgfparser.rgftree,"The generated RGF should give the same tree as the original one...");
});


// Empty rgf parsing
module("Simple RGF tree parsing", {
    setup: function() {
        rgf=";B[aa]VT[N]TS[49]VT[ENDED]TS[50](;W[bb]VT[N]TS[19];TS[20]B[dd]TS[20])(;W[bc]AB[ef][fg]VT[N]TS[29]AW[cd]TS[30]AB[gh]TS[40])";
        rgfparser=new RGFParser(rgf);
        max_duration=50;
    },
    teardown: function() {
        rgf=undefined;
        rgfparser=undefined;
        max_duration=undefined;
    }
});
test("Basic RGFParser properties", function(){
    //equal(rgfparser.rgf, rgfparser.rgftree.writeRGF()), "RGF Content (rgfparser.rgf): "+rgfparser.rgf);
    equal(rgfparser.index, rgf.length, "Character index after parsing (rgfparser.index): "+rgfparser.index);
    equal(rgfparser.max_duration, max_duration, "Maximal time of all actions (rgfparser.max_duration): "+ ((rgfparser.max_duration==undefined) ? "undefined" : rgfparser.max_duration));
});
test("RGF Tree", function(){
    // here we construct the tree manually
    var root=new RGFNode();
    root.addNode(new RGFNode());
        root.children[0].addProp(new RGFProperty("B","aa"));
        root.children[0].addNode(new RGFNode());
            root.children[0].children[0].addProp(new RGFProperty("W","bb"));
            root.children[0].children[0].addProp(new RGFProperty("VT","N",19));
            root.children[0].children[0].addNode(new RGFNode(20));
                root.children[0].children[0].children[0].addProp(new RGFProperty("B","dd",20));
        root.children[0].addNode(new RGFNode());
            root.children[0].children[1].addProp(new RGFProperty("W","bc"))
            root.children[0].children[1].addProp(new RGFProperty("AB","ef"))
            root.children[0].children[1].addProp(new RGFProperty("AB","fg"))
            root.children[0].children[1].addProp(new RGFProperty("VT","N",29));
            root.children[0].children[1].addProp(new RGFProperty("AW","cd",30))
            root.children[0].children[1].addProp(new RGFProperty("AB","gh",40))
        root.children[0].addProp(new RGFProperty("VT","N",49));
        root.children[0].addProp(new RGFProperty("VT","ENDED",50));
    ok(_.isEqual(rgfparser.rgftree,root), "RGF Tree created by rgfparser._parseTree(new RGFNode()) based on rgfparser.rgf => (rgfparser.rgftree)");
});
test("Action List", function(){
    // here we construct the (un)sorted action lists manually
    var unsorted_actions=[];
    unsorted_actions.push( {time:  -1, counter: 0, name:  ";", arg:      "", position: "",     _node_pos: "0"     } );
    unsorted_actions.push( {time:  -1, counter: 0, name:  "B", arg:    "aa", position: "0"                        } );
    unsorted_actions.push( {time:  49, counter: 0, name: "VT", arg:     "N", position: "0"                        } );
    unsorted_actions.push( {time:  50, counter: 0, name: "VT", arg: "ENDED", position: "0"                        } );
    unsorted_actions.push( {time:  -1, counter: 0, name:  ";", arg:      "", position: "0",    _node_pos: "0.0"   } );
    unsorted_actions.push( {time:  -1, counter: 0, name:  "W", arg:    "bb", position: "0.0"                      } );
    unsorted_actions.push( {time:  19, counter: 0, name: "VT", arg:     "N", position: "0.0"                      } );
    unsorted_actions.push( {time:  20, counter: 0, name:  ";", arg:      "", position: "0.0",  _node_pos: "0.0.0" } );
    unsorted_actions.push( {time:  20, counter: 0, name:  "B", arg:    "dd", position: "0.0.0"                    } );
    unsorted_actions.push( {time:  -1, counter: 0, name:  ";", arg:      "", position: "0",    _node_pos: "0.1"   } );
    unsorted_actions.push( {time:  -1, counter: 0, name:  "W", arg:    "bc", position: "0.1"                      } );
    unsorted_actions.push( {time:  -1, counter: 0, name: "AB", arg:    "ef", position: "0.1"                      } );
    unsorted_actions.push( {time:  -1, counter: 0, name: "AB", arg:    "fg", position: "0.1"                      } );
    unsorted_actions.push( {time:  29, counter: 0, name: "VT", arg:     "N", position: "0.1"                      } );
    unsorted_actions.push( {time:  30, counter: 0, name: "AW", arg:    "cd", position: "0.1"                      } );
    unsorted_actions.push( {time:  40, counter: 0, name: "AB", arg:    "gh", position: "0.1"                      } );

    var sorted_actions=[];
    sorted_actions.push(   {time:  -1, counter: 0, name:  ";", arg:      ""                    } );
    sorted_actions.push(   {time:  -1, counter: 0, name:  "B", arg:    "aa"                    } );
    sorted_actions.push(   {time:  -1, counter: 0, name:  ";", arg:      ""                    } );
    sorted_actions.push(   {time:  -1, counter: 0, name:  "W", arg:    "bb"                    } );
    sorted_actions.push(   {time:  -1, counter: 0, name:  ";", arg:      "", position: "0"     } );
    sorted_actions.push(   {time:  -1, counter: 0, name:  "W", arg:    "bc"                    } );
    sorted_actions.push(   {time:  -1, counter: 0, name: "AB", arg:    "ef"                    } );
    sorted_actions.push(   {time:  -1, counter: 0, name: "AB", arg:    "fg"                    } );
    sorted_actions.push(   {time:  19, counter: 0, name: "VT", arg:     "N", position: "0.0"   } );
    sorted_actions.push(   {time:  20, counter: 0, name:  ";", arg:      ""                    } );
    sorted_actions.push(   {time:  20, counter: 0, name:  "B", arg:    "dd"                    } );
    sorted_actions.push(   {time:  29, counter: 0, name: "VT", arg:     "N", position: "0.1"   } );
    sorted_actions.push(   {time:  30, counter: 0, name: "AW", arg:    "cd"                    } );
    sorted_actions.push(   {time:  40, counter: 0, name: "AB", arg:    "gh"                    } );
    sorted_actions.push(   {time:  49, counter: 0, name: "VT", arg:     "N", position: "0"     } );
    sorted_actions.push(   {time:  50, counter: 0, name: "VT", arg: "ENDED"                    } );

    deepEqual(rgfparser.rgftree._getUnsortedActions(),unsorted_actions, "Step 1: Unsorted Action List created by rgfparser.rgftree._getUnsortedActions(), it contains temporary node position information");
    deepEqual(RGFNode._sortActions(rgfparser.rgftree._getUnsortedActions()),sorted_actions, "Step 2: Sorted Action List created by rgfparser._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfparser.action_list,sorted_actions, "Step 3: The Action List created by rgfparser.rgftree.getActions(), it should be the same as <result from above> => (rgfparser.action_list)");
});
test("Writing RGF", function(){
    final_rgf="";
    final_rgf+="("+"\n";
    final_rgf+="    ;B[aa] VT[N]TS[49] VT[ENDED]TS[50]" + " \n";
    final_rgf+="    (" + "\n";
    final_rgf+="        ;W[bb] VT[N]TS[19]" + " \n";
    final_rgf+="        ;TS[20] B[dd]TS[20]" + " \n";
    final_rgf+="    )" + "\n";
    final_rgf+="    (" + "\n";
    final_rgf+="        ;W[bc] AB[ef][fg] VT[N]TS[29] AW[cd]TS[30] AB[gh]TS[40]" + " \n";
    final_rgf+="    )" + "\n";
    final_rgf+=")"+"\n";

    equal(rgfparser.rgf,final_rgf, "Generated RGF file, with standard indentations, created by rgfparser.rgftree.writeRGF()");
});
test("Consistency", function(){
    var new_rgfparser=new RGFParser(rgfparser.rgftree.writeRGF());
    ok(_.isEqual(rgfparser.rgftree,new_rgfparser.rgftree),"The generated RGF should give the same tree as the original one...");
});
