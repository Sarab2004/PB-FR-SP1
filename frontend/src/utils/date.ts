import DateObject from "react-date-object";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export type JalaliDateParts = {
  jy: number;
  jm: number;
  jd: number;
};

function toGregorianDateObject(source: string | DateObject | Date) {
  if (source instanceof DateObject) {
    return source.convert(gregorian, gregorian_en);
  }

  const base =
    source instanceof Date
      ? source
      : typeof source === "string"
      ? new Date(source)
      : new Date();

  if (Number.isNaN(base.getTime())) {
    throw new Error("Invalid date value");
  }

  return new DateObject({ date: base, calendar: gregorian, locale: gregorian_en });
}

export function formatJalali(input: string | Date | null | undefined, format = "YYYY/MM/DD"): string {
  if (!input) return "";
  try {
    const greg = toGregorianDateObject(input);
    return greg.convert(persian, persian_fa).format(format);
  } catch (error) {
    console.warn("formatJalali", error);
    return "";
  }
}

export function gregorianToJalali(isoDate: string): JalaliDateParts {
  const greg = new DateObject({ date: isoDate, calendar: gregorian, locale: gregorian_en });
  const jalali = greg.convert(persian, persian_fa);
  return { jy: jalali.year, jm: jalali.month, jd: jalali.day };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): string {
  const jalali = new DateObject({
    calendar: persian,
    locale: persian_fa,
    year: jy,
    month: jm,
    day: jd,
  });

  return jalali.convert(gregorian, gregorian_en).format("YYYY-MM-DD");
}

export function isoToJalali(iso: string | null | undefined, format = "YYYY/MM/DD"): string {
  if (!iso) return "-";
  return formatJalali(iso, format) || "-";
}

export function jalaliPartsToDisplay(parts: JalaliDateParts, format = "YYYY/MM/DD"): string {
  const jalali = new DateObject({
    calendar: persian,
    locale: persian_fa,
    year: parts.jy,
    month: parts.jm,
    day: parts.jd,
  });
  return jalali.format(format);
}
