// jsdom ships no interactive <dialog> support, so the lightbox specs polyfill the modal API
// over the reflected `open` attribute, which jsdom does implement.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
    this.open = false;
  };
}

export {};
