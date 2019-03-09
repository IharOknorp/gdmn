import { getNextID } from "../utils/idGenerator";

export class Value {
  readonly id: number = getNextID();
  readonly image: string;

  constructor(image: string) {
    this.image = image;
  }

  public getText() {
    return this.image;
  }
}

export class DateValue extends Value {
  public readonly date: Date;

  constructor(image: string, date: Date) {
    super(image);
    this.date = date;
  }
}

export function parseDate(date: string): Date {
  const rg = /(31|30|2[0-9]|1[0-9]|0[1-9]|[1-9]){1}\.(12|11|10|0[1-9]|[1-9]){1}\.([1-2]{1}[0-9]{3}|[0-9]{2})/;
  const groups = rg.exec(date);
  if (groups) {
    const day = parseInt(groups[1]);
    const month = parseInt(groups[2]);
    let year = parseInt(groups[3]);
    if (year < 100) {
      year += 2000;
    }
    return new Date(year, month, day);
  }
  throw new Error(`Invalid date string ${date}`);
}