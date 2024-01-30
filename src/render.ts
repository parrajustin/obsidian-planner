import { MarkdownRenderChild } from "obsidian";

import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import luxonPlugin from "@fullcalendar/luxon";
import { DateTime } from "luxon";
import { EventSpec, ItinerarySpec } from "./types";
import { getArrayForArrayOrObject } from "./util";
import { isNull, isUndefined } from "./util";

export class ItineraryRenderer extends MarkdownRenderChild {
  private messages: string[] = [];
  private loaded: boolean = false;
  private calendar: Calendar | undefined;
  private sources: Record<string, EventSpec[]> = {};

  constructor(
    private spec: ItinerarySpec,
    private sourcePaths: string[],
    private container: HTMLElement
  ) {
    super(container);
  }

  async onload() {
    await this.render();
    this.loaded = true;
  }

  async onunload() {
    this.loaded = false;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /** Updates stored event information
   *
   * Returns `false` if source file is *not* an event source for
   *   this particular itinerary.
   * Returns `true` if source file *is*.
   */
  updateSource(source: string, events: EventSpec[]): boolean {
    if (this.sourcePaths.includes(source)) {
      this.sources[source] = events;
      this.render();
      return true;
    }
    return false;
  }

  log(message: string) {
    if (!isUndefined(this.spec.debug) && this.spec.debug) {
      console.log(message);
      this.messages.push(message);
    }
  }

  /**
   * Updates the size of the underlying calendar.
   */
  public updateSize() {
    if (!isUndefined(this.calendar)) {
      this.calendar.updateSize();
    }
  }

  async render() {
    try {
      const events = Object.values(this.sources).flat();

      if (!this.calendar) {
        const calendarProps = { ...this.spec };
        // Our itinerary spec extends the CalendarOptions object used by
        // @fullcalendar/core, but there are a handful of properties that
        // are used only by obsidian-itinerary; we need to delete them
        // or @fullcalendar/core will show a warning in the console.
        delete calendarProps.source;
        delete calendarProps.filter;
        delete calendarProps.debug;

        this.calendar = new Calendar(this.container, {
          plugins: [dayGridPlugin, timeGridPlugin, listPlugin, luxonPlugin],
          ...calendarProps,
        });
      }
      this.calendar.removeAllEvents();
      this.calendar.addEventSource(events);
      this.calendar.render();

      setTimeout(() => this.updateSize(), 250);
      if (!isUndefined(this.spec.debug) && this.spec.debug) {
        renderErrorPre(
          this.container,
          this.messages.join("\n"),
          "itinerary-debug"
        );
        this.messages = [];
      }
    } catch (e) {
      renderErrorPre(this.container, e);
    }
  }
}

export class EventRenderer extends MarkdownRenderChild {
  constructor(
    private event: EventSpec,
    private container: HTMLElement
  ) {
    super(container);
  }

  async onload() {
    await this.render();
  }

  async render() {
    try {
      if (!isUndefined(this.event.hidden) && this.event.hidden) {
        // Remove all child nodes (in case we rendered them before)
        const childNode = this.container.firstChild;
        while (!isNull(childNode)) {
          this.container.removeChild(childNode);
        }
      } else {
        const element = this.container.createEl("div", {
          cls: ["itinerary", "itinerary-event"],
        });

        const name = element.createEl("div", {
          cls: ["name"],
        });
        if (!isUndefined(this.event.backgroundColor)) {
          name.style.backgroundColor = this.event.backgroundColor;
        }
        if (!isUndefined(this.event.borderColor)) {
          name.style.borderColor = this.event.borderColor;
        }
        if (!isUndefined(this.event.textColor)) {
          name.style.color = this.event.textColor;
        }
        name.innerText = this.event.title;

        const dateStr = element.createEl("div", {
          cls: ["date"],
        });
        let start: DateTime = DateTime.now();
        if (!isUndefined(this.event.start)) {
          start = DateTime.fromISO(this.event.start);
        }
        let end: DateTime | null = null;
        if (!isUndefined(this.event.end)) {
          end = DateTime.fromISO(this.event.end);
        }
        if (!isUndefined(this.event.allDay) && this.event.allDay) {
          // An all day event render.
          if (!isNull(end) && end.equals(start)) {
            dateStr.innerText = `${end?.toLocaleString(DateTime.DATE_FULL)} (all day)`;
          } else if (!isNull(end)) {
            dateStr.innerText = `${start?.toLocaleString(DateTime.DATE_FULL)} - ${end.toLocaleString(DateTime.DATE_FULL)} (all day)`;
          } else {
            dateStr.innerText = `${start.toLocaleString(DateTime.DATE_FULL)} (all day)`;
          }
        } else {
          if (end) {
            const zone = this.event.timeZone ?? this.event.endTimeZone;
            if (!isUndefined(zone)) {
              end = end.setZone(zone);
            }
          }
          const zone = this.event.timeZone ?? this.event.startTimeZone;
          if (!isUndefined(zone)) {
            start = start.setZone(zone);
          }
          if (!end || end == start) {
            dateStr.innerText = `${start.toLocaleString(
              DateTime.DATETIME_FULL
            )}`;
          } else {
            dateStr.innerText = `${start.toLocaleString(
              DateTime.DATETIME_FULL
            )} - ${end.toLocaleString(DateTime.DATETIME_FULL)}`;
          }
        }

        for (const tagName of getArrayForArrayOrObject(this.event.tag)) {
          const tag = element.createEl("div", {
            cls: ["tag"],
          });
          tag.innerText = tagName;
        }
      }
    } catch (e) {
      renderErrorPre(this.container, e);
    }
  }
}

export function renderErrorPre(
  container: HTMLElement,
  error: string,
  cls?: string
): HTMLElement {
  const pre = container.createEl("pre", {
    cls: ["itinerary", cls ?? "itinerary-error"],
  });
  pre.appendText(error);
  return pre;
}
