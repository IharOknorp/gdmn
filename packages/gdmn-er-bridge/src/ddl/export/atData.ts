/**
 * at_* таблицы платформы Гедымин хранят дополнительную информацию по доменам,
 * таблицам и полям. При построении сущностей мы используем эту информацию
 * вместе с информацией о структуре базу данных.
 * Чтобы каждый раз не выполнять отдельные запросы, мы изначально загружаем
 * все данные в объекты.
 */

import {AConnection, AResultSet, ATransaction} from "gdmn-db";
import {ITName, LName} from "gdmn-internals";
import {SemCategory, str2SemCategories} from "gdmn-nlp";

/**
 * Дополнительная информация по доменам.
 */
export interface IATField {
  lName: LName;
  refTable?: string;
  refCondition?: string;
  setTable?: string;
  setListField?: string;
  setCondition?: string;
  numeration?: string;
}

export interface IATFields {
  [fieldName: string]: IATField;
}

/**
 * Дополнительная информация по полям таблиц.
 */
export interface IATRelationField {
  attrName?: string;
  masterEntityName?: string;
  lName: LName;
  fieldSource: string;
  fieldSourceKey: number;
  crossTable?: string;
  crossTableKey?: number;
  crossField?: string;
  semCategories: SemCategory[];
}

export interface IATRelationFields {
  [fieldName: string]: IATRelationField;
}

/**
 * Дополнительная информация по таблицам.
 */
export interface IATRelation {
  lName: LName;
  entityName?: string;
  semCategories: SemCategory[];
  relationFields: IATRelationFields;
}

export interface IATRelations {
  [relationName: string]: IATRelation;
}

export interface IATLoadResult {
  atFields: IATFields;
  atRelations: IATRelations;
}

const getTrimmedStringFunc = (resultSet: AResultSet) =>
  (fieldName: string) => resultSet.isNull(fieldName) ? undefined : resultSet.getString(fieldName).trim();

export async function load(connection: AConnection, transaction: ATransaction): Promise<IATLoadResult> {
  const atFields = await AConnection.executeQueryResultSet({
    connection,
    transaction,
    sql: `
      SELECT
        FIELDNAME,
        LNAME,
        DESCRIPTION,
        REFTABLE,
        REFCONDITION,
        SETTABLE,
        SETLISTFIELD,
        SETCONDITION,
        NUMERATION
      FROM
        AT_FIELDS`,
    callback: async (resultSet) => {
      const getTrimmedString = getTrimmedStringFunc(resultSet);
      const fields: IATFields = {};
      while (await resultSet.next()) {
        const ru: ITName = {name: resultSet.getString("LNAME")};
        const fullName = getTrimmedString("DESCRIPTION");
        if (fullName) {
          ru.fullName = fullName;
        }
        fields[resultSet.getString("FIELDNAME")] = {
          lName: {ru},
          refTable: getTrimmedString("REFTABLE"),
          refCondition: getTrimmedString("REFCONDITION"),
          setTable: getTrimmedString("SETTABLE"),
          setListField: getTrimmedString("SETLISTFIELD"),
          setCondition: getTrimmedString("SETCONDITION"),
          numeration: resultSet.isNull("NUMERATION")
            ? undefined
            : await connection.openBlobAsString(transaction, resultSet.getBlob("NUMERATION")!)
        };
      }
      return fields;
    }
  });

  const atRelations = await AConnection.executeQueryResultSet({
    connection,
    transaction,
    sql: `
      SELECT
        RELATIONNAME,
        LNAME,
        DESCRIPTION,
        ENTITYNAME,
        SEMCATEGORY
      FROM
        AT_RELATIONS`,
    callback: async (resultSet) => {
      const getTrimmedString = getTrimmedStringFunc(resultSet);
      const relations: IATRelations = {};
      while (await resultSet.next()) {
        const ru: ITName = {name: resultSet.getString("LNAME")};
        const fullName = getTrimmedString("DESCRIPTION");
        if (fullName) {
          ru.fullName = fullName;
        }
        relations[resultSet.getString("RELATIONNAME")] = {
          lName: {ru},
          entityName: getTrimmedString("ENTITYNAME"),
          semCategories: str2SemCategories(resultSet.getString("SEMCATEGORY")),
          relationFields: {}
        };
      }
      return relations;
    }
  });

  await AConnection.executeQueryResultSet({
    connection,
    transaction,
    sql: `
      SELECT
        FIELDNAME,
        FIELDSOURCE,
        FIELDSOURCEKEY,
        RELATIONNAME,
        ATTRNAME,
        MASTERENTITYNAME,
        LNAME,
        DESCRIPTION,
        SEMCATEGORY,
        CROSSTABLE,
        CROSSTABLEKEY,
        CROSSFIELD
      FROM
        AT_RELATION_FIELDS
      ORDER BY
        RELATIONNAME`,
    callback: async (resultSet) => {
      const getTrimmedString = getTrimmedStringFunc(resultSet);
      let relationName: string = "";
      let rel: IATRelation;
      while (await resultSet.next()) {
        if (relationName !== resultSet.getString("RELATIONNAME")) {
          relationName = resultSet.getString("RELATIONNAME");
          rel = atRelations[relationName];
          if (!rel) throw new Error(`Unknown relation ${relationName}`);
        }
        const fieldName = resultSet.getString("FIELDNAME");
        const ru: ITName = {name: resultSet.getString("LNAME")};
        const fullName = getTrimmedString("DESCRIPTION");
        if (fullName) {
          ru.fullName = fullName;
        }
        rel!.relationFields[fieldName] = {
          attrName: getTrimmedString("ATTRNAME"),
          masterEntityName: getTrimmedString("MASTERENTITYNAME"),
          lName: {ru},
          fieldSource: getTrimmedString("FIELDSOURCE")!,
          fieldSourceKey: resultSet.getNumber("FIELDSOURCEKEY"),
          crossTable: getTrimmedString("CROSSTABLE"),
          crossTableKey: resultSet.getNumber("CROSSTABLEKEY"),
          crossField: getTrimmedString("CROSSFIELD"),
          semCategories: str2SemCategories(resultSet.getString("SEMCATEGORY"))
        };
      }
    }
  });

  return {atFields, atRelations};
}
