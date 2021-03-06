import {Constants} from "../Constants";
import {DDLHelper} from "../DDLHelper";
import {BaseSimpleUpdate} from "./BaseSimpleUpdate";

export class Update2 extends BaseSimpleUpdate {

  protected readonly _version: number = 2;
  protected readonly _description: string = "Обновление для бд Гедымина, включающее поддержку gdmn web";

  protected async internalRun(ddlHelper: DDLHelper): Promise<void> {
    await ddlHelper.addSequence(Constants.GLOBAL_DDL_GENERATOR);

    await ddlHelper.addColumns("AT_RELATION_FIELDS", [
      {name: "ATTRNAME", domain: "DFIELDNAME"},
      {name: "MASTERENTITYNAME", domain: "DTABLENAME"}
    ]);

    await ddlHelper.addColumns("AT_RELATIONS", [
      {name: "ENTITYNAME", domain: "DTABLENAME"}
    ]);

    await ddlHelper.addTable("AT_DATABASE", [
      {name: "ID", domain: "DINTKEY"},
      {name: "VERSION", domain: "DINTKEY"},
      {name: "UPGRADED", domain: "DTIMESTAMP_NOTNULL", default: "CURRENT_TIMESTAMP"}
    ]);
    await ddlHelper.addPrimaryKey("AT_PK_DATABASE", "AT_DATABASE", ["ID"]);
    // TODO change constraint name
    await ddlHelper.addUnique("UQ_1", "AT_DATABASE", ["VERSION"]);
  }
}
