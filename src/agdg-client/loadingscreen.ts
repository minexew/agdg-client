module agdg {
    export class LoadingScreen {
        overlay: JQuery;
        text: JQuery;
        bar: JQuery;

        constructor() {
            this.overlay = $('#loading-overlay');
            this.text = this.overlay.find('#loading-text');
            this.bar = this.overlay.find('#loading-bar');
        }

        close() {
            this.overlay.remove();
        }

        hide() {
            this.overlay.hide();
        }

        show(text: string) {
            this.text.text(text);
            this.overlay.show();
        }
    }
}
