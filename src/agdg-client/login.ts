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
        loggedIn,
        loginError,
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
            this.statusBar = $('#status-bar');
            this.loginForm = $('#login-box .login-form');
            this.loginStatus = $('#login-box .login-status');
            this.newsPanel = $('#news-panel')

            var username = this.loginForm.find('input[type="text"]');
            var password = this.loginForm.find('input[type="password"]');

            this.loginForm.find('input').keyup(event => {
                if (event.keyCode != 13)
                    return;

                if (!username.val())
                    username.focus();
                else
                    this.loginForm.find('button').click();
            });

            this.loginForm.find('button').click(() => {
                this.setState(LoginState.loggingIn);

                this.ws.send(JSON.stringify({ username: username.val(), password: password.val() }));
            });

            this.connect();
        }

        uninitialize() {
            if (this.newsPanel)
                this.newsPanel.remove();
        }

        connect() {
            var loginServerUrl = agdg_config.loginServerUrl;

            this.setState(LoginState.connecting, loginServerUrl);
            this.ws = new WebSocket(loginServerUrl);

            this.ws.onopen = event => {
                this.setState(LoginState.negotiating);

                this.ws.send(JSON.stringify({ clientVersion: this.clientVersion }));
            };

            this.ws.onmessage = event => {
                var message = JSON.parse(event.data);
                console.log(this.state, message);

                switch (this.state) {
                    case LoginState.negotiating:
                        if (message.type == 'hello') {
                            this.setState(LoginState.connected, message);

                            this.showNews(message.news);

                            if (this.autologin) {
                                setTimeout(() => {
                                    this.setState(LoginState.loggingIn);
                                    this.ws.send(JSON.stringify(this.autologin));
                                }, 100);
                            }
                        }
                        else if (message.type == 'reject') {
                            this.setState(LoginState.versionRejected);
                        }
                        else if (message.type == 'server_closed') {
                            this.setState(LoginState.disconnected, 'Server is closed: ' + message.message);
                            this.ws.close();
                        }
                        break;

                    case LoginState.loggingIn:
                        if (message.type == 'success') {
                            this.setState(LoginState.loggedIn);

                            this.uninitialize();
                            this.transferToRealm(message.realms[0], message.token);
                        }
                        else if (message.type == 'error') {
                            this.setState(LoginState.loginError, message.error);
                        }
                        break;
                }
            }

            this.ws.onclose = event => {
                if (this.state == LoginState.connecting)
                    this.setState(LoginState.failedToConnect);
                else
                    this.setState(LoginState.disconnected);
            }
        }

        setState(state, data?) {
            this.state = state;

            switch (state) {
                case LoginState.disconnected: this.setStatusText(data ? data : 'Disconnected'); break;
                case LoginState.connecting: this.setStatusText('Connecting to ' + data + '...'); break;
                case LoginState.failedToConnect: this.setStatusText('Failed to connect.'); break;
                case LoginState.negotiating: this.setStatusText('Negotiating...'); break;
                case LoginState.versionRejected: this.setStatusText('Rejected by server (try Shift+F5)'); break;

                case LoginState.connected:
                    if (data.anonymousLogin) {
                        this.loginStatus.text("Anonymous login. Use any username.");
                        this.loginForm.find('.password-row').hide();
                    }
                    else {
                        this.loginStatus.text("Login to " + data.serverName + ":");
                        this.loginForm.find('.password-row').show();
                    }

                    this.loginForm.show();
                    break;

                case LoginState.loginError:
                    this.loginStatus.text(data);
                    this.loginForm.show();
                    break;
            }
        }

        setStatusText(text) {
            this.loginForm.hide();
            this.loginStatus.text(text);
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
