// Common functions
//
var c = {

    // Path for API calls

    API_PATH : "/api/v1",

    api_debug : undefined,

    api_call_lock : {},

    // Do an API call to the backend.
    //
    // endpoint       - REST endpoint to call.
    // method         - HTTP method to use (e.g. POST)
    // params         - Parameter for the action - ignored for GET requests.
    // callback       - Callback to call after the request returns.
    //                  Parameter is: response
    // error_callback - Optional: Error callback if the request return an error.
    //                            Parameters: code, response, exception
    // allow_multi    - Allow multiple calls to the same endpoint.
    //
    api : function (endpoint, method, params, callback, error_callback, allow_multi) {
        "use strict";

        // Prevent multiple calls to the same endpoint

        if (allow_multi !== true && c.api_call_lock[endpoint]) {
            return;
        }

        if (c.api_debug !== undefined) {

            // Just simulate a REST call

            window.setTimeout(function () {
                c.api_debug(endpoint, method, params, callback, error_callback);
            }, 5);
            return
        }

        var http = new XMLHttpRequest();

        // Send an async ajax call

        http.open(method, c.API_PATH + "/" + endpoint, true);
        http.setRequestHeader("content-type", "application/json");

        c.api_call_lock[endpoint] = true;

        http.onload = function () {

            delete c.api_call_lock[endpoint];

            try {
                if (http.status === 200) {
                    if (http.response) {
                        var response = JSON.parse(http.response);
                        callback(response, http);
                    } else {
                        callback({}, http);
                    }
                } else {
                    var err;
                    try {
                        err  = JSON.parse(http.response)["error"];
                    } catch(e) {
                        err = http.response.trim();
                    }
                    console.log("API call failed - response: ", err);
                    if (error_callback !== undefined) {
                        error_callback(http.status, err);
                    }
                }
            } catch(e) {
                console.log("API call failed - exception:", e);
                if (error_callback !== undefined) {
                    error_callback(undefined, undefined, e);
                }
            }
        };

        if (method.toLowerCase() === "get") {
            http.send();
        } else {
            http.send(JSON.stringify(params));
        }
    },

    // Get general information from the API
    //
    apiInfo : function (callback, k) {
        "use strict";

        var kind = k ? "/" + k : "";
        
        c.api(encodeURI("db/v1/info/" + kind),
               "GET",
               undefined,
               callback,
               function (code, response, exception) {
                   console.log(response);
               });
    },

    // Run an EQL query and return the result in the callback.
    //
    apiQuery : function (query, callback, errorElement, errorCallback) {
        "use strict";

        c.api(encodeURI("db/v1/query/main?q=" + query),
               "GET",
               undefined,
               callback,
               function (code, response, exception) {
                    console.log("API Query Error:", response);

                    if (response && errorElement) {
                        errorElement.innerHTML = "";
                        c.insert(errorElement, c.createText(response));
                        c.show(errorElement);
                    } else if (errorCallback) {
                        errorCallback(response);
                    }
               });
    },

    // Escape HTML function
    //
    esc : function (unsafe) {
        if (unsafe) {
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        }

        return ""
    },

    // Create a capitalized string.
    //
    // s - String to capitalize.
    //
    title : function (s) {
        return s.replace(/(?:^|\s)\S/g,
            function(a) { return a.toUpperCase(); });
    },

    // Add an event handler to an element. This function makes sure
    // that an event listener is not added twice.
    //
    // element   - Element to which the event handler should be attached.
    // eventName - Name of the event.
    // func      - Event handler.
    //
    observe : function (element, eventName, func) {
        "use strict";

        var handlers = c.getData(element)["_event_handlers"];

        handlers = handlers === undefined ? {} : handlers;

        if (handlers !== undefined && handlers[func]) {

            // Handler was already added no need to add it twice

            return;
        }

        handlers[func] = true;
        c.storeData(element, { "_event_handlers" : handlers});

        // Add the event listener

        if (element.addEventListener) {
            element.addEventListener(eventName, func, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + eventName, func);
        }
    },

    // Observe the enter key for a given element.
    //
    observeEnterPress : function (element, func) {
        "use strict";
        c.observe(element, "keyup", function (e) {
            if (e.keyCode == 13) {
                func();
            }            
        });
    },
    
    // Stop event propagation.
    //
    // e - Event to stop.
    //
    stopBubbleEvent : function (e) {
        "use strict";
        e = e ? e:window.event;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (e.cancelBubble !== null) {
            e.cancelBubble = true;
        }
    },

    // Merge two objects.
    //
    // o1 - Object to merge from.
    // o2 - Object to merge into (already existing
    //      attributes will not be overwritten).
    //
    // Returns o2.
    //
    mergeObjects : function (o1, o2) {
        "use strict";
        for (var attr in o1) {
            if(o2[attr] === undefined) {
                o2[attr] = o1[attr];
            }
        }

        return o2;
    },

    // Iterate over a list.
    //
    // list - List to iterate over.
    // iterator - Function to be called in each step - gets
    //            the index and element as parameter. If the
    //            function returns false then the iteration
    //            ends immediately.
    //
    iter : function (list, iterator) {
        "use strict";
        for (var i=0;i<list.length;i++) {
            if (iterator(i, list[i]) === false) {
                break;
            }
        }
    },

    // Get a list of keys on an object.
    // This will ignore "inherited" keys.
    //
    oKeys : function (obj) {
        "use strict";
        var key, keys = [];
        for(key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        keys.sort();
        return keys;
    },

    // Get a list of values on an object.
    // This will ignore "inherited" keys.
    //
    oVals : function (obj) {
        "use strict";
        var key, values = [];
        for(key in obj) {
            if (obj.hasOwnProperty(key)) {
                values.push(obj[key]);
            }
        }
        return values;
    },

    // Clone a given object structure which does not include
    // functions, dates or other special types.
    //
    // obj - Object to clone.
    //
    cloneStruct : function (obj) {
        return JSON.parse(JSON.stringify(obj))
    },

    // Dom traversal
    // =============

    // Element lookup.
    //
    // id - Element ID to lookup.
    //
    // Returns the element.
    //
    $ : function(id) {
        "use strict";
        return document.getElementById(id);
    },

    // Search a child element which has a certain class name.
    //
    // element   - Root element.
    // classname - Class name to search.
    //
    // Returns the first found child or undefined.
    //
    find : function (element, classname) {
        var s = function (r) {

            if (!r) {
                return undefined;
            }

            if (c.hasClassName(r, classname)) {
                return r
            }

			if (r.childNodes) {
				for (var i=0; i < r.childNodes.length; i++) {
					var cn = s(r.childNodes[i]);
					if (cn !== undefined) {
						return cn;
					}
				}
			}
        };

        return s(element);
    },

    // Search all child elements which have a certain class name.
    //
    // element   - Root element.
    // classname - Class name to search.
    //
    // Returns all found children.
    //
    findAll : function (element, classname) {
        var ret = [],
            s = function (r) {
                if (c.hasClassName(r, classname)) {
                    ret.push(r);
                }
                for (var i=0; i < r.childNodes.length; i++) {
                    s(r.childNodes[i]);
                }
            };

        s(element);

        return ret;
    },

    // Search a parent element which has a certain class name.
    //
    // element   - Child element.
    // classname - Class name to search.
    //
    // Returns the first found parent or undefined.
    //
    findParent : function (element, classname) {
        "use strict";

        var s = function (r) {
            if (!r || c.hasClassName(r, classname)) {
                return r
            }

            return s(r.parentNode);
        };

        return s(element);
    },

    // Get the next sibling of a dom element.
    //
    next : function (element) {
        "use strict";

        return element.nextSibling;
    },

    // Get the previous sibling of a dom element.
    //
    prev : function (element) {
        "use strict";

        return element.previousSibling;
    },

    // Get all further sibling of a dom element.
    //
    nextAll : function (element) {
        "use strict";

        var ret = [];

        while(element = c.next(element)) {
            ret.push(element);
        }

        return ret;
    },

    // Dom manipulation
    // ================

    // Create a dom element.
    //
    // tag   - Element name (e.g. "a").
    // attrs - Element attributes (e.g. "href")
    //
    create : function(tag, attrs) {
        "use strict";
        var element = document.createElement(tag);
        if (attrs !== undefined) {
            c.iter(c.oKeys(attrs), function (i, v) {
                element.setAttribute(v, attrs[v]);
            });
        }
        return element;
    },

    // Replace an existing dom element.
    //
    // element    - Element to replace.
    // newelement - New element.
    //
    // Returns the replaced element.
    //
	replace : function (element, newelement) {
		return element.parentNode.replaceChild(newelement, element)
	},

    // Create a new html escaped text node.
    //
    // text - text to insert into text node.
    //
    createText : function(text) {
        "use strict";

        return document.createTextNode(text);
    },

    // Update the content of a text node with escaped text.
    //
    // element - Element to update.
    // text    - New text.
    //
    updateText : function(element, text) {
        element.innerHTML = c.esc(text);
    },

	// Remove an element from the dom.
	//
    // element - Element to remove.
    //
    // Returns the removed element.
    //
	remove : function (element) {
		"use strict";

		return element.parentNode.removeChild(element);
	},

    // Insert a dom element as a child element of another dom element.
    //
    // element - Existing parent element.
    // child   - Element to add as a child.
    //
    insert : function(element, child) {
        "use strict";
        element.appendChild(child);
        return element;
    },

    // Insert all dom elements as children of another dom element.
    //
    // element  - Existing parent element.
    // children - Elements to add as children.
    //
    insertAll : function(element, children) {
        "use strict";
        c.iter(children, function (i, item) {
            if (item !== undefined) {
                element.appendChild(item);
            }
        });
        return element;
    },

    // Insert a dom element before another dom element.
    //
    // element - Existing dom element.
    // child   - Element to insert.
    //
    insertBefore : function(element, child) {
        "use strict";
        element.parentNode.insertBefore(child, element);
    },

    // Insert a dom element after another dom element.
    //
    // element - Existing dom element.
    // child   - Element to insert.
    //
    insertAfter : function(element, child) {
        "use strict";
        element.parentNode.insertBefore(child, element.nextSibling);
    },

    // Ensure that a given element has a certain class name.
    //
    // element - Existing dom element.
    // name    - Class name.
    //
    // Returns the given element.
    //
    ensureClassName : function(element, name) {
        "use strict";
        if (c.hasClassName(element, name)) {
            return;
        }
        var classes = element.getAttribute("class");
        if (classes === null || classes.length === 0) {
            classes = name;
        } else {
            classes += " " + name;
        }
        element.setAttribute("class", classes);

        return element;
    },

    // Check if a given element has a class name.
    //
    // element - Existing dom element.
    // name    - Class name to check.
    //
    // Return true if the element has the class name - false otherwise.
    //
    hasClassName : function(element, name) {
        "use strict";
        if (element.getAttribute === undefined) {
            return false;
        }
        var classes = element.getAttribute("class");
        if (classes === null) {
            return false;
        }
        return classes.split(" ").indexOf(name) !== -1;
    },

    // Remove a class name from a given element.
    //
    // element - Existing dom element.
    // name    - Class name to remove.
    //
    // Returns the given element.
    //
    removeClassName : function(element, name) {
        "use strict";

        if (element !== undefined) {
            var classes = element.getAttribute("class").split(" "),
                index   = classes.indexOf(name);
            if (index !== -1) {
                classes.splice(index, 1);
                element.setAttribute("class", classes.join(" "));
            }
        }

        return element;
    },

    // Hide an element.
    //
    // element - Element to hide.
    //
    hide : function(element) {
        "use strict";
        element.style.display = 'none';
    },

    // Hide elements.
    //
    // elements - List of elements to hide.
    //
    hideAll : function(elements) {
        c.iter(elements, function (i, item) { c.hide(item); });
    },

    // Show an element.
    //
    // element - Element to show.
    //
    show : function(element) {
        "use strict";
        element.style.display = '';
    },


    // Show elements.
    //
    // elements - List of elements to show.
    //
    showAll : function(elements) {
        "use strict";
        c.iter(elements, function (i, item) { c.show(item); });
    },

    // Special functions
    // =================
    // Functions below rely on spectre.css

    // Disable a button and add a tooltip which explains to the
    // user that he/she doesn't have permission for access.
    //
    // element - Element to disable.
    //
    disableNoPermission : function (element, tooltipDirection) {
        "use strict";

        element.disabled = true;
        c.ensureClassName(element, "tooltip");
        if (tooltipDirection) {
            c.ensureClassName(element, "tooltip-"+tooltipDirection);
        }
        element.setAttribute("data-tooltip", "You don't have permission");
        
        c.iter(element.getElementsByTagName("*"), function (i, item) {
            if (item.tagName === "A") {
                item.style.opacity = 0.5;
                item.setAttribute("href", "javascript:void(0)");
            }
            if (item.tagName === "IMG") {
                item.style.opacity = 0.5;
            }
        });
    }
}

// Data storage on DOM elements
// ============================

c.DOM_STORE_ATTR = "_yfdata"; // Attribute name on dom elements
                               // which hold data

c.storeData = function (element, data) {
    "use strict";
    var edata = element[c.DOM_STORE_ATTR];

    if (edata === undefined) {
        edata = {};
    }

    element[c.DOM_STORE_ATTR] = c.mergeObjects(data, edata);

    return element;
};

c.getData = function (element) {
    "use strict";
    var ret;

    try {
        ret = element[c.DOM_STORE_ATTR];
    } catch (e) {
    }

    return ret !== undefined ? ret : {};
};

// Polyfills
// =========

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}
