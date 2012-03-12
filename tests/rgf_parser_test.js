// variables
var rgf, rgfParser, maxDuration;


// Empty rgf parsing
module("Empty rgf parsing", {
    setup: function() {
        rgf="";
        rgfParser=new RGFParser;
        rgfParser.loadRGF("");
    },
    teardown: function() {
        rgf=undefined;
        rgfParser=undefined;
        maxDuration=undefined;
    }
});
test("Basic RGFParser properties", function(){
    equal(rgfParser.rgf, rgf, "RGF Content (rgfParser.rgf): "+rgfParser.rgf);
    equal(rgfParser.index, 0, "Character index after parsing (rgfParser.index): "+rgfParser.index);
    equal(rgfParser.duration, undefined, "Maximal time of all actions (rgfParser.duration): "+ ((rgfParser.duration==undefined) ? "undefined" : rgfParser.duration));
});
test("RGF Tree", function(){
    var root=new RGFNode();
    deepEqual(rgfParser.rgfTree, root, "RGF Tree created by rgfParser._parseTree(new RGFNode()) based on rgfParser.rgf => (rgfParser.rgfTree)");
});
test("Action List", function(){
    var unsortedActions=[];
    var sortedActions=[];
    deepEqual(rgfParser.rgfTree._getUnsortedActions(),unsortedActions, "Step 1: Unsorted Action List created by rgfParser._getUnsortedActions(rgfParser.rgfTree), it contains temporary node position information");
    deepEqual(rgfParser.rgfTree._sortActions(rgfParser.rgfTree._getUnsortedActions()),sortedActions, "Step 2: Sorted Action List created by rgfParser.rgfTree._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfParser.actionList,sortedActions, "Step 3: The Action List created by rgfParser.rgfTree.getActions(), it should be the same as <result from above> => (rgfParser.actionList): "+rgfParser.actionList);
});
test("Writing RGF", function(){
    equal(rgfParser.rgfTree.writeRGF(),"", "Generated RGF file, with standard indentations, created by rgfParser.rgfTree.writeRGF(): "+rgfParser.rgfTree.writeRGF());
    equal(rgfParser.rgfTree.writeRGF("  "),"", "Generated RGF file, with 2 indentations, created by rgfParser.rgfTree.writeRGF(\"<2 spaces>\"): "+rgfParser.rgfTree.writeRGF("  "));
    equal(rgfParser.rgfTree.writeRGF(""),"", "Generated RGF file, without indentations, created by rgfParser.rgfTree.writeRGF(\"\"): "+rgfParser.rgfTree.writeRGF(""));
});
test("Consistency", function(){
    var newRGFparser=new RGFParser;
    newRGFparser.loadRGF(rgfParser.rgfTree.writeRGF());
    deepEqual(rgfParser.rgfTree,newRGFparser.rgfTree,"The generated RGF should give the same tree as the original one...");
});


// Empty rgf parsing
module("Simple RGF tree parsing", {
    setup: function() {
        rgf=";B[aa]VT[N]TS[49]VT[ENDED]TS[50](;W[bb]VT[N]TS[19];TS[20]B[dd]TS[20])(;W[bc]AB[ef][fg]VT[N]TS[29]AW[cd]TS[30]AB[gh]TS[40])";
        rgfParser=new RGFParser;
        rgfParser.loadRGF(rgf);
        maxDuration=50;
    },
    teardown: function() {
        rgf=undefined;
        rgfParser=undefined;
        maxDuration=undefined;
    }
});
test("Basic RGFParser properties", function(){
    //equal(rgfParser.rgf, rgfParser.rgfTree.writeRGF()), "RGF Content (rgfParser.rgf): "+rgfParser.rgf);
    equal(rgfParser.index, rgf.length, "Character index after parsing (rgfParser.index): "+rgfParser.index);
    equal(rgfParser.maxDuration, maxDuration, "Maximal time of all actions (rgfParser.maxDuration): "+ ((rgfParser.maxDuration==undefined) ? "undefined" : rgfParser.maxDuration));
});
test("RGF Tree", function(){
    // here we construct the tree manually
    var root=new RGFNode();
    root.addNode(new RGFNode(-1,0));
        root.children[0].addProp(new RGFProperty("B","aa",-1,1));
        root.children[0].addNode(new RGFNode(-1,2));
            root.children[0].children[0].addProp(new RGFProperty("W","bb",-1,3));
            root.children[0].children[0].addProp(new RGFProperty("VT","N",19));
            root.children[0].children[0].addNode(new RGFNode(20));
                root.children[0].children[0].children[0].addProp(new RGFProperty("B","dd",20));
        root.children[0].addNode(new RGFNode(-1,4));
            root.children[0].children[1].addProp(new RGFProperty("W","bc",-1,5))
            root.children[0].children[1].addProp(new RGFProperty("AB","ef",-1,6))
            root.children[0].children[1].addProp(new RGFProperty("AB","fg",-1,7))
            root.children[0].children[1].addProp(new RGFProperty("VT","N",29));
            root.children[0].children[1].addProp(new RGFProperty("AW","cd",30))
            root.children[0].children[1].addProp(new RGFProperty("AB","gh",40))
        root.children[0].addProp(new RGFProperty("VT","N",49));
        root.children[0].addProp(new RGFProperty("VT","ENDED",50));
    ok(_.isEqual(rgfParser.rgfTree,root), "RGF Tree created by rgfParser._parseTree(new RGFNode()) based on rgfParser.rgf => (rgfParser.rgfTree)");
});
test("Action List", function(){
    // here we construct the (un)sorted action lists manually
    var unsortedActions=[];
    unsortedActions.push( {time:  -1, counter: 0, name:  ";", arg:      "", position: "",     _nodePos: "0"     } );
    unsortedActions.push( {time:  -1, counter: 1, name:  "B", arg:    "aa", position: "0"                        } );
    unsortedActions.push( {time:  49, counter: 0, name: "VT", arg:     "N", position: "0"                        } );
    unsortedActions.push( {time:  50, counter: 0, name: "VT", arg: "ENDED", position: "0"                        } );
    unsortedActions.push( {time:  -1, counter: 2, name:  ";", arg:      "", position: "0",    _nodePos: "0.0"   } );
    unsortedActions.push( {time:  -1, counter: 3, name:  "W", arg:    "bb", position: "0.0"                      } );
    unsortedActions.push( {time:  19, counter: 0, name: "VT", arg:     "N", position: "0.0"                      } );
    unsortedActions.push( {time:  20, counter: 0, name:  ";", arg:      "", position: "0.0",  _nodePos: "0.0.0" } );
    unsortedActions.push( {time:  20, counter: 0, name:  "B", arg:    "dd", position: "0.0.0"                    } );
    unsortedActions.push( {time:  -1, counter: 4, name:  ";", arg:      "", position: "0",    _nodePos: "0.1"   } );
    unsortedActions.push( {time:  -1, counter: 5, name:  "W", arg:    "bc", position: "0.1"                      } );
    unsortedActions.push( {time:  -1, counter: 6, name: "AB", arg:    "ef", position: "0.1"                      } );
    unsortedActions.push( {time:  -1, counter: 7, name: "AB", arg:    "fg", position: "0.1"                      } );
    unsortedActions.push( {time:  29, counter: 0, name: "VT", arg:     "N", position: "0.1"                      } );
    unsortedActions.push( {time:  30, counter: 0, name: "AW", arg:    "cd", position: "0.1"                      } );
    unsortedActions.push( {time:  40, counter: 0, name: "AB", arg:    "gh", position: "0.1"                      } );

    var sortedActions=[];
    sortedActions.push(   {time:  -1, counter: 0, name:  ";", arg:      ""                    } );
    sortedActions.push(   {time:  -1, counter: 1, name:  "B", arg:    "aa"                    } );
    sortedActions.push(   {time:  -1, counter: 2, name:  ";", arg:      ""                    } );
    sortedActions.push(   {time:  -1, counter: 3, name:  "W", arg:    "bb"                    } );
    sortedActions.push(   {time:  -1, counter: 4, name:  ";", arg:      "", position: "0"     } );
    sortedActions.push(   {time:  -1, counter: 5, name:  "W", arg:    "bc"                    } );
    sortedActions.push(   {time:  -1, counter: 6, name: "AB", arg:    "ef"                    } );
    sortedActions.push(   {time:  -1, counter: 7, name: "AB", arg:    "fg"                    } );
    sortedActions.push(   {time:  19, counter: 0, name: "VT", arg:     "N", position: "0.0"   } );
    sortedActions.push(   {time:  20, counter: 0, name:  ";", arg:      ""                    } );
    sortedActions.push(   {time:  20, counter: 0, name:  "B", arg:    "dd"                    } );
    sortedActions.push(   {time:  29, counter: 0, name: "VT", arg:     "N", position: "0.1"   } );
    sortedActions.push(   {time:  30, counter: 0, name: "AW", arg:    "cd"                    } );
    sortedActions.push(   {time:  40, counter: 0, name: "AB", arg:    "gh"                    } );
    sortedActions.push(   {time:  49, counter: 0, name: "VT", arg:     "N", position: "0"     } );
    sortedActions.push(   {time:  50, counter: 0, name: "VT", arg: "ENDED"                    } );

    deepEqual(rgfParser.rgfTree._getUnsortedActions(),unsortedActions, "Step 1: Unsorted Action List created by rgfParser.rgfTree._getUnsortedActions(), it contains temporary node position information");
    deepEqual(rgfParser.rgfTree._sortActions(rgfParser.rgfTree._getUnsortedActions()),sortedActions, "Step 2: Sorted Action List created by rgfParser.rgfTree._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfParser.actionList,sortedActions, "Step 3: The Action List created by rgfParser.rgfTree.getActions(), it should be the same as <result from above> => (rgfParser.actionList)");
});
test("Writing RGF", function(){
    finalRGF="";
    finalRGF+="("+"\n";
    finalRGF+="    ;B[aa] VT[N]TS[49] VT[ENDED]TS[50]" + " \n";
    finalRGF+="    (" + "\n";
    finalRGF+="        ;W[bb] VT[N]TS[19]" + " \n";
    finalRGF+="        ;TS[20] B[dd]TS[20]" + " \n";
    finalRGF+="    )" + "\n";
    finalRGF+="    (" + "\n";
    finalRGF+="        ;W[bc] AB[ef][fg] VT[N]TS[29] AW[cd]TS[30] AB[gh]TS[40]" + " \n";
    finalRGF+="    )" + "\n";
    finalRGF+=")"+"\n";

    equal(rgfParser.rgf,finalRGF, "Generated RGF file, with standard indentations, created by rgfParser.rgfTree.writeRGF()");
});
test("Consistency", function(){
    var newRGFparser=new RGFParser;
    newRGFparser.loadRGF(rgfParser.rgfTree.writeRGF());
    ok(_.isEqual(rgfParser.rgfTree,newRGFparser.rgfTree),"The generated RGF should give the same tree as the original one...");
});
