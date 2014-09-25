var basename = require('path').basename,
  should = require('should'),
  Promise = require('bluebird');

function Toboggan(request){
  var expectations = [],
    endings = [];
  
  if (!request.Test || !request.Test.prototype){
    throw new Error('Must pass a valid instance of supertest');
  }
    
  var proto = request.Test.prototype;
  proto.expectTemplate = function(){
    if (arguments.length === 0 ||
        (typeof(arguments[0]) !== 'string' && typeof(arguments[0]) !== 'function')){
      throw new Error('Must pass either one string or one function');
    }
    
    if (typeof(arguments[0]) === 'string'){
      var expectedTemplate = arguments[0];
      expectations.push(function(path, options, verified){
        try {
          basename(path).should.equal(expectedTemplate);
          verified();
        } catch (err) {
          verified(err);
        }
      });
    } else if (typeof(arguments[0]) === 'function'){
      expectations.push(arguments[0]);
    }

    return this;
  };
  
  proto.endTemplate = function(fn){
    endings.push(fn);
    return this;
  }
  
  this.install = function(app, engine){
    if (!engine){
      throw new Error('You must supply a view engine (e.g "jade")');
    }
    
    app.engine(engine, renderFile);
  };
  
  var renderFile = function(path, options, callback){
    var pending = [];
    for (var expectation in expectations){
      var fn = expectations[expectation];
      pending.push(new Promise(function(accepted, rejected){
        fn(path, options, function(err){
          if (err){
            rejected(err);
          } else {
            accepted();
          }
        });
      }));
    }
    
    Promise.all(pending).then(function(){
      for (var i = 0; i < endings.length; i++){
        endings[i]();
      }
    })
    .caught(function(error){
      if (endings.length > 0){
        for (var i = 0; i < endings.length; i++){
          endings[i](error);
        }
      } else {
        throw error;
      }
    })
    .finally(function(){
      expectations = [];
      endings = [];
      callback();
    });
  };
  
  return this;
}

module.exports = Toboggan;
