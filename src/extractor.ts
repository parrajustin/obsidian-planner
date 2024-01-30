import { parseYaml } from "obsidian";
import { EventSpec } from "./types";
import { DateTime } from "luxon";
import { isUndefined } from "./util";

const DefaultTextColor = "white";
const DefaultColor = "blue";

export function getEventInformation(fileData: string): EventSpec[] {
  const matcher = /```itinerary-event\n([^`]*)\n```/g;
  const matches: EventSpec[] = [];
  let match;

  do {
    match = matcher.exec(fileData);
    if (match) {
      try {
        matches.push(parseEventSpec(match[1]));
      } catch (e) {
        // Although you're probably tempted to raise an error here, it
        // won't help you -- this isn't called from within a render loop.
      }
    }
  } while (match);

  return matches;
}

export function parseEventSpec(eventSpec: string): EventSpec {
  const parsed: EventSpec = parseYaml(eventSpec);

  // Apply timezones to start/end times if provided
  if (!isUndefined(parsed.allDay) && !parsed.allDay) {
    const startTimeZone = parsed.startTimeZone;
    const timeZone = parsed.timeZone;
    if (!isUndefined(parsed.start) && !isUndefined(startTimeZone)) {
      parsed.start = DateTime.fromISO(parsed.start, {
        zone: startTimeZone,
      }).toISO();
    } else if (!isUndefined(parsed.start) && !isUndefined(timeZone)) {
      parsed.start = DateTime.fromISO(parsed.start, {
        zone: timeZone,
      }).toISO();
    }

    const endTimeZone = parsed.endTimeZone;
    if (!isUndefined(parsed.end) && !isUndefined(endTimeZone)) {
      parsed.end = DateTime.fromISO(parsed.end, {
        zone: endTimeZone,
      }).toISO();
    } else if (!isUndefined(parsed.end) && !isUndefined(timeZone)) {
      parsed.end = DateTime.fromISO(parsed.end, {
        zone: endTimeZone,
      }).toISO();
    }
  }

  if (isUndefined(parsed.backgroundColor)) {
    parsed.backgroundColor = parsed.color ?? DefaultColor;
  }
  if (isUndefined(parsed.borderColor)) {
    parsed.borderColor = parsed.color ?? DefaultColor;
  }
  if (isUndefined(parsed.textColor)) {
    parsed.textColor = DefaultTextColor;
  }
  if (isUndefined(parsed.title)) {
    parsed.title = "Untitled Event";
  }

  return parsed;
}
