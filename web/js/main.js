/*
 * Main JavaScript code for NodeJS Dependency Search
 */

var nds = {

    // The current displayed tree
    //
    tree : undefined,

    tree_options : {
        images : {
            line         : "background: url(\"/img/tree_line.png\") repeat-y scroll 0px 0px transparent;",
            minusbottom  : "background: url(\"/img/tree_minusbottom.png\") no-repeat scroll 0px 0px rgb(255, 255, 255);",
            plusbottom   : "background: url(\"/img/tree_plusbottom.png\") repeat-y scroll 0px 0px rgb(255, 255, 255);",
            minus        : "background: url(\"/img/tree_minus.png\") no-repeat scroll 0px 0px transparent;",
            plus         : "background: url(\"/img/tree_plus.png\") repeat-y scroll 0px 0px transparent;",
            joinbottom   : "background: url(\"/img/tree_joinbottom.png\") repeat-y scroll 0px 0px rgb(255, 255, 255);",
            join         : "background: url(\"/img/tree_join.png\") repeat-y scroll 0px 0px transparent;"
        },

        buildDeferredData : function (index, children, callback) {
            "use strict";
            var data = nds.tree.getDataItem(index);
            
            console.log(index, data, children);

            nds._buildTreeData(data.pkg, data.ver, function (treeData) {
                
                console.log("GOT:", treeData);
                
                children.push.apply(children, treeData);
                callback();

            }, function (err, msg) {
                console.log(err, msg);
                alert("Error: " + msg);
            });
        }
    },

    // Initialisation code
    //
    init : function () {
        "use strict";
        c.$("name").focus();
    },

    // Submit a new query
    //
    submit : function() {
        "use strict";

        var pkg = c.$("name").value
        var ver = c.$("version").value;

        nds._buildTreeData(pkg, ver, function (treeData) {
            nds.tree = new derevo.TreeController("tree", treeData, nds.tree_options);            
        }, function (err, msg) {
            console.log(err, msg);
            c.insert(c.$("tree"), c.createText("Error: " + msg));
        });
    },
    
    _buildTreeData : function (pkg, ver, callback, err_callback) {
        "use strict";

        c.api("deps/" + pkg + "/" + ver, "get", {}, function (res) {
            var treeData = [];

            // Build up tree data

            c.iter(c.oKeys(res), function (i, pkg) {
                var ver = res[pkg];
                treeData.push({
                    name     : c.esc(pkg + " (" + ver + ")"),
                    pkg      : pkg,
                    ver      : ver,
                    deferred : true,
                    children : []
                });
                
            });

            callback(treeData);

        }, err_callback);
    }
};
