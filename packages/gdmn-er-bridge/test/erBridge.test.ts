import {existsSync, unlinkSync} from "fs";
import {AConnection, Factory, IConnectionOptions, TExecutor} from "gdmn-db";
import {SemCategory} from "gdmn-nlp";
import {
  BlobAttribute,
  BooleanAttribute,
  DateAttribute,
  DetailAttribute,
  Entity,
  EntityAttribute,
  EntityQuery,
  EntityQueryUtils,
  EnumAttribute,
  ERModel,
  FloatAttribute,
  IntegerAttribute,
  MAX_16BIT_INT,
  MAX_32BIT_INT,
  MIN_16BIT_INT,
  MIN_32BIT_INT,
  NumericAttribute,
  SetAttribute,
  StringAttribute,
  TimeAttribute,
  TimeStampAttribute
} from "gdmn-orm";
import moment from "moment";
import {resolve} from "path";
import {ERBridge} from "../src";
import {Constants} from "../src/ddl/Constants";

const dbOptions: IConnectionOptions = {
  username: "SYSDBA",
  password: "masterkey",
  path: resolve("./GDMN_ER_BRIDGE_ER_BRIDGE.FDB"),
  readTransaction: true
};

jest.setTimeout(60 * 1000);

describe("ERBridge", () => {
  const connection = Factory.FBDriver.newConnection();

  const initERModel = async () => {
    return await ERBridge.reloadERModel(connection, connection.readTransaction, new ERModel());
  };

  const execute = async <R>(callback: TExecutor<ERBridge, R>): Promise<R> => {
    return await AConnection.executeTransaction({
      connection,
      callback: (transaction) => ERBridge.executeSelf({
        connection,
        transaction,
        callback: (erBridge) => callback(erBridge)
      })
    });
  };

  beforeEach(async () => {
    if (existsSync(dbOptions.path)) {
      unlinkSync(dbOptions.path);
    }
    await connection.createDatabase(dbOptions);
    await ERBridge.initDatabase(connection);
  });

  afterEach(async () => {
    await connection.dropDatabase();
  });

  it("empty entity", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder}) => {
      await erBuilder.create(erModel, new Entity({
        name: "USR$TEST1",
        lName: {ru: {name: "entity name", fullName: "full entity name"}},
        semCategories: [SemCategory.Company],
        adapter: {
          relation: [{relationName: "USR$TEST_ADAPTER"}]
        }
      }));

      await erBuilder.create(erModel, new Entity({
        name: "USR$TEST2",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));
    });

    const loadedERModel = await initERModel();
    const entity1 = erModel.entity("USR$TEST1");
    const entity2 = erModel.entity("USR$TEST2");
    const loadEntity1 = loadedERModel.entity("USR$TEST1");
    const loadEntity2 = loadedERModel.entity("USR$TEST2");
    expect(loadEntity1).toEqual(entity1);
    expect(loadEntity2).toEqual(entity2);
    expect(loadEntity1.serialize()).toEqual(entity1.serialize());
    expect(loadEntity2.serialize()).toEqual(entity2.serialize());
  });

  it("integer", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new IntegerAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1", fullName: "FULLNAME"}}, required: true,
        minValue: MIN_16BIT_INT, maxValue: MAX_16BIT_INT, defaultValue: -10000,
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new IntegerAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2", fullName: "FULLNAME"}}, required: true,
        minValue: MIN_32BIT_INT, maxValue: MAX_32BIT_INT, defaultValue: -10000
      }));
      // await eBuilder.createAttribute(entity, new IntegerAttribute({
      //   name: "FIELD3", lName: {ru: {name: "Поле 3", fullName: "FULLNAME"}}, required: true,
      //   minValue: MIN_64BIT_INT, maxValue: MAX_64BIT_INT, defaultValue: -100000000000000
      // }));
      await eBuilder.createAttribute(entity, new IntegerAttribute({
        name: "FIELD4", lName: {ru: {name: "Поле 4", fullName: "FULLNAME"}},
        minValue: MIN_16BIT_INT, maxValue: MAX_16BIT_INT + 1, defaultValue: 0
      }));
      await eBuilder.createAttribute(entity, new IntegerAttribute({
        name: "FIELD5", lName: {ru: {name: "Поле 5", fullName: "FULLNAME"}},
        minValue: MIN_16BIT_INT, maxValue: MAX_16BIT_INT + 1
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("numeric", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new NumericAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        precision: 4, scale: 2, minValue: 40, maxValue: 1000, defaultValue: 40.36,
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new NumericAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2"}},
        precision: 4, scale: 2, minValue: 40, maxValue: 1000, defaultValue: 40.36
      }));
      await eBuilder.createAttribute(entity, new NumericAttribute({
        name: "FIELD3", lName: {ru: {name: "Поле 3"}},
        precision: 4, scale: 2, minValue: 40, maxValue: 1000
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("blob", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new BlobAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new BlobAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2"}}
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("boolean", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new BooleanAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        defaultValue: true, adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new BooleanAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2"}}
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("string", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new StringAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        minLength: 5, maxLength: 30, defaultValue: "test default", autoTrim: true,
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new StringAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2"}},
        minLength: 1, maxLength: 160, defaultValue: "test default", autoTrim: true
      }));
      await eBuilder.createAttribute(entity, new StringAttribute({
        name: "FIELD3", lName: {ru: {name: "Поле 3"}},
        minLength: 1, maxLength: 160, autoTrim: true
      }));
      await eBuilder.createAttribute(entity, new StringAttribute({
        name: "FIELD4", lName: {ru: {name: "Поле 3"}},
        minLength: 1, autoTrim: true
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("date", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new DateAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        minValue: moment.utc().year(1999).month(10).date(3).startOf("date").local().toDate(),
        maxValue: moment.utc().year(2099).startOf("year").local().toDate(),
        defaultValue: moment.utc().startOf("date").local().toDate(),
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new DateAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2"}},
        minValue: moment.utc(Constants.MIN_TIMESTAMP).startOf("date").local().toDate(),
        maxValue: moment.utc(Constants.MAX_TIMESTAMP).startOf("date").local().toDate(),
        defaultValue: "CURRENT_DATE"
      }));
      await eBuilder.createAttribute(entity, new DateAttribute({
        name: "FIELD3", lName: {ru: {name: "Поле 3"}},
        minValue: moment.utc(Constants.MIN_TIMESTAMP).startOf("date").local().toDate(),
        maxValue: moment.utc(Constants.MAX_TIMESTAMP).startOf("date").local().toDate()
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("time", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new TimeAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        minValue: moment.utc().year(Constants.MIN_TIMESTAMP.getUTCFullYear()).month(Constants.MIN_TIMESTAMP.getUTCMonth())
          .date(Constants.MIN_TIMESTAMP.getDate()).startOf("date").local().toDate(),
        maxValue: moment.utc().year(Constants.MIN_TIMESTAMP.getUTCFullYear()).month(Constants.MIN_TIMESTAMP.getUTCMonth())
          .date(Constants.MIN_TIMESTAMP.getDate()).endOf("date").local().toDate(),
        defaultValue: moment.utc().year(Constants.MIN_TIMESTAMP.getUTCFullYear()).month(Constants.MIN_TIMESTAMP.getUTCMonth())
          .date(Constants.MIN_TIMESTAMP.getDate()).local().toDate(),
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new TimeAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2"}},
        minValue: moment.utc(Constants.MIN_TIMESTAMP, Constants.TIME_TEMPLATE).local().toDate(),
        maxValue: moment.utc(Constants.MAX_TIMESTAMP, Constants.TIME_TEMPLATE)
          .year(Constants.MIN_TIMESTAMP.getUTCFullYear()).month(Constants.MIN_TIMESTAMP.getUTCMonth())
          .date(Constants.MIN_TIMESTAMP.getDate()).local().toDate(),
        defaultValue: "CURRENT_TIME"
      }));
      await eBuilder.createAttribute(entity, new TimeAttribute({
        name: "FIELD3", lName: {ru: {name: "Поле 3"}},
        minValue: moment.utc(Constants.MIN_TIMESTAMP, Constants.TIME_TEMPLATE).local().toDate(),
        maxValue: moment.utc(Constants.MAX_TIMESTAMP, Constants.TIME_TEMPLATE)
          .year(Constants.MIN_TIMESTAMP.getUTCFullYear()).month(Constants.MIN_TIMESTAMP.getUTCMonth())
          .date(Constants.MIN_TIMESTAMP.getDate()).local().toDate()
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("timestamp", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new TimeStampAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        minValue: moment.utc().year(1999).month(10).startOf("month").local().toDate(),
        maxValue: moment.utc().year(2099).month(1).date(1).endOf("date").local().toDate(),
        defaultValue: moment.utc().local().toDate(),
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new TimeStampAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2"}},
        minValue: moment.utc(Constants.MIN_TIMESTAMP).local().toDate(),
        maxValue: moment.utc(Constants.MAX_TIMESTAMP).local().toDate(),
        defaultValue: "CURRENT_TIMESTAMP"
      }));
      await eBuilder.createAttribute(entity, new TimeStampAttribute({
        name: "FIELD3", lName: {ru: {name: "Поле 3"}},
        minValue: moment.utc(Constants.MIN_TIMESTAMP).local().toDate(),
        maxValue: moment.utc(Constants.MAX_TIMESTAMP).local().toDate()
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("float", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new FloatAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        minValue: -123, maxValue: 123123123123123123123123, defaultValue: 40,
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      // await eBuilder.createAttribute(entity, new FloatAttribute({
      //   name: "FIELD2", lName: {ru: {name: "Поле 2"}},
      //   minValue: Number.MIN_VALUE, maxValue: Number.MAX_VALUE, defaultValue: 40
      // }));
      await eBuilder.createAttribute(entity, new FloatAttribute({
        name: "FIELD3", lName: {ru: {name: "Поле 3"}}, required: true,
        minValue: -123, maxValue: 123123123123123123123123
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("enum", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new EnumAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        values: [
          {
            value: "Z",
            lName: {ru: {name: "Перечисление Z"}}
          },
          {
            value: "X",
            lName: {ru: {name: "Перечисление X"}}
          },
          {
            value: "Y",
            lName: {ru: {name: "Перечисление Y"}}
          }
        ], defaultValue: "Z",
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER"}
      }));
      await eBuilder.createAttribute(entity, new EnumAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2"}},
        values: [{value: "Z"}, {value: "X"}, {value: "Y"}], defaultValue: "Z"
      }));
      await eBuilder.createAttribute(entity, new EnumAttribute({
        name: "FIELD3", lName: {ru: {name: "Поле 3"}},
        values: [{value: "Z"}, {value: "X"}, {value: "Y"}]
      }));
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("link to entity", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity1 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST1",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));
      const entity2 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST2",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity1, new EntityAttribute({
        name: "LINK1", lName: {ru: {name: "Ссылка "}}, required: true, entities: [entity2]
      }));
      await eBuilder.createAttribute(entity2, new EntityAttribute({
        name: "LINK", lName: {ru: {name: "Ссылка"}}, entities: [entity1]
      }));
    });

    const loadedERModel = await initERModel();
    const entity1 = erModel.entity("USR$TEST1");
    const entity2 = erModel.entity("USR$TEST2");
    const loadEntity1 = loadedERModel.entity("USR$TEST1");
    const loadEntity2 = loadedERModel.entity("USR$TEST2");
    expect(loadEntity1).toEqual(entity1);
    expect(loadEntity2).toEqual(entity2);
    expect(loadEntity1.serialize()).toEqual(entity1.serialize());
    expect(loadEntity2.serialize()).toEqual(entity2.serialize());
  });

  // it("parent link to entity", async () => {
  //   const erModel = await initERModel();
  //   await execute(async ({erBuilder, eBuilder}) => {
  //     const entity = await erBuilder.create(erModel, new Entity({
  //       name: "USR$TEST",
  //       lName: {ru: {name: "entity name", fullName: "full entity name"}}
  //     }));
  //
  //     await eBuilder.createAttribute(entity, new ParentAttribute({
  //       name: "PARENT", lName: {ru: {name: "Дерево"}}, entities: [entity]
  //     }));
  //   });
  //
  //   const loadedERModel = await initERModel();
  //   const entity = erModel.entity("USR$TEST");
  //   const loadEntity = loadedERModel.entity("USR$TEST");
  //   expect(loadEntity).toEqual(entity);
  //   expect(loadEntity.serialize()).toEqual(entity.serialize());
  // });

  it("detail entity", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity2 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST2",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));
      const entity1 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST1",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));
      const entity3 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST3",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity1, new DetailAttribute({
        name: "DETAILLINK", lName: {ru: {name: "Позиции 1"}}, required: true, entities: [entity2],
        adapter: {
          masterLinks: [{
            detailRelation: "USR$TEST2",
            link2masterField: "MASTER_KEY"
          }]
        }
      }));
      await eBuilder.createAttribute(entity1, new DetailAttribute({
        name: "USR$TEST3", lName: {ru: {name: "Позиции 2"}}, required: true, entities: [entity3]
      }));
    });

    const loadedERModel = await initERModel();
    const entity1 = erModel.entity("USR$TEST1");
    const entity2 = erModel.entity("USR$TEST2");
    const entity3 = erModel.entity("USR$TEST3");
    const loadEntity1 = loadedERModel.entity("USR$TEST1");
    const loadEntity2 = loadedERModel.entity("USR$TEST2");
    const loadEntity3 = loadedERModel.entity("USR$TEST3");
    expect(loadEntity1).toEqual(entity1);
    expect(loadEntity2).toEqual(entity2);
    expect(loadEntity3).toEqual(entity3);
    expect(loadEntity1.serialize()).toEqual(entity1.serialize());
    expect(loadEntity2.serialize()).toEqual(entity2.serialize());
    expect(loadEntity3.serialize()).toEqual(entity3.serialize());
  });

  it("set link to entity", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity1 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST1",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));
      const entity2 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST2",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));


      await eBuilder.createAttribute(entity1, new SetAttribute({
        name: "SET1", lName: {ru: {name: "Ссылка1"}}, required: true, entities: [entity2], presLen: 120,
        adapter: {
          crossRelation: "CROSS_TABLE_ADAPTER1",
          crossPk: ["KEY1", "KEY2"],
          presentationField: "SET_FIELD_ADAPTER"
        }
      }));
      const setAttr = new SetAttribute({
        name: "SET2", lName: {ru: {name: "Ссылка2"}}, required: true, entities: [entity2], presLen: 120,
        adapter: {crossRelation: "CROSS_TABLE_ADAPTER2", crossPk: ["KEY1", "KEY2"]}
      });
      setAttr.add(new IntegerAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1", fullName: "FULLNAME"}}, required: true,
        minValue: MIN_16BIT_INT, maxValue: MAX_16BIT_INT, defaultValue: -100,
        adapter: {relation: "CROSS_TABLE_ADAPTER2", field: "FIELD_ADAPTER1"}
      }));
      setAttr.add(new IntegerAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2", fullName: "FULLNAME"}}, required: true,
        minValue: MIN_32BIT_INT, maxValue: MAX_32BIT_INT, defaultValue: -1000
      }));
      await eBuilder.createAttribute(entity1, setAttr);

      await eBuilder.createAttribute(entity1, new SetAttribute({
        name: "SET3", lName: {ru: {name: "Ссылка3"}}, required: true, entities: [entity2],
        adapter: {crossRelation: "TABLE_7", crossPk: ["KEY1", "KEY2"]} // generated
      }));
    });

    const loadedERModel = await initERModel();
    const entity1 = erModel.entity("USR$TEST1");
    const entity2 = erModel.entity("USR$TEST2");
    const loadEntity1 = loadedERModel.entity("USR$TEST1");
    const loadEntity2 = loadedERModel.entity("USR$TEST2");
    expect(loadEntity1).toEqual(entity1);
    expect(loadEntity2).toEqual(entity2);
    expect(loadEntity1.serialize()).toEqual(entity1.serialize());
    expect(loadEntity2.serialize()).toEqual(entity2.serialize());
  });

  it("entity with unique fields", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));

      await eBuilder.createAttribute(entity, new StringAttribute({
        name: "FIELD1", lName: {ru: {name: "Поле 1"}}, required: true,
        minLength: 5, maxLength: 30, defaultValue: "test default", autoTrim: true,
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER1"}
      }));
      await eBuilder.createAttribute(entity, new IntegerAttribute({
        name: "FIELD2", lName: {ru: {name: "Поле 2", fullName: "FULLNAME"}}, required: true,
        minValue: MIN_16BIT_INT, maxValue: MAX_16BIT_INT, defaultValue: -100,
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER2"}
      }));
      await eBuilder.createAttribute(entity, new FloatAttribute({
        name: "FIELD3", lName: {ru: {name: "Поле 3"}}, required: true,
        minValue: -123, maxValue: 123123123123123123123123, defaultValue: 40,
        adapter: {relation: "USR$TEST", field: "FIELD_ADAPTER3"}
      }));

      await eBuilder.addUnique(entity, [entity.attribute("FIELD1"), entity.attribute("FIELD2")]);
      await eBuilder.addUnique(entity, [entity.attribute("FIELD2"), entity.attribute("FIELD3")]);
    });

    const loadedERModel = await initERModel();
    const entity = erModel.entity("USR$TEST");
    const loadEntity = loadedERModel.entity("USR$TEST");
    expect(loadEntity).toEqual(entity);
    expect(loadEntity.serialize()).toEqual(entity.serialize());
  });

  it("inheritance", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      const entity1 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST1",
        lName: {ru: {name: "entity name", fullName: "full entity name"}}
      }));
      await eBuilder.createAttribute(entity1, new StringAttribute({
        name: "TEST_FIELD1", lName: {ru: {name: "Поле 1"}},
        adapter: {relation: "USR$TEST1", field: "FIELD_ADAPTER1"}
      }));

      const entity2 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST2",
        parent: entity1,
        lName: {ru: {name: "entity name", fullName: "full entity name"}},
        adapter: {
          relation: [...entity1.adapter!.relation, {relationName: "USR$TEST2"}]
        }
      }));
      await eBuilder.createAttribute(entity2, new StringAttribute({
        name: "TEST_FIELD2", lName: {ru: {name: "Поле 2"}},
        adapter: {relation: "USR$TEST2", field: "FIELD_ADAPTER2"}
      }));

      const entity3 = await erBuilder.create(erModel, new Entity({
        name: "USR$TEST3",
        parent: entity1,
        lName: {ru: {name: "entity name", fullName: "full entity name"}},
        adapter: {
          relation: [...entity1.adapter!.relation, {relationName: "USR$TEST3"}]
        }
      }));
      await eBuilder.createAttribute(entity3, new StringAttribute({
        name: "TEST_FIELD3", lName: {ru: {name: "Поле 3"}}
      }));
      await eBuilder.createAttribute(entity3, new StringAttribute({
        name: "TEST_FIELD1",
        lName: {ru: {name: "Переопределенное Поле 1"}},
        required: true
      }));
    });

    const loadedERModel = await initERModel();
    const entity1 = erModel.entity("USR$TEST1");
    const entity2 = erModel.entity("USR$TEST2");
    const entity3 = erModel.entity("USR$TEST3");
    const loadEntity1 = loadedERModel.entity("USR$TEST1");
    const loadEntity2 = loadedERModel.entity("USR$TEST2");
    const loadEntity3 = loadedERModel.entity("USR$TEST3");
    expect(loadEntity1).toEqual(entity1);
    expect(loadEntity2).toEqual(entity2);
    expect(loadEntity3).toEqual(entity3);
    expect(loadEntity1.serialize()).toEqual(entity1.serialize());
    expect(loadEntity2.serialize()).toEqual(entity2.serialize());
    expect(loadEntity3.serialize()).toEqual(entity3.serialize());
  });

  it("AUTH DATABASE", async () => {
    const erModel = await initERModel();
    await execute(async ({erBuilder, eBuilder}) => {
      // APP_USER
      const userEntity = await erBuilder.create(erModel, new Entity({
        name: "APP_USER", lName: {ru: {name: "Пользователь"}}
      }));
      await eBuilder.createAttribute(userEntity, new StringAttribute({
        name: "LOGIN", lName: {ru: {name: "Логин"}}, required: true, minLength: 1, maxLength: 32
      }));
      await eBuilder.createAttribute(userEntity, new BlobAttribute({
        name: "PASSWORD_HASH", lName: {ru: {name: "Хешированный пароль"}}, required: true
      }));
      await eBuilder.createAttribute(userEntity, new BlobAttribute({
        name: "SALT", lName: {ru: {name: "Примесь"}}, required: true
      }));
      await eBuilder.createAttribute(userEntity, new TimeStampAttribute({
        name: "CREATIONDATE", lName: {ru: {name: "Дата создания"}}, required: true,
        minValue: Constants.MIN_TIMESTAMP, maxValue: Constants.MAX_TIMESTAMP, defaultValue: "CURRENT_TIMESTAMP"
      }));
      await eBuilder.createAttribute(userEntity, new BooleanAttribute({
        name: "IS_ADMIN", lName: {ru: {name: "Пользователь - администратор"}}
      }));
      await eBuilder.createAttribute(userEntity, new BooleanAttribute({
        name: "DELETED", lName: {ru: {name: "Удален"}}
      }));

      // APPLICATION
      const appEntity = await erBuilder.create(erModel, new Entity({
        name: "APPLICATION", lName: {ru: {name: "Приложение"}}
      }));
      await eBuilder.createAttribute(appEntity, new EntityAttribute({
        name: "OWNER", lName: {ru: {name: "Создатель"}}, required: true, entities: [userEntity]
      }));
      await eBuilder.createAttribute(appEntity, new BooleanAttribute({
        name: "IS_EXTERNAL", lName: {ru: {name: "Является внешним"}}, required: true
      }));
      await eBuilder.createAttribute(appEntity, new StringAttribute({
        name: "HOST", lName: {ru: {name: "Хост"}}, maxLength: 260
      }));
      await eBuilder.createAttribute(appEntity, new IntegerAttribute({
        name: "PORT", lName: {ru: {name: "Хост"}},
        minValue: -2147483648, maxValue: 2147483647
      }));
      await eBuilder.createAttribute(appEntity, new StringAttribute({
        name: "USERNAME", lName: {ru: {name: "Имя пользователя"}}, maxLength: 260
      }));
      await eBuilder.createAttribute(appEntity, new StringAttribute({
        name: "PASSWORD", lName: {ru: {name: "Пароль"}}, maxLength: 260
      }));
      await eBuilder.createAttribute(appEntity, new StringAttribute({
        name: "PATH", lName: {ru: {name: "Путь"}}, maxLength: 260
      }));
      const appUid = new StringAttribute({
        name: "UID",
        lName: {ru: {name: "Идентификатор приложения"}},
        required: true,
        minLength: 1,
        maxLength: 36
      });
      await eBuilder.createAttribute(appEntity, appUid);
      await eBuilder.addUnique(appEntity, [appUid]);
      await eBuilder.createAttribute(appEntity, new TimeStampAttribute({
        name: "CREATIONDATE", lName: {ru: {name: "Дата создания"}}, required: true,
        minValue: Constants.MIN_TIMESTAMP, maxValue: Constants.MAX_TIMESTAMP, defaultValue: "CURRENT_TIMESTAMP"
      }));
      const appSet = new SetAttribute({
        name: "APPLICATIONS", lName: {ru: {name: "Приложения"}}, entities: [appEntity],
        adapter: {crossRelation: "APP_USER_APPLICATIONS", crossPk: ["KEY1", "KEY2"]}
      });
      appSet.add(new StringAttribute({
        name: "ALIAS", lName: {ru: {name: "Название приложения"}}, required: true, minLength: 1, maxLength: 120
      }));

      await eBuilder.createAttribute(userEntity, appSet);
    });

    const loadedERModel = await initERModel();
    const userEntity = erModel.entity("APP_USER");
    const appEntity = erModel.entity("APPLICATION");
    const loadUserEntity = loadedERModel.entity("APP_USER");
    const loadAppEntity = loadedERModel.entity("APPLICATION");
    expect(loadUserEntity).toEqual(userEntity);
    expect(loadAppEntity).toEqual(appEntity);
    expect(loadUserEntity.serialize()).toEqual(userEntity.serialize());
    expect(loadAppEntity.serialize()).toEqual(appEntity.serialize());

    const sql = "EXECUTE BLOCK\n" +
      "AS\n" +
      "BEGIN\n" +
      " INSERT INTO APP_USER (LOGIN, PASSWORD_HASH, SALT, IS_ADMIN, DELETED, CREATIONDATE )\n" +
      " VALUES ('Ford', 'T', 0, 0, 0, '10.01.2014 13:32:02');\n" +
      " INSERT INTO APP_USER (LOGIN, PASSWORD_HASH, SALT, IS_ADMIN, DELETED, CREATIONDATE )\n" +
      " VALUES ('tom', 'Karl', 0, 0, 0, '10.01.2014 13:32:02');\n" +
      " INSERT INTO APPLICATION (OWNER, IS_EXTERNAL, HOST, PORT, USERNAME, PASSWORD, UID, CREATIONDATE )\n" +
      " VALUES (50, 0, 1000, 5050, 'a', 'b', 'a', '10.01.2014 13:32:02');\n" +
      " INSERT INTO APPLICATION (OWNER, IS_EXTERNAL, HOST, PORT, USERNAME, PASSWORD, UID, CREATIONDATE )\n" +
      " VALUES (51, 0, 1000, 5050, 'd' , 'e', 'f', '10.01.2014 13:32:02');\n" +
      " INSERT INTO APP_USER_APPLICATIONS (KEY1, KEY2, ALIAS )\n" +
      " VALUES (50, 52, 'Незабудка');\n" +
      " INSERT INTO APP_USER_APPLICATIONS (KEY1, KEY2, ALIAS )\n" +
      " VALUES (51, 53, 'Мокрые кроссы');\n" +
      "END";

    await AConnection.executeTransaction({
      connection,
      callback: (transaction) => connection.executeReturning(transaction, sql)
    });

    const entityQuery = EntityQuery.inspectorToObject(erModel, {
      link: {
        entity: "APP_USER",
        alias: "app",
        fields: [
          {
            attribute: "APPLICATIONS",
            setAttributes: ["ALIAS"],
            links: [{
              entity: "APPLICATION",
              alias: "s",
              fields: [
                {attribute: "ID"},
                {attribute: "UID"},
                {attribute: "CREATIONDATE"},
                {
                  attribute: "OWNER",
                  links: [{
                    entity: "APP_USER",
                    alias: "au",
                    fields: [
                      {attribute: "ID"}
                    ]
                  }]
                },
                {attribute: "IS_EXTERNAL"},
                {attribute: "HOST"},
                {attribute: "PORT"},
                {attribute: "USERNAME"},
                {attribute: "PASSWORD"},
                {attribute: "PATH"}
              ]
            }]
          }
        ]
      }
      ,
      options: {
        where: [{
          equals: [{
            alias: "au",
            attribute: "ID",
            value: 50
          }]
        }]
      }
    });

    const result = await ERBridge.query(connection, connection.readTransaction, entityQuery!);
    expect(
      result.data.map((row) => {
        const host = EntityQueryUtils.findAttrValue(row, result.aliases, "s", "HOST");
        const port = EntityQueryUtils.findAttrValue(row, result.aliases, "s", "PORT");

        return {
          alias: EntityQueryUtils.findAttrValue(row, result.aliases, "app", "APPLICATIONS", "ALIAS"),
          id: EntityQueryUtils.findAttrValue(row, result.aliases, "s", "ID"),
          uid: EntityQueryUtils.findAttrValue(row, result.aliases, "s", "UID"),
          creationDate: EntityQueryUtils.findAttrValue(row, result.aliases, "s", "CREATIONDATE"),
          ownerKey: EntityQueryUtils.findAttrValue(row, result.aliases, "au", "ID"),
          external: EntityQueryUtils.findAttrValue(row, result.aliases, "s", "IS_EXTERNAL"),
          server: host && port ? {host, port} : undefined,
          username: EntityQueryUtils.findAttrValue(row, result.aliases, "s", "USERNAME"),
          password: EntityQueryUtils.findAttrValue(row, result.aliases, "s", "PASSWORD"),
          path: EntityQueryUtils.findAttrValue(row, result.aliases, "s", "PATH")
        };
      })
    ).toEqual([{
      alias: "Незабудка",
      id: 52,
      uid: "a",
      creationDate: new Date("2014-01-10T10:32:02.000Z"),
      ownerKey: 50,
      external: 0,
      server: {host: "1000", port: 5050},
      username: "a",
      password: "b",
      path: null
    }]);

    const id: any = undefined;
    const login = "Ford";
    let whereEquals = [{
      alias: "user",
      attribute: "DELETED",
      value: "0"
    }];
    if (login) {
      whereEquals.push({
        alias: "user",
        attribute: "LOGIN",
        value: login
      });
    }
    if (id !== undefined && id != null) {
      whereEquals.push({
        alias: "user",
        attribute: "ID",
        value: id
      });
    }

    const entityQueryUser = EntityQuery.inspectorToObject(erModel, {
      link: {
        entity: "APP_USER",
        alias: "user",
        fields: [
          {attribute: "ID"},
          {attribute: "LOGIN"},
          {attribute: "PASSWORD_HASH"},
          {attribute: "SALT"},
          {attribute: "CREATIONDATE"},
          {attribute: "IS_ADMIN"},
          {attribute: "DELETED"},
          {
            attribute: "APPLICATIONS",
            links: [{
              entity: "APPLICATION",
              alias: "application",
              fields: [
                {attribute: "ID"}
              ]
            }]
          }
        ]
      },
      options: {
        where: [{
          equals: whereEquals
        }]
      }
    });

    const resultQuery = await ERBridge.query(connection, connection.readTransaction, entityQueryUser!);
    expect(
      resultQuery.data.map((row) => ({
        id: EntityQueryUtils.findAttrValue<number>(row, resultQuery.aliases, "user", "ID"),
        login: EntityQueryUtils.findAttrValue<string>(row, resultQuery.aliases, "user", "LOGIN"),
        passwordHash: EntityQueryUtils.findAttrValue<string>(row, resultQuery.aliases, "user", "PASSWORD_HASH"),
        salt: EntityQueryUtils.findAttrValue<string>(row, resultQuery.aliases, "user", "SALT"),
        creationDate: EntityQueryUtils.findAttrValue<Date>(row, resultQuery.aliases, "user", "CREATIONDATE"),
        admin: EntityQueryUtils.findAttrValue<boolean>(row, resultQuery.aliases, "user", "IS_ADMIN")
      }))
    ).toEqual([{
      id: 50,
      login: "Ford",
      passwordHash: "T",
      salt: "0",
      creationDate: new Date("2014-01-10T10:32:02.000Z"),
      admin: 0
    }]);
  });
});
