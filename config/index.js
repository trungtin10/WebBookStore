const appConfig = require('./appConfig');
const authConfig = require('./authConfig');

const config = {
    ...authConfig,
    ...appConfig
};

function getBootstrapConfig() {
    return {
        port: appConfig.port,
        jwtSecret: authConfig.JWT_SECRET,
        sessionSecret: appConfig.session.secret,
        viewPath: appConfig.view.path,
        staticPath: appConfig.static,
        viewEngine: appConfig.view.engine,
        error404: appConfig.error404,
        error500: appConfig.error500
    };
}

module.exports = { ...config, getBootstrapConfig };
