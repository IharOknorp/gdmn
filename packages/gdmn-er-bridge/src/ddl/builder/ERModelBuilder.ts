import {AConnection, ATransaction} from "gdmn-db";
import {
  DetailAttribute,
  Entity,
  EntityAttribute,
  ParentAttribute,
  Sequence,
  SequenceAttribute,
  SetAttribute
} from "gdmn-orm";
import {IFieldProps} from "../DDLHelper";
import {Prefix} from "../Prefix";
import {Builder} from "./Builder";
import {DomainResolver} from "./DomainResolver";
import {EntityBuilder} from "./EntityBuilder";

export class ERModelBuilder extends Builder {

  private _entityBuilder: EntityBuilder | undefined;

  get entityBuilder(): EntityBuilder {
    if (!this._entityBuilder || !this._entityBuilder.prepared) {
      throw new Error("Need call prepare");
    }
    return this._entityBuilder;
  }

  public async prepare(connection: AConnection, transaction: ATransaction): Promise<void> {
    await super.prepare(connection, transaction);

    this._entityBuilder = new EntityBuilder({
      ddlUniqueGen: this.ddlUniqueGen,
      atHelper: this.atHelper,
      ddlHelper: this.ddlHelper
    });
  }

  public async addSequence(sequence: Sequence): Promise<Sequence> {
    // TODO custom adapter name
    await this.ddlHelper.addSequence(sequence.name);
    return sequence;
  }

  public async removeSequence(_sequence: Sequence): Promise<void> {
    // TODO
    throw new Error("Unsupported yet");
  }

  public async addEntity(entity: Entity): Promise<Entity> {
    const tableName = Builder._getOwnRelationName(entity);
    const fields: IFieldProps[] = [];
    for (const pkAttr of entity.pk) {
      const fieldName = Builder._getFieldName(pkAttr);
      const domainName = Prefix.domain(await this.ddlUniqueGen.next());
      await this.ddlHelper.addDomain(domainName, DomainResolver.resolve(pkAttr));
      await this._insertATAttr(pkAttr, {relationName: tableName, fieldName, domainName});
      fields.push({
        name: fieldName,
        domain: domainName
      });
    }

    const pkConstName = Prefix.pkConstraint(await this.ddlUniqueGen.next());
    await this.ddlHelper.addTable(tableName, fields);
    await this.ddlHelper.addPrimaryKey(pkConstName, tableName, fields.map((i) => i.name));
    await this._insertATEntity(entity, {relationName: tableName});

    for (const pkAttr of entity.pk) {
      if (SequenceAttribute.isType(pkAttr)) {
        const fieldName = Builder._getFieldName(pkAttr);
        const seqAdapter = pkAttr.sequence.adapter;
        const triggerName = Prefix.triggerBeforeInsert(await this.ddlUniqueGen.next());
        await this.ddlHelper.addAutoIncrementTrigger(triggerName, tableName, fieldName,
          seqAdapter ? seqAdapter.sequence : pkAttr.sequence.name);
      } else if (DetailAttribute.isType(pkAttr)) {
        // ignore
      } else if (ParentAttribute.isType(pkAttr)) {
        // ignore
      } else if (SetAttribute.isType(pkAttr)) {
        // ignore
      } else if (EntityAttribute.isType(pkAttr)) { // for inheritance
        const fkConstName = Prefix.fkConstraint(await this.ddlUniqueGen.next());
        const fieldName = Builder._getFieldName(pkAttr);
        await this.ddlHelper.addForeignKey(fkConstName, {
          tableName,
          fieldName
        }, {
          tableName: Builder._getOwnRelationName(pkAttr.entities[0]),
          fieldName: Builder._getFieldName(pkAttr.entities[0].pk[0])
        });
      }
    }

    for (const attr of Object.values(entity.ownAttributes)) {
      if (!entity.pk.includes(attr)) {
        await this.entityBuilder.addAttribute(entity, attr);
      }
    }

    for (const unique of entity.ownUnique) {
      await this.entityBuilder.addUnique(entity, unique);
    }

    return entity;
  }

  public removeEntity(_entity: Entity): Promise<void> {
    // TODO
    throw new Error("Unsupported yet");
  }
}