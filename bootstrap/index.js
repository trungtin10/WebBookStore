module.exports = {
    App: require('./App').App,
    registerMiddleware: require('./middleware').registerMiddleware,
    registerRoutes: require('./routes').registerRoutes,
    registerErrorHandlers: require('./errorHandlers').registerErrorHandlers,
    startServer: require('./server').startServer
};
