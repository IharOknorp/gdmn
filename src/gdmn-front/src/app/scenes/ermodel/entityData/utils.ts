import {
  Entity,
  EntityAttribute,
  EntityLink,
  EntityLinkField,
  EntityQuery,
  EntityQueryOptions,
  IEntityQueryResponseFieldAlias,
  ScalarAttribute
} from "gdmn-orm";
import {IFieldDef, TFieldType} from "gdmn-recordset";

export function prepareDefaultEntityQuery(entity: Entity, pkValues?: any[]): EntityQuery {
  const scalarFields = Object.values(entity.attributes)
    .filter((attr) => attr instanceof ScalarAttribute && attr.type !== "Blob")
    .map((attr) => new EntityLinkField(attr));

  const linkFields = Object.values(entity.attributes)
    .filter((attr) => attr.type === "Entity")
    .map((attr) => {
      const linkAttr = attr as EntityAttribute;
      const scalarAttrs = Object.values(linkAttr.entities[0].attributes)
        .filter((attr) => attr instanceof ScalarAttribute && attr.type !== "Blob");

      let fields: EntityLinkField[] = [];

      const presentField = scalarAttrs.find((attr) => attr.name === "NAME")
        || scalarAttrs.find((attr) => attr.name === "USR$NAME")
        || scalarAttrs.find((attr) => attr.name === "ALIAS")
        || scalarAttrs.find((attr) => attr.type === "String");
      if (presentField) {
        fields.push(new EntityLinkField(presentField));
      }
      if (!fields.length) {
        fields = fields.concat(linkAttr.entities[0].pk.map((attr) => new EntityLinkField(attr)));
      }
      const link = new EntityLink(linkAttr.entities[0], attr.name, fields);
      return new EntityLinkField(attr, [link]);
    });

  return new EntityQuery(
    new EntityLink(entity, "root", scalarFields.concat(linkFields)),
    pkValues && new EntityQueryOptions(
    undefined,
    undefined,
    [{
      equals: pkValues.map((value, index) => ({
        alias: "root",
        attribute: entity.pk[index],
        value
      }))
    }])
  );
}

export function attr2fd(query: EntityQuery, fieldAlias: string, eqfa: IEntityQueryResponseFieldAlias): IFieldDef {
  const link = query.link.deepFindLink(eqfa.linkAlias)!;
  const findField = link.fields.find((field) => field.attribute.name === eqfa.attribute);

  if (!findField) {
    throw new Error("Invalid query data!");
  }

  const attr = findField.attribute;
  let dataType;
  let size: number | undefined = undefined;

  switch (attr.type) {
    case "Enum":
    case "String":
      dataType = TFieldType.String;
      break;
    case "Sequence":
    case "Integer":
      dataType = TFieldType.Integer;
      break;
    case "Float":
      dataType = TFieldType.Float;
      break;
    case "TimeStamp":
    case "Time":
    case "Date":
      dataType = TFieldType.Date;
      break;
    case "Boolean":
      dataType = TFieldType.Boolean;
      break;
    case "Numeric":
      dataType = TFieldType.Currency;
      break;
    default:
      throw new Error(`Unsupported attribute type ${attr.type} of ${attr.name}`);
  }

  const caption = query.link === link ? attr.name : `${link.alias}.${attr.name}`;
  return {
    fieldName: fieldAlias,
    dataType,
    size,
    caption,
    eqfa
  };
}
