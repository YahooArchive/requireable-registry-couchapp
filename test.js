/*
* Copyright 2015, Yahoo Inc.
* Copyrights licensed under the MIT License.
* See the accompanying LICENSE.txt file for terms.
*/

var origDoc = {"_id":"pitesti","_rev":"2-83f43ac9becd2051620d0819657ac62f","name":"pitesti","description":"A super-simple test framework for promises *only*.","dist-tags":{"latest":"2.0.0"},"versions":{"1.0.0":{"name":"pitesti","version":"1.0.0","description":"A super-simple test framework for promises *only*.","main":"index.js","scripts":{"pretest":"standard","test":"node test"},"author":{"name":"Bryan English","email":"bryan@bryanenglish.com"},"license":"MIT","dependencies":{"js-yaml":"^3.3.1"},"devDependencies":{"standard":"^5.1.0"},"gitHead":"3e95587da1942ed76026eb7ecaa6483360ca1ac2","_id":"pitesti@1.0.0","_shasum":"59eec18e3fd6bd3d019ecb1d0b316c02fad4fd20","_from":".","_npmVersion":"2.13.3","_nodeVersion":"3.0.0","_npmUser":{"name":"bengl","email":"bryan@bryanenglish.com"},"dist":{"shasum":"59eec18e3fd6bd3d019ecb1d0b316c02fad4fd20","tarball":"http://registry.npmjs.org/pitesti/-/pitesti-1.0.0.tgz"},"maintainers":[{"name":"bengl","email":"bryan@bryanenglish.com"}],"directories":{}},"2.0.0":{"name":"pitesti","version":"2.0.0","description":"A super-simple test framework for promises *only*.","main":"index.js","scripts":{"pretest":"standard","test":"node test"},"author":{"name":"Bryan English","email":"bryan@bryanenglish.com"},"license":"MIT","dependencies":{"make-tap-output":"^1.0.0"},"devDependencies":{"standard":"^5.1.0"},"gitHead":"92a77a023f67e687396010dec60cabbdb71ec42a","_id":"pitesti@2.0.0","_shasum":"a9b3bd3cc07d740d2747b057d7de869f349e83f3","_from":".","_npmVersion":"2.14.2","_nodeVersion":"4.0.0","_npmUser":{"name":"bengl","email":"bryan@bryanenglish.com"},"dist":{"shasum":"a9b3bd3cc07d740d2747b057d7de869f349e83f3","tarball":"http://registry.npmjs.org/pitesti/-/pitesti-2.0.0.tgz"},"maintainers":[{"name":"bengl","email":"bryan@bryanenglish.com"}],"directories":{}}},"readme":"# PITESTI\n\n**`pitesti`** is a tiny test framework for promises *only*.\n","maintainers":[{"name":"bengl","email":"bryan@bryanenglish.com"}],"time":{"modified":"2015-09-09T03:49:44.509Z","created":"2015-08-25T00:16:35.305Z","1.0.0":"2015-08-25T00:16:35.305Z","2.0.0":"2015-09-09T03:49:44.509Z"},"author":{"name":"Bryan English","email":"bryan@bryanenglish.com"},"license":"MIT","readmeFilename":"README.md","_attachments":{}};

var topLevelReq = {
    query: { pkg: 'pitesti' }
};

var versionReq = {
    query: { pkg: 'pitesti', version: '1.0.0' }
}


var ddoc = require('./index')();
var assert = require('assert');
var jsonutil = require('jsonutil');

describe('ddoc', function() {
    describe('internal functions', function(){
        it('show top level package', function(){
            assert.deepEqual(JSON.parse(ddoc.shows.package(origDoc, topLevelReq).body), origDoc);
        });

        it('show package version', function(){
            assert.deepEqual(JSON.parse(ddoc.shows.package(origDoc, versionReq).body), origDoc.versions['1.0.0']);
        });
    });

    describe('showPackage', function(){
        it('shows top level pacakge', function(){
            assert.deepEqual(ddoc.showPackage(origDoc, 'pitesti'), origDoc);
        });
        it('shows package version', function(){
            assert.deepEqual(ddoc.showPackage(origDoc, 'pitesti', '1.0.0'), origDoc.versions['1.0.0']);
        });
    });

    describe('showPackageString', function(){
        it('shows top level pacakge', function(){
            assert.deepEqual(JSON.parse(ddoc.showPackageString(origDoc, 'pitesti')), origDoc);
        });
        it('shows package version', function(){
            assert.deepEqual(JSON.parse(ddoc.showPackageString(origDoc, 'pitesti', '1.0.0')), origDoc.versions['1.0.0']);
        });
    });

    describe('updatePackage', function(){
        it('updates package', function(){
            var altered = jsonutil.deepCopy(origDoc);
            var newVersion = {name: 'pitesti', description: 'foobar', version: '3.0.0'};
            altered.versions['3.0.0'] = newVersion;
            var result = ddoc.updatePackage({}, JSON.stringify(altered), origDoc, 'me', true);
            assert.equal(result[0].description, 'foobar');
            assert(result[0].versions['3.0.0']);
        });

        it('updates the package as the user', function(){
            var altered = jsonutil.deepCopy(origDoc);
            var newVersion = {name: 'pitesti', description: 'foobar', version: '3.0.0'};
            altered.versions['3.0.0'] = newVersion;
            var result = ddoc.updatePackage({}, JSON.stringify(altered), origDoc, 'bengl', true);
            assert.equal(result[0].description, 'foobar');
            assert(result[0].versions['3.0.0']);
        });

        it('fails to update with bad auth', function(){
            var altered = jsonutil.deepCopy(origDoc);
            var newVersion = {name: 'pitesti', description: 'foobar', version: '3.0.0'};
            altered.versions['3.0.0'] = newVersion;
            try {
                var result = ddoc.updatePackage({}, JSON.stringify(altered), origDoc, 'me', false);
            } catch (e) {
                assert(e.forbidden);
            }
        });
    });
});
