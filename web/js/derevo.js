/*
 derevo.js

 by Matthias Ladkau (matthias@devt.de)

 Javascript Tree Control.

 -------
The MIT License (MIT)

Copyright (c) 2013 Matthias Ladkau

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE
 */

if (derevo === undefined) {
    var derevo = {};
}

// Utility functions
// =================
derevo.$ = function(id) { "use strict"; return document.getElementById(id); };

derevo.bind = function () {
    "use strict";
    var f = arguments[0],
        t = Array.prototype.slice.call(arguments, 1),
        a = t.splice(1);
    return function() {
        return f.apply(t[0],
                       a.concat(Array.prototype.slice.call(arguments, 0)));
    };
};

derevo.getObjectKeys = function (obj) {
    "use strict";
    var key, keys = [];
    for(key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
};

derevo.cloneData = function (obj) {
    "use strict";
    var ret;
    if (obj instanceof Array) {
        ret = [];
        for (var i=0;i<obj.length;i++) {
            ret.push(derevo.cloneData(obj[i]));
        }
    } else if (obj instanceof Object) {
        ret = {};
        for (var attr in obj) {
            ret[attr] = derevo.cloneData(obj[attr]);
        }
    } else {
        ret = obj;
    }
    return ret;
}

derevo.copyObject = function (o1, o2) {
    "use strict";
    for (var attr in o1) {
        o2[attr] = o1[attr];
    }
};

derevo.iterate = function (list, iterator) {
    "use strict";
    for (var i=0;i<list.length;i++) {
        if (iterator(i, list[i]) === false) {
            break;
        }
    }
};

derevo.create = function(tag, attrs) {
    "use strict";
    var element = document.createElement(tag);
    if (attrs !== undefined) {
        derevo.iterate(derevo.getObjectKeys(attrs),
                       function (i, v) {
                           element.setAttribute(v, attrs[v]);
                       });
    }
    return element;
};

derevo.insert = function(element, child) {
    "use strict";
    element.appendChild(child);
};

derevo.insertBefore = function(element, child) {
    "use strict";
    element.parentNode.insertBefore(child, element);
};

derevo.insertAfter = function(element, child) {
    "use strict";
    element.parentNode.insertBefore(child, element.nextSibling);
};

derevo.findChildren = function (element, tags, max) {
    "use strict";
    var items = [],
        collect = function (i, item) {
            if (tags.indexOf(item.tagName.toLowerCase()) !== -1) {
                items.push(item);
                if (max !== undefined && items.length === max) {
                    return;
                }
            }
            derevo.iterate(item.children, collect);
        };
    collect(0, element);
    return items;
};

derevo.addClassName = function(element, name) {
    "use strict";
    if (derevo.hasClassName(element, name)) {
        return;
    }
    var classes = element.getAttribute("class");
    if (classes === null || classes.length === 0) {
        classes = name;
    } else {
        classes += " " + name;
    }
    element.setAttribute("class", classes);
};

derevo.hasClassName = function(element, name) {
    "use strict";
    var classes = element.getAttribute("class");
    if (classes === null) {
        return false;
    }
    return classes.split(" ").indexOf(name) !== -1;
};

derevo.removeClassName = function(element, name) {
    "use strict";
    var classes = element.getAttribute("class").split(" "),
        index   = classes.indexOf(name);
    if (index !== -1) {
        classes.splice(index, 1);
        element.setAttribute("class", classes.join(" "));
    }
};

derevo.addEvent = function (element, eventName, func) {
    "use strict";
    if (element.addEventListener) {
        element.addEventListener(eventName, func, false);
    } else if (element.attachEvent) {
        element.attachEvent('on' + eventName, func);
    }
};

derevo.stopBubbleEvent = function (e) {
    "use strict";
    e = e ? e:window.event;
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.cancelBubble !== null) {
        e.cancelBubble = true;
    }
};

// Class implementation
// ====================
// Class objects with constructor and multi-inheritance support.
//
// Based on: Simple JavaScript Inheritance by John Resig
// http://ejohn.org/blog/simple-javascript-inheritance/
//
// Inspired by base2 and Prototype
//
derevo.Class = function() {};
(function(){

    // Pattern which checks if a given function uses the function _super - this test
    // returns always true if toString on a function does not return the function code
    var functionUsesSuper = /abc/.test(function () { abc(); }) ? /\b_super\b/ : /.*/;

    // Flag which is used to detect if we are currently initialising
    var initializing = false;

    // Add create function to the new class object
    derevo.Class.create = function() {

        // Get the current prototype as the super prototype of the new class
        var _super = this.prototype;

        // Clone the current class object (without running the init constructor function)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Go through all given mixin objects. Each object should be either
        // a normal properties object or a constructor function.
        for (var i = 0; i < arguments.length; i++) {
            var properties = arguments[i];

            // Check if the given mixin is a constructor funtion
            if (typeof properties === "function") {
                // Use the prototype as properties
                properties = properties.prototype;
            }

            // Copy the given properties to the cloned class object
            for (var name in properties) {

                // Check if we're overwriting an existing function and if the new function uses
                // it by calling _super
                if (typeof properties[name] == "function" &&
                    typeof _super[name] == "function" &&
                    functionUsesSuper.test(properties[name])) {

                    // If _super is called we need to wrap the given function
                    // in a closure and provide the right environment
                    prototype[name] = (
                        function(name, func, _super) {
                            return function() {
                                var t, ret;
                                // Save the current value in _super
                                t = this._super;
                                // Add the function from the current class object as _super function
                                this._super = _super[name];
                                // Run the function which calls _super
                                ret = func.apply(this, arguments);
                                // Restore the old value in _super
                                this._super = t;
                                // Return the result
                                return ret;
                            };
                        }
                    )(name, properties[name], _super);

                } else {

                    prototype[name] = properties[name];
                }
            }

            // Once the mixin is added it becomes the new super class
            // so we can have this._super call chains
            _super = properties;
        }

        // Defining a constructor function which is used to call the constructor function init on objects
        var Class = function () {
          if ( !initializing && this.init ) {
            this.init.apply(this, arguments);
          }
        };

        // Put our constructed prototype object in place
        Class.prototype = prototype;

        // Constructor of the new object should be Class
        // (this must be done AFTER the prototype was assigned)
        Class.prototype.constructor = Class;

        // The current function becomes the create function
        // on the new object
        Class.create = arguments.callee;

        return Class;
    };
})();

// Constants
// =========

derevo.INDEX_ATTR      = "_derevo_index";
derevo.CLASS_COLLAPSED = "collapsed";

// Default Event Handler
// =====================
//
// All event handler have the controller as "this" context.

derevo.default_event_handler = {

    // Toggle a branch in the tree
    //
    // element        - Element that is being toggled.
    // e              - Click event.
    // toggleCallback - Function to be called after the toggle event has ended.
    //
    branchToggle : function (element, e, toggleCallback) {
        "use strict";

        var index           = element[derevo.INDEX_ATTR],
            child_container = derevo.findChildren(element, "ul", 1)[0],
            click_point;

        if (e !== undefined) {
            // Check click point - only toggle if clicked in the box
            click_point = derevo.default_event_handler._calculateClickPoint(e,element)
            if (click_point.y > 20) {
                return;
            }
        }

        // Check if there are children to collapse / expand

        if (child_container.children.length > 0) {
            if (derevo.hasClassName(element, derevo.CLASS_COLLAPSED)) {
                derevo.removeClassName(element, derevo.CLASS_COLLAPSED);
            } else {
                derevo.addClassName(element, derevo.CLASS_COLLAPSED);
            }
            this._setBranchImage(element);
            if (toggleCallback !== undefined) {
                toggleCallback();
            }
        }

        // Check if this is a deferred node

        else {
            var dataItem = this.getDataItem(index);
            if ("deferred" in dataItem) {
                var callback = derevo.bind(function () {
                    delete dataItem["deferred"];
                    this._insertChildren(index, element, dataItem);
                    this._setBranchImage(element);
                    if (toggleCallback !== undefined) {
                        toggleCallback();
                    }
                }, this);
                derevo.bind(this._options.buildDeferredData, this)
                    (index, dataItem["children"], callback);
            } else {
                if (toggleCallback !== undefined) {
                    toggleCallback();
                }
            }
        }

        if (e !== undefined) {
            derevo.stopBubbleEvent(e);
        }
    },

    // Get the point of a mouse event (internal function).
    //
    // event   - Mouse event.
    // element - Element where the click point should be calculated.
    //           The point will be relative to the element's position.
    //           If undefined then the click point is absolute on the document.
    //
    _calculateClickPoint : function (event, element) {
        "use strict";

        if (event._ccp_cp !== undefined) {
            return event._ccp_cp;
        }

        var docElement = document.documentElement,
            body = document.body || { scrollLeft: 0, scrollTop: 0 },
            getX = function () {
              return event.pageX || (event.clientX +
                     (docElement.scrollLeft || body.scrollLeft) -
                     (docElement.clientLeft || 0));
            },
            getY = function () {
              return  event.pageY || (event.clientY +
                      (docElement.scrollTop || body.scrollTop) -
                      (docElement.clientTop || 0));
            },
            getOffset = function (element) {
                var top = 0,
                    left = 0;

                if (element.parentNode) {

                  while(element !== null) {

                    top  += element.offsetTop  || 0;
                    left += element.offsetLeft || 0;
                    element = element.offsetParent;
                  }
                }

                return {
                    left : left,
                    top  : top
                };
            },
            cp;

        if (!element) {
            cp = {
                x : getX(),
                y : getY()
            };
        } else {
            var offset = getOffset(element);

            cp = {
                x : getX() - offset.left,
                y : getY() - offset.top
            };
        }

        event._ccp_cp = cp;

        return cp;
    }
}

// Default Options
// ===============

derevo.default_options = {

    event_handler      : derevo.default_event_handler,

    images             : {
        line         : "background: url(\"img/tree_line.png\") repeat-y scroll 0px 0px transparent;",
        minusbottom  : "background: url(\"img/tree_minusbottom.png\") no-repeat scroll 0px 0px rgb(255, 255, 255);",
        plusbottom   : "background: url(\"img/tree_plusbottom.png\") repeat-y scroll 0px 0px rgb(255, 255, 255);",
        minus        : "background: url(\"img/tree_minus.png\") no-repeat scroll 0px 0px transparent;",
        plus         : "background: url(\"img/tree_plus.png\") repeat-y scroll 0px 0px transparent;",
        joinbottom   : "background: url(\"img/tree_joinbottom.png\") repeat-y scroll 0px 0px rgb(255, 255, 255);",
        join         : "background: url(\"img/tree_join.png\") repeat-y scroll 0px 0px transparent;"
    },

    allow_single_root  : true,  // If data has only one item show this item as root node

    // Function for constructing the HTML of a node in the tree.
    //
    // nodediv - Div element in the tree which should contain the HTML.
    // index   - Node index.
    // data    - Object from the given data structure which represents the node.
    buildNode : function (nodediv, index, data) {
        "use strict";
        nodediv.innerHTML = data["name"];
    },

    // Function to build deferred data. Some nodes in the tree
    // can have the attribute and value "deferred : true" which
    // means that the children of this node should not be displayed
    // in the beginning (the children list may be empty).
    // This function is called when the user clicks on the expand toggle.
    //
    // index    - Index of the parent item.
    // children - Current list of children - this list may be expanded
    //            during the function call.
    // callback - Function to be called after the update has finished
    //            (without parameters).
    //
    buildDeferredData : function (index, children, callback) {
        "use strict";
        callback();
    }
}

// Tree Visualization
// ==================
//
// This class controls a tree in the UI.
//
derevo.TreeController =  derevo.Class.create({

    // Initialise the tree object.
    //
    // root_element_id - ID of root element (should be a block element - e.g. div).
    // data            - Datastructure modelling the tree (may be undefined).
    // options         - Options for the controller.
    //
    init : function (root_element_id, data, options) {
        "use strict";

        // Get root element and make sure it is empty

        this._root_element = derevo.$(root_element_id);

        if (this._root_element == null) {
            throw new Error("Could not find root element");
        }

        this._options = {};
        derevo.copyObject(derevo.default_options, this._options);
        if (options !== undefined) {
            derevo.copyObject(options, this._options);
        }

        derevo.addClassName(this._root_element, "tree");
        this._root_element.innerHTML = "";

        if (data !== undefined) {
            this.update(data);
        } else {
            this._data = {};
        }
    },

    // Main API
    // ========

    // Update the tree. This will clear any existing data and display elements.
    //
    // data           - Data to display. The data should be either
    //                  a list with a single child object (as root node)
    //                  or a list of child objects (which present the
    //                  first level of the tree). Each child object
    //                  should have the following form:
    //
    //                  <child obj> ::= { name     : <String>,
    //                                    selected : <Boolean>,
    //                                    children : <List of child nodes> }
    //
    update : function (data) {
        "use strict";

        this._root_element.innerHTML = "";

        if (data !== undefined) {
            if (!(data instanceof Array)) {
                throw new Error("Expected data to be an array");
            }
            this._data = data;
            this._updateTree();
        }
    },

    // Update part of the tree. This function should be called
    // if the tree data structure has changed.
    //
    // index - Index of the parent node where the children have changed.
    //
    updateBranch : function (index) {
        "use strict";

        var domElement = this.getDomElement(index),
            dataItem   = this.getDataItem(index);

        if (domElement === undefined || dataItem === undefined) {
            throw new Error("Could not find element " + index);
        }

        this._setBranchImage(domElement, dataItem);
        this._insertChildren(domElement[derevo.INDEX_ATTR], domElement, dataItem);

    },

    // Reload part of the tree. This function removes
    // the current child elements and triggers a click
    // event. Use this function only if the tree uses
    // deferred items.
    //
    // index    - Index of the parent node.
    // callback - Function to be called after the operation has ended.
    //
    reloadBranch : function (index, callback) {
        "use strict";

        var item = this.getDataItem(index),
            element = this.getDomElement(index);

        // Clear out all children in the dom
        derevo.findChildren(element, "ul", 1)[0].innerHTML = "";

        // Clear out all children in the data structure
        item["children"] = [];

        // Reset the deferred state
        item["deferred"] = true;

        // Trigger a click event
        derevo.bind(this._options.event_handler.branchToggle, this)(element, undefined, callback);
    },

    // Ensure that a particular branch is open. A click
    // event is generated if the branch is closed.
    //
    // index    - Index of the parent node.
    // callback - Function to be called after the operation has ended.
    //
    openBranch : function (index, callback) {
        "use strict";

        var item    = this.getDataItem(index),
            element = this.getDomElement(index);

        if (element === undefined || item === undefined) {
            throw new Error("Could not find element " + index);
        }

        if ("deferred" in item || derevo.hasClassName(element, derevo.CLASS_COLLAPSED)) {
            derevo.bind(this._options.event_handler.branchToggle, this)(element, undefined, callback);
        } else if (callback !== undefined) {
            callback();
        }
    },

    // Iterate through all children of a given node.
    //
    // index    - Index of the parent node.
    // callback - Function to be called for each child.
    //            Parameters: index, childElement, childData
    //
    iterateChildren : function (index, callback) {
        "use strict";

        var domElement = this.getDomElement(index);

        if (domElement === undefined) {
            throw new Error("Could not find element " + index);
        }

        var iteratorFunction = derevo.bind(function (i, v) {
                var index = v[derevo.INDEX_ATTR],
                    dataItem = this.getDataItem(index);
                callback(index, v, dataItem);
            }, this),
            children = derevo.findChildren(domElement, "li");

        if (children[0] === domElement) {
            children = children.splice(1);
        }

        derevo.iterate(children, iteratorFunction);
    },

    // Iterate through all parents of a given node.
    //
    // index    - Index of the child node.
    // callback - Function to be called for each parent.
    //            Parameters: index, parentElement, parentData
    //
    iterateParents : function (index, callback) {

        var domElement = this.getDomElement(index),
            getParent  = derevo.bind(function(element) {
                var parentNode = element.parentNode;
                if (derevo.INDEX_ATTR in parentNode) {
                    var parentIndex = parentNode[derevo.INDEX_ATTR];
                    if (parentIndex !== "") {
                        var dataItem = this.getDataItem(parentIndex);
                        callback(parentIndex, parentNode, dataItem);
                    }
                }
                if (!derevo.hasClassName(parentNode, "tree")) {
                    getParent(parentNode);
                }
            }, this);

        if (domElement === undefined) {
            throw new Error("Could not find element " + index);
        }

        if (!derevo.hasClassName(domElement, "tree")) {
            getParent(domElement);
        }
    },

    // Insert a child at a specific position.
    //
    // parentIndex - Index of parent node where to insert the child.
    // childData   - Data of child to insert.
    //
    insertChild : function (parentIndex, childData) {
        "use strict";

        if (parentIndex === '') {

            if (this._data.length === 1 && this._options.allow_single_root) {
                // We got only one root node on the first level and want to
                // insert another node there.

                // Create a new root node
                var new_root_node = this._createTreeNode(''),
                    ul = new_root_node.children[0],
                    li = derevo.create("li"),
                    old_root_element = this._root_element.children[0];

                li[derevo.INDEX_ATTR] = "0L";
                derevo.insert(this._root_element, new_root_node);
                derevo.insert(ul, li);
                derevo.insert(li, old_root_element);
                derevo.addEvent(li, "click",
                    derevo.bind(this._options.event_handler.branchToggle,
                                this, li));
                this._setBranchImage(li);
                this._root_element[derevo.INDEX_ATTR] = "";
                this._fixIndex(this._root_element);
            }

            this._data.push(childData);
            this._insertChildren('', this._root_element,
                                 { children : [ childData ] }, true);
            return;
        }

        var domElement = this.getDomElement(parentIndex),
            dataItem   = this.getDataItem(parentIndex);

        if (domElement === undefined || dataItem === undefined) {
            throw new Error("Could not find parent");
        }

        if (! ("children" in dataItem)) {
            dataItem["children"] = [];
        }

        dataItem["children"].push(childData);
        this._insertChildren(domElement[derevo.INDEX_ATTR], domElement,
                             { children : [ childData ] }, true);
        this._setBranchImage(domElement);
    },

    // Calculate the parent index of a given index.
    //
    // index - Index of the child.
    //
    // Returns the index of the parent.
    //
    getParentIndex : function (index) {
        "use strict";
        var indexPath = index.split("-");
        if (indexPath.length === 0) {
            return "";
        }
        indexPath.splice(indexPath.length - 1);
        return indexPath.join("-");
    },

    // Delete a child at a specific position.
    //
    // index - Index of node which should be deleted.
    //
    deleteChild : function (index) {
        "use strict";

        var domElement = this.getDomElement(index),
            dataItem   = this.getDataItem(index),
            parentIndex, parentElement,
            parentElementUl, parentDataItem;

        if (domElement === undefined || dataItem === undefined) {
            throw new Error("Could not find element " + index);
        }

        // Calculate parent index
        parentIndex = this.getParentIndex(domElement[derevo.INDEX_ATTR]),
        parentElement  = this.getDomElement(parentIndex),
        parentDataItem = this.getDataItem(parentIndex);

        if (!(parentDataItem instanceof Array)) {
            parentDataItem = parentDataItem["children"];
        }

        // Remove item from data structure

        parentDataItem.splice(parentDataItem.indexOf(dataItem), 1);

        // Remove item from dom

        domElement.parentNode.removeChild(domElement);

        // Fix up index of siblings

        parentElementUl = derevo.findChildren(parentElement, "ul", 1)[0];

        // Check if we need to go back to single root node

        if (this._options.allow_single_root && parentIndex === '' &&
            parentElementUl.children.length === 1) {

            derevo.insert(this._root_element, parentElementUl.children[0].children[0]);
            parentElement.removeChild(parentElement.children[0]);
            this._root_element[derevo.INDEX_ATTR] = "0L";
        }

        // Fix up image of parent

        this._setBranchImage(parentElement);

        // Fix up index

        this._fixIndex(parentElement);
    },

    _fixIndex : function (element) {
        "use strict";

        var parentIndex = element[derevo.INDEX_ATTR],
            parentElementUl = derevo.findChildren(element, "ul", 1)[0];

        derevo.iterate(parentElementUl.children, derevo.bind(function (i, v) {
            v[derevo.INDEX_ATTR] = parentIndex;
            if (parentIndex !== '') {
                v[derevo.INDEX_ATTR] += "-";
            }
            v[derevo.INDEX_ATTR] += i;
            if (i === parentElementUl.children.length - 1) {
                v[derevo.INDEX_ATTR] += "L";
            }
            this._setBranchImage(v);

            this._fixIndex(v);
        }, this));
    },

    // Lookup a data item of a given index.
    //
    // index - Index to lookup.
    //
    getDataItem : function (index) {
        "use strict";

        var path = index.replace(/L/g, '').split("-"),
            element;

        if (index === '') {
            return this._data;
        }

        element = this._data[path[0]];

        for (var i = 1; i < path.length; i++) {
            if (element === undefined || (!"children" in element)) {
                return undefined;
            }
            element = element["children"][path[parseInt(i)]];
        }

        return element;
    },

    // Return the dom element which is of a give index.
    //
    // index - Index to lookup.
    //
    getDomElement : function (index) {
        "use strict";

        var element = derevo.findChildren(this._root_element, "ul", 1)[0],
            path = index.replace(/L/g, '').split("-");

        if (index === '') {
            return this._root_element;
        }

        if (this._data.length === 1 && this._options.allow_single_root) {
            // There is only one root node in this case
            element = element.parentNode.parentNode;
            if (path[0] !== "0") {
                return undefined;
            }
        } else {
            element = element.children[path[0]];
        }

        for (var i = 1; i < path.length; i++) {
            if (element === undefined) {
                return undefined;
            }
            element = derevo.findChildren(element, "ul", 1)[0];
            element = element.children[path[i]];
        }

        return element;
    },

    // Rebuild the entire tree.
    //
    _updateTree : function () {
        "use strict";

        if (this._data.length === 0) {
            // Nothing to display
            return
        }

        // Decide if a root node should be shown or not

        if (this._data.length === 1 && this._options.allow_single_root) {

            var node = this._createTreeNode('0L', this._data[0]),
                boxdiv;
            this._root_element[derevo.INDEX_ATTR] = '0L';
            derevo.insert(this._root_element, node);
            boxdiv = derevo.findChildren(node, "div", 1)[0];
            this._setTreeImage(boxdiv, this._options.images.line);
            this._insertChildren('0L', node, this._data[0]);

        } else {

            var node = this._createTreeNode('');
            this._root_element[derevo.INDEX_ATTR] = "";
            derevo.insert(this._root_element, node);
            this._insertChildren('', node, { children : this._data });
        }
    },

    // Insert all child elements from a given tree position.
    //
    // parent_index - Index of parent node.
    // parent_node  - Parent node (children will be inserted in the parents
    //               child container.
    // data         - Data item from which to build the child elements.
    // insert       - Flag which should be set if inserting into an existing tree.
    //
    _insertChildren : function (parent_index, parent_node, data, insert) {
        "use strict";

        if ("deferred" in data) {
            return;
        }

        if ("children" in data) {

            var child_container = derevo.findChildren(parent_node, "ul", 1)[0];

            if (child_container.tagName.toLowerCase() !== "ul") {
                throw new Error("Unexpected child container at index " + parent_index);
            }

            if (insert !== true) {
                // Make sure the child container is empty
                child_container.innerHTML = "";
            }

            derevo.iterate(data["children"], derevo.bind(function (i, child) {
                var childNumber = child_container.children.length,
                    index = (parent_index !== '' ? parent_index + "-" : '') +
                            childNumber + (i === data["children"].length - 1 ? "L" : ""),
                    li = derevo.create("li"),
                    node = this._createTreeNode(index, child);

                derevo.insert(li, node);
                derevo.insert(child_container, li);
                this._insertChildren(index, node, child);

                li[derevo.INDEX_ATTR] = index;

                derevo.addEvent(li, "click",
                    derevo.bind(this._options.event_handler.branchToggle,
                                this, li));
                this._setBranchImage(li, child);

            }, this));

            if (insert) {
                // Fix up index attribute in case of insert
                this._fixIndex(parent_node);
            }
        }
    },

    // Set the correct branch image on a given tree element
    //
    // li    - Element which will display the branch image
    // child - Data item for the branch. The item will be
    //         looked up via the index if the parameter is undefiend.
    //
    _setBranchImage : function (li, child) {
        "use strict";

        var index  = li[derevo.INDEX_ATTR],
            boxdiv = derevo.findChildren(li, "div", 1)[0];

        if (child === undefined) {
            child = this.getDataItem(index);
        }

        if (("children" in child && child["children"].length > 0) ||
            "deferred" in child) {

            // Special case the "last" child
            if (index.search(/L$/) !== -1) {
                if (derevo.hasClassName(li, derevo.CLASS_COLLAPSED) ||
                    "deferred" in child) {
                    this._setTreeImage(li, this._options.images.plusbottom);
                    this._setTreeImage(boxdiv, '');
                } else {
                    this._setTreeImage(li, this._options.images.minusbottom);
                    this._setTreeImage(boxdiv, this._options.images.line);
                }
            } else {
                if (derevo.hasClassName(li, derevo.CLASS_COLLAPSED) ||
                    "deferred" in child) {
                    this._setTreeImage(li, this._options.images.plus);
                    this._setTreeImage(boxdiv, '');
                } else {
                    this._setTreeImage(li, this._options.images.minus);
                    this._setTreeImage(boxdiv, this._options.images.line);
                }
            }
        } else {
            // Special case the "last" child
            if (index.search(/L$/) !== -1) {
                this._setTreeImage(li, this._options.images.joinbottom);
            } else {
                this._setTreeImage(li, this._options.images.join);
            }
        }
    },

    // Create a single tree element.
    //
    // index    - Index of the child element.
    // childObj - Data object containing the data which
    //            should be displayed on the tree element.
    //            If undefined then only the child container
    //            will be returned.
    //
    // Returns the tree element.
    //
    _createTreeNode : function (index, childObj) {
        "use strict";

        var elementspan = derevo.create("span", {
                "class" : "tree-element"
            }),
            boxdiv = derevo.create("div", {
                "class" : "box"
            }),
            nodediv = derevo.create("div", {
                "class" : "node"
            }),
            ul = derevo.create("ul");

        this._setTreeImage(ul, this._options.images.line);

        // Insert the node
        if (childObj !== undefined) {

            this._options.buildNode(nodediv, index, childObj);
            derevo.insert(boxdiv, nodediv);
            derevo.insert(elementspan, boxdiv);
            derevo.insert(elementspan, ul);

        } else {

            derevo.insert(elementspan, ul);
        }

        return elementspan;
    },

    // Set the appropriate tree image on a tree element.
    //
    _setTreeImage : function (element, image) {
        "use strict";
        element.setAttribute("style", image);
    }
});

derevo.DEFERRED_SELECTION = "_derevo_deferred_selection";

derevo.default_select_tree_event_handler = {

    branchToggle : function (element, e, toggleCallback) {
        var index = element[derevo.INDEX_ATTR],
            dataItem  = this.getDataItem(index),
            deferredLoading = "deferred" in dataItem;
        derevo.bind(derevo.default_event_handler.branchToggle, this)
            (element, e, derevo.bind(function() {

                var inputElement = derevo.findChildren(element, "input", 1)[0];

                if (derevo.DEFERRED_SELECTION in inputElement) {
                    // There was a deferred selection stored here;
                    // apply it again
                    var selected = inputElement[derevo.DEFERRED_SELECTION];
                    delete inputElement[derevo.DEFERRED_SELECTION];
                    for (var i=0; i<selected.length; i++) {
                        this.toggleChild(selected[i]);
                    }
                } else if (deferredLoading && inputElement.checked) {
                    // Apply selection to children
                    var ul = derevo.findChildren(element, "ul", 1)[0];
                    for (var i=0; i<ul.children.length; i++) {
                        var childData = this.getDataItem(ul.children[i][derevo.INDEX_ATTR]),
                            childInput = derevo.findChildren(ul.children[i], "input", 1)[0];

                        childInput.checked = true;
                        childData.selected = true;
                    }
                } else if (deferredLoading) {
                    // Apply selection to parents
                    var ul = derevo.findChildren(element, "ul", 1)[0];
                    for (var i=0; i<ul.children.length; i++) {
                        var childIndex = ul.children[i][derevo.INDEX_ATTR],
                            childData = this.getDataItem(childIndex),
                            childInput = derevo.findChildren(ul.children[i], "input", 1)[0];

                        if (childData.selected) {
                            derevo.bind(this._options.event_handler.tickToggle, this)(childIndex, childInput, childData);
                        }
                    }
                }

                if (toggleCallback !== undefined) {
                    toggleCallback();
                }
            }, this));
    },

    tickToggle   : function (index, tickbox, childObj, e) {
        "use strict";

        var dataItem = this.getDataItem(index);

        dataItem["selected"] = tickbox.checked;

        // Remove any deferred selection
        tickbox.indeterminate = false;
        delete tickbox[derevo.DEFERRED_SELECTION]

        if (tickbox.checked) {
            // Select all children
            this.iterateChildren(index, function (index, childElement, childData) {
                childData["selected"] = true;
                var childInput = derevo.findChildren(childElement, "input", 1)[0];
                childInput.indeterminate = false;
                childInput.checked = true;
            });
            // Select all parents where all children are selected
            this.iterateParents(index, function (index, parentElement, parentData) {
                var parentInput = derevo.findChildren(parentElement, "input", 1)[0],
                    ul = derevo.findChildren(parentElement, "ul", 1)[0],
                    allchecked = true;
                derevo.iterate(ul.children, function (i, v) {
                    var childInput = derevo.findChildren(v, "input", 1)[0];
                    allchecked = allchecked && childInput.checked;
                });
                if (allchecked) {
                    parentInput.checked = allchecked;
                    parentInput.indeterminate = false;
                } else {
                    parentInput.indeterminate = true;
                }
            });
        } else {
            // Deselect all children
            this.iterateChildren(index, function (index, childElement, childData) {
                childData["selected"] = false;
                var childInput = derevo.findChildren(childElement, "input", 1)[0];
                childInput.indeterminate = false;
                childInput.checked = false;
            });

            // Deselect all parents
            var parents_indeterminate = false;
            this.iterateParents(index, function (index, parentElement, parentData) {
                var parentInput = derevo.findChildren(parentElement, "input", 1)[0];
                if (!parents_indeterminate) {
                    var ul = derevo.findChildren(parentElement, "ul", 1)[0],
                        child_checked = false;
                    for (var i=0; i<ul.children.length; i++) {
                        var childInput = derevo.findChildren(ul.children[i], "input", 1)[0];
                        if (childInput.checked) {
                            child_checked = true;
                            break;
                        };
                    }

                    if (child_checked) {
                        parentInput.indeterminate = true;
                        parents_indeterminate = true;
                    } else {
                        parentInput.indeterminate = false;
                    }
                } else {
                    parentInput.indeterminate = true;
                }

                parentData["selected"] = false;
                parentInput.checked = false;
            });
        }

        if (e !== undefined) {
            derevo.stopBubbleEvent(e);
        }
    }
}

derevo.default_select_tree_options = {
    event_handler      : derevo.default_select_tree_event_handler
};

derevo.SelectTreeController = derevo.TreeController.create({

    init : function (root_element_id, data, options) {
        "use strict";

        var select_tree_options = {};

        derevo.copyObject(derevo.default_select_tree_options, select_tree_options);
        if (options !== undefined) {
            derevo.copyObject(options, select_tree_options);
        }

        this._super(root_element_id, data, select_tree_options);
    },

    // Check the tick status of a given child.
    //
    // index - Index of the child element.
    //
    getChildTickStatus : function (index) {
        "use strict";
        var domElement = this.getDomElement(index);

        if (domElement === undefined) {
            throw new Error("Could not find element " + index);
        }

        var tickbox = derevo.findChildren(domElement, "input", 1)[0];

        return tickbox.checked;
    },

    // Set the tick status of a given child.
    //
    // index     - Index of the child element.
    // new_state - New tick state. This might be undefined
    //             if which case the status will just toggle.
    //
    toggleChild : function (index, new_state) {
        "use strict";
        var domElement = this.getDomElement(index),
            dataItem   = this.getDataItem(index);

        if (domElement === undefined) {

            var parentIndex = this.getParentIndex(index);
            while(this.getDomElement(parentIndex) === undefined) {
                parentIndex = this.getParentIndex(parentIndex);
            }
            var parentDataItem = this.getDataItem(parentIndex);

            if (parentDataItem.deferred) {
                // We have deferred loading so the index might
                // become available in the future

                var inputElement = derevo.findChildren(
                    this.getDomElement(parentIndex), "input", 1)[0];

                inputElement.indeterminate = true;

                if (!(derevo.DEFERRED_SELECTION in inputElement)) {
                    inputElement[derevo.DEFERRED_SELECTION] = [];
                }
                inputElement[derevo.DEFERRED_SELECTION].push(index);

                // All parents should be indeterminate as well
                this.iterateParents(parentIndex, function (index, parentElement, parentData) {
                    var parentInput = derevo.findChildren(parentElement, "input", 1)[0];
                    parentInput.indeterminate = true;
                });

                return;
            }

            throw new Error("Could not find element " + index);
        }

        var tickbox = derevo.findChildren(domElement, "input", 1)[0];

        if (new_state !== undefined &&
            tickbox.checked === new_state &&
            tickbox.indeterminate !== true) {

            return
        }

        if (new_state === undefined) {
            tickbox.checked = !tickbox.checked;
        } else {
            tickbox.checked = new_state;
        }

        derevo.bind(this._options.event_handler.tickToggle, this)(index, tickbox, dataItem);
    },

    // Iterate through all selected nodes.
    //
    // callback - Function to be called for each selected node.
    //            Parameters: index, element, data
    // index    - Branch to be checked for selected nodes. If
    //            this is undefined all nodes are considered.
    //
    iterateSelectedChildren : function (callback, index) {
        "use strict";
        var root_element = index === undefined ? this._root_element : this.getDomElement(index),
            collect      = derevo.bind(function (i, item) {
                if (item.checked === true && item.tagName.toLowerCase() === "input") {
                    var element = item,
                        index,
                        dataItem;

                    while(element[derevo.INDEX_ATTR] === undefined) {
                        element = element.parentElement;
                    }
                    index = element[derevo.INDEX_ATTR];
                    dataItem = this.getDataItem(index);

                    callback(index, element, dataItem);
                }
                derevo.iterate(item.children, collect);
            }, this);

        if (root_element === undefined) {
            throw new Error("Could not find element " + index);
        }

        collect(0, root_element);
    },

    _createTreeNode : function (index, childObj) {
        "use strict";

        var elementspan = this._super(index, childObj);

        if (childObj !== undefined) {

            if (!("selected" in childObj)) {
                childObj["selected"] = false;
            }

            var tickbox = derevo.create("input", {
                "type"  : "checkbox",
                "class" : "tree-select"
            });
            derevo.insertBefore(elementspan.children[0], tickbox);

            tickbox.checked = childObj["selected"];

            derevo.addEvent(tickbox, "click",
                derevo.bind(this._options.event_handler.tickToggle,
                            this, index, tickbox, childObj));
        }

        return elementspan;
    }
});
