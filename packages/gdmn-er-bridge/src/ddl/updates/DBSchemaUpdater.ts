import {AConnection} from "gdmn-db";
import {BaseUpdate} from "./BaseUpdate";
import {Update1} from "./Update1";
import {Update2} from "./Update2";

const UPDATES_LIST: UpdateConstructor[] = [
  Update2,
  Update1
];

export type UpdateConstructor = new (connection: AConnection) => BaseUpdate;

export class DBSchemaUpdater extends BaseUpdate {

  protected readonly _version: number;
  protected readonly _description: string = "Обновление структуры базы данных";
  protected readonly _updates: BaseUpdate[];

  constructor(connection: AConnection) {
    super(connection);

    this._updates = UPDATES_LIST.map((UpdateConstructor) => new UpdateConstructor(this._connection));
    this._updates.sort((a, b) => {
      if (a.version === b.version) throw new Error("Two identical versions of BaseUpdate");
      return a.version < b.version ? -1 : 1;
    });
    this._version = this._updates[this._updates.length - 1].version;
    this._verifyAmount();
  }

  public async run(): Promise<void> {
    const version = await this._executeTransaction((transaction) => this._getDatabaseVersion(transaction));

    if (this._version < version) {
      throw new Error(`Missing updates; app:v.${this._version} < db:v.${version}`);
    }

    const newUpdates = this._updates.filter((item) => item.version > version);
    console.log(this._description + "...");
    console.time(this._description);
    for (const update of newUpdates) {
      console.log(update.description + "...");
      console.time(update.description);
      await update.run();
      console.timeEnd(update.description);
    }
    console.timeEnd(this._description);
  }

  private _verifyAmount(): void {
    const lastVersion = this._updates.reduce((prev, cur) => {
      if (cur.version - prev !== 1) {
        throw new Error("missing update");
      }
      return cur.version;
    }, 0);
    if (lastVersion < this._version) {
      throw new Error("missing update");
    }
    if (lastVersion > this._version) {
      throw new Error("extra update");
    }
  }
}
