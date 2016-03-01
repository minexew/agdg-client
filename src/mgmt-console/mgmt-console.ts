/// <reference path="../jquery.ts"/>

declare var agdg_config;

class ManagementConsoleClient {
    console: any;
    ws: WebSocket;

    constructor() {
        this.console = $('#console');

        this.connect();

        $('#cmd-stop-server').click(() => this.ws.send(JSON.stringify({ command: 'stop' })));
        $('#btn-close-server').click(() => this.ws.send(JSON.stringify({ command: 'close_server', message: $('#close-server-reason').val() })));
        $('#btn-reopen-server').click(() => this.ws.send(JSON.stringify({ command: 'reopen_server' })));
    }

    connect() {
        var self = this;

        this.ws = new WebSocket(agdg_config.mgmtConsoleUrl);

        this.ws.onopen = function (event) {
            console.log('open');
            $('#status-connecting').hide();
            $('#status-connected').show();
        };

        this.ws.onmessage = function (event) {
            var ev = JSON.parse(event.data);

            self.console.append(self.presentEvent(ev));
        }

        this.ws.onclose = function (event) {
            $('#status-connecting').hide();
            $('#status-connected').hide();
            $('#status-failed').show();
        }
    }

    presentEvent(event) {
        var tr = $('<tr>');

        tr.append($('<td>').text(event.timestamp / 1000));
        tr.append($('<td>').text(event.message));

        return tr;
    }
}
