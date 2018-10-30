import {ISetAttributeAdapter} from "../../rdbadapter";
import {ISetAttribute} from "../../serialize";
import {AttributeTypes} from "../../types";
import {Attribute} from "../Attribute";
import {IAttributes} from "../Entity";
import {EntityAttribute, IEntityAttributeOptions} from "./EntityAttribute";

export interface ISetAttributeOptions extends IEntityAttributeOptions<ISetAttributeAdapter> {
  presLen?: number;
}

export class SetAttribute extends EntityAttribute<ISetAttributeAdapter> {

  public type: AttributeTypes = "Set";

  public readonly attributes: IAttributes = {};
  public readonly presLen: number;

  constructor(options: ISetAttributeOptions) {
    super(options);
    this.presLen = options.presLen || 1;
  }

  public attribute(name: string): Attribute | never {
    const found = this.attributes[name];
    if (!found) {
      throw new Error(`Unknown attribute ${name}`);
    }
    return found;
  }

  public add<T extends Attribute>(attribute: T): T | never {
    if (this.attributes[attribute.name]) {
      throw new Error(`Attribute ${attribute.name} already exists`);
    }

    return this.attributes[attribute.name] = attribute;
  }

  public serialize(): ISetAttribute {
    return {
      ...super.serialize(),
      attributes: Object.entries(this.attributes).map((a) => a[1].serialize()),
      presLen: this.presLen
    };
  }

  public inspect(indent: string = "    "): string[] {
    const result = super.inspect();
    return [...result,
      ...Object.entries(this.attributes).reduce((p, a) => {
        return [...p, ...a[1].inspect(indent + "  ")];
      }, [] as string[])
    ];
  }
}
