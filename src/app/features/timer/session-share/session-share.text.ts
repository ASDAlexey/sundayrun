import { SessionShareTextLabels } from '../../../core/timer/session-share-text.interface';

/** The headings of the pasted message. Kept out of the core, which has no `$localize` of its own. */
export function sessionShareLabels(dateText: string): SessionShareTextLabels {
  return {
    title: $localize`:@@timerShare.messageTitle:Воскресный пробег · ${dateText}:date:`,
    fiveKm: $localize`:@@timerShare.messageFiveKm:5 км`,
    twoThreeKm: $localize`:@@timerShare.messageTwoThreeKm:2,3 км`,
    didNotFinish: $localize`:@@timerShare.messageDnf:Не финишировали`,
  };
}

/** What the system share sheet puts above the workbook when a chat app asks for a caption. */
export function shareFileCaption(dateText: string, metaText: string): string {
  return $localize`:@@timerShare.fileCaption:Протокол забега ${dateText}:date: · ${metaText}:meta:`;
}
