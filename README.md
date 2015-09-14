# requireable-registry-couchapp

When writing code that needs to do some of the same things that the npm registry
does, it can be useful to use the couchapp code for the registy itself, which
is in the package [`npm-registry-couchapp`](https://www.npmjs.com/package/npm-registry-couchapp).
Unfortunately, this code is not designed to run in node, but in CouchDB, so in
order to require it correctly, `require` need to be defined in a way that works
correctly.

In order to make this easier, `requireable-registry-couchapp` does all the work
of requiring the the code, and making it available to you.

For example, to use the couchapp code for showing a package (which does things
like isolating versions as well), you can do this:

```javascript
var ddoc = require('requireable-registry-couchapp')();

var shownPackage = ddoc.shows.package(/* ... */);
```

The functions that are provided by `npm-registry-couchapp`, such as the one in
the example above, can sometimes be confusing to use (as they have specific
argument requirements), so for convenience, a few extra functions have been
added:

### `ddoc.showPackage(doc, name, [version])`

This calls the `ddoc.shows.package` function as above, putting in ther correct
arguments. `doc` should be JS object that is the entire package metadata.

Returns a JS object.

### `ddoc.showPackageString(doc, name, [version])`

Since `ddoc.shows.package` returns a string instead of an object, and sometimes
that's exactly what you want, this method bypasses the JSON.parse done in
`ddoc.showPackage`, but is otherwise identical to it.

### `ddoc.updatePackage(params, updatedDoc, originalDoc, username, isAdmin)`

This calls `ddoc.updates.package` with the correct arguments. `params` indicates
which kind of update is being done, and is typically gotten from an HTTP
request (see source for more details). `updatedDoc` is the new state of the
document and `originalDoc` is the state it was in before. `username` is the
username of the user performing the operation and `isAdmin` is used to override
permissions if the user doesn't own the package.

Returns an array. The first element is the modified document. The second element
is a stringified status message, which can be sent to clients to confirm the
update.

This function also calls `ddoc.validate_doc_update`, which can throw, and the
objects that it throws are not Error objects, unfortunately.

## License

Code licensed under the MIT license. See LICENSE.txt file for terms.
