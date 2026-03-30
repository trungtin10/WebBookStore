class ErrorHandlersBootstrap {
    constructor({ app, config }) {
        this.app = app;
        this.config = config;
    }

    register() {
        const { app, config } = this;

        app.use((req, res, next) => {
            if (req.path.startsWith('/api')) {
                return res.status(404).json({ success: false, message: config.error404.api.message });
            }
            res.status(404).render('pages/page', config.error404.web);
        });

        app.use((err, req, res, next) => {
            console.error('SERVER ERROR:', err);
            if (req.path.startsWith('/api')) {
                return res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
            }
            res.status(500).send(`
                <div style="text-align: center; padding: 50px; font-family: sans-serif;">
                    <h1 style="color: #C92127;">${config.error500.title}</h1>
                    <p>${config.error500.message}</p>
                    <pre style="text-align: left; background: #f4f4f4; padding: 15px; display: inline-block; border-radius: 5px;">${err.message}</pre>
                    <br><br>
                    <a href="/" style="color: #1a1a2e; font-weight: bold;">${config.error500.linkText}</a>
                </div>
            `);
        });
    }
}

function registerErrorHandlers(app, config) {
    new ErrorHandlersBootstrap({ app, config }).register();
}

module.exports = { registerErrorHandlers, ErrorHandlersBootstrap };
