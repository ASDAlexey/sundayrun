import { Component, DOCUMENT, computed, inject, linkedSignal, output, signal } from '@angular/core';

import { inferGender } from '../../../core/gender/gender-inference';
import { normalizeAthleteKey } from '../../../core/history/athlete-key';
import { suggestAthletes } from '../../../core/history/athlete-suggest';
import { pluralText } from '../../../core/i18n/plural-text';
import { AthleteRecord } from '../../../core/models/athlete-history.interface';
import { Gender, GenderType } from '../../../core/models/gender.enum';
import { addRunner, removeRunner, setRunnerGender } from '../../../core/timer/session-actions';
import { hasDuplicateSurnames, runnersWithoutGender } from '../../../core/timer/session-splits';
import { createTimerId } from '../../../core/timer/timer-id';
import { NAME_PART_SEPARATOR, SURNAME_INDEX } from '../../../core/timer/timer-session.constant';
import { TimerRunnerOutcome } from '../../../core/timer/timer-session.enum';
import { TimerRunner } from '../../../core/timer/timer-session.interface';
import { normalizeFullNameCase } from '../../../core/xlsx/full-name-case';
import { TimerRosterStatus } from '../../../state/timer-roster.enum';
import { TimerRosterService } from '../../../state/timer-roster.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import {
  TIMER_PICKER_EMPTY_TEXT,
  TIMER_PICKER_GENDERS,
  TIMER_PICKER_META_SEPARATOR,
  TIMER_PICKER_MIN_NAME_PARTS,
  TIMER_PICKER_NO_APPEARANCES,
  TIMER_PICKER_PROBE_ID,
  TIMER_PICKER_REGULARS_LIMIT,
  TIMER_PICKER_ROSTER_DATE_FORMAT,
  TIMER_PICKER_SSR_NOW_MS,
  TIMER_PICKER_SSR_RANDOM,
  TIMER_PICKER_SUGGESTION_LIMIT,
  TIMER_PICKER_TITLE_ID,
} from './runner-picker.constant';
import { TimerGenderOption, TimerPickerCandidate, TimerPickerOption } from './runner-picker.interface';

/**
 * The «Атлеты» sheet — the whole roster job in one self-contained panel (docs/TIMER.md §5):
 * search the archive, pull last Sunday's line-up or the regulars in one tap, add a newcomer with a
 * gender the organiser confirms, and answer for anybody still missing one.
 *
 * It edits the active measurement straight through `TimerSessionService`, which is why it serves the
 * minute before the start and the middle of the race alike: a latecomer joins while the clock runs
 * and behaves like everybody else. No session state is duplicated here — the sheet owns only the
 * query, the newcomer draft and which regulars are ticked. Its single output is `close`; where the
 * sheet lives and when it opens is the page's business, never its own.
 *
 * The directory refresh fires on creation and is allowed to fail: with no signal in the park the
 * cached names stay on screen and the sheet says how old they are.
 */
@Component({
  selector: 'app-timer-picker',
  templateUrl: './runner-picker.html',
  styleUrl: './runner-picker.scss',
})
export class TimerPicker {
  readonly #sessions = inject(TimerSessionService);
  readonly #roster = inject(TimerRosterService);
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #duplicateSurname = signal<string | null>(null);
  readonly #checkedKeys = signal<ReadonlySet<string>>(new Set<string>());
  readonly #runners = computed(() => this.#sessions.active()?.runners ?? []);
  readonly #pickedKeys = computed(() =>
    this.#runners().reduce<string[]>((keys, runner) => (runner.athleteKey === null ? keys : [...keys, runner.athleteKey]), []),
  );

  readonly #pickedNames = computed(() => new Set(this.#runners().map((runner) => normalizeAthleteKey(runner.fullName))));
  /** The newest OTHER measurement that had a line-up — «как в прошлый раз» never means «сейчас». */
  readonly #previousRunners = computed(() => {
    const activeId = this.#sessions.activeId();

    return this.#sessions.sessions().find((session) => session.id !== activeId && session.runners.length > 0)?.runners ?? [];
  });

  /** Regulars ranked by timed first laps in the archive — the honest measure of who shows up. */
  readonly #regularRecords = computed(() => {
    const appearances = this.#roster.appearanceCount();
    const picked = this.#pickedKeys();

    return this.#roster
      .records()
      .filter((record) => !picked.includes(record.key))
      .sort(byAppearances(appearances))
      .slice(0, TIMER_PICKER_REGULARS_LIMIT);
  });

  readonly close = output<void>();

  readonly status = this.#roster.status;
  /**
   * The one text box of the sheet. It searches the archive and it names a newcomer at the same time,
   * because that is what an organiser typing «Тест Тестов» means: whoever is in the directory shows
   * up in the hits, and whoever is not gets the «Новый участник» key right under them.
   */
  readonly query = signal(TIMER_PICKER_EMPTY_TEXT);
  /**
   * A linked signal, not a plain one: every keystroke re-infers the gender from what has been typed,
   * and a tap on М/Ж overrides that guess until the name changes again. That is the whole point of
   * asking — the guess is the default, the organiser's tap is the answer.
   */
  readonly newGender = linkedSignal({
    source: () => this.query(),
    computation: (name: string) => inferGender(name).gender,
  });

  readonly runners = this.#runners;
  readonly runnerCount = computed(() => this.#runners().length);
  readonly warningSurname = this.#duplicateSurname.asReadonly();
  readonly suggestions = computed(() =>
    this.#toOptions(suggestAthletes(this.#roster.records(), this.query(), this.#pickedKeys(), TIMER_PICKER_SUGGESTION_LIMIT)),
  );

  readonly regulars = computed(() => this.#toOptions(this.#regularRecords()));
  readonly checkedCount = computed(() =>
    this.regulars().reduce((count, option) => (option.checked ? count + 1 : count), TIMER_PICKER_NO_APPEARANCES),
  );

  readonly previousCount = computed(() => this.#previousRunners().length);
  readonly missingGender = computed(() => {
    const session = this.#sessions.active();

    return session === null ? [] : runnersWithoutGender(session);
  });

  readonly missingGenderText = computed(() => missingGenderText(this.missingGender().length));
  /**
   * The footer names the pending work, not the sheet: with names ticked it reads «Добавить · 2»,
   * because a tick that survives the tap is a person who never made it to the start.
   */
  readonly doneText = computed(() => {
    const checked = this.checkedCount();

    return checked > 0 ? addCheckedText(checked) : readyText(this.runnerCount());
  });

  /** «Готово» stays locked while this holds: a place cannot be awarded to a runner without a gender. */
  readonly genderPending = computed(() => this.missingGender().length > 0);
  /** «Добавить „Тест Тестов"» — the query as it would be written down, so the key shows the result. */
  readonly newcomerName = computed(() => displayName(this.query()));

  /** The form is offered from the first character typed; the key itself waits for a full name. */
  readonly showNewcomer = computed(() => this.newcomerName().length > 0);
  readonly canAddNewcomer = computed(() => isCompleteName(this.query()));
  /**
   * The archive already holds this exact name. Not a refusal — two brothers with one name do run
   * together, and only the organiser knows which of the two is standing here — but a reason to look
   * at the hit above before minting a second entry for the same person.
   */
  readonly newcomerKnown = computed(() => {
    const key = normalizeAthleteKey(this.newcomerName());

    return this.showNewcomer() && this.#roster.records().some((record) => record.key === key);
  });

  readonly rosterAgeText = computed(() => {
    const cachedAtMs = this.#roster.cachedAtMs();

    return cachedAtMs === null ? null : rosterAgeText(cachedAtMs);
  });

  protected readonly titleId = TIMER_PICKER_TITLE_ID;
  protected readonly statuses = TimerRosterStatus;
  protected readonly genderOptions = buildGenderOptions();

  constructor() {
    void this.#roster.load();
  }

  /** A tap on a search hit. The archive already knows the gender, so there is nothing to ask. */
  pick(option: TimerPickerOption): void {
    this.#add([{ fullName: option.displayName, athleteKey: option.key, gender: option.gender }]);
    this.query.set(TIMER_PICKER_EMPTY_TEXT);
  }

  /** «Как в прошлый раз»: last Sunday's line-up, minus whoever is already standing here. */
  addPrevious(): void {
    this.#add(this.#unknownOnly(this.#previousRunners().map(toCandidate)));
  }

  toggleRegular(option: TimerPickerOption): void {
    const next = new Set(this.#checkedKeys());

    if (next.has(option.key)) {
      next.delete(option.key);
    } else {
      next.add(option.key);
    }

    this.#checkedKeys.set(next);
  }

  /** Every ticked regular joins in one write — thirty people, one action. */
  addRegulars(): void {
    const chosen = this.regulars().reduce<TimerPickerCandidate[]>(
      (candidates, option) =>
        option.checked ? [...candidates, { fullName: option.displayName, athleteKey: option.key, gender: option.gender }] : candidates,
      [],
    );

    this.#add(chosen);
    this.#checkedKeys.set(new Set<string>());
  }

  /** «Новый участник»: the search box read as a name, display-cased, with the confirmed gender. */
  addNewcomer(): void {
    const fullName = this.newcomerName();

    if (!isCompleteName(fullName)) {
      return;
    }

    this.#add([{ fullName, athleteKey: null, gender: this.newGender() }]);
    this.query.set(TIMER_PICKER_EMPTY_TEXT);
  }

  /**
   * The single exit of the sheet. Ticks are spent before it closes: the organiser who ticked two
   * names and reached for the big button meant «добавь этих двоих», never «забудь их».
   */
  commit(): void {
    this.addRegulars();
    this.close.emit();
  }

  setGender(runner: TimerRunner, gender: GenderType): void {
    this.#sessions.updateActive((session) => setRunnerGender(session, runner.id, gender));
  }

  /** Added by mistake: the tile goes, and with it every time recorded against it. */
  remove(runner: TimerRunner): void {
    this.#duplicateSurname.set(null);
    this.#sessions.updateActive((session) => removeRunner(session, runner.id));
  }

  /**
   * The one write path of the sheet. Ids are minted off the injected clock with the index folded in,
   * so a batch of thirty gets thirty distinct ids from one reading — `addRunner` drops a repeated id,
   * and a shared one would silently swallow twenty-nine people.
   */
  #add(candidates: readonly TimerPickerCandidate[]): void {
    if (candidates.length === 0) {
      return;
    }

    const nowMs = this.#nowMs();

    this.#duplicateSurname.set(this.#twinSurname(this.#runners(), candidates));
    this.#sessions.updateActive((session) =>
      candidates.reduce((current, candidate, index) => addRunner(current, { ...candidate, id: this.#nextId(nowMs + index) }), session),
    );
  }

  /**
   * «В составе уже есть Попов» — a warning, never a block: two brothers do run together, and only
   * the organiser knows whether this is the second Попов or the same one entered twice.
   */
  #twinSurname(runners: readonly TimerRunner[], candidates: readonly TimerPickerCandidate[]): string | null {
    const known = [...runners];

    for (const candidate of candidates) {
      const probe = probeRunner(candidate);
      const twin = known.find((runner) => hasDuplicateSurnames([runner, probe]));

      known.push(probe);

      if (twin !== undefined) {
        return surnameOf(twin.fullName);
      }
    }

    return null;
  }

  /** Batch sets are sloppy by nature: the same person may already be standing in the roster. */
  #unknownOnly(candidates: readonly TimerPickerCandidate[]): TimerPickerCandidate[] {
    const keys = this.#pickedKeys();
    const names = this.#pickedNames();

    return candidates.reduce<TimerPickerCandidate[]>((kept, candidate) => {
      const byKey = candidate.athleteKey !== null && keys.includes(candidate.athleteKey);

      return byKey || names.has(normalizeAthleteKey(candidate.fullName)) ? kept : [...kept, candidate];
    }, []);
  }

  #toOptions(records: readonly AthleteRecord[]): TimerPickerOption[] {
    const appearances = this.#roster.appearanceCount();
    const checked = this.#checkedKeys();

    return records.map((record) => ({
      key: record.key,
      displayName: record.displayName,
      gender: record.gender,
      metaText: optionMetaText(record.gender, appearanceCount(appearances, record.key)),
      checked: checked.has(record.key),
    }));
  }

  #nowMs(): number {
    return this.#view?.Date.now() ?? TIMER_PICKER_SSR_NOW_MS;
  }

  /** The randomness comes from the injected window too, so a spec knows the ids in advance. */
  #nextId(nowMs: number): string {
    return createTimerId(nowMs, () => this.#view?.Math.random() ?? TIMER_PICKER_SSR_RANDOM);
  }
}

/** Most laps first; equal regulars fall back to the alphabet so the list never shuffles itself. */
function byAppearances(appearances: ReadonlyMap<string, number>): (left: AthleteRecord, right: AthleteRecord) => number {
  return (left, right) => {
    const gap = appearanceCount(appearances, right.key) - appearanceCount(appearances, left.key);

    return gap === 0 ? left.displayName.localeCompare(right.displayName) : gap;
  };
}

function appearanceCount(appearances: ReadonlyMap<string, number>, key: string): number {
  return appearances.get(key) ?? TIMER_PICKER_NO_APPEARANCES;
}

function toCandidate(runner: TimerRunner): TimerPickerCandidate {
  return { fullName: runner.fullName, athleteKey: runner.athleteKey, gender: runner.gender };
}

/** A stand-in runner built only to be compared by the core's surname check; never stored. */
function probeRunner(candidate: TimerPickerCandidate): TimerRunner {
  return { ...candidate, id: TIMER_PICKER_PROBE_ID, outcome: TimerRunnerOutcome.active };
}

/** Names are kept «Фамилия Имя», so the warning shows the first token as written, not normalised. */
function surnameOf(fullName: string): string {
  return fullName.split(NAME_PART_SEPARATOR)[SURNAME_INDEX];
}

function displayName(raw: string): string {
  return normalizeFullNameCase(raw).trim();
}

function isCompleteName(raw: string): boolean {
  return displayName(raw).split(NAME_PART_SEPARATOR).length >= TIMER_PICKER_MIN_NAME_PARTS;
}

/** «М · 47 забегов» — gender first, because that is what the sheet is here to settle. */
function optionMetaText(gender: GenderType | null, appearances: number): string {
  return `${genderText(gender)}${TIMER_PICKER_META_SEPARATOR}${appearanceText(appearances)}`;
}

function genderText(gender: GenderType | null): string {
  if (gender === Gender.male) {
    return $localize`:@@timerPicker.metaMale:М`;
  }

  return gender === Gender.female ? $localize`:@@timerPicker.metaFemale:Ж` : $localize`:@@timerPicker.metaUnknownGender:пол не указан`;
}

function appearanceText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timerPicker.appearancesOne:${count}:count: забег`,
    few: $localize`:@@timerPicker.appearancesFew:${count}:count: забега`,
    many: $localize`:@@timerPicker.appearancesMany:${count}:count: забегов`,
  });
}

/** «Добавить · 2» — the ticked names are the promise the button has to keep. */
function addCheckedText(count: number): string {
  return $localize`:@@timerPicker.addChecked:Добавить · ${count}:count:`;
}

/** «Готово · 12» — nothing pending, so the button answers with the line-up it closes on. */
function readyText(count: number): string {
  return $localize`:@@timerPicker.done:Готово · ${count}:count:`;
}

/** «Уточните пол: 2 человека» — the line that keeps «Готово» locked until it is gone. */
function missingGenderText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@timerPicker.missingGenderOne:Уточните пол: ${count}:count: человек`,
    few: $localize`:@@timerPicker.missingGenderFew:Уточните пол: ${count}:count: человека`,
    many: $localize`:@@timerPicker.missingGenderMany:Уточните пол: ${count}:count: человек`,
  });
}

/** «Справочник от 26.07» — how old the names in hand are when there is no signal to refresh them. */
function rosterAgeText(cachedAtMs: number): string {
  const dateText = TIMER_PICKER_ROSTER_DATE_FORMAT.format(new Date(cachedAtMs));

  return $localize`:@@timerPicker.rosterAge:Справочник от ${dateText}:date:`;
}

function buildGenderOptions(): TimerGenderOption[] {
  const options: Record<GenderType, TimerGenderOption> = {
    [Gender.male]: {
      gender: Gender.male,
      label: $localize`:@@timerPicker.genderMale:М`,
      ariaLabel: $localize`:@@timerPicker.genderMaleLabel:Мужской`,
    },
    [Gender.female]: {
      gender: Gender.female,
      label: $localize`:@@timerPicker.genderFemale:Ж`,
      ariaLabel: $localize`:@@timerPicker.genderFemaleLabel:Женский`,
    },
  };

  return TIMER_PICKER_GENDERS.map((gender) => options[gender]);
}
