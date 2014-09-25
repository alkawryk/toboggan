var express = require('express'),
  app = express(),
  request = require('supertest'),
  toboggan = require('../toboggan')(request);
  
app.set('views', __dirname + '/views');
app.get('/user', function(req, res){
  res.render('user.jade', {
    foo: 'bar'
  });
});

toboggan.install(app, 'jade');  

describe('toboggan.js', function(){
  
  it('should throw an error when the template name is incorrect', function(done){
    request(app)
      .get('/user')
      .expectTemplate('incorrect')
      .end(function(err){
        try {
          'user.jade'.should.equal('incorrect')
        } catch (e) {
          err.should.eql(e);
        }
        done();
      });  
  });
  
  it('should not throw an error when the template name is correct', function(done){
    request(app)
      .get('/user')
      .expectTemplate('user.jade')
      .end(done);
  });
  
  it('should return an error to the end function when expectTemplate throws an error', function(done){
    var expectedError = new Error('error');
    
    request(app)
      .get('/user')
      .expectTemplate(function(){
        throw expectedError;
      })
      .end(function(err){
        err.should.equal(expectedError);
        done();
      });
  });
  
  it('should return failed regular assertions to end', function(done){
    request(app)
      .get('/user')
      .expect(500) // should be 200 
      .end(function(err){
        if (!err){
          throw new Error('Expected an error');
        }
        
        done();
      });
  });
  
  it('should return errors thrown in a regular .expect to .end', function(done){
    var expectedError = new Error('error');
    
    request(app)
      .get('/user')
      .expect(function(){
        throw expectedError;
      })
      .end(function(err){
        err.should.equal(expectedError);
        done();
      });
  });
  
  it('should pass the path passed to response.render to expectedTemplate', function(done){
    request(app)
      .get('/user')
      .expectTemplate(function(path, options, verified){
        path.should.equal(__dirname + '/views/user.jade');
        verified();
      })
      .end(done);
  });
  
  it('should pass the options passed to response.render to expectTemplate', function(done){
    request(app)
      .get('/user')
      .expectTemplate(function(path, options, verified){
        options.foo.should.equal('bar');
        verified();
      })
      .end(done);
  });
  
  it('should execute multiple expected functions', function(done){
    var executed1 = false, executed2 = false;
    request(app)
      .get('/user')
      .expectTemplate(function(path, options, verified){
        executed1 = true;
        verified();
      })
      .expectTemplate(function(path, options, verified){
        executed2 = true;
        verified();
      })
      .end(function(){
        executed1.should.equal(true);
        executed2.should.equal(true);
        done();
      });
  });
  
  it('should wait for the expected template functions before calling .end', function(done){
    var executed = [];
    request(app)
      .get('/user')
      .expectTemplate(function(path, options, verified){
        setTimeout(function(){
          executed.push(1);
          verified();
        }, 200);
      })
      .expectTemplate(function(path, options, verified){
        setTimeout(function(){
          executed.push(2);
          verified();
        }, 100);
      })
      .end(function(){
        executed.should.eql([2, 1]);
        done();
      });
  });
  
  it('should revert to the previously set engine when uninstalled is called', function(done){
    var testapp = express(),
      testtoboggan = require('../toboggan')(request);
    testapp.set('views', __dirname + '/views');

    var oldEngine = false;
    testapp.engine('jade', function(){
      oldEngine = true; 
      
      // supertest doesn't seem to let me call .end twice,
      // but lets me make two requests. 
      // If I call .done() in the old template engine, the test should 
      // finish executing on the second request since we should have 
      // reverted back to this template engine 
      done();
    });
    
    testtoboggan.install(testapp, 'jade');
    
    testapp.get('/test', function(req, res){
      res.render('user.jade');
    });

    request(testapp)
      .get('/test')
      .end(function(){
        oldEngine.should.equal(false);
        
        testtoboggan.uninstall(testapp);
        
        request(testapp)
          .get('/test')
          .end();
      });
  });
});
