import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { DateUtil } from './date-util';
import { DateLocale } from './date-locale';
import {
  DOWN_ARROW,
  END, ENTER,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  UP_ARROW
} from '../core/keyboard/keycodes';

const CLOCK_RADIUS = 50;
const CLOCK_INNER_RADIUS = 27.5;
const CLOCK_OUTER_RADIUS = 41.25;
const CLOCK_TICK_RADIUS = 7.0833;

/**
 * A clock that is used as part of the datepicker.
 * @docs-private
 */
@Component({
  moduleId: module.id,
  selector: 'md2-clock1',
  templateUrl: 'clock1.html',
  styleUrls: ['clock1.css'],
  host: {
    'role': 'clock',
    '(mousedown)': '_handleMousedown($event)',
  },
  //encapsulation: ViewEncapsulation.None,
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Md2Clock1 implements AfterContentInit {
  /**
   * The date to display in this clock view (everything other than the hours and minutes is ignored).
   */
  @Input()
  get activeDate(): Date { return this._activeDate; }
  set activeDate(value: Date) {
    let oldActiveDate = this._activeDate;
    this._activeDate = this._util.parse(value) || this._util.today();
    if (!this._util.isSameDay(oldActiveDate, this._activeDate)) {
      this._init();
    }
  }
  private _activeDate: Date;

  /** The currently selected date. */
  @Input()
  get selected(): Date { return this._selected; }
  set selected(value: Date) {
    this._selected = this._util.parse(value);
    this._selectedHour = this._util.getHour(this.selected);
    this._selectedMinute = this._util.getMinute(this.selected);
  }
  private _selected: Date;

  /** Whether the clock should be started in hour or minute view. */
  @Input() startView: 'hour' | 'minute' = 'hour';

  /** A function used to filter which dates are selectable. */
  @Input() dateFilter: (date: Date) => boolean;

  /** Emits when the currently selected date changes. */
  @Output() selectedChange = new EventEmitter<Date>();

  /** Hours and Minutes representing the clock view. */
  _hours: Array<Object> = [];
  _minutes: Array<Object> = [];

  /** Whether the clock is in hour view. */
  _hourView: boolean;

  _selectedHour: number;
  _selectedMinute: number;

  get _hand(): any {
    let deg = 0;
    let radius = CLOCK_OUTER_RADIUS;
    if (this._hourView) {
      let inner = this.activeDate.getHours() > 0 && this.activeDate.getHours() < 13;
      radius = inner ? CLOCK_INNER_RADIUS : CLOCK_OUTER_RADIUS;
      deg = Math.round(this.activeDate.getHours() * (360 / (24 / 2)));
    } else {
      deg = Math.round(this.activeDate.getMinutes() * (360 / 60));
    }
    return {
      'transform': `rotate(${deg}deg)`,
      'height': `${radius}%`,
      'margin-top': `${50 - radius}%`
    };
  }

  private mouseMoveListener: any;
  private mouseUpListener: any;

  constructor(private _element: ElementRef, private _locale: DateLocale,
    private _util: DateUtil) {
    this.mouseMoveListener = (event: any) => { this._handleMousemove(event); };
    this.mouseUpListener = (event: any) => { this._handleMouseup(event); };
  }

  ngAfterContentInit() {
    this.activeDate = this._activeDate || this._util.today();
    this._hourView = this.startView != 'minute';
    this._init();
  }

  /** Handles hour selection in the clock view. */
  _hourSelected(date: Date): void {
    //this.activeDate = this._selectedHour;
    this._hourView = false;
  }

  /** Handles minute selection in the clock view. */
  _minuteSelected(date: Date): void {
    //if ((!date || !this.selected) && date != this.selected || this._util.isSameDay(date, this.selected)) {
    //this.selectedChange.emit(date);
    //this.selectedChange.emit(this.activeDate);
    //}
    this._hourView = true;
  }

  /** Initializes this clock view. */
  private _init() {
    this._hours.length = 0;

    for (let i = 0; i < 24; i++) {
      let radian = i / 6 * Math.PI;
      let inner = i > 0 && i < 13,
        radius = inner ? CLOCK_INNER_RADIUS : CLOCK_OUTER_RADIUS;
      this._hours.push({
        hour: i === 0 ? '00' : i,
        top: CLOCK_RADIUS - Math.cos(radian) * radius - CLOCK_TICK_RADIUS,
        left: CLOCK_RADIUS + Math.sin(radian) * radius - CLOCK_TICK_RADIUS
      });
    }

    for (let i = 0; i < 60; i += 5) {
      let radian = i / 30 * Math.PI;
      this._minutes.push({
        minute: i === 0 ? '00' : i,
        top: CLOCK_RADIUS - Math.cos(radian) * CLOCK_OUTER_RADIUS - CLOCK_TICK_RADIUS,
        left: CLOCK_RADIUS + Math.sin(radian) * CLOCK_OUTER_RADIUS - CLOCK_TICK_RADIUS
      });
    }
  }

  /** Handles mousedown events on the clock body. */
  _handleMousedown(event: any) {
    this.setTime(event);
    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('touchmove', this.mouseMoveListener);
    document.addEventListener('mouseup', this.mouseUpListener);
    document.addEventListener('touchend', this.mouseUpListener);
  }

  _handleMousemove(event: any) {
    event.preventDefault();
    this.setTime(event);
  }

  _handleMouseup(event: any) {
    document.removeEventListener('mousemove', this.mouseMoveListener);
    document.removeEventListener('touchmove', this.mouseMoveListener);
    document.removeEventListener('mouseup', this.mouseUpListener);
    document.removeEventListener('touchend', this.mouseUpListener);
    //if (!cell.enabled || this._selectedDate == cell.value) {
    //  return;
    //}
    if (this._hourView) {
      this._hourSelected(this.activeDate);
    } else {
      this._minuteSelected(this.activeDate);
    }
  }

  private twelvehour: boolean = false;

  /**
   * Set Time
   * @param event
   */
  private setTime(event: any) {
    let trigger = this._element.nativeElement;
    let triggerRect = trigger.getBoundingClientRect();
    let width = trigger.offsetWidth;
    let height = trigger.offsetHeight;
    let pageX = event.pageX !== undefined ? event.pageX : event.touches[0].pageX;
    let pageY = event.pageY !== undefined ? event.pageY : event.touches[0].pageY;
    let x = (width / 2) - (pageX - triggerRect.left - window.pageXOffset);
    let y = (height / 2) - (pageY - triggerRect.top - window.pageYOffset);
    let radian = Math.atan2(-x, y);
    let unit = Math.PI / (this._hourView ? 6 : 30);
    let z = Math.sqrt(x * x + y * y);
    let inner = this._hourView && z < ((width * (CLOCK_OUTER_RADIUS / 100)) +
      (width * (CLOCK_INNER_RADIUS / 100))) / 2;
    let value = 0;

    if (radian < 0) { radian = Math.PI * 2 + radian; }
    value = Math.round(radian / unit);
    radian = value * unit;

    if (this._hourView) {
      if (value === 12) { value = 0; }
      value = inner ? (value === 0 ? 12 : value) : value === 0 ? 0 : value + 12;
      this._selectedHour = value;
      this.activeDate.setHours(value);
    } else {
      this._selectedMinute = value;
      if (value === 60) { value = 0; }
      this.activeDate.setMinutes(value);
    }
  }

}