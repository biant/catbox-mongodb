// Load modules

var Lab = require('lab');
var Catbox = require('catbox');
var Mongo = require('..');
var Mongodb = require('mongodb');


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Mongo', function () {

    before(function (done) {

        var db = new Mongodb.Db('unit-testing', new Mongodb.Server('127.0.0.1', 27017, { auto_reconnect: false, poolSize: 4 }), { safe: false });
        db.open(function (err, db) {

            db.dropDatabase(function (err) {

                db.addUser('tester', 'secret', function (err, result) {

                    expect(err).to.not.exist;
                    db.close();
                    done();
                });
            });
        });
    });

    it('creates a new connection', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            expect(client.isReady()).to.equal(true);
            done();
        });
    });

    it('closes the connection', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            expect(client.isReady()).to.equal(true);
            client.stop();
            expect(client.isReady()).to.equal(false);
            done();
        });
    });

    it('gets an item after settig it', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            var key = { id: 'x', segment: 'test' };
            client.set(key, '123', 500, function (err) {

                expect(err).to.not.exist;
                client.get(key, function (err, result) {

                    expect(err).to.equal(null);
                    expect(result.item).to.equal('123');
                    done();
                });
            });
        });
    });

    it('fails setting an item circular references', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            var key = { id: 'x', segment: 'test' };
            var value = { a: 1 };
            value.b = value;
            client.set(key, value, 10, function (err) {

                expect(err.message).to.equal('Converting circular structure to JSON');
                done();
            });
        });
    });

    it('fails setting an item with very long ttl', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            var key = { id: 'x', segment: 'test' };
            client.set(key, '123', Math.pow(2, 31), function (err) {

                expect(err.message).to.equal('Invalid ttl (greater than 2147483647)');
                done();
            });
        });
    });

    it('ignored starting a connection twice on same event', function (done) {

        var client = new Catbox.Client(Mongo);
        var x = 2;
        var start = function () {

            client.start(function (err) {

                expect(client.isReady()).to.equal(true);
                --x;
                if (!x) {
                    done();
                }
            });
        };

        start();
        start();
    });

    it('ignored starting a connection twice chained', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            expect(err).to.not.exist;
            expect(client.isReady()).to.equal(true);

            client.start(function (err) {

                expect(err).to.not.exist;
                expect(client.isReady()).to.equal(true);
                done();
            });
        });
    });

    it('returns not found on get when using null key', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            client.get(null, function (err, result) {

                expect(err).to.equal(null);
                expect(result).to.equal(null);
                done();
            });
        });
    });

    it('returns not found on get when item expired', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            var key = { id: 'x', segment: 'test' };
            client.set(key, 'x', 1, function (err) {

                expect(err).to.not.exist;
                setTimeout(function () {

                    client.get(key, function (err, result) {

                        expect(err).to.equal(null);
                        expect(result).to.equal(null);
                        done();
                    });
                }, 2);
            });
        });
    });

    it('returns error on set when using null key', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            client.set(null, {}, 1000, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on get when using invalid key', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            client.get({}, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on drop when using invalid key', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            client.drop({}, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on set when using invalid key', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            client.set({}, {}, 1000, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('ignores set when using non-positive ttl value', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            var key = { id: 'x', segment: 'test' };
            client.set(key, 'y', 0, function (err) {

                expect(err).to.not.exist;
                done();
            });
        });
    });

    it('returns error on drop when using null key', function (done) {

        var client = new Catbox.Client(Mongo);
        client.start(function (err) {

            client.drop(null, function (err) {

                expect(err instanceof Error).to.equal(true);
                done();
            });
        });
    });

    it('returns error on get when stopped', function (done) {

        var client = new Catbox.Client(Mongo);
        client.stop();
        var key = { id: 'x', segment: 'test' };
        client.connection.get(key, function (err, result) {

            expect(err).to.exist;
            expect(result).to.not.exist;
            done();
        });
    });

    it('returns error on set when stopped', function (done) {

        var client = new Catbox.Client(Mongo);
        client.stop();
        var key = { id: 'x', segment: 'test' };
        client.connection.set(key, 'y', 1, function (err) {

            expect(err).to.exist;
            done();
        });
    });

    it('returns error on drop when stopped', function (done) {

        var client = new Catbox.Client(Mongo);
        client.stop();
        var key = { id: 'x', segment: 'test' };
        client.connection.drop(key, function (err) {

            expect(err).to.exist;
            done();
        });
    });

    it('returns error on missing segment name', function (done) {

        var config = {
            expiresIn: 50000
        };
        var fn = function () {

            var client = new Catbox.Client(Mongo);
            var cache = new Catbox.Policy(config, client, '');
        };
        expect(fn).to.throw(Error);
        done();
    });

    it('returns error on bad segment name', function (done) {

        var config = {
            expiresIn: 50000
        };
        var fn = function () {

            var client = new Catbox.Client(Mongo);
            var cache = new Catbox.Policy(config, client, 'a\0b');
        };
        expect(fn).to.throw(Error);
        done();
    });

    it('returns error when cache item dropped while stopped', function (done) {

        var client = new Catbox.Client(Mongo);
        client.stop();
        client.drop('a', function (err) {

            expect(err).to.exist;
            done();
        });
    });

    it('throws an error if not created with new', function (done) {

        var fn = function () {

            var mongo = Mongo();
        };

        expect(fn).to.throw(Error);
        done();
    });

    it('throws an error when using a reserved partition name (admin)', function (done) {

        var fn = function () {

            var options = {
                partition: 'admin'
            };

            var mongo = new Mongo(options);
        };

        expect(fn).to.throw(Error, 'Cache partition name cannot be "admin", "local", or "config" when using MongoDB');
        done();
    });

    it('throws an error when using a reserved partition name (local)', function (done) {

        var fn = function () {

            var options = {
                partition: 'local'
            };

            var mongo = new Mongo(options);
        };

        expect(fn).to.throw(Error, 'Cache partition name cannot be "admin", "local", or "config" when using MongoDB');
        done();
    });

    describe('#start', function () {

        it('returns an error when authentication fails', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5,
                username: 'bob'
            };
            var mongo = new Mongo(options);

            mongo.start(function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                done();
            });
        });

        it('connects with authentication', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5,
                username: 'tester',
                password: 'secret'
            };
            var mongo = new Mongo(options);

            mongo.start(function (err) {

                expect(err).to.not.exist;
                done();
            });
        });

        it('sets isReady to true when the connection succeeds', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.start(function (err) {

                expect(err).to.not.exist;
                expect(mongo.isReady()).to.be.true;
                done();
            });
        });

        it('calls any pending callbacks waiting for a start', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.start(function (err) {

                expect(err).to.not.exist;
            });

            mongo.start(function (err) {

                expect(err).to.not.exist;
                done();
            });
        });
    });

    describe('#validateSegmentName', function () {

        it('returns an error when the name is empty', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            var result = mongo.validateSegmentName('');

            expect(result).to.be.instanceOf(Error);
            expect(result.message).to.equal('Empty string');
            done();
        });

        it('returns an error when the name has a null character', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            var result = mongo.validateSegmentName('\0test');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns an error when the name starts with system.', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            var result = mongo.validateSegmentName('system.');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns an error when the name has a $ character', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            var result = mongo.validateSegmentName('te$t');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns an error when the name is too long', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            var result = mongo.validateSegmentName('0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789');

            expect(result).to.be.instanceOf(Error);
            done();
        });

        it('returns null when the name is valid', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            var result = mongo.validateSegmentName('hereisavalidname');

            expect(result).to.not.exist;
            done();
        });
    });

    describe('#getCollection', function () {

        it('passes an error to the callback when the connection is closed', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.getCollection('test', function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not ready');
                done();
            });
        });

        it('passes a collection to the callback', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.start(function () {

                mongo.getCollection('test', function (err, result) {

                    expect(err).to.not.exist;
                    expect(result).to.exist;
                    done();
                });
            });
        });

        it('passes an error to the callback when there is an error getting the collection', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.start(function () {

                mongo.getCollection('', function (err, result) {

                    expect(err).to.exist;
                    expect(result).to.not.exist;
                    done();
                });
            });
        });

        it('passes an error to the callback when the collection is null', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.start(function () {

                mongo.client.collection = function (item, callback) {

                    callback(null, null);
                };

                mongo.getCollection('testcollection', function (err, result) {

                    expect(err).to.exist;
                    expect(result).to.not.exist;
                    expect(err.message).to.equal('Received null collection object');
                    done();
                });
            });
        });
    });

    describe('#get', function () {

        it('passes an error to the callback when the connection is closed', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.get('test', function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('passes a null item to the callback when it doesn\'t exist', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.start(function () {

                mongo.get({ segment: 'test0', id: 'test0' }, function (err, result) {

                    expect(err).to.not.exist;
                    expect(result).to.not.exist;
                    done();
                });
            });
        });

        it('is able to retrieve an object thats stored when connection is started', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var key = {
                id: 'test',
                segment: 'test'
            };

            var mongo = new Mongo(options);

            mongo.start(function () {

                mongo.set(key, 'myvalue', 200, function (err) {

                    expect(err).to.not.exist;
                    mongo.get(key, function (err, result) {

                        expect(err).to.not.exist;
                        expect(result.item).to.equal('myvalue');
                        done();
                    });
                });
            });
        });

        it('passes an error to the callback when there is an error finding the item', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27018,
                poolSize: 5
            };
            var key = {
                id: 'test',
                segment: 'test'
            };
            var mongo = new Mongo(options);

            mongo.start(function () {

                mongo.get(key, function (err, result) {

                    expect(err).to.exist;
                    expect(result).to.not.exist;
                    done();
                });
            });
        });

        it('passes an error to the callback when there is an error returned from getting an item', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27018,
                poolSize: 5
            };
            var key = {
                id: 'testerr',
                segment: 'testerr'
            };
            var mongo = new Mongo(options);
            mongo.client = true;
            mongo.isConnected = true;

            mongo.collections.testerr = {
                findOne: function (item, callback) {

                    return callback(new Error('test'));
                }
            };

            mongo.get(key, function (err, result) {

                expect(err).to.exist;
                expect(err.message).to.equal('test');
                expect(result).to.not.exist;
                done();
            });
        });

        it('passes an error to the callback when there is an issue with the record structure', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27018,
                poolSize: 5
            };
            var key = {
                id: 'testerr',
                segment: 'testerr'
            };
            var mongo = new Mongo(options);
            mongo.client = true;
            mongo.isConnected = true;

            mongo.collections.testerr = {
                findOne: function (item, callback) {

                    return callback(null, { value: false });
                }
            };

            mongo.get(key, function (err, result) {

                expect(err).to.exist;
                expect(err.message).to.equal('Incorrect record structure');
                expect(result).to.not.exist;
                done();
            });
        });

        it('passes an error to the callback when there is an issue parsing the record value', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27018,
                poolSize: 5
            };
            var key = {
                id: 'testerr',
                segment: 'testerr'
            };
            var mongo = new Mongo(options);
            mongo.client = true;
            mongo.isConnected = true;

            mongo.collections.testerr = {
                findOne: function (item, callback) {

                    return callback(null, { value: 'test', stored: true });
                }
            };

            mongo.get(key, function (err, result) {

                expect(err).to.exist;
                expect(err.message).to.equal('Bad value content');
                expect(result).to.not.exist;
                done();
            });
        });
    });

    describe('#set', function () {

        it('passes an error to the callback when the connection is closed', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.set({ id: 'test1', segment: 'test1' }, 'test1', 3600, function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('doesn\'t return an error when the set succeeds', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.start(function () {

                mongo.set({ id: 'test1', segment: 'test1' }, 'test1', 3600, function (err, result) {

                    expect(err).to.not.exist;
                    expect(result).to.not.exist;
                    done();
                });
            });
        });

        it('passes an error to the callback when there is an error returned from setting an item', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27018,
                poolSize: 5
            };
            var key = {
                id: 'testerr',
                segment: 'testerr'
            };
            var mongo = new Mongo(options);
            mongo.client = true;
            mongo.isConnected = true;

            mongo.getCollection = function (item, callback) {

                return callback(new Error('test'));
            };

            mongo.set(key, true, 0, function (err, result) {

                expect(err).to.exist;
                expect(err.message).to.equal('test');
                expect(result).to.not.exist;
                done();
            });
        });

        it('passes an error to the callback when there is an error returned from calling update', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27018,
                poolSize: 5
            };
            var key = {
                id: 'testerr',
                segment: 'testerr'
            };
            var mongo = new Mongo(options);
            mongo.client = true;
            mongo.isConnected = true;

            mongo.getCollection = function (item, callback) {

                return callback(null, {
                    update: function (criteria, record, options, cb) {

                        return cb(new Error('test'));
                    }
                });
            };

            mongo.set(key, true, 0, function (err, result) {

                expect(err).to.exist;
                expect(err.message).to.equal('test');
                expect(result).to.not.exist;
                done();
            });
        });
    });

    describe('#drop', function () {

        it('passes an error to the callback when the connection is closed', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.drop({ id: 'test2', segment: 'test2' }, function (err) {

                expect(err).to.exist;
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.equal('Connection not started');
                done();
            });
        });

        it('doesn\'t return an error when the drop succeeds', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27017,
                poolSize: 5
            };
            var mongo = new Mongo(options);

            mongo.start(function () {

                mongo.drop({ id: 'test2', segment: 'test2' }, function (err, result) {

                    expect(err).to.not.exist;
                    expect(result).to.not.exist;
                    done();
                });
            });
        });

        it('passes an error to the callback when there is an error returned from dropping an item', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27018,
                poolSize: 5
            };
            var key = {
                id: 'testerr',
                segment: 'testerr'
            };
            var mongo = new Mongo(options);
            mongo.client = true;
            mongo.isConnected = true;

            mongo.getCollection = function (item, callback) {

                return callback(new Error('test'));
            };

            mongo.drop(key, function (err, result) {

                expect(err).to.exist;
                expect(err.message).to.equal('test');
                expect(result).to.not.exist;
                done();
            });
        });

        it('passes an error to the callback when there is an error returned from calling remove', function (done) {

            var options = {
                partition: 'unit-testing',
                host: '127.0.0.1',
                port: 27018,
                poolSize: 5
            };
            var key = {
                id: 'testerr',
                segment: 'testerr'
            };
            var mongo = new Mongo(options);
            mongo.client = true;
            mongo.isConnected = true;

            mongo.getCollection = function (item, callback) {

                return callback(null, {
                    remove: function (criteria, safe, cb) {

                        return cb(new Error('test'));
                    }
                });
            };

            mongo.drop(key, function (err, result) {

                expect(err).to.exist;
                expect(err.message).to.equal('test');
                expect(result).to.not.exist;
                done();
            });
        });
    });
});
