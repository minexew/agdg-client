declare var agdg_config;

module Login {
    enum LoginState {
        disconnected,
        connecting,
        failedToConnect,
        negotiating,
        versionRejected,
        connected,
        loggingIn,
        loggedIn
    };

    export class LoginSession {
        state: LoginState = LoginState.disconnected;
        ws: WebSocket;
        statusBar: JQuery;
        loginForm: JQuery;
        loginStatus: JQuery;
        newsPanel: JQuery;

        clientVersion: number = 1;

        autologin: any;// = { username: 'admin', password: 'admin' };

        constructor() {
            var self = this;

            this.statusBar = $('#status-bar');
            this.loginForm = $('#login-box .login-form');
            this.loginStatus = $('#login-box .login-status');
            this.newsPanel = $('#news-panel')

            this.loginForm.find('button').click(() => {
                self.setLoginStatus('Logging in...', false);
                self.setState(LoginState.loggingIn);

                var username = self.loginForm.find('input[type="text"]').val();
                var password = self.loginForm.find('input[type="password"]').val();

                self.ws.send(JSON.stringify({ username: username, password: password }));
            });

            this.connect();
        }

        uninitialize() {
            if (this.newsPanel)
                this.newsPanel.remove();
        }

        connect() {
            var self = this;

            var loginServerUrl = agdg_config.loginServerUrl;

            this.setState(LoginState.connecting, loginServerUrl);
            this.ws = new WebSocket(loginServerUrl);

            this.ws.onopen = function(event) {
                self.setState(LoginState.negotiating);

                self.ws.send(JSON.stringify({ clientVersion: self.clientVersion }));
            };

            this.ws.onmessage = function(event) {
                var message = JSON.parse(event.data);

                switch (self.state) {
                    case LoginState.negotiating:
                        if (message.type == 'hello') {
                            self.setState(LoginState.connected, message.serverName);

                            self.showNews(message.news);

                            if (self.autologin) {
                                setTimeout(function () {
                                    self.setLoginStatus('Logging in...', false);
                                    self.setState(LoginState.loggingIn);
                                    self.ws.send(JSON.stringify(self.autologin));
                                }, 1000);
                            }
                        }
                        else if (message.type == 'reject') {
                            self.setState(LoginState.versionRejected, message.expectedVersion);
                        }
                        else if (message.type == 'server_closed') {
                            self.setLoginStatus('Server is closed: ' + message.message, false);
                            self.setState(LoginState.disconnected);
                            self.ws.close();
                        }
                        break;

                    case LoginState.loggingIn:
                        if (message.type == 'success') {
                            self.setLoginStatus("Success!", false);
                            self.setState(LoginState.loggedIn);

                            self.uninitialize();
                            self.transferToRealm(message.realms[0], message.token);
                        }
                        else if (message.type == 'error') {
                            self.setLoginStatus(message.error, true);
                            //self.setState(LoginState.connected);
                        }
                        break;
                }
            }

            this.ws.onclose = function (event) {
                if (self.state == LoginState.connecting)
                    self.setState(LoginState.failedToConnect);
                else
                    self.setState(LoginState.disconnected);
            }
        }

        setState(state, data?) {
            this.state = state;

            switch (state) {
                case LoginState.disconnected: this.statusBar.text('Disconnected'); break;
                case LoginState.connecting: this.statusBar.text('Connecting to ' + data + '...'); break;
                case LoginState.failedToConnect: this.statusBar.text('Failed to connect.'); break;
                case LoginState.negotiating: this.statusBar.text('Negotiating...'); break;
                case LoginState.versionRejected: this.statusBar.text('Rejected by server (expected version ' + data + ')'); break;
                case LoginState.connected: this.statusBar.text('Connected to ' + data); break;
            }
        }

        setLoginStatus(status, showForm: boolean) {
            if (showForm)
                this.loginForm.show();
            else
                this.loginForm.hide();

            this.loginStatus.text(status);
        }

        showNews(news) {
            news.forEach(entry => {
                this.newsPanel.append(
                    $('<div>')
                        .append($('<h5>').html(entry.when_posted))
                        .append($('<h3>').html(entry.title))
                        .append(entry.contents)
                );
            });

            $('body').append(this.newsPanel);
        }

        transferToRealm(realm, token: string) {
            this.ws.close();
            $('#login-box').hide();

            connectToRealm(realm.url, token);
        }
    }
}
