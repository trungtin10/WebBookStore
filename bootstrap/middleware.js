const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const { checkUser, flashMiddleware, cartMiddleware, webLocalsMiddleware } = require('../middleware');

class MiddlewareBootstrap {
    constructor({ app, config }) {
        this.app = app;
        this.config = config;
    }

    register() {
        const { app, config } = this;
        // Uploaded images + default images live in public/images
        app.use('/images', express.static(path.join(config.staticPath, 'images')));
        app.use(express.static(config.staticPath));
        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());
        app.use(cookieParser());
        app.use(session({
            secret: config.sessionSecret,
            resave: false,
            saveUninitialized: true
        }));
        app.use(flash());
        app.use(flashMiddleware);
        app.use(checkUser);
        app.use(cartMiddleware);
        app.use(webLocalsMiddleware);
    }
}

function registerMiddleware(app, config) {
    new MiddlewareBootstrap({ app, config }).register();
}

module.exports = { registerMiddleware, MiddlewareBootstrap };
