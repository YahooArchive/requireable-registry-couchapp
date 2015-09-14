/*
* Copyright 2015, Yahoo Inc.
* Copyrights licensed under the MIT License.
* See the accompanying LICENSE.txt file for terms.
*/

var fs = require('fs'),
    path = require('path'),
    url = require('url'),
    vm = require('vm'),
    jsonutil = require('jsonutil');

var WRAPPER_BEFORE = "(function (exports, require, module, process) { ",
    WRAPPER_AFTER = "\n});",
    COUCHAPP_ROOT = "app.js";

// cache for the loaded scripts
var scripts = {};


/*
 * Retrieve the script for a module from the cache if it has been compiled
 * already. Otherwise load it, compile it, cache it and return it.
 */
function getScript(mod) {
    if (scripts.hasOwnProperty(mod)) {
        return scripts[mod];
    }

    var modfile = path.join(__dirname, 'node_modules', 'npm-registry-couchapp', 'registry', mod),
        filetext = fs.readFileSync(modfile, "utf8"),
        content = WRAPPER_BEFORE + filetext  + WRAPPER_AFTER,
        script = vm.createScript(content, mod + ".vm");

    scripts[mod] = script;
    return script;
}

/*
 * The version of 'require' used when executing design document functions. This
 * pulls the code from the ddoc (as a string), runs it in its own context to
 * obtain the exports, and returns those. Thus it is very similar to the normal
 * 'require' except that the code comes from the ddoc instead of a file.
 */
function requireEmbedded(mod, ddoc) {
    var code = ddoc[mod],
        exports = {};

    if (code && typeof code === 'string') {
        vm.runInNewContext(code,
            {
                exports: exports,
                require: require
            },
            mod + ".ddoc.vm");
        return exports;
    }

    throw new Error("requireEmbedded: code not found for module '" + mod + "'");
}

/*
 * Show the specified package, optionally with version.
 */
function showPackage(doc, name, version) {
    return JSON.parse(this.showPackageString(doc, name, version));
}

/*
 * Show the specified package, optionally with version, as a string.
 */
function showPackageString(doc, name, version) {
    var request = {query: {name: name}};
    if (version) {
        request.query.version = version;
    }

    return this.shows.package(doc, request).body;
}

/*
 * Update the specified package with the given new content.
 * Returns the content of the new package after processing by the design doc.
 */
function updatePackage(updateParams, data, doc, username, isAdmin) {
    var user = {
            name: username,
            roles: []
        },
        request = {
            query: updateParams,
            body: data,
            userCtx: user
        },
        newDoc = jsonutil.deepCopy(doc), // Keep the original for validation
        result = this.updates.package(newDoc, request);

    // If the user is an admin, give them that role
    if (isAdmin) {
        user.roles.push("_admin");
    }

    // Validate the new document if the update succeeded
    if (!(result && result[0] && result[0].hasOwnProperty("forbidden"))) {
        newDoc = result[0]; // If we created a new one, grab it
        this.validate_doc_update(newDoc, doc, user, null);
    }

    return result;
}

/*
 * Obtain the design document by running the application script in the specified
 * context (augmented with the standard functions). Switch the 'require' version
 * afterwards, so that view / list functions use the special embedded version.
 *
 * Note that the context values provided to 'runInNewContext' are baked in from
 * that point, and cannot be changed (e.g. to switch the version of 'require').
 * Thus we need to pass in a wrapper function that can make the switch.
 */
module.exports = function getDesignDoc(sandbox) {
    var requireInContext,
        dynamicRequire,
        useEmbedded = false,
        moduleInfo = { exports: {} },
        fakeProcess = {env:{DEPLOY_VERSION:1}},
        script,
        func;

    function requireInContext(mod) {
        var moduleInfo = { exports: {} },
            script = getScript(mod),
            func = script.runInNewContext(sandbox);
        func(moduleInfo.exports, dynamicRequire, moduleInfo);
        return moduleInfo.exports;
    }

    function dynamicRequire (mod) {
        if (useEmbedded) {
            return requireEmbedded(mod, moduleInfo.exports);
        }
        if (mod.charAt(0) === '.') {
            return requireInContext(mod);
        }
        return require(mod);
    }

    dynamicRequire.resolve = require.resolve;

    // Make sure we have a sandbox object
    sandbox = sandbox || {};

    // Add standard entries (not worrying about modifying the object)
    sandbox.toJSON = JSON.stringify;

    // Run the script
    script = getScript('app.js');
    func = script.runInNewContext(sandbox);
    func(moduleInfo.exports, dynamicRequire, moduleInfo, fakeProcess);

    // Use embedded require from now on
    useEmbedded = true;

    // Add our methods
    moduleInfo.exports.showPackage = showPackage;
    moduleInfo.exports.showPackageString = showPackageString;
    moduleInfo.exports.updatePackage = updatePackage;

    // Return the design doc
    return moduleInfo.exports;
}
