shuvit
======

Poker tracker and pocket cruncher for live tournament poker players.
[Details](http://ngokevin.com/blog/poker19/).

### Dependencies

- [AngularJS](http://angularjs.org) for MVC.
- [Browserify](http://browserify.org/) for bundling and third-party
  dependencies.
- [Gulp](http://gulpjs.com) for automated build tasks.
- [Ionic](http://ionicframework.com) for hybrid mobile app framework.

**Cordova Plugins**:

- org.apache.cordova.inappbrowser

### Setup

- ```npm install```
- ```bower install```
- ```cp www/js/settings_local.js.dist www/js/settings_local.js```
- ```make gulp```

### Running Unit Tests

Uses the Karma test runner.

- ```make test```

### Testing

- **Browser**: ```ionic serve```
- **ios**: Install Xcode4.6, agree to the Xcode license. And:

    ```
    sudo xcode-select -switch /Applications/<XCODE_PATH>
    ionic build ios
    ionic emulate ios
    cordova prepare ios
    ```
