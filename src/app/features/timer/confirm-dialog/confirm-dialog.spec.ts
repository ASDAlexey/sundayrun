import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerConfirm } from './confirm-dialog';
import { CONFIRM_ACTION_LABEL, CONFIRM_HEADING, CONFIRM_NOTE } from './confirm-dialog.mock';

@Component({
  selector: 'app-confirm-host',
  imports: [TimerConfirm],
  template: `<dialog
    appTimerConfirm
    [actionLabel]="action"
    [heading]="heading"
    [note]="note"
    (closed)="closed()"
    (confirmed)="confirmed()"
  ></dialog>`,
})
class ConfirmHost {
  readonly action = CONFIRM_ACTION_LABEL;
  readonly heading = CONFIRM_HEADING;
  readonly note = CONFIRM_NOTE;
  readonly answers: string[] = [];

  confirmed(): void {
    this.answers.push('confirmed');
  }

  closed(): void {
    this.answers.push('closed');
  }
}

describe('TimerConfirm', () => {
  let fixture: ComponentFixture<ConfirmHost>;
  let host: ConfirmHost;
  let dialog: HTMLDialogElement;

  const click = (selector: string): void => {
    dialog.querySelector<HTMLElement>(selector)?.click();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(ConfirmHost);
    host = fixture.componentInstance;
    await fixture.whenStable();
    dialog = fixture.nativeElement.querySelector('dialog');
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('names the damage, confirms once and backs out three ways', () => {
    expect(dialog.open, 'the question shows itself the moment it is rendered').toBe(true);
    expect(dialog.getAttribute('aria-labelledby'), 'the dialog is named by its own heading').not.toBeNull();
    expect(dialog.querySelector('.timer-confirm__title')?.textContent?.trim()).toBe(CONFIRM_HEADING);
    expect(dialog.querySelector('.timer-confirm__note')?.textContent?.trim()).toBe(CONFIRM_NOTE);
    expect(dialog.querySelector('.timer-confirm__action')?.textContent?.trim()).toBe(CONFIRM_ACTION_LABEL);
    expect(
      dialog.querySelector('.timer-confirm__keys')?.firstElementChild?.classList.contains('timer-confirm__cancel'),
      'the safe key comes first, so the platform lands the focus on it',
    ).toBe(true);

    click('.timer-confirm__action');

    expect(host.answers, 'a confirmed question is answered, not dismissed').toEqual(['confirmed']);
    expect(dialog.open).toBe(false);

    dialog.showModal();
    click('.timer-confirm__cancel');

    expect(host.answers.at(-1)).toBe('closed');
    expect(dialog.open).toBe(false);

    dialog.showModal();
    dialog.querySelector('.timer-confirm__body')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(host.answers, 'a click on the card itself is not a click on the backdrop').toHaveLength(2);

    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    dialog.showModal();
    dialog.dispatchEvent(new Event('cancel'));

    expect(host.answers, 'the backdrop and Escape reach the same way out').toEqual(['confirmed', 'closed', 'closed', 'closed']);
  });
});
