const express = require('express');
const { getBootstrapConfig } = require('../config');
const { registerMiddleware } = require('./middleware');
const { registerRoutes } = require('./routes');
const { registerErrorHandlers } = require('./errorHandlers');
const { startServer } = require('./server');

class App {
    constructor() {
        this.app = express();
        this.config = getBootstrapConfig();
    }

    setup() {
        this.app.set("view engine", this.config.viewEngine);
        this.app.set("views", this.config.viewPath);
        registerMiddleware(this.app, this.config);
        registerRoutes(this.app);
        registerErrorHandlers(this.app, this.config);
    }

    run() {
        this.setup();
        startServer(this.app, this.config.port);
    }
}

module.exports = { App };
