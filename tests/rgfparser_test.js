// variables
var rgfparser;


// Empty rgf parsing
module("Empty rgf parsing", {
    setup: function() {
        rgfparser=new RGFParser("");
    },
    teardown: function() {
        rgfparser=undefined;
    }
});
test("Basic RGFParser properties", function(){
    equal(rgfparser.rgf,   "", "RGF Content (rgfparser.rgf): "+rgfparser.rgf);
    equal(rgfparser.index,  0, "Character index after parsing (rgfparser.index): "+rgfparser.index);
});
test("RGF Tree", function(){
    deepEqual(rgfparser.rgftree, new RGFNode, "RGF Tree created by rgfparser._parseTree(new RGFNode()) based on rgfparser.rgf => (rgfparser.rgftree)");
});
test("Action List", function(){
    deepEqual(RGFParser._getUnsortedActions(rgfparser.rgftree),[], "Step 1: Unsorted Action List created by rgfparser._getUnsortedActions(rgfparser.rgftree), it contains temporary node position information");
    deepEqual(RGFParser._sortActions(RGFParser._getUnsortedActions(rgfparser.rgftree)),[], "Step 2: Sorted Action List created by rgfparser._sortActions(<result from above>), it uses the temporary information and removes it");
    deepEqual(rgfparser.action_list,[], "Step 3: The Action List created by rgfparser.getActions(rgfparser.rgftree), it should be the same as <result from above> => (rgfparser.action_list): "+rgfparser.action_list);
});
test("Writing RGF", function(){
    equal(RGFParser.writeRGF(rgfparser.rgftree),"", "Generated RGF file, with standard indentations, created by RGFParser.writeRGF(rgfparser.rgftree): "+RGFParser.writeRGF(rgfparser.rgftree));
    equal(RGFParser.writeRGF(rgfparser.rgftree,"  ","  "),"", "Generated RGF file, with 2 indentations, created by RGFParser.writeRGF(rgfparser.rgftree,\"<2 spaces>\",\"<2 spaces>\"): "+RGFParser.writeRGF(rgfparser.rgftree,"  ","  "));
    equal(RGFParser.writeRGF(rgfparser.rgftree,"",""),"", "Generated RGF file, without indentations, created by RGFParser.writeRGF(rgfparser.rgftree,\"\",\"\"): "+RGFParser.writeRGF(rgfparser.rgftree,"",""));
});
