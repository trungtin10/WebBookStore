class ServerBootstrap {
    constructor({ app, port }) {
        this.app = app;
        this.port = port;
    }

    start() {
        return this._listenWithFallback(this.port);
    }

    _listenWithFallback(port) {
        const server = this.app.listen(port, () => {
            console.log(`Server running at http://localhost:${server.address().port}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const nextPort = port + 1;
                if (nextPort <= 3010) {
                    console.warn(`Port ${port} đang dùng, thử port ${nextPort}...`);
                    this._listenWithFallback(nextPort);
                } else {
                    console.error(`\n⚠️  Port ${port} đang được sử dụng. Tắt process cũ hoặc chạy: set PORT=3002 && node app.js\n`);
                    process.exit(1);
                }
            } else {
                throw err;
            }
        });
        return server;
    }
}

function startServer(app, port) {
    return new ServerBootstrap({ app, port }).start();
}

module.exports = { startServer, ServerBootstrap };
