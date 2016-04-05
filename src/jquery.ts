interface JQuery {
    length: number;
    clone(): JQuery;
    fadeIn(): JQuery;
    fadeOut(duration?: number, complete?: any): JQuery;
    focus(): JQuery;
    html(): string;
    html(val: string): JQuery;
    text(): string;
    text(val: any): JQuery;
    show(): JQuery;
    hide(): JQuery;
    addClass(className: string): JQuery;
    removeClass(className: string): JQuery;
    append(el: any): JQuery;
    val(): string;
    val(value: string): JQuery;
    attr(attrName: string): string;
    click(callback?: any): JQuery;
    keyup(callback?: any): JQuery;
    find(selector: string): JQuery;
    on(selector: string, callback: any): JQuery;
    scrollTop(value: number): JQuery;
    width(): number;
    height(): number;
    css(property: string, value: any): JQuery;
    remove(): JQuery;
}
declare var $: {
    (el: HTMLElement): JQuery;
    (selector: string): JQuery;
    (readyCallback: () => void): JQuery;
    (selectors: Array<any>): JQuery;
};
