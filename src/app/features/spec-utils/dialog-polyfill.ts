/** jsdom 28 still ships `<dialog>` without the modal API; the specs only need the open flag to flip. */
export function polyfillDialogModal(): void {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
      this.open = true;
    };
  }

  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
      this.open = false;
    };
  }
}
